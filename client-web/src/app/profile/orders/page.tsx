'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Loader2, Package, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';

interface Order {
    id: string;
    total: number;
    status: string;
    created_at: string;
    items?: Array<{
        product_id: string;
        quantity: number;
        product?: {
            name: string;
            images?: string[];
        }
    }>;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setLoading(false); // Stop loading if no session
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                const res = await fetch(`${API_URL}/marketplace/orders?role=buyer`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                } else {
                    console.error("Failed to fetch orders:", res.status, res.statusText);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            'PENDING': 'En attente',
            'CONFIRMED': 'Confirmée',
            'COMPLETED': 'Livrée',
            'CANCELLED': 'Annulée',
            'IN_PROGRESS': 'En cours'
        };
        return map[status.toUpperCase()] || status;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <ShoppingBag className="h-12 w-12 text-orange-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos Commandes</h2>
                <p className="text-gray-500 max-w-sm mb-8">
                    Vous n'avez pas encore effectué de commande sur la marketplace.
                    Découvrez nos produits dès maintenant.
                </p>
                <Link href="/marketplace">
                    <Button size="lg" className="rounded-full">
                        Jeter un œil
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>

            <div className="grid gap-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                        <Clock className="h-3 w-3 ml-2" />
                                        {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="font-bold text-lg text-primary">
                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(order.total)}
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                                        <div className="h-10 w-10 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            {item.product?.images?.[0] ? (
                                                <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-5 w-5 m-auto text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.product?.name || "Produit inconnu"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Qté: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
