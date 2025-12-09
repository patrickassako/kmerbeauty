'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, MessageSquare, Plus, Send, Phone, Video, Search, ChevronLeft, Paperclip, Mic, X, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AudioPlayer } from "./AudioPlayer";

interface Chat {
    id: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    booking_id?: string;
    other_user: {
        id: string;
        first_name: string;
        last_name: string;
        avatar: string;
        business_name?: string;
    };
    other_user_type: string;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
    type?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VOICE';
    attachments?: string[];
    duration_seconds?: number;
}

interface ChatInterfaceProps {
    initialChatId?: string | null;
}

export default function ChatInterface({ initialChatId }: ChatInterfaceProps) {
    const router = useRouter();
    // Also check searchParams for backward compatibility or if passed via query
    const searchParams = useSearchParams();
    const queryChatId = searchParams.get('id');

    // Priority: Prop > Query Param
    const effectiveChatId = initialChatId || queryChatId;

    const supabase = createClient();
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // Media States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Fetch User & Chats
    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

                // Fetch all chats
                const res = await fetch(`${API_URL}/chat/user/${user.id}`);
                let userChats: Chat[] = [];

                if (res.ok) {
                    userChats = await res.json();
                    setChats(userChats);
                }

                // Handle Auto-Selection
                let targetChat: Chat | null = null;
                const bookingId = searchParams.get('bookingId');
                const targetUserId = searchParams.get('userId');

                if (effectiveChatId) {
                    targetChat = userChats.find(c => c.id === effectiveChatId) || null;
                    if (!targetChat) {
                        // Fetch details if not in list
                        try {
                            const chatRes = await fetch(`${API_URL}/chat/details/${effectiveChatId}`);
                            if (chatRes.ok) {
                                targetChat = await chatRes.json();
                            }
                        } catch (e) { }
                    }
                } else if (bookingId) {
                    // Try to get/create chat by booking
                    try {
                        const bookingChatRes = await fetch(`${API_URL}/chat/booking/${bookingId}`);
                        if (bookingChatRes.ok) {
                            targetChat = await bookingChatRes.json();
                        }
                    } catch (e) {
                        console.error("Error fetching booking chat", e);
                    }
                } else if (targetUserId) {
                    // Try to get/create direct chat (optional, but good for completeness)
                    /* 
                    // Need provider type (therapist/salon) which we might not have in params. 
                    // Unless we guess or query. For now, rely on bookingId for this task.
                    */
                }

                // Normalize and Select Target Chat
                if (targetChat) {
                    // Ensure other_user structure
                    if (!targetChat.other_user && (targetChat as any).client && (targetChat as any).provider) {
                        const isClient = (targetChat as any).client_id === user.id;
                        const other = isClient ? (targetChat as any).provider : (targetChat as any).client;
                        const type = isClient ? 'provider' : 'client';

                        targetChat = {
                            ...targetChat,
                            other_user: {
                                id: other.id,
                                first_name: other.first_name || (other as any).name_fr || "Inconnu",
                                last_name: other.last_name || "",
                                avatar: other.avatar || (other as any).logo || (other as any).profile_image || "",
                                business_name: (other as any).business_name || (other as any).name_fr
                            },
                            other_user_type: type
                        };
                    }

                    // Add to list if missing
                    const finalTarget = targetChat; // TypeScript narrow
                    setChats(prev => {
                        if (!prev.find(c => c.id === finalTarget.id)) {
                            return [finalTarget, ...prev];
                        }
                        return prev;
                    });

                    setSelectedChat(finalTarget);
                    // Update URL to reflect real Chat ID (cleaner)
                    // router.replace(`/pro/chat?id=${finalTarget.id}`); 
                    // Actually maybe keep bookingId visible or just push proper ID
                }

            } catch (e) {
                console.error("List chats error", e);
            } finally {
                setLoadingChats(false);
            }
        };
        init();
    }, [effectiveChatId, searchParams]); // Add searchParams to dep array or keep empty if we only run on mount

    // 2. Fetch Messages
    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
            try {
                const res = await fetch(`${API_URL}/chat/${selectedChat.id}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    scrollToBottom();
                }
            } catch (e) {
                console.error("Messages error", e);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat:${selectedChat.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `chat_id=eq.${selectedChat.id}`
            }, (payload) => {
                const newMsg = payload.new as Message;

                setMessages(prev => {
                    // 1. Check if message already exists (by ID)
                    if (prev.some(m => m.id === newMsg.id)) {
                        return prev;
                    }

                    // 2. Check for matching optimistic message (by content & sender, and temp ID)
                    // We look for a temp message from THIS user with SAME content
                    const optimisticIndex = prev.findIndex(m =>
                        m.id.startsWith('temp-') &&
                        m.sender_id === newMsg.sender_id &&
                        (m.content === newMsg.content || (m.type === newMsg.type && m.type !== 'TEXT'))
                    );

                    if (optimisticIndex !== -1) {
                        // Replace optimistic with real
                        const newArr = [...prev];
                        newArr[optimisticIndex] = newMsg;
                        return newArr;
                    }

                    // 3. Otherwise append new message
                    return [...prev, newMsg];
                });

                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChat?.id]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e?: React.FormEvent, type: 'TEXT' | 'IMAGE' | 'VOICE' = 'TEXT', content = "", attachments: string[] = [], duration?: number) => {
        if (e) e.preventDefault();

        const msgContent = content || newMessage;
        if ((!msgContent.trim() && type === 'TEXT') || !selectedChat || !currentUser) return;

        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            content: msgContent,
            sender_id: currentUser.id,
            created_at: new Date().toISOString(),
            is_read: false,
            // @ts-ignore
            type,
            attachments,
            duration_seconds: duration
        };

        setMessages(prev => [...prev, optimisticMsg]);
        if (type === 'TEXT') setNewMessage("");
        scrollToBottom();

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        try {
            await fetch(`${API_URL}/chat/${selectedChat.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: currentUser.id,
                    content: optimisticMsg.content,
                    type,
                    attachments,
                    duration_seconds: duration
                })
            });

            // Text is immediate, others handled by subscription mostly
            setChats(prev => prev.map(c =>
                c.id === selectedChat.id
                    ? { ...c, last_message: type === 'TEXT' ? msgContent : (type === 'IMAGE' ? '📷 Image' : '🎤 Vocal'), last_message_at: optimisticMsg.created_at }
                    : c
            ));
        } catch (e) {
            console.error("Send error", e);
        }
    };

    // --- Media Handlers ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedChat.id}/${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('chat-attachments')
                .upload(`chat-images/${fileName}`, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(`chat-images/${fileName}`);

            await handleSendMessage(undefined, 'IMAGE', 'Image sent', [publicUrl]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Erreur lors de l\'envoi de l\'image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Votre navigateur ne supporte pas l'enregistrement audio.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                await uploadAudio(blob);
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err: any) {
            console.error('Mic access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("Accès au micro refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur (icône cadenas dans la barre URL).");
            } else if (err.name === 'NotFoundError') {
                alert("Aucun microphone détecté.");
            } else {
                alert(`Erreur micro: ${err.message || 'Inconnue'}`);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const uploadAudio = async (blob: Blob) => {
        if (!selectedChat) return;
        setIsUploading(true);
        try {
            const fileName = `${selectedChat.id}/${Date.now()}.webm`;
            const { error } = await supabase.storage
                .from('chat-attachments')
                .upload(`chat-audio/${fileName}`, blob);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(`chat-audio/${fileName}`);

            await handleSendMessage(undefined, 'VOICE', 'Message vocal', [publicUrl], recordingTime);
        } catch (error) {
            console.error('Audio upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelectChat = (chat: Chat) => {
        setSelectedChat(chat);
        // Update URL to path param structure
        router.push(`/profile/chat/${chat.id}`);
    };

    if (loadingChats) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-[calc(100dvh-160px)] md:h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Messages</h2>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Plus className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
                {/* Search */}
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Rechercher..." className="w-full bg-gray-50 pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                </div>
                {/* Chat List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                    {chat.other_user.avatar ? (
                                        <img src={chat.other_user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                            {chat.other_user.first_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium text-sm truncate flex items-center gap-2">
                                            {chat.other_user.business_name || `${chat.other_user.first_name} ${chat.other_user.last_name}`}
                                            {chat.booking_id && (
                                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                    CMD
                                                </span>
                                            )}
                                        </h3>
                                        {chat.last_message_at && (
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1" suppressHydrationWarning>
                                                {format(new Date(chat.last_message_at), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${chat.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {chat.last_message || "Nouvelle conversation"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Aucune conversation.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area - Mobile Fullscreen Logic Override */}
            <div
                className={selectedChat
                    ? "fixed top-0 left-0 right-0 bottom-0 z-[99999] bg-white flex flex-col w-full h-[100dvh] md:static md:w-auto md:h-auto md:bg-gray-50/30 md:z-auto md:flex-1"
                    : "hidden md:flex md:flex-1 md:flex-col bg-gray-50/30"
                }
            >
                {selectedChat ? (
                    <>
                        <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10 pt-safe-top">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden p-1 mr-1" onClick={() => setSelectedChat(null)}>
                                    <ChevronLeft className="h-6 w-6 text-gray-600" />
                                </button>
                                <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                                    {selectedChat.other_user?.avatar ? (
                                        <img src={selectedChat.other_user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                            {selectedChat.other_user?.first_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        {selectedChat.other_user?.business_name || `${selectedChat.other_user?.first_name || ''} ${selectedChat.other_user?.last_name || ''}`}
                                        {selectedChat.booking_id && (
                                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                Commande
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex flex-col">
                                        <span className="flex items-center text-xs text-green-600">
                                            <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                            En ligne
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-0.5">
                                            {selectedChat.booking_id ? `Commande #${selectedChat.booking_id.substring(0, 8)}` : "Discussion Directe (Hors Commande)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <Phone className="h-5 w-5" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <Video className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F7FB]">
                            {loadingMessages ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-[#1E3A5F] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                                {/* Content Render Logic */}
                                                {msg.type === 'IMAGE' && msg.attachments?.[0] ? (
                                                    <img
                                                        src={msg.attachments[0]}
                                                        alt="Attached"
                                                        className="max-w-full h-auto max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => setViewImage(msg.attachments![0])}
                                                    />
                                                ) : msg.type === 'VOICE' ? (
                                                    <AudioPlayer
                                                        src={msg.attachments?.[0] || ''}
                                                        duration={msg.duration_seconds}
                                                        isMe={isMe}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-balance break-words">{msg.content}</p>
                                                )}

                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`} suppressHydrationWarning>
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
                        <div className="p-4 bg-white border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            {isRecording ? (
                                <div className="flex items-center justify-between bg-red-50 p-3 rounded-full animate-pulse border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-red-500 rounded-full animate-ping" />
                                        <span className="text-red-500 font-bold text-sm">
                                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setIsRecording(false);
                                                stopRecording(); // Send
                                            }}
                                            className="p-2 bg-white text-green-600 rounded-full shadow-sm hover:bg-gray-50"
                                        >
                                            <Send className="h-4 w-4 fill-current" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsRecording(false);
                                                if (mediaRecorder) mediaRecorder.stop();
                                                setMediaRecorder(null);
                                            }}
                                            className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="p-2 text-gray-400 hover:text-[#1E3A5F] transition-colors hover:bg-blue-50 rounded-full"
                                        title="Envoyer une image"
                                    >
                                        <ImageIcon className="h-6 w-6" />
                                    </button>

                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Message..."
                                        className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 rounded-full py-2.5 px-4 text-base md:text-sm transition-all outline-none"
                                        disabled={isUploading}
                                    />

                                    {newMessage.trim().length > 0 ? (
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="p-2.5 bg-[#FFB700] hover:bg-[#FFB700]/90 text-[#1E3A5F] rounded-full transition-colors disabled:opacity-50"
                                        >
                                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            disabled={isUploading}
                                            className="p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                            title="Message vocal"
                                        >
                                            <Mic className="h-5 w-5" />
                                        </button>
                                    )}
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <MessageSquare className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-bold text-gray-900">Vos conversations</h3>
                        <p className="text-gray-500 text-sm mt-1">Sélectionnez une conversation pour commencer à discuter.</p>
                    </div>
                )}
            </div>
            {/* Image Preview Modal */}
            {viewImage && (
                <div className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
                    <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors z-50">
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={viewImage}
                        alt="Full preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
