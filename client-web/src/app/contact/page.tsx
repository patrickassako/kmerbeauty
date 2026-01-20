"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, Mail, Phone, MapPin, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";

const CONTACT_REASONS = [
    { value: "general", label: "Question générale" },
    { value: "booking", label: "Problème de réservation" },
    { value: "provider", label: "Devenir prestataire" },
    { value: "partnership", label: "Partenariat" },
    { value: "other", label: "Autre" },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        email: "",
        reason: "",
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.email || !formData.reason || !formData.message) {
            setError("Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from("contact_requests")
                .insert([{
                    email: formData.email,
                    reason: formData.reason,
                    message: formData.message,
                }]);

            if (insertError) throw insertError;

            setSuccess(true);
            setFormData({ email: "", reason: "", message: "" });
        } catch (err) {
            console.error("Error submitting contact form:", err);
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <div className="bg-black text-white py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Contactez-nous
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Une question, une suggestion ou besoin d&apos;aide ?
                        Notre équipe est là pour vous accompagner.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

                    {/* Contact Info */}
                    <div>
                        <h2 className="text-2xl font-bold mb-8">Nos coordonnées</h2>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-3 bg-black rounded-lg">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Email</h3>
                                    <a href="mailto:support@kmrbeauty.com" className="text-gray-600 hover:text-black transition-colors">
                                        support@kmrbeauty.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-3 bg-black rounded-lg">
                                    <Phone className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Téléphone</h3>
                                    <a href="tel:+237681022388" className="text-gray-600 hover:text-black transition-colors">
                                        +237 681 02 23 88
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-3 bg-black rounded-lg">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Adresse</h3>
                                    <p className="text-gray-600">
                                        Yaoundé, Cameroun
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-3 bg-black rounded-lg">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Horaires</h3>
                                    <p className="text-gray-600">
                                        Lun - Sam: 8h00 - 18h00
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                            <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>

                            {success ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Message envoyé !
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Nous vous répondrons dans les plus brefs délais.
                                    </p>
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="text-black underline hover:no-underline"
                                    >
                                        Envoyer un autre message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Votre adresse email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="exemple@email.com"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                            Motif de contact *
                                        </label>
                                        <select
                                            id="reason"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
                                            required
                                        >
                                            <option value="">Sélectionnez un motif</option>
                                            {CONTACT_REASONS.map((reason) => (
                                                <option key={reason.value} value={reason.value}>
                                                    {reason.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Votre message *
                                        </label>
                                        <textarea
                                            id="message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Décrivez votre demande..."
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5" />
                                                Envoyer le message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
