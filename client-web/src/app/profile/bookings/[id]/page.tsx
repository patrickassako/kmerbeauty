"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageSquare, Send, User, CheckCircle, Paperclip, Mic, X, StopCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export default function BookingDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [booking, setBooking] = useState<any>(null);
    const [chat, setChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Data
    useEffect(() => {
        if (!id) return;

        async function loadData() {
            setLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (!currentUser) {
                router.push('/login');
                return;
            }

            // 1. Fetch Booking Details
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    booking_items(*),
                    salon:salons(*),
                    therapist:therapists(*)
                `)
                .eq('id', id)
                .single();

            if (bookingError) {
                console.error("Error fetching booking:", bookingError);
                setLoading(false);
                return;
            }

            // Fetch Service Images (Name Match Fallback)
            const serviceNames = bookingData.booking_items?.map((i: any) => i.service_name).filter(Boolean) || [];
            let imagesMap: Record<string, string[]> = {};

            if (serviceNames.length > 0) {
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('images, name_fr, name_en')
                    .in('name_fr', serviceNames);

                servicesData?.forEach((svc: any) => {
                    if (svc.name_fr) imagesMap[svc.name_fr] = svc.images;
                });
            }

            // Fetch Therapist User Name if needed
            let providerName = "Prestataire";
            let providerId: string | null = null;

            if (bookingData.salon) {
                providerName = bookingData.salon.name_fr || bookingData.salon.name_en;
                // Try to find owner_id or user_id for chat
                providerId = bookingData.salon.user_id || bookingData.salon.owner_id;
            } else if (bookingData.therapist) {
                providerName = bookingData.therapist.business_name;
                providerId = bookingData.therapist.user_id;

                if (!providerName && bookingData.therapist.user_id) {
                    const { data: uData } = await supabase.from('users').select('first_name, last_name').eq('id', bookingData.therapist.user_id).single();
                    if (uData) providerName = `${uData.first_name} ${uData.last_name}`;
                }
            }

            // Enrich Booking Object
            const enrichedBooking = {
                ...bookingData,
                providerName,
                providerId,
                booking_items: bookingData.booking_items.map((item: any) => ({
                    ...item,
                    image: imagesMap[item.service_name]?.[0] || null
                }))
            };
            setBooking(enrichedBooking);

            // 2. Load Chat
            if (providerId) {
                // Find existing chat
                const { data: chatData } = await supabase
                    .from('chats')
                    .select('*')
                    .eq('booking_id', id)
                    .maybeSingle();

                if (chatData) {
                    setChat(chatData);
                    // Load Messages
                    const { data: msgs } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('chat_id', chatData.id)
                        .order('created_at', { ascending: true });
                    setMessages(msgs || []);
                }
            }

            setLoading(false);
        }

        loadData();
    }, [id, router]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Subscribe to new messages (Simple polling for now or Realtime)
    useEffect(() => {
        if (!chat) return;

        const channel = supabase
            .channel(`chat:${chat.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `chat_id=eq.${chat.id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chat]);

    const ensureChatExists = async () => {
        if (chat) return chat.id;
        if (!booking || !user) return null;

        if (!booking.providerId) {
            alert("Impossible de démarrer le chat : Contact du prestataire introuvable.");
            return null;
        }

        try {
            const { data: newChat, error: createError } = await supabase
                .from('chats')
                .insert({
                    booking_id: booking.id,
                    client_id: user.id,
                    provider_id: booking.providerId,
                    is_active: true
                })
                .select()
                .single();

            if (createError) throw createError;
            setChat(newChat);
            return newChat.id;
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Erreur lors de la création de la conversation.");
            return null;
        }
    };

    const handleSendMessage = async (content = newMessage, type = 'TEXT', attachments: string[] = [], duration?: number) => {
        if (!content.trim() && type === 'TEXT') return;
        if (!user || !booking) return;

        setSending(true);

        try {
            const chatId = await ensureChatExists();
            if (!chatId) {
                setSending(false);
                return;
            }

            // Send Message
            const { error: msgError } = await supabase
                .from('chat_messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: content,
                    type: type,
                    attachments: attachments,
                    duration_seconds: duration
                });

            if (msgError) throw msgError;

            // Optimistic Update if creating new chat (realtime might not catch it if channel setup is delayed)
            if (!chat) {
                const { data: msgs } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId);
                setMessages(msgs || []);
            }

            if (type === 'TEXT') setNewMessage("");

            // Update Chat Last Message
            await supabase
                .from('chats')
                .update({
                    last_message: type === 'TEXT' ? content : (type === 'IMAGE' ? '📷 Image' : '🎤 Audio'),
                    last_message_at: new Date().toISOString()
                })
                .eq('id', chatId);

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Erreur lors de l'envoi du message.");
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSending(true);
        try {
            const chatId = await ensureChatExists();
            if (!chatId) {
                setSending(false);
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${chatId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `chat-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            await handleSendMessage("Image envoyée", 'IMAGE', [publicUrl]);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Erreur lors de l'envoi de l'image.");
            setSending(false);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const mimeTypeRef = useRef<string>("");

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            let mimeType = "audio/mp4";
            if (MediaRecorder.isTypeSupported("audio/mp4")) {
                mimeType = "audio/mp4";
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                mimeType = "audio/webm";
            } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
                mimeType = "audio/ogg";
            }
            mimeTypeRef.current = mimeType;
            console.log("Recording with MIME type:", mimeType);

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
                await sendVoiceMessage(audioBlob, duration);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordingStartTimeRef.current = Date.now();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Impossible d'accéder au microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
        if (audioBlob.size === 0) {
            console.error("Audio blob is empty");
            return;
        }

        setSending(true);
        try {
            const chatId = await ensureChatExists();
            if (!chatId) {
                setSending(false);
                return;
            }

            const mimeType = mimeTypeRef.current || audioBlob.type || "audio/mp4";
            let extension = "mp4";
            if (mimeType.includes("webm")) extension = "webm";
            if (mimeType.includes("ogg")) extension = "ogg";
            if (mimeType.includes("wav")) extension = "wav";

            const fileName = `${chatId}/${Date.now()}.${extension}`;
            const filePath = `chat-audio/${fileName}`;

            console.log("Uploading audio:", filePath, mimeType, audioBlob.size);

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, audioBlob, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            await handleSendMessage("Message vocal", 'VOICE', [publicUrl], duration);

        } catch (error) {
            console.error("Error sending voice message:", error);
            alert("Erreur lors de l'envoi du message vocal.");
            setSending(false);
        }
    };


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'Confirmé';
            case 'PENDING': return 'En attente';
            case 'CANCELLED': return 'Annulé';
            case 'COMPLETED': return 'Terminé';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <p className="text-gray-500">Réservation introuvable.</p>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="!fixed !inset-0 !z-[99999] !bg-gray-50 overflow-y-auto min-h-[100dvh] pb-20 md:!static md:!z-auto md:min-h-screen md:pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100 pt-[calc(env(safe-area-inset-top))]">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Détails de la réservation</h1>
                        <p className="text-xs text-gray-500">#{booking.id.slice(0, 8)}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
                        {/* Service Item */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                Informations Service
                            </h2>
                            {booking.booking_items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                                    <div className="h-20 w-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                        {item.image ? (
                                            <img src={item.image} alt={item.service_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <Calendar className="h-8 w-8 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 line-clamp-2">{item.service_name}</h3>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            {item.duration} min
                                        </div>
                                        <div className="text-primary font-bold mt-1">
                                            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(item.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-lg text-primary">
                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(booking.total)}
                                </span>
                            </div>
                        </div>

                        {/* Provider Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Prestataire
                            </h2>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-lg">
                                    {booking.providerName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{booking.providerName}</h3>
                                    <p className="text-sm text-gray-500">{booking.salon?.city || booking.therapist?.city}</p>
                                </div>
                            </div>
                            {booking.salon?.address && (
                                <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                    <span>{booking.salon.address}</span>
                                </div>
                            )}
                            {(booking.salon?.phone || booking.therapist?.phone) && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{booking.salon?.phone || booking.therapist?.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Date & Heure
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {format(new Date(booking.scheduled_at), 'd MMM yyyy', { locale: fr })}
                                    </p>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Heure</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {format(new Date(booking.scheduled_at), 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Chat */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Discussion
                            </h2>
                            <span className="text-xs text-gray-400">
                                {messages.length > 0 ? `${messages.length} messages` : 'Aucun message'}
                            </span>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <MessageSquare className="h-12 w-12 opacity-20" />
                                    <p>Commencez la discussion avec le prestataire.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMe
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                                }`}>

                                                {msg.type === 'IMAGE' && msg.attachments?.[0] && (
                                                    <div className="mb-2 rounded-lg overflow-hidden">
                                                        <img src={msg.attachments[0]} alt="Image" className="max-w-full max-h-60 object-cover" />
                                                    </div>
                                                )}

                                                {msg.type === 'VOICE' && msg.attachments?.[0] && (
                                                    <div className="mb-1">
                                                        <audio controls src={msg.attachments[0]} className="h-8 max-w-[200px]" />
                                                    </div>
                                                )}

                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(newMessage, 'TEXT'); }}
                                className="flex gap-2 items-center"
                            >
                                {/* File Input (Hidden) */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />

                                {/* Buttons */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sending}
                                >
                                    <Paperclip className="h-5 w-5" />
                                </Button>

                                {isRecording ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="animate-pulse"
                                        onClick={stopRecording}
                                    >
                                        <StopCircle className="h-5 w-5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-primary"
                                        onClick={startRecording}
                                        disabled={sending}
                                    >
                                        <Mic className="h-5 w-5" />
                                    </Button>
                                )}

                                <Input
                                    className="bg-white border-gray-200 focus-visible:ring-primary"
                                    placeholder={isRecording ? "Enregistrement en cours..." : "Écrivez votre message..."}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending || isRecording}
                                />
                                <Button type="submit" disabled={!newMessage.trim() || sending || isRecording} className="bg-primary hover:bg-primary/90 text-white">
                                    {sending ? '...' : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
