'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * This component saves and restores scroll position when navigating
 * between pages. It works with both browser back button and in-app
 * back buttons that use router.back().
 */
export function ScrollRestoration() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);
    const previousPathRef = useRef<string | null>(null);

    // Create a unique key for the current route
    const routeKey = `${pathname}?${searchParams.toString()}`;

    // Use useLayoutEffect for synchronous scroll restoration
    useLayoutEffect(() => {
        // Disable browser's native scroll restoration to prevent conflicts
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Skip first render - just save the initial path
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousPathRef.current = routeKey;
            return;
        }

        // Check if we're navigating back to a page we've been to before
        const savedPosition = sessionStorage.getItem(`scroll:${routeKey}`);

        if (savedPosition) {
            const position = parseInt(savedPosition, 10);

            // Restore scroll position with multiple attempts
            // This handles cases where content might load async
            const restoreScroll = () => {
                window.scrollTo(0, position);
            };

            // Immediate attempt
            restoreScroll();

            // After a small delay (for any async content)
            requestAnimationFrame(restoreScroll);
            setTimeout(restoreScroll, 50);
            setTimeout(restoreScroll, 150);
        }

        // Update previous path
        previousPathRef.current = routeKey;
    }, [routeKey]);

    // Save scroll position on scroll
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const saveScrollPosition = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                sessionStorage.setItem(`scroll:${routeKey}`, window.scrollY.toString());
            }, 50);
        };

        // Save position on scroll
        window.addEventListener('scroll', saveScrollPosition, { passive: true });

        // Save position before page unload
        const handleBeforeUnload = () => {
            sessionStorage.setItem(`scroll:${routeKey}`, window.scrollY.toString());
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // Save position when component unmounts (navigating away)
            sessionStorage.setItem(`scroll:${routeKey}`, window.scrollY.toString());
            window.removeEventListener('scroll', saveScrollPosition);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearTimeout(scrollTimeout);
        };
    }, [routeKey]);

    return null;
}
