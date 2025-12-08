import VoucherCard from '@/components/misc/voucher-card';
import VoucherModal from '@/components/misc/voucher-modal';
import { VoucherFormState, VoucherGroupOption, VoucherProductOption } from '@/components/misc/voucher-types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type VoucherProductResponse = {
    id?: string;
    product_name?: string | null;
    product_sku?: string | null;
    product_group_id?: string | null;
    product_price?: number | null;
    product_usd_price?: number | null;
};

type VoucherResponse = {
    id?: string;
    name?: string | null;
    voucher_code?: string | null;
    discount?: number | string | null;
    is_limit?: boolean | number | string | null;
    limit?: number | string | null;
    products?: (VoucherProductResponse | null)[] | null;
};

type ProductGroupResponse = {
    id?: string;
    name?: string | null;
    products?: (VoucherProductResponse | null)[] | null;
    products_count?: number | null;
};

type PageProps = SharedData & {
    vouchers?: VoucherResponse[] | null;
    productGroups?: ProductGroupResponse[] | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Misc - Voucher',
        href: '/misc/voucher',
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

const normalizeProduct = (product: VoucherProductResponse | null | undefined, groupName?: string, forcedGroupId?: string): VoucherProductOption | null => {
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

const generateVoucherId = () => {
    const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto & { randomUUID?: () => string }) : undefined;
    if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
    return `voucher-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function Voucher() {
    const { vouchers: voucherData, productGroups } = usePage<PageProps>().props;

    const normalizedGroups = useMemo<VoucherGroupOption[]>(() => {
        if (!Array.isArray(productGroups)) return [];

        const groups: VoucherGroupOption[] = [];

        productGroups.forEach((group) => {
            const id = typeof group?.id === 'string' ? group.id : '';
            if (!id) return;

            const name = typeof group?.name === 'string' ? group.name : 'Untitled group';
            const products = Array.isArray(group?.products)
                ? group.products
                      .map((product) => normalizeProduct(product, name, id))
                      .filter((product): product is VoucherProductOption => Boolean(product))
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

    const fallbackProductLookup = useMemo<Record<string, VoucherProductOption>>(() => {
        const map: Record<string, VoucherProductOption> = {};
        if (!Array.isArray(voucherData)) return map;

        voucherData.forEach((voucher) => {
            if (!Array.isArray(voucher?.products)) return;

            voucher.products.forEach((product) => {
                const normalized = normalizeProduct(product);
                if (normalized) {
                    map[normalized.id] = normalized;
                }
            });
        });

        return map;
    }, [voucherData]);

    const productLookup = useMemo<Record<string, VoucherProductOption>>(() => {
        const map: Record<string, VoucherProductOption> = {};

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

    const serverVouchers = useMemo<VoucherFormState[]>(() => {
        if (!Array.isArray(voucherData)) return [];

        const vouchersList: VoucherFormState[] = [];

        voucherData.forEach((voucher) => {
            const id = toStringValue(voucher?.id);
            if (!id) return;

            const productIds = Array.isArray(voucher?.products)
                ? Array.from(
                      new Set(
                          voucher.products
                              .map((product) => (product && typeof product.id === 'string' ? product.id : null))
                              .filter((value): value is string => Boolean(value)),
                      ),
                  )
                : [];

            vouchersList.push({
                id,
                name: toStringValue(voucher?.name),
                code: toStringValue(voucher?.voucher_code),
                discount: toStringValue(voucher?.discount),
                isLimit: toBoolean(voucher?.is_limit),
                limit: toStringValue(voucher?.limit),
                productIds,
                search: '',
                isNew: false,
            });
        });

        return vouchersList;
    }, [voucherData]);

    const [vouchers, setVouchers] = useState<VoucherFormState[]>(serverVouchers);
    const [draftVoucher, setDraftVoucher] = useState<VoucherFormState | null>(null);
    const [activeVoucherId, setActiveVoucherId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);

    useEffect(() => {
        setVouchers(serverVouchers);
    }, [serverVouchers]);

    useEffect(() => {
        setFormError(null);
    }, [activeVoucherId]);

    const addVoucher = () => {
        const newVoucher: VoucherFormState = {
            id: generateVoucherId(),
            name: '',
            code: '',
            discount: '',
            isLimit: false,
            limit: '',
            productIds: [],
            search: '',
            isNew: true,
        };

        setDraftVoucher(newVoucher);
        setActiveVoucherId(newVoucher.id);
        setFormError(null);
    };

    const updateVoucherField = (voucherId: string, field: keyof VoucherFormState, value: string | boolean) => {
        if (draftVoucher?.id === voucherId) {
            setDraftVoucher({ ...draftVoucher, [field]: value } as VoucherFormState);
            return;
        }

        setVouchers((prev) =>
            prev.map((voucher) => {
                if (voucher.id !== voucherId) return voucher;
                return { ...voucher, [field]: value } as VoucherFormState;
            }),
        );
    };

    const toggleProduct = (voucherId: string, productId: string, checked: boolean) => {
        if (draftVoucher?.id === voucherId) {
            const selected = new Set(draftVoucher.productIds);
            if (checked) {
                selected.add(productId);
            } else {
                selected.delete(productId);
            }
            setDraftVoucher({ ...draftVoucher, productIds: Array.from(selected) });
            return;
        }

        setVouchers((prev) =>
            prev.map((voucher) => {
                if (voucher.id !== voucherId) return voucher;
                const selected = new Set(voucher.productIds);
                if (checked) {
                    selected.add(productId);
                } else {
                    selected.delete(productId);
                }
                return { ...voucher, productIds: Array.from(selected) };
            }),
        );
    };

    const toggleGroup = (voucherId: string, groupId: string, next: CheckedState) => {
        const group = normalizedGroups.find((item) => item.id === groupId);
        if (!group) return;

        const shouldSelect = next === true;
        const productIds = group.products.map((product) => product.id);

        if (draftVoucher?.id === voucherId) {
            const selected = new Set(draftVoucher.productIds);
            productIds.forEach((id) => {
                if (shouldSelect) {
                    selected.add(id);
                } else {
                    selected.delete(id);
                }
            });
            setDraftVoucher({ ...draftVoucher, productIds: Array.from(selected) });
            return;
        }

        setVouchers((prev) =>
            prev.map((voucher) => {
                if (voucher.id !== voucherId) return voucher;
                const selected = new Set(voucher.productIds);
                productIds.forEach((id) => {
                    if (shouldSelect) {
                        selected.add(id);
                    } else {
                        selected.delete(id);
                    }
                });
                return { ...voucher, productIds: Array.from(selected) };
            }),
        );
    };

    const handleSaveVoucher = (voucherId: string) => {
        const voucher = draftVoucher?.id === voucherId ? draftVoucher : vouchers.find((item) => item.id === voucherId);
        if (!voucher) return;

        const trimmedName = voucher.name.trim();
        const trimmedCode = voucher.code.trim();
        const discountValue = Number.parseFloat(voucher.discount);
        let parsedLimit: number | null = null;

        if (!trimmedName) {
            setFormError('Please provide a voucher name.');
            return;
        }

        if (!trimmedCode) {
            setFormError('Voucher code is required.');
            return;
        }

        if (!Number.isFinite(discountValue)) {
            setFormError('Enter a valid discount value.');
            return;
        }

        if (voucher.isLimit) {
            const limitNumber = Number.parseInt(voucher.limit || '', 10);
            if (!Number.isFinite(limitNumber) || !Number.isInteger(limitNumber) || limitNumber < 1) {
                setFormError('Limit must be at least 1 when enabled.');
                return;
            }
            parsedLimit = limitNumber;
        }

        setFormError(null);
        setSavingVoucherId(voucherId);

        const payload = {
            name: trimmedName,
            voucher_code: trimmedCode,
            discount: discountValue,
            is_limit: voucher.isLimit,
            limit: voucher.isLimit ? parsedLimit : null,
            product_ids: voucher.productIds,
        };

        const onFinish = () => setSavingVoucherId(null);
        const onSuccess = () => {
            setActiveVoucherId(null);
            setDraftVoucher(null);
            router.reload({ only: ['vouchers', 'productGroups'] });
        };
        const onError = (errors: Record<string, string>) => {
            const firstError = Object.values(errors)[0];
            setFormError(typeof firstError === 'string' ? firstError : 'Unable to save voucher.');
        };

        if (voucher.isNew) {
            router.post(route('create.voucher'), payload, {
                preserveScroll: true,
                onError,
                onSuccess,
                onFinish,
            });
        } else {
            router.post(
                route('update.voucher', voucher.id),
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

    const activeVoucher = useMemo(() => {
        if (draftVoucher && draftVoucher.id === activeVoucherId) return draftVoucher;
        return vouchers.find((voucher) => voucher.id === activeVoucherId) ?? null;
    }, [vouchers, activeVoucherId, draftVoucher]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Misc - Voucher" />

            <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold leading-tight">Voucher management</h1>
                        <p className="text-sm text-muted-foreground">
                            Create voucher codes, set discounts, and attach them to products inside each product group.
                        </p>
                    </div>
                    <Button onClick={addVoucher}>
                        <Plus className="size-4" />
                        Add voucher
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {vouchers.map((voucher) => {
                        const selectedProducts = voucher.productIds
                            .map((id) => productLookup[id])
                            .filter((product): product is VoucherProductOption => Boolean(product));

                        return (
                            <VoucherCard
                                key={voucher.id}
                                voucher={voucher}
                                products={selectedProducts}
                                onEdit={() => setActiveVoucherId(voucher.id)}
                            />
                        );
                    })}
                </div>

                {!vouchers.length && (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No vouchers yet</CardTitle>
                            <CardDescription>Add your first voucher to start offering discounts.</CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>

            {activeVoucher && (
                <VoucherModal
                    open={Boolean(activeVoucher)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setFormError(null);
                            setActiveVoucherId(null);
                            if (draftVoucher) setDraftVoucher(null);
                        }
                    }}
                    voucher={activeVoucher}
                    productGroups={normalizedGroups}
                    onFieldChange={(field, value) => updateVoucherField(activeVoucher.id, field, value)}
                    onToggleProduct={(id, checked) => toggleProduct(activeVoucher.id, id, checked)}
                    onToggleGroup={(groupId, next) => toggleGroup(activeVoucher.id, groupId, next)}
                    onSave={() => handleSaveVoucher(activeVoucher.id)}
                    saving={savingVoucherId === activeVoucher.id}
                    errorMessage={formError}
                />
            )}
        </AppLayout>
    );
}
