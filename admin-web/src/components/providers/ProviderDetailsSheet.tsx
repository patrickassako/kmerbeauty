"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, MapPin, DollarSign, Star, Package, CreditCard, Briefcase, AlertTriangle, PauseCircle, PlayCircle, Ban, Wallet } from "lucide-react";

type ProviderDetailsSheetProps = {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
};

type ProviderProfile = {
    user: any;
    details: any; // Therapist or Salon
    type: 'therapist' | 'salon' | null;
};

export function ProviderDetailsSheet({ userId, isOpen, onClose }: ProviderDetailsSheetProps) {
    const [profile, setProfile] = useState<ProviderProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Action States
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState("");
    const [rechargeReason, setRechargeReason] = useState("Bonus Admin");
    const [actionLoading, setActionLoading] = useState(false);

    // Tab Data
    const [services, setServices] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [credits, setCredits] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProviderFullDetails(userId);
        } else {
            resetState();
        }
    }, [isOpen, userId]);

    const resetState = () => {
        setProfile(null);
        setServices([]);
        setBookings([]);
        setCredits(null);
        setTransactions([]);
        setMarketplaceItems([]);
        setReviews([]);
    };

    const fetchProviderFullDetails = async (uid: string) => {
        setLoading(true);
        try {
            // 1. Fetch User & Entity Details
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", uid)
                .single();

            if (userError) throw userError;

            // Try to find Therapist
            const { data: therapistData } = await supabase
                .from("therapists")
                .select("*")
                .eq("user_id", uid)
                .maybeSingle();

            // Try to find Salon
            const { data: salonData } = await supabase
                .from("salons")
                .select("*")
                .eq("user_id", uid)
                .maybeSingle();

            let type: 'therapist' | 'salon' | null = null;
            let details = null;
            let entityId = null;

            if (therapistData) {
                type = 'therapist';
                details = therapistData;
                entityId = therapistData.id;
            } else if (salonData) {
                type = 'salon';
                details = salonData;
                entityId = salonData.id;
            }

            setProfile({ user: userData, details, type });

            if (entityId && type) {
                // 2. Fetch Services
                const serviceTable = type === 'therapist' ? 'therapist_services' : 'salon_services';
                const serviceIdCol = type === 'therapist' ? 'therapist_id' : 'salon_id';

                const { data: servicesData } = await supabase
                    .from(serviceTable)
                    .select(`
                        *,
                        service:services(*)
                    `)
                    .eq(serviceIdCol, entityId);
                setServices(servicesData || []);

                // 3. Fetch Bookings
                const bookingIdCol = type === 'therapist' ? 'therapist_id' : 'salon_id';
                const { data: bookingsData } = await supabase
                    .from("bookings")
                    .select("*")
                    .eq(bookingIdCol, entityId)
                    .order('created_at', { ascending: false })
                    .limit(50);
                setBookings(bookingsData || []);

                // 4. Fetch Credits
                const { data: creditData } = await supabase
                    .from("provider_credits")
                    .select("*")
                    .eq("provider_id", entityId)
                    .maybeSingle();
                setCredits(creditData);

                const { data: txData } = await supabase
                    .from("credit_transactions")
                    .select("*")
                    .eq("provider_id", entityId)
                    .order('created_at', { ascending: false })
                    .limit(20);
                setTransactions(txData || []);

                // 5. Fetch Reviews
                const reviewIdCol = type === 'therapist' ? 'therapist_id' : 'salon_id';
                const { data: reviewsData } = await supabase
                    .from("reviews")
                    .select("*, user:users(first_name, last_name)")
                    .eq(reviewIdCol, entityId)
                    .order('created_at', { ascending: false });
                setReviews(reviewsData || []);
            }

            // 6. Fetch Marketplace (linked to Therapist/Salon ID, NOT User ID)
            if (entityId) {
                const { data: marketData, error: marketError } = await supabase
                    .from("marketplace_products")
                    .select("*")
                    .eq("seller_id", entityId) // Use entityId here
                    .order('created_at', { ascending: false });

                if (!marketError) {
                    setMarketplaceItems(marketData || []);
                }
            }

        } catch (error) {
            console.error("Error fetching provider details:", error);
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

    const formatCredits = (amount: number) => {
        return new Intl.NumberFormat("fr-CM", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const handleRecharge = async () => {
        if (!profile?.details?.id || !rechargeAmount) return;
        setActionLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_add_credits', {
                target_provider_id: profile.details.id,
                amount: parseFloat(rechargeAmount),
                reason: rechargeReason
            });

            if (error) throw error;

            // Refresh data
            await fetchProviderFullDetails(userId!);
            setIsRechargeOpen(false);
            setRechargeAmount("");
            alert("Crédit ajouté avec succès !");
        } catch (error: any) {
            console.error("Error adding credits:", error);
            alert("Erreur lors de l'ajout de crédit: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!profile?.user?.id) return;
        const newStatus = !profile.user.is_active;
        if (!confirm(`Voulez-vous vraiment ${newStatus ? 'activer' : 'mettre en pause'} ce prestataire ?`)) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: newStatus })
                .eq('id', profile.user.id);

            if (error) throw error;

            // Optimistic update
            setProfile(prev => prev ? ({ ...prev, user: { ...prev.user, is_active: newStatus } }) : null);
        } catch (error: any) {
            alert("Erreur: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!profile?.user?.id) return;
        if (!confirm("Voulez-vous vraiment révoquer la validation de ce prestataire ? Il repassera en 'En attente'.")) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_verified: false })
                .eq('id', profile.user.id);

            if (error) throw error;

            // Optimistic update
            setProfile(prev => prev ? ({ ...prev, user: { ...prev.user, is_verified: false } }) : null);
        } catch (error: any) {
            alert("Erreur: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[90%] sm:w-[800px] overflow-y-auto sm:max-w-[800px]">
                <SheetHeader className="mb-6">
                    <SheetTitle>Fiche Prestataire</SheetTitle>
                    <SheetDescription>
                        Vue d'overview à 360° du prestataire.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                    </div>
                ) : profile ? (
                    <div className="space-y-6">
                        {/* Header Profile */}
                        <div className="flex items-start gap-6">
                            <Avatar className="h-24 w-24 border-4 border-gray-100">
                                <AvatarImage src={profile.user.avatar || (profile.type === 'therapist' ? profile.details?.profile_image : profile.details?.logo) || ""} />
                                <AvatarFallback className="text-2xl">
                                    {profile.user.first_name?.[0]}{profile.user.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">{profile.user.first_name} {profile.user.last_name}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{profile.type === 'therapist' ? 'Indépendant' : 'Salon'}</Badge>
                                    <Badge variant={profile.user.is_active ? "default" : "destructive"}>
                                        {profile.user.is_active ? "Actif" : "Suspendu"}
                                    </Badge>
                                    {profile.user.is_verified && (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Vérifié</Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>{profile.user.email}</p>
                                    <p>{profile.user.phone}</p>
                                    <p className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {profile.user.city || "Ville inconnue"}, {profile.user.country || "Cameroun"}
                                    </p>
                                </div>
                            </div>
                            <div className="ml-auto text-right space-y-2">
                                <div>
                                    <div className="text-sm text-muted-foreground">Solde Crédits</div>
                                    <div className="text-3xl font-bold text-primary">
                                        {credits ? formatCredits(credits.balance) : "0"}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="w-full">
                                                <Wallet className="mr-2 h-4 w-4" />
                                                Recharger
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Recharger le compte crédit</DialogTitle>
                                                <DialogDescription>
                                                    Ajoutez des crédits manuellement au compte du prestataire.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="amount" className="text-right">
                                                        Montant
                                                    </Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        value={rechargeAmount}
                                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                                        className="col-span-3"
                                                        placeholder="Ex: 5000"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="reason" className="text-right">
                                                        Motif
                                                    </Label>
                                                    <Input
                                                        id="reason"
                                                        value={rechargeReason}
                                                        onChange={(e) => setRechargeReason(e.target.value)}
                                                        className="col-span-3"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleRecharge} disabled={actionLoading}>
                                                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Confirmer
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        size="sm"
                                        variant={profile.user.is_active ? "destructive" : "default"}
                                        onClick={handleToggleStatus}
                                        disabled={actionLoading}
                                        className="w-full"
                                    >
                                        {profile.user.is_active ? (
                                            <><PauseCircle className="mr-2 h-4 w-4" /> Mettre en pause</>
                                        ) : (
                                            <><PlayCircle className="mr-2 h-4 w-4" /> Activer</>
                                        )}
                                    </Button>

                                    {profile.user.is_verified && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleRevoke}
                                            disabled={actionLoading}
                                            className="w-full text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                                        >
                                            <Ban className="mr-2 h-4 w-4" /> Révoquer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                                <TabsTrigger value="services">Services</TabsTrigger>
                                <TabsTrigger value="bookings">Commandes</TabsTrigger>
                                <TabsTrigger value="credits">Crédits</TabsTrigger>
                                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total (Estimé)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(bookings.reduce((sum, b) => sum + (b.status === 'COMPLETED' ? b.total : 0), 0))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Note Moyenne</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold">
                                                    {reviews.length > 0
                                                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                                        : "-"}
                                                </span>
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                <span className="text-xs text-muted-foreground">({reviews.length} avis)</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {profile.details?.bio_fr && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Biographie</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600">{profile.details.bio_fr}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* SERVICES TAB */}
                            <TabsContent value="services" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 gap-2">
                                    {services.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">Aucun service configuré.</p>
                                    ) : (
                                        services.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                        {s.service?.images?.[0] ? (
                                                            <img src={s.service.images[0]} alt={s.service.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Briefcase className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{s.service?.name || "Service sans nom"}</div>
                                                        <div className="text-xs text-muted-foreground">{s.duration || s.service?.duration} min</div>
                                                    </div>
                                                </div>
                                                <div className="font-bold">
                                                    {formatCurrency(s.price || s.service?.basePrice)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* BOOKINGS TAB */}
                            <TabsContent value="bookings" className="space-y-4 mt-4">
                                <div className="space-y-2 h-[60vh] overflow-y-auto pr-2">
                                    {bookings.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">Aucune commande.</p>
                                    ) : (
                                        bookings.map((b) => (
                                            <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                                                <div>
                                                    <div className="font-medium">Commande #{b.id.slice(0, 8)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(b.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(b.total)}</div>
                                                    <Badge variant="outline" className="text-xs scale-90 origin-right">{b.status}</Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* CREDITS TAB */}
                            <TabsContent value="credits" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="text-xs text-blue-600 uppercase font-semibold">Total Gagné</div>
                                        <div className="text-xl font-bold text-blue-900">
                                            {credits ? formatCredits(credits.total_earned) : "0"}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <div className="text-xs text-orange-600 uppercase font-semibold">Total Dépensé</div>
                                        <div className="text-xl font-bold text-orange-900">
                                            {credits ? formatCredits(credits.total_spent) : "0"}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold mb-2">Historique des transactions</h3>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {transactions.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">Aucune transaction.</p>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-2 border-b last:border-0">
                                                <div>
                                                    <div className="font-medium text-sm">{tx.transaction_type}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* MARKETPLACE TAB */}
                            <TabsContent value="marketplace" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 gap-2">
                                    {marketplaceItems.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">Aucun produit en vente.</p>
                                    ) : (
                                        marketplaceItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                        {item.images?.[0] ? (
                                                            <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground">{item.category}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(item.price)}</div>
                                                    <Badge variant={item.is_approved ? "default" : "secondary"} className="text-xs">
                                                        {item.is_approved ? "Approuvé" : "En attente"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">Prestataire introuvable</div>
                )}
            </SheetContent>
        </Sheet>
    );
}
