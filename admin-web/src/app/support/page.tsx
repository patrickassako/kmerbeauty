"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Types
type Conversation = {
    id: string;
    user_id: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    updated_at: string;
    user?: {
        email: string;
        first_name: string;
        last_name: string;
    };
};

type Message = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
};

export default function SupportPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Fetch current user on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        getUser();
    }, []);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();

        // Realtime subscription for new conversations
        const channel = supabase
            .channel('support_conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' },
                () => fetchConversations()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fetch messages when a conversation is selected
    useEffect(() => {
        if (!selectedConversation) return;

        fetchMessages(selectedConversation.id);

        // Realtime subscription for messages
        const channel = supabase
            .channel(`messages:${selectedConversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages',
                filter: `conversation_id=eq.${selectedConversation.id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation]);

    const fetchConversations = async () => {
        // Note: In a real app, we would join with 'users' table. 
        // Since Supabase JS client doesn't do deep joins easily without foreign keys set up perfectly in Types,
        // we might need a view or just fetch raw.
        const { data, error } = await supabase
            .from('support_conversations')
            .select('*, user:users(email, first_name, last_name)') // Assuming relation exists
            .order('updated_at', { ascending: false });

        if (!error && data) {
            setConversations(data as any);
        }
        setLoading(false);
    };

    const fetchMessages = async (conversationId: string) => {
        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

        const { error } = await supabase
            .from('support_messages')
            .insert({
                conversation_id: selectedConversation.id,
                sender_id: currentUserId,
                content: newMessage,
                is_read: false
            });

        if (!error) {
            setNewMessage("");
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4">
            {/* Sidebar: Conversation List */}
            <Card className="w-1/3 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold mb-4">Conversations</h2>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="Rechercher..." className="pl-8" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedConversation?.id === conv.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                }`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">
                                    {conv.user?.first_name || 'Utilisateur'} {conv.user?.last_name || ''}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(conv.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 truncate">
                                    {conv.status}
                                </span>
                                {conv.status === 'OPEN' && (
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Main: Chat Window */}
            <Card className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">
                                    {selectedConversation.user?.first_name} {selectedConversation.user?.last_name}
                                </h3>
                                <span className="text-xs text-gray-500">{selectedConversation.user?.email}</span>
                            </div>
                            <Button variant="outline" size="sm">
                                Marquer comme résolu
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === currentUserId;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border text-gray-800"
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <span className="text-[10px] opacity-70 mt-1 block">
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Écrivez votre réponse..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button onClick={handleSendMessage}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Sélectionnez une conversation pour commencer
                    </div>
                )}
            </Card>
        </div>
    );
}
