
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Truck, MapPin, Eye, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';

interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
    images?: string[];
    video_url?: string;
    stock_quantity: number;
    views_count?: number;
    city?: string;
    seller_id: string;
    owner?: {
        id: string;
        user_id: string; // The chat needs the user_id
    };
    therapists?: { // Mobile uses this pattern too
        user_id: string;
    }
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                const res = await fetch(`${API_URL}/marketplace/products/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    const handleContactSeller = async () => {
        if (!product) return;

        // Determine seller user ID (logic from mobile)
        const sellerUserId = product.therapists?.user_id || product.seller_id;

        // We need to create/get chat logic. 
        // Best way: Use the API endpoint for "direct chat".
        // Mobile: const response = await api.post('/chat/direct', { ... });
        // Web: We must be logged in. 

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push('/login?redirect=/marketplace/' + product.id);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
            const res = await fetch(`${API_URL}/chat/direct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` // Important: Pass Supabase token if backend expects it, or custom logic.
                    // The backend likely expects the standard Supabase JWT as Bearer token if it uses `AuthenticatedUser` guard.
                },
                body: JSON.stringify({
                    clientId: session.user.id,
                    providerId: sellerUserId,
                    providerType: 'therapist' // Assuming therapist for now, could be salon if needed
                })
            });

            if (res.ok) {
                const chat = await res.json();
                router.push(`/profile/chat?id=${chat.id}`);
            } else {
                console.error("Failed to create chat");
            }
        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const handleBuyNow = () => {
        // Implement simple buy logic or alert "Coming soon" if no checkout yet
        // Mobile has a checkout screen. I'll mock it via alert or a modal later.
        alert("La commande web sera disponible bientôt. Utilisez l'application mobile pour commander.");
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
    if (!product) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Produit introuvable</div>;

    const images = product.images || ['/placeholder-image.png'];

    return (
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto min-h-[100dvh] pb-20 md:static md:z-auto md:min-h-screen md:pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100 pt-[calc(env(safe-area-inset-top))]">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-bold text-lg leading-tight truncate flex-1">{product.name}</h1>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl p-0 md:p-6 md:grid md:grid-cols-2 md:gap-8">
                {/* Gallery */}
                <div className="relative aspect-square md:aspect-[4/3] bg-gray-100 md:rounded-xl overflow-hidden group">
                    <img
                        src={images[currentImageIndex]}
                        alt={product.name}
                        onClick={() => setFullscreenImage(images[currentImageIndex])}
                        className="w-full h-full object-cover cursor-zoom-in"
                    />

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1) }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % images.length) }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-2 w-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Details */}
                <div className="p-4 md:p-0">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    </div>

                    <div className="text-3xl font-bold text-primary mb-6">
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(product.price)}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 border-b border-gray-100 pb-6">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>{product.views_count || 0} vues</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Stock: {product.stock_quantity}</span>
                        </div>
                        {product.city && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{product.city}</span>
                            </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <h3 className="font-semibold text-lg mb-2">Description</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {product.description || "Aucune description disponible."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 sticky bottom-0 bg-white p-4 md:static md:p-0 border-t md:border-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1 gap-2"
                            onClick={handleContactSeller}
                        >
                            <MessageCircle className="h-5 w-5" />
                            Contacter
                        </Button>
                        <Button
                            size="lg"
                            className="flex-1 gap-2"
                            onClick={handleBuyNow}
                            disabled={product.stock_quantity <= 0}
                        >
                            <Truck className="h-5 w-5" />
                            {product.stock_quantity > 0 ? 'Commander' : 'Rupture'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
                <div className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
                    <button className="absolute top-4 right-4 text-white p-2" onClick={() => setFullscreenImage(null)}>
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Zoom"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
