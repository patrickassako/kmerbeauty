"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ContactRequest = {
    id: string;
    email: string;
    reason: string;
    message: string;
    status: 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';
    created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    NEW: { label: "Nouveau", color: "bg-blue-100 text-blue-700" },
    READ: { label: "Lu", color: "bg-yellow-100 text-yellow-700" },
    REPLIED: { label: "Répondu", color: "bg-green-100 text-green-700" },
    CLOSED: { label: "Fermé", color: "bg-gray-100 text-gray-700" },
};

const REASON_LABELS: Record<string, string> = {
    general: "Question générale",
    booking: "Problème de réservation",
    provider: "Devenir prestataire",
    partnership: "Partenariat",
    other: "Autre",
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactRequest[]>([]);
    const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchContacts();

        // Realtime subscription
        const channel = supabase
            .channel('contact_requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' },
                () => fetchContacts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchContacts = async () => {
        const { data, error } = await supabase
            .from('contact_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setContacts(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase
            .from('contact_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        fetchContacts();
        if (selectedContact?.id === id) {
            setSelectedContact({ ...selectedContact, status: status as ContactRequest['status'] });
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4">
            {/* Sidebar: Contact List */}
            <Card className="w-1/3 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Demandes de contact
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Chargement...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Aucune demande</div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => {
                                    setSelectedContact(contact);
                                    if (contact.status === 'NEW') {
                                        updateStatus(contact.id, 'READ');
                                    }
                                }}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedContact?.id === contact.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                    }`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium truncate">{contact.email}</span>
                                    {contact.status === 'NEW' && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 truncate">
                                        {REASON_LABELS[contact.reason] || contact.reason}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(contact.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Main: Contact Details */}
            <Card className="flex-1 flex flex-col">
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-bold flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {selectedContact.email}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[selectedContact.status].color}`}>
                                        {STATUS_LABELS[selectedContact.status].label}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(selectedContact.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateStatus(selectedContact.id, 'REPLIED')}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Marquer répondu
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                                >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Répondre
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                                <h4 className="font-semibold text-sm text-gray-500 mb-1">Motif</h4>
                                <p className="text-gray-900">
                                    {REASON_LABELS[selectedContact.reason] || selectedContact.reason}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-sm text-gray-500 mb-1">Message</h4>
                                <p className="text-gray-900 whitespace-pre-wrap">
                                    {selectedContact.message}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Sélectionnez une demande pour voir les détails
                    </div>
                )}
            </Card>
        </div>
    );
}
