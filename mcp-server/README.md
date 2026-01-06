# KmerBeauty MCP Server

Serveur MCP (Model Context Protocol) pour l'agent WhatsApp KmerBeauty.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Configurez les variables :
- `KMERBEAUTY_API_URL` : URL de l'API backend
- `WHATSAPP_AGENT_KEY` : Clé secrète de l'agent

## Build

```bash
npm run build
```

## Utilisation avec n8n

1. Dans n8n, ajoutez un nœud "MCP Client"
2. Configurez la commande : `node /path/to/mcp-server/dist/index.js`
3. L'agent IA aura accès aux tools suivants

## Tools disponibles

| Tool | Description |
|------|-------------|
| `search_services` | Recherche de services par mot-clé |
| `list_therapists` | Liste des prestataires |
| `check_availability` | Vérifie disponibilité |
| `create_booking` | Crée une réservation |
| `get_client_bookings` | Historique client |
| `modify_booking` | Modifie un RDV |
| `cancel_booking` | Annule un RDV |
