import { useCallback, useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType, IInventoryNotification } from '@/types';
import { Bell, Loader2 } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [openNotifications, setOpenNotifications] = useState(false);
    const [notifications, setNotifications] = useState<IInventoryNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(route('notifications.low-stock'), {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                signal,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const payload = await response.json();
            setNotifications(Array.isArray(payload?.data) ? payload.data : []);
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                return;
            }
            console.error(err);
            setError('Unable to load notifications. Please try again.');
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadNotifications(controller.signal);

        return () => controller.abort();
    }, [loadNotifications]);

    useEffect(() => {
        if (!openNotifications) return;
        const controller = new AbortController();
        void loadNotifications(controller.signal);

        return () => controller.abort();
    }, [openNotifications, loadNotifications]);

    const notificationGroups = useMemo(() => {
        const groups: Record<IInventoryNotification['type'], IInventoryNotification[]> = {
            product: [],
            subcategory: [],
            division: [],
            variant: [],
        };

        notifications.forEach((notification) => {
            groups[notification.type]?.push(notification);
        });

        return groups;
    }, [notifications]);

    const notificationCount = notifications.length;
    const formattedCount = notificationCount > 99 ? '99+' : notificationCount;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <Sheet open={openNotifications} onOpenChange={setOpenNotifications}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Open notifications"
                            className="relative h-9 w-9 rounded-full border border-transparent hover:border-sidebar-border/70"
                        >
                            <Bell className="size-5" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1.5 -right-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] leading-none font-semibold text-destructive-foreground">
                                    {formattedCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="flex w-full max-w-sm flex-col px-0">
                        <SheetHeader className="border-b border-sidebar-border/60 px-6 py-4 text-left">
                            <SheetTitle>Notifications</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                            {loading && (
                                <div className="flex items-center justify-center rounded-md border border-dashed border-sidebar-border/80 bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Loading notifications...
                                </div>
                            )}
                            {!loading && error && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            {!loading && !error && notifications.length === 0 && (
                                <div className="rounded-md border border-dashed border-sidebar-border/70 bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                                    You're all caught up! No low stock alerts.
                                </div>
                            )}
                            {!loading && !error && notifications.length > 0 && (
                                <div className="flex flex-col gap-5">
                                    {(['product', 'subcategory', 'division', 'variant'] as IInventoryNotification['type'][]).map((section) => {
                                        const items = notificationGroups[section];
                                        if (!items || items.length === 0) return null;
                                        return (
                                            <div key={section} className="space-y-2">
                                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{section}</p>
                                                <ul className="space-y-2">
                                                    {items.map((item) => (
                                                        <li
                                                            key={`${section}-${item.id}`}
                                                            className="rounded-md border border-sidebar-border/60 bg-background/50 px-4 py-3 shadow-xs"
                                                        >
                                                            <div className="flex items-center justify-between text-sm font-medium">
                                                                <span className="truncate pr-3">{item.name}</span>
                                                                <span className="text-xs font-semibold text-amber-600">{item.remaining}</span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Running low — only {item.remaining} in stock
                                                            </p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
