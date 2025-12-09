
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductForm from '@/components/pro/marketplace/ProductForm';
import { marketplaceApi } from '@/services/api';

export default function UpdateProductPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data } = await createClient().auth.getUser();
            setUserId(data.user?.id || null);

            try {
                if (!params?.id) return;
                const p = await marketplaceApi.getProductById(params.id as string);
                setProduct(p);
            } catch (e) {
                console.error(e);
                alert("Impossible de charger le produit");
                router.back();
            } finally {
                setInitialLoading(false);
            }
        };
        init();
    }, [params]);

    const handleSubmit = async (data: any) => {
        setLoading(true);
        try {
            await marketplaceApi.updateProduct(params.id as string, data);
            router.push('/pro/marketplace');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading || !userId) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <LinkButton onClick={() => router.back()} />
                <h1 className="text-2xl font-bold">Modifier le produit</h1>
            </div>

            <ProductForm
                initialData={product}
                onSubmit={handleSubmit}
                loading={loading}
                userId={userId}
            />
        </div>
    );
}

function LinkButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" onClick={onClick}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
    )
}
