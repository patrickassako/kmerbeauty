
"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not use template literals
// If cn doesn't exist, I'll stick to template literals for safety now.
// Actually checking ChatInterface used cn? No, it used template literals. 
// ProfileSidebar used @/lib/utils cn. So it exists.

interface FilterOption {
    label: string;
    value: string;
}

const CATEGORIES: FilterOption[] = [
    { label: 'Tous', value: '' },
    { label: 'Équipement', value: 'equipment' },
    { label: 'Beauté', value: 'beauty_product' },
    { label: 'Accessoire', value: 'accessory' },
    { label: 'Autre', value: 'other' },
];

export function MarketplaceFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentCategory = searchParams.get('category') || '';

    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams);
        if (category) {
            params.set('category', category);
        } else {
            params.delete('category');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {CATEGORIES.map((cat) => {
                const isActive = currentCategory === cat.value;
                return (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {cat.label}
                    </button>
                );
            })}
        </div>
    );
}
