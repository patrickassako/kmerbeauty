
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';

interface Product {
    id: string;
    name: string;
    price: number;
    images?: string[];
    views_count?: number;
    stock_quantity: number;
    category: string;
    city?: string;
}

function MarketplaceContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const category = searchParams.get('category');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Construct URL with params
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                const url = new URL(`${API_URL}/marketplace/products`);

                if (category) url.searchParams.set('category', category);
                if (searchQuery) url.searchParams.set('search', searchQuery);

                // Add limit to match mobile
                url.searchParams.set('limit', '50');

                const res = await fetch(url.toString());
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.data || []); // API returns { data: [] } typically based on mobile code
                } else {
                    console.error("Failed to fetch products");
                }
            } catch (error) {
                console.error("Error fetching marketplace:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(debounce);
    }, [category, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 border-b border-gray-100 shadow-sm pt-[calc(env(safe-area-inset-top))]">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Boutique</h1>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <MarketplaceFilters />
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-4xl mb-4">🛍️</p>
                        <h3 className="font-bold text-lg text-gray-900">Aucun produit</h3>
                        <p>Il n'y a pas de produits correspondant à votre recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <MarketplaceContent />
        </Suspense>
    );
}
