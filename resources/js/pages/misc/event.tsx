import EventCard from '@/components/misc/event-card';
import EventModal from '@/components/misc/event-modal';
import { EventFormState, EventGroupOption, EventProductOption } from '@/components/misc/event-types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type EventProductResponse = {
    id?: string;
    product_name?: string | null;
    product_sku?: string | null;
    product_group_id?: string | null;
    product_price?: number | null;
    product_usd_price?: number | null;
};

type EventProductRow = {
    product?: EventProductResponse | null;
};

type EventResponse = {
    id?: string;
    name?: string | null;
    description?: string | null;
    discount?: number | string | null;
    is_active?: boolean | number | string | null;
    picture_url?: string | null;
    event_products?: (EventProductRow | null)[] | null;
};

type ProductGroupResponse = {
    id?: string;
    name?: string | null;
    products?: (EventProductResponse | null)[] | null;
    products_count?: number | null;
};

type PageProps = SharedData & {
    events?: EventResponse[] | null;
    productGroups?: ProductGroupResponse[] | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Misc - Event',
        href: '/misc/event',
    },
];

const toStringValue = (value: unknown) => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const toBoolean = (value: unknown) => value === true || value === 1 || value === '1';
const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeProduct = (
    product: EventProductResponse | null | undefined,
    groupName?: string,
    forcedGroupId?: string,
): EventProductOption | null => {
    const id = typeof product?.id === 'string' ? product.id : '';
    if (!id) return null;

    return {
        id,
        name: typeof product?.product_name === 'string' ? product.product_name : 'Untitled product',
        sku: typeof product?.product_sku === 'string' ? product.product_sku : null,
        groupId: forcedGroupId ?? (typeof product?.product_group_id === 'string' ? product.product_group_id : null),
        groupName,
        price: typeof product?.product_price === 'number' ? product.product_price : null,
        usdPrice: typeof product?.product_usd_price === 'number' ? product.product_usd_price : null,
    };
};

