"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Layers,
    MessageSquare,
    ShieldAlert,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Clients",
        href: "/clients",
        icon: Users,
    },
    {
        title: "Prestataires",
        href: "/providers",
        icon: Briefcase,
    },
    {
        title: "Services",
        href: "/services",
        icon: Layers,
    },
    {
        title: "Marketplace",
        href: "/marketplace",
        icon: ShoppingBag,
    },
    {
        title: "Support",
        href: "/support",
        icon: MessageSquare,
    },
    {
        title: "Modération",
        href: "/moderation",
        icon: ShieldAlert,
    },
    {
        title: "Paramètres",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 py-4 border-b border-sidebar-border/50">
                {!isCollapsed ? (
                    <div className="flex items-center gap-2 animate-in fade-in duration-300">
                        <img src="/logo-desktop.png" alt="KmerServices" className="h-8 w-auto object-contain" />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-foreground">KmerServices</h1>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admin Panel</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full absolute left-0 pr-8">
                        <img src="/logo-mobile.png" alt="K" className="h-8 w-8 object-contain" />
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent z-10"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.title : undefined}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isCollapsed ? "justify-center px-2" : "gap-3",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!isCollapsed && <span>{item.title}</span>}
                                {!isCollapsed && isActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-sidebar-border/50">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                        isCollapsed ? "justify-center px-2" : "justify-start gap-3"
                    )}
                >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span>Déconnexion</span>}
                </Button>
            </div>
        </div>
    );
}
