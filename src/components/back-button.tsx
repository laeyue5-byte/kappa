'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
    fallbackHref?: string;
}

/**
 * A back button that uses router.back() to preserve scroll position.
 * Falls back to a specific href if there's no history.
 */
export function BackButton({ fallbackHref = '/' }: Props) {
    const router = useRouter();

    function handleClick() {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleClick}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}