const generateEventId = () => {
    const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto & { randomUUID?: () => string }) : undefined;
    if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
    return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function Event() {
    const { events: eventData, productGroups } = usePage<PageProps>().props;

    const normalizedGroups = useMemo<EventGroupOption[]>(() => {
        if (!Array.isArray(productGroups)) return [];

        const groups: EventGroupOption[] = [];

        productGroups.forEach((group) => {
            const id = typeof group?.id === 'string' ? group.id : '';
            if (!id) return;

            const name = typeof group?.name === 'string' ? group.name : 'Untitled group';
            const products = Array.isArray(group?.products)
                ? group.products
                      .map((product) => normalizeProduct(product, name, id))
                      .filter((product): product is EventProductOption => Boolean(product))
                : [];
            const productsCount = toNumber(group?.products_count) ?? products.length;

            groups.push({
                id,
                name,
                products,
                productsCount,
            });
        });

        return groups;
    }, [productGroups]);

    const fallbackProductLookup = useMemo<Record<string, EventProductOption>>(() => {
        const map: Record<string, EventProductOption> = {};
        if (!Array.isArray(eventData)) return map;

        eventData.forEach((event) => {
            if (!Array.isArray(event?.event_products)) return;

            event.event_products.forEach((row) => {
                const normalized = normalizeProduct(row?.product);
                if (normalized) {
                    map[normalized.id] = normalized;
                }
            });
        });

        return map;
    }, [eventData]);

    const productLookup = useMemo<Record<string, EventProductOption>>(() => {
        const map: Record<string, EventProductOption> = {};

        normalizedGroups.forEach((group) => {
            group.products.forEach((product) => {
                map[product.id] = product;
            });
        });

        Object.values(fallbackProductLookup).forEach((product) => {
            if (!map[product.id]) {
                map[product.id] = product;
            }
        });

        return map;
    }, [normalizedGroups, fallbackProductLookup]);

    const serverEvents = useMemo<EventFormState[]>(() => {
        if (!Array.isArray(eventData)) return [];

        const events: EventFormState[] = [];

        eventData.forEach((event) => {
            const id = toStringValue(event?.id);
            if (!id) return;

            const productIds = Array.isArray(event?.event_products)
                ? Array.from(
                      new Set(
                          event.event_products
                              .map((row) => (row?.product && typeof row.product.id === 'string' ? row.product.id : null))
                              .filter((value): value is string => Boolean(value)),
                      ),
                  )
                : [];

            events.push({
                id,
                name: toStringValue(event?.name),
                description: toStringValue(event?.description),
                discount: toStringValue(event?.discount),
                isActive: toBoolean(event?.is_active),
                productIds,
                imageFile: null,
                imageUrl: toStringValue(event?.picture_url) || null,
                search: '',
                isNew: false,
            });
        });

        return events;
    }, [eventData]);

    const [events, setEvents] = useState<EventFormState[]>(serverEvents);
    const [draftEvent, setDraftEvent] = useState<EventFormState | null>(null);
    const [activeEventId, setActiveEventId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [savingEventId, setSavingEventId] = useState<string | null>(null);

    useEffect(() => {
        setEvents(serverEvents);
    }, [serverEvents]);

    useEffect(() => {
        setFormError(null);
    }, [activeEventId]);

    const addEvent = () => {
        const newEvent: EventFormState = {
            id: generateEventId(),
            name: '',
            description: '',
            discount: '',
            isActive: true,
            productIds: [],
            imageFile: null,
            imageUrl: null,
            search: '',
            isNew: true,
        };

        setDraftEvent(newEvent);
        setActiveEventId(newEvent.id);
        setFormError(null);
    };

    const updateEventField = (eventId: string, field: keyof EventFormState, value: string | boolean | File | null) => {
        if (draftEvent?.id === eventId) {
            setDraftEvent({ ...draftEvent, [field]: value } as EventFormState);
            return;
        }

        setEvents((prev) =>
            prev.map((item) => {
                if (item.id !== eventId) return item;
                return { ...item, [field]: value } as EventFormState;
            }),
        );
    };

    const toggleProduct = (eventId: string, productId: string, checked: boolean) => {
        if (draftEvent?.id === eventId) {
            const selected = new Set(draftEvent.productIds);
            if (checked) {
                selected.add(productId);
            } else {
                selected.delete(productId);
            }
            setDraftEvent({ ...draftEvent, productIds: Array.from(selected) });
            return;
        }

        setEvents((prev) =>
            prev.map((item) => {
                if (item.id !== eventId) return item;
                const selected = new Set(item.productIds);
                if (checked) {
                    selected.add(productId);
                } else {
                    selected.delete(productId);
                }
                return { ...item, productIds: Array.from(selected) };
            }),
        );
    };

    const toggleGroup = (eventId: string, groupId: string, next: CheckedState) => {
        const group = normalizedGroups.find((item) => item.id === groupId);
        if (!group) return;

        const shouldSelect = next === true;
        const productIds = group.products.map((product) => product.id);

        if (draftEvent?.id === eventId) {
            const selected = new Set(draftEvent.productIds);
            productIds.forEach((id) => {
                if (shouldSelect) {
                    selected.add(id);
                } else {
                    selected.delete(id);
                }
            });
            setDraftEvent({ ...draftEvent, productIds: Array.from(selected) });
            return;
        }

        setEvents((prev) =>
            prev.map((item) => {
                if (item.id !== eventId) return item;
                const selected = new Set(item.productIds);
                productIds.forEach((id) => {
                    if (shouldSelect) {
                        selected.add(id);
                    } else {
                        selected.delete(id);
                    }
                });
                return { ...item, productIds: Array.from(selected) };
            }),
        );
    };

    const handleSaveEvent = (eventId: string) => {
        const event = draftEvent?.id === eventId ? draftEvent : events.find((item) => item.id === eventId);
        if (!event) return;

        const trimmedName = event.name.trim();
        const trimmedDescription = event.description.trim();
        const discountValue = Number.parseFloat(event.discount);

        if (!trimmedName) {
            setFormError('Please provide an event name.');
            return;
        }

        if (!Number.isFinite(discountValue)) {
            setFormError('Enter a valid discount value.');
            return;
        }

        if (!event.productIds.length) {
            setFormError('Select at least one product for this event.');
            return;
        }

        setFormError(null);
        setSavingEventId(eventId);

        const payload: Record<string, any> = {
            name: trimmedName,
            description: trimmedDescription || null,
            discount: discountValue,
            is_active: event.isActive,
            product_ids: event.productIds,
        };

        if (event.imageFile) {
            payload.image = event.imageFile;
        }

        const onFinish = () => setSavingEventId(null);
        const onSuccess = () => {
            setActiveEventId(null);
            setDraftEvent(null);
            router.reload({ only: ['events', 'productGroups'] });
        };
        const onError = (errors: Record<string, string>) => {
            const firstError = Object.values(errors)[0];
            setFormError(typeof firstError === 'string' ? firstError : 'Unable to save event.');
        };

        if (event.isNew) {
            router.post(route('event.create'), payload, {
                preserveScroll: true,
                onError,
                onSuccess,
                onFinish,
            });
        } else {
            router.post(
                route('event.update', event.id),
                payload,
                {
                    preserveScroll: true,
                    onError,
                    onSuccess,
                    onFinish,
                },
            );
        }
    };

    const activeEvent = useMemo(() => {
        if (draftEvent && draftEvent.id === activeEventId) return draftEvent;
        return events.find((item) => item.id === activeEventId) ?? null;
    }, [events, activeEventId, draftEvent]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Misc - Event" />

            <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold leading-tight">Event management</h1>
                        <p className="text-sm text-muted-foreground">Create promotional events, set discounts, and attach products.</p>
                    </div>
                    <Button onClick={addEvent}>
                        <Plus className="size-4" />
                        Add event
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => {
                        const selectedProducts = event.productIds
                            .map((id) => productLookup[id])
                            .filter((product): product is EventProductOption => Boolean(product));

                        return <EventCard key={event.id} event={event} products={selectedProducts} onEdit={() => setActiveEventId(event.id)} />;
                    })}
                </div>

                {!events.length && (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No events yet</CardTitle>
                            <CardDescription>Create an event to start grouping discounts for selected products.</CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>

            {activeEvent && (
                <EventModal
                    open={Boolean(activeEvent)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setFormError(null);
                            setActiveEventId(null);
                            if (draftEvent) setDraftEvent(null);
                        }
                    }}
                    event={activeEvent}
                    productGroups={normalizedGroups}
                    onFieldChange={(field, value) => updateEventField(activeEvent.id, field, value)}
                    onToggleProduct={(id, checked) => toggleProduct(activeEvent.id, id, checked)}
                    onToggleGroup={(groupId, next) => toggleGroup(activeEvent.id, groupId, next)}
                    onSave={() => handleSaveEvent(activeEvent.id)}
                    saving={savingEventId === activeEvent.id}
                    errorMessage={formError}
                />
            )}
        </AppLayout>
    );
}
