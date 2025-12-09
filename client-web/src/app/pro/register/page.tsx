
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RegisterProPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        business_name: '',
        niche: 'beauty', // default
        city: 'Yaoundé',
        experience: '1',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Must be logged in to become a pro
                router.push('/login?redirect=/pro/register');
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

            // Create Contractor Profile
            const res = await fetch(`${API_URL}/contractors/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    business_name: formData.business_name, // Mapping mobile fields
                    bio_fr: formData.description,
                    city: formData.city,
                    experience: parseInt(formData.experience),
                    // Adding defaults for required fields if any
                    is_mobile: true,
                    travel_radius: 10
                })
            });

            if (res.ok) {
                router.push('/pro/dashboard');
            } else {
                console.error("Failed to register");
            }

        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-2xl font-bold mb-6">Créer votre profil Pro</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Nom de l'entreprise / Marque</label>
                    <input
                        className="w-full p-2 border rounded-md"
                        value={formData.business_name}
                        onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Ville</label>
                    <select
                        className="w-full p-2 border rounded-md"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                    >
                        <option value="Yaoundé">Yaoundé</option>
                        <option value="Douala">Douala</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Années d'expérience</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded-md"
                        value={formData.experience}
                        onChange={e => setFormData({ ...formData, experience: e.target.value })}
                        min="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        className="w-full p-2 border rounded-md h-32"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Présentez vos services..."
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Commencer
                </Button>
            </form>
        </div>
    );
}
