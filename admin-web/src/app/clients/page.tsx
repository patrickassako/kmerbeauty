"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreHorizontal, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { ClientDetailsSheet } from "@/components/clients/ClientDetailsSheet";

type Client = {
    id: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
};

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'CLIENT')
            .order('created_at', { ascending: false });

        if (searchTerm) {
            // Simple search on email or name
            query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setClients(data as any);
        }
        setLoading(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewDetails = (clientId: string) => {
        setSelectedClientId(clientId);
        setIsDetailsOpen(true);
    };

    const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
        const action = currentStatus ? "suspendre" : "activer";
        if (!confirm(`Êtes-vous sûr de vouloir ${action} ce compte ?`)) return;

        const { error } = await supabase
            .from('users')
            .update({ is_active: !currentStatus })
            .eq('id', clientId);

        if (error) {
            console.error("Error updating client status:", error);
            alert("Erreur lors de la mise à jour du statut.");
        } else {
            // Optimistic update or refetch
            fetchClients();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground">
                        Gérez votre base de clients ({clients.length} total)
                    </p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter un client
                </Button>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher par nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Utilisateur</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Vérifié</TableHead>
                            <TableHead>Inscrit le</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucun client trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={client.avatar || ""} />
                                                <AvatarFallback>
                                                    {client.first_name?.[0]}{client.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold">
                                                    {client.first_name} {client.last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">ID: {client.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{client.email}</span>
                                            <span className="text-xs text-muted-foreground">{client.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={client.is_active ? "default" : "destructive"}>
                                            {client.is_active ? "Actif" : "Suspendu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {client.is_verified ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Vérifié
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">
                                                Non
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(client.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
                                                    Copier ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleViewDetails(client.id)}>
                                                    Voir détails
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewDetails(client.id)}>
                                                    Voir historique commandes
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className={client.is_active ? "text-red-600" : "text-green-600"}
                                                    onClick={() => toggleClientStatus(client.id, client.is_active)}
                                                >
                                                    {client.is_active ? "Suspendre le compte" : "Activer le compte"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClientDetailsSheet
                clientId={selectedClientId}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
}
