'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ChatInterface />
        </Suspense>
    );
}
