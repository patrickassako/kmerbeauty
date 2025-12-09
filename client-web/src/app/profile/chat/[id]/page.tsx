'use client';

import ChatInterface from "@/components/chat/ChatInterface";
import { useParams } from "next/navigation";

export default function ChatDetailPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <ChatInterface initialChatId={id} />
    );
}
