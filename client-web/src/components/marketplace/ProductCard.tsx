
"use client";

import Link from 'next/link';
import { Eye, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    images?: string[];
    views_count?: number;
    stock_quantity: number;
    city?: string;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const mainImage = product.images?.[0] || '/placeholder-image.png';

    return (
        <Link href={`/marketplace/${product.id}`} className="group block">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col">
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Rupture</span>
                        </div>
                    )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>

                    <div className="text-primary font-bold text-lg mb-2">
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(product.price)}
                    </div>

                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{product.views_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            <span>{product.stock_quantity}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
