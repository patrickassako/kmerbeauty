import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Removed missing components: Separator, ScrollArea
import { CheckCircle, Trash2, Package, User, MapPin, Tag, DollarSign, Box, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProductDetailsSheetProps = {
    product: any | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string) => void;
    onDelete: (id: string) => void;
};

export function ProductDetailsSheet({ product, isOpen, onClose, onApprove, onDelete }: ProductDetailsSheetProps) {
    const [seller, setSeller] = useState<any>(null);
    const [loadingSeller, setLoadingSeller] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Combine images and video into a single media array
    const media = [
        ...(product?.images || []).map((url: string) => ({ type: 'image', url })),
        ...(product?.video_url ? [{ type: 'video', url: product.video_url }] : [])
    ];

    useEffect(() => {
        if (product?.seller_id) {
            fetchSeller(product.seller_id);
        }
        setCurrentImageIndex(0); // Reset index when product changes
    }, [product]);

    const nextImage = () => {
        if (media.length === 0) return;
        setCurrentImageIndex((prev) => (prev + 1) % media.length);
    };

    const prevImage = () => {
        if (media.length === 0) return;
        setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const fetchSeller = async (sellerId: string) => {
        setLoadingSeller(true);
        // Try to find in therapists first
        let { data, error } = await supabase
            .from('therapists')
            .select('*, user:users(*)')
            .eq('id', sellerId)
            .single();

        if (error || !data) {
            // Try salons
            const { data: salonData, error: salonError } = await supabase
                .from('salons')
                .select('*, user:users(*)')
                .eq('id', sellerId)
                .single();

            if (salonData) data = salonData;
        }

        if (data) {
            setSeller(data);
        }
        setLoadingSeller(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CM", {
            style: "currency",
            currency: "XAF",
        }).format(amount);
    };

    if (!product) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[90%] sm:w-[600px] overflow-y-auto sm:max-w-[600px]">
                <SheetHeader className="mb-6">
                    <SheetTitle>Détails du Produit</SheetTitle>
                    <SheetDescription>
                        Examinez les détails du produit avant validation.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Media Carousel */}
                    <div className="space-y-2">
                        <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center group bg-black">
                            {media.length > 0 ? (
                                <>
                                    {media[currentImageIndex].type === 'video' ? (
                                        <video
                                            src={media[currentImageIndex].url}
                                            controls
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <img
                                            src={media[currentImageIndex].url}
                                            alt={`${product.name} - Media ${currentImageIndex + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    )}

                                    {media.length > 1 && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={prevImage}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={nextImage}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
                                                {currentImageIndex + 1} / {media.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Package className="h-16 w-16 text-gray-400" />
                            )}
                        </div>

                        {/* Thumbnails */}
                        {media.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {media.map((item: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 flex items-center justify-center bg-gray-100 ${currentImageIndex === idx ? "border-primary" : "border-transparent"
                                            }`}
                                    >
                                        {item.type === 'video' ? (
                                            <Video className="h-6 w-6 text-gray-500" />
                                        ) : (
                                            <img src={item.url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{product.name}</h2>
                                <Badge variant="outline" className="mt-1">
                                    {product.category || "Non catégorisé"}
                                </Badge>
                            </div>
                            <div className="text-xl font-bold text-primary">
                                {formatCurrency(product.price)}
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-gray-200" />

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Description
                        </h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {product.description || "Aucune description fournie."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Box className="h-4 w-4" /> Stock
                            </h3>
                            <p className="font-medium">{product.stock_quantity} unités</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Ville
                            </h3>
                            <p className="font-medium">{product.city || "Non spécifiée"}</p>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-gray-200" />

                    {/* Seller Info */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Vendeur
                        </h3>
                        {loadingSeller ? (
                            <div className="text-sm text-muted-foreground">Chargement du vendeur...</div>
                        ) : seller ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Avatar>
                                    <AvatarImage src={seller.user?.avatar || ""} />
                                    <AvatarFallback>{seller.user?.first_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">
                                        {seller.user?.first_name} {seller.user?.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {seller.user?.email} • {seller.user?.phone}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-red-500">Vendeur introuvable (ID: {product.seller_id})</div>
                        )}
                    </div>
                </div>

                <SheetFooter className="mt-8 flex-col sm:flex-row gap-3 sm:justify-between">
                    <Button
                        variant="destructive"
                        onClick={() => onDelete(product.id)}
                        className="w-full sm:w-auto"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer / Rejeter
                    </Button>
                    {!product.is_approved && (
                        <Button
                            onClick={() => onApprove(product.id)}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approuver le produit
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
