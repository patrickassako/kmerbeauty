
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { marketplaceApi } from '@/services/api';

interface ProductFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
    userId: string;
}

export default function ProductForm({ initialData, onSubmit, loading, userId }: ProductFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        price: initialData?.price?.toString() || '',
        description: initialData?.description || '',
        stock: initialData?.stock_quantity?.toString() || '1',
        category: initialData?.category || 'equipment',
        city: initialData?.city || 'Yaoundé',
        images: initialData?.images || [] as string[],
        video_url: initialData?.video_url || ''
    });

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (formData.images.length >= 5) {
            alert("Limite atteinte : Maximum 5 images");
            return;
        }

        setUploading(true);
        try {
            const result = await marketplaceApi.uploadFile(file, userId, 'product');
            const url = result.url || result.publicUrl || result;

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, url]
            }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Erreur lors de l'upload de l'image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await marketplaceApi.uploadFile(file, userId, 'video');
            const url = result.url || result.publicUrl || result;

            setFormData(prev => ({
                ...prev,
                video_url: url
            }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Erreur lors de l'upload de la vidéo");
        } finally {
            setUploading(false);
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_: string, i: number) => i !== index)
        }));
    };

    const removeVideo = () => {
        setFormData(prev => ({ ...prev, video_url: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock),
            category: formData.category,
            city: formData.city,
            images: formData.images,
            video_url: formData.video_url
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            {/* Images */}
            <div>
                <label className="block text-sm font-medium mb-2">Images (max 5)</label>
                <div className="flex flex-wrap gap-4 mb-4">
                    {formData.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500 shadow-sm hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {formData.images.length < 5 && (
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                            <span className="text-xs mt-1">Ajouter</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                />
            </div>

            {/* Video */}
            <div>
                <label className="block text-sm font-medium mb-2">Vidéo (optionnel)</label>
                {formData.video_url ? (
                    <div className="relative w-full max-w-xs aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                        <video src={formData.video_url} controls className="w-full h-full object-contain" />
                        <button
                            type="button"
                            onClick={removeVideo}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full text-red-500 shadow-sm hover:bg-gray-100 z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => !uploading && videoInputRef.current?.click()}
                        className="w-full max-w-xs p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                        <span className="text-sm">Ajouter une vidéo</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Nom du produit *</label>
                    <input
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Sèche-cheveux professionnel"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Prix (XAF) *</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Ex: 25000"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Catégorie *</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'Équipement', value: 'equipment' },
                        { label: 'Produit de beauté', value: 'beauty_product' },
                        { label: 'Accessoire', value: 'accessory' },
                        { label: 'Autre', value: 'other' },
                    ].map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            className={`p-2 rounded-md border text-sm transition-colors ${formData.category === cat.value
                                ? 'bg-gray-800 text-white border-gray-800'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Stock disponible *</label>
                <input
                    type="number"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="Ex: 10"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Ville</label>
                <input
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Yaoundé"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre produit..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <Button type="submit" disabled={loading || uploading} className="bg-gray-900 text-white hover:bg-gray-800">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Mettre à jour' : 'Créer le produit'}
                </Button>
            </div>

            <p className="text-center text-xs text-gray-500 italic">
                * Champs obligatoires<br />
                Note: Votre produit sera soumis à validation avant d'être visible.
            </p>
        </form>
    );
}
