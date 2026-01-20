"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export function ContactModal({ isOpen, onClose }: Props) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setError("Veuillez entrer un message");
            return;
        }

        if (!userId) {
            setError("Vous devez être connecté pour envoyer un message");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create support conversation
            const { data: conversation, error: convError } = await supabase
                .from("support_conversations")
                .insert([{ user_id: userId, status: "OPEN" }])
                .select()
                .single();

            if (convError) throw convError;

            // 2. Create initial message
            const { error: msgError } = await supabase
                .from("support_messages")
                .insert([{
                    conversation_id: conversation.id,
                    sender_id: userId,
                    content: message,
                }]);

            if (msgError) throw msgError;

            setSuccess(true);
            setMessage("");

            // Auto close after 3 seconds
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 3000);

        } catch (err: unknown) {
            console.error("Error creating support ticket:", err);
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-full">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Nous contacter</h2>
                            <p className="text-sm text-gray-300">Notre équipe vous répond sous 24h</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Message envoyé !
                            </h3>
                            <p className="text-gray-600">
                                Nous vous répondrons dans les plus brefs délais.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Votre message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Décrivez votre problème ou question..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Envoyer
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Contact alternatives */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center mb-3">Ou contactez-nous directement</p>
                        <div className="flex justify-center gap-4">
                            <a
                                href="mailto:support@kmrbeauty.com"
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                                support@kmrbeauty.com
                            </a>
                            <a
                                href="tel:+237681022388"
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                +237 681 02 23 88
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
