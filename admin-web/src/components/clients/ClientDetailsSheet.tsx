"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Calendar, MapPin, DollarSign } from "lucide-react";

type ClientDetailsSheetProps = {
    clientId: string | null;
    isOpen: boolean;
    onClose: () => void;
};

type Booking = {
    id: string;
    created_at: string;
    status: string;
    total: number;
    service_name: string; // We might need to fetch items or just show total
    provider_name: string;
};

type ClientFullDetails = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    role: string;
};

export function ClientDetailsSheet({ clientId, isOpen, onClose }: ClientDetailsSheetProps) {
    const [client, setClient] = useState<ClientFullDetails | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && clientId) {
            fetchClientDetails(clientId);
        } else {
            setClient(null);
            setBookings([]);
        }
    }, [isOpen, clientId]);

    const fetchClientDetails = async (id: string) => {
        setLoading(true);
        try {
            // 1. Fetch Client Profile
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single();

            if (userError) throw userError;
            setClient(userData);

            // 2. Fetch Booking History
            const { data: bookingsData, error: bookingsError } = await supabase
                .from("bookings")
                .select(`
                    id,
                    created_at,
                    status,
                    total,
                    therapist:therapists(user:users(first_name, last_name)),
                    salon:salons(name_fr)
                `)
                .eq("user_id", id)
                .order("created_at", { ascending: false });

            if (bookingsError) throw bookingsError;

            const formattedBookings = bookingsData.map((b: any) => {
                let providerName = "Inconnu";
                if (b.therapist?.user) {
                    providerName = `${b.therapist.user.first_name} ${b.therapist.user.last_name}`;
                } else if (b.salon) {
                    providerName = b.salon.name_fr;
                }

                return {
                    id: b.id,
                    created_at: b.created_at,
                    status: b.status,
                    total: b.total,
                    service_name: "Service", // Placeholder as items are in a separate table
                    provider_name: providerName,
                };
            });

            setBookings(formattedBookings);

        } catch (error) {
            console.error("Error fetching client details:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CM", {
            style: "currency",
            currency: "XAF",
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED": return <Badge className="bg-green-500">Terminé</Badge>;
            case "PENDING": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">En attente</Badge>;
            case "CONFIRMED": return <Badge className="bg-blue-500">Confirmé</Badge>;
            case "CANCELLED": return <Badge variant="destructive">Annulé</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Détails du Client</SheetTitle>
                    <SheetDescription>
                        Informations complètes et historique des commandes.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : client ? (
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-2 border-gray-100">
                                <AvatarImage src={client.avatar || ""} />
                                <AvatarFallback className="text-xl">
                                    {client.first_name?.[0]}{client.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-bold">{client.first_name} {client.last_name}</h3>
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                                <p className="text-sm text-muted-foreground">{client.phone}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={client.is_active ? "default" : "destructive"}>
                                        {client.is_active ? "Actif" : "Suspendu"}
                                    </Badge>
                                    {client.is_verified && (
                                        <Badge variant="outline" className="text-green-600 border-green-200">Vérifié</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Dépensé</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(bookings.reduce((sum, b) => sum + (b.status === 'COMPLETED' ? b.total : 0), 0))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{bookings.length}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Booking History */}
                        <div>
                            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Historique des commandes
                            </h4>
                            <div className="h-[400px] rounded-md border p-4 overflow-y-auto">
                                {bookings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Aucune commande trouvée.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {bookings.map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">{booking.provider_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <div className="font-bold text-sm">{formatCurrency(booking.total)}</div>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">Client introuvable</div>
                )}
            </SheetContent>
        </Sheet>
    );
}
