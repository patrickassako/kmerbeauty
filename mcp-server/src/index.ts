import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config, validateConfig } from './config.js';
import { apiClient } from './api-client.js';

// Create MCP Server
const server = new McpServer({
    name: 'kmerbeauty-agent',
    version: '1.0.0',
});

// ============ TOOL: search_services ============
server.tool(
    'search_services',
    'Recherche des services de beauté par mot-clé (coiffure, massage, manucure, etc.). Comprend les synonymes et termes approximatifs.',
    {
        query: z.string().describe('Le terme de recherche (ex: coiffure, massage, ongles)'),
    },
    async ({ query }) => {
        try {
            const services = await apiClient.searchServices(query);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(services, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Erreur: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: list_therapists ============
server.tool(
    'list_therapists',
    'Liste les prestataires de beauté. Peut filtrer par ville, quartier, et service. Les prestataires du quartier demandé apparaissent en premier.',
    {
        city: z.string().optional().describe('Ville (ex: Douala, Yaoundé)'),
        quarter: z.string().optional().describe('Quartier (ex: Akwa, Bonanjo)'),
        serviceId: z.string().optional().describe('ID du service pour filtrer'),
    },
    async ({ city, quarter, serviceId }) => {
        try {
            const therapists = await apiClient.listTherapists(city, quarter, serviceId);
            // Simplify response for the agent
            const simplified = therapists.map((t: any) => ({
                id: t.id,
                name: t.user ? `${t.user.first_name} ${t.user.last_name}` : 'N/A',
                rating: t.rating,
                city: t.city,
                zones: t.service_zones,
                price: t.service_price,
            }));
            return {
                content: [{ type: 'text', text: JSON.stringify(simplified, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Erreur: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: check_availability ============
server.tool(
    'check_availability',
    'Vérifie si un prestataire est actuellement disponible pour recevoir des réservations.',
    {
        therapistId: z.string().describe('ID du prestataire'),
    },
    async ({ therapistId }) => {
        try {
            const availability = await apiClient.checkAvailability(therapistId);
            return {
                content: [{ type: 'text', text: JSON.stringify(availability, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Erreur: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: create_booking ============
server.tool(
    'create_booking',
    'Crée une nouvelle réservation. Peut réserver plusieurs services en une fois. Crée automatiquement un compte client si le numéro est nouveau.',
    {
        customerPhone: z.string().describe('Numéro de téléphone au format +237XXXXXXXXX'),
        customerName: z.string().optional().describe('Nom du client'),
        serviceIds: z.array(z.string()).describe('Liste des IDs de services à réserver'),
        therapistId: z.string().optional().describe('ID du prestataire'),
        scheduledAt: z.string().describe('Date et heure au format ISO 8601 (ex: 2024-01-20T10:00:00Z)'),
        city: z.string().describe('Ville de la prestation'),
        quarter: z.string().optional().describe('Quartier'),
        street: z.string().optional().describe('Adresse précise'),
        notes: z.string().optional().describe('Notes ou instructions du client'),
    },
    async (params) => {
        try {
            const booking = await apiClient.createBooking(params);
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Réservation créée!\nID: ${booking.id}\nDate: ${booking.scheduled_at}\nTotal: ${booking.total} XAF\nStatut: ${booking.status}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `❌ Erreur: ${error.response?.data?.message || error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: get_client_bookings ============
server.tool(
    'get_client_bookings',
    'Récupère l\'historique des réservations d\'un client à partir de son numéro de téléphone.',
    {
        phone: z.string().describe('Numéro de téléphone du client au format +237XXXXXXXXX'),
    },
    async ({ phone }) => {
        try {
            const bookings = await apiClient.getClientBookings(phone);
            if (bookings.length === 0) {
                return {
                    content: [{ type: 'text', text: 'Aucune réservation trouvée pour ce numéro.' }],
                };
            }
            const summary = bookings.map((b: any) => ({
                id: b.id,
                date: b.scheduled_at,
                status: b.status,
                total: b.total,
                services: b.items?.map((i: any) => i.service_name).join(', '),
            }));
            return {
                content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Erreur: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: modify_booking ============
server.tool(
    'modify_booking',
    'Modifie une réservation existante (changer la date, les notes, l\'adresse).',
    {
        bookingId: z.string().describe('ID de la réservation à modifier'),
        scheduledAt: z.string().optional().describe('Nouvelle date/heure ISO 8601'),
        notes: z.string().optional().describe('Nouvelles notes'),
        quarter: z.string().optional().describe('Nouveau quartier'),
        street: z.string().optional().describe('Nouvelle adresse'),
    },
    async ({ bookingId, ...updates }) => {
        try {
            const booking = await apiClient.modifyBooking(bookingId, updates);
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Réservation modifiée!\nNouvelle date: ${booking.scheduled_at}\nStatut: ${booking.status}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `❌ Erreur: ${error.response?.data?.message || error.message}` }],
                isError: true,
            };
        }
    }
);

// ============ TOOL: cancel_booking ============
server.tool(
    'cancel_booking',
    'Annule une réservation existante.',
    {
        bookingId: z.string().describe('ID de la réservation à annuler'),
        reason: z.string().optional().describe('Raison de l\'annulation'),
    },
    async ({ bookingId, reason }) => {
        try {
            const booking = await apiClient.cancelBooking(bookingId, reason);
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Réservation annulée.\nID: ${booking.id}\nStatut: ${booking.status}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `❌ Erreur: ${error.response?.data?.message || error.message}` }],
                isError: true,
            };
        }
    }
);

// Start the server
async function main() {
    validateConfig();
    console.log('🚀 KmerBeauty MCP Server starting...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('✅ MCP Server connected and ready!');
}

main().catch(console.error);
