'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    FileSpreadsheet,
    Menu,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Periods', href: '/periods', icon: CalendarDays },
    { name: 'Ledger', href: '/ledger', icon: FileSpreadsheet },
];

export function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="container flex h-16 items-center px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mr-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">K</span>
                    </div>
                    <span className="font-bold text-xl hidden sm:inline-block">
                        KAPPA
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Desktop Logout Button */}
                <div className="hidden md:flex items-center ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
                {/* Mobile Navigation */}
                <div className="md:hidden ml-auto">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <SheetDescription className="sr-only">Main navigation links</SheetDescription>
                            <div className="flex flex-col gap-4 mt-8">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/' && pathname.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}

                                {/* Mobile Logout Button */}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950 mt-4 border-t pt-6"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Logout
                                </button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
