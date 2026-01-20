"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ContactModal } from "./ContactModal";

export function ContactButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-black text-white px-4 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105 group"
                aria-label="Nous contacter"
            >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Nous contacter</span>
            </button>

            <ContactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
