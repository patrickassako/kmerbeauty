
"use client";

import { useEffect, useState } from 'react';
import { Plus, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { marketplaceApi } from '@/services/api';

export default function MyProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getMyProducts();
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
        try {
            await marketplaceApi.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            console.error("Delete failed", e);
            alert("Erreur lors de la suppression");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Ma Boutique</h1>
                <Link href="/pro/marketplace/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Vendre un produit
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="aspect-video bg-gray-100 relative">
                            {p.images?.[0] ? (
                                <img src={p.images[0]} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Package className="h-8 w-8" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold">
                                {p.stock_quantity} en stock
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                            <div className="text-primary font-bold mt-1">
                                {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(p.price)}
                            </div>

                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Stock: {p.stock_quantity}</span>
                                <span>Vues: {p.views_count || 0}</span>
                                <span>Ventes: {p.sales_count || 0}</span>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {!p.is_approved && (
                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-medium">
                                        ⏳ En attente d'approbation
                                    </span>
                                )}
                                {!p.is_active && (
                                    <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-medium">
                                        ❌ Inactif
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                <div className="flex gap-2 w-full justify-end">
                                    <Link href={`/pro/marketplace/${p.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(p.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <StoreIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-bold text-gray-900">Votre boutique est vide</h3>
                    <p className="text-gray-500 mb-6">Ajoutez vos produits pour commencer à vendre.</p>
                    <Link href="/pro/marketplace/new">
                        <Button>Ajouter un produit</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

function StoreIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    )
}
