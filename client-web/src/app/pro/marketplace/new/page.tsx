
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/pro/marketplace/ProductForm';
import { marketplaceApi } from '@/services/api';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    }, []);

    const handleSubmit = async (data: any) => {
        setLoading(true);
        try {
            await marketplaceApi.createProduct(data);
            router.push('/pro/marketplace');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Ajouter un produit</h1>
            </div>

            <ProductForm
                onSubmit={handleSubmit}
                loading={loading}
                userId={userId}
            />
        </div>
    );
}
