
"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

            // Get Orders as Seller
            const res = await fetch(`${API_URL}/marketplace/orders?role=seller`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                setSales(await res.json());
            }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mes Ventes</h1>

            <div className="grid gap-4">
                {sales.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {order.status}
                                </span>
                                <span className="text-gray-400 text-sm">#{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="font-bold">
                                {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(order.total)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {order.items?.[0]?.product?.name || "Produit"} x{order.items?.[0]?.quantity}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium">{order.client?.first_name} {order.client?.last_name}</div>
                            <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                ))}

                {sales.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-bold text-gray-900">Aucune vente</h3>
                        <p className="text-gray-500">Vous n'avez pas encore reçu de commande.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
