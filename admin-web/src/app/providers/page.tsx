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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { ProviderDetailsSheet } from "@/components/providers/ProviderDetailsSheet";


type Provider = {
    id: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    // In a real scenario, we'd fetch service categories too
};

export default function ProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setLoading(true);
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'PROVIDER')
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setProviders(data as any);
        }
        setLoading(false);
    };

    const handleVerify = async (id: string, status: boolean) => {
        const { error } = await supabase
            .from('users')
            .update({ is_verified: status })
            .eq('id', id);

        if (!error) {
            // Optimistic update
            setProviders(providers.map(p => p.id === id ? { ...p, is_verified: status } : p));
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProviders();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const pendingProviders = providers.filter(p => !p.is_verified);
    const verifiedProviders = providers.filter(p => p.is_verified);

    const ProviderTable = ({ data, onViewDetails }: { data: Provider[], onViewDetails: (id: string) => void }) => (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Prestataire</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Vérification</TableHead>
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
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Aucun prestataire trouvé.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((provider) => (
                            <TableRow key={provider.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={provider.avatar || ""} />
                                            <AvatarFallback>
                                                {provider.first_name?.[0]}{provider.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-bold">
                                                {provider.first_name} {provider.last_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">ID: {provider.id.slice(0, 8)}...</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{provider.email}</span>
                                        <span className="text-xs text-muted-foreground">{provider.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={provider.is_active ? "default" : "destructive"}>
                                        {provider.is_active ? "Actif" : "Suspendu"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {provider.is_verified ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                            <ShieldCheck className="w-3 h-3 mr-1" /> Vérifié
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                            En attente
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {new Date(provider.created_at).toLocaleDateString()}
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
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(provider.id)}>
                                                Copier ID
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onViewDetails(provider.id)}>
                                                Voir détails complets
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {!provider.is_verified && (
                                                <DropdownMenuItem onClick={() => handleVerify(provider.id, true)} className="text-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Valider le compte
                                                </DropdownMenuItem>
                                            )}
                                            {provider.is_verified && (
                                                <DropdownMenuItem onClick={() => handleVerify(provider.id, false)} className="text-orange-600">
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Révoquer validation
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">
                                                Suspendre le compte
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
    );

    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewDetails = (providerId: string) => {
        setSelectedProviderId(providerId);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Prestataires</h2>
                    <p className="text-muted-foreground">
                        Gérez les demandes et les comptes prestataires
                    </p>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">Tous ({providers.length})</TabsTrigger>
                    <TabsTrigger value="pending" className="relative">
                        En attente
                        {pendingProviders.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                {pendingProviders.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="verified">Vérifiés ({verifiedProviders.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                    <ProviderTable data={providers} onViewDetails={handleViewDetails} />
                </TabsContent>
                <TabsContent value="pending" className="space-y-4">
                    <ProviderTable data={pendingProviders} onViewDetails={handleViewDetails} />
                </TabsContent>
                <TabsContent value="verified" className="space-y-4">
                    <ProviderTable data={verifiedProviders} onViewDetails={handleViewDetails} />
                </TabsContent>
            </Tabs>

            <ProviderDetailsSheet
                userId={selectedProviderId}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
}
