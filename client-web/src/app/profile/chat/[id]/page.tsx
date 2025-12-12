'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ChatInterface from "@/components/chat/ChatInterface";
import { useParams } from "next/navigation";

function ChatDetailContent() {
    const params = useParams();
    const id = params.id as string;
    return <ChatInterface initialChatId={id} />;
}

export default function ChatDetailPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ChatDetailContent />
        </Suspense>
    );
}
