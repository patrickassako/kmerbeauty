
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ProPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Devenez Partenaire KMS</h1>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                Rejoignez notre réseau de professionnels. Gérez vos rendez-vous, vendez vos produits et développez votre activité.
            </p>

            <div className="grid gap-6 md:grid-cols-2 text-left mb-12">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold mb-2">Pour les Services</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Gestion d'agenda</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Visibilité accrue</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold mb-2">Pour la Vente</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Boutique en ligne</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Zéro commission cachée</li>
                    </ul>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <Link href="/pro/register">
                    <Button size="lg">Créer mon compte Pro</Button>
                </Link>
                <Link href="/pro/dashboard">
                    <Button variant="outline" size="lg">J'ai déjà un compte</Button>
                </Link>
            </div>
        </div>
    );
}
