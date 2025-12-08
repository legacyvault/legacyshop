export type VoucherProductOption = {
    id: string;
    name: string;
    sku?: string | null;
    groupId?: string | null;
    groupName?: string;
    price?: number | null;
    usdPrice?: number | null;
};

export type VoucherGroupOption = {
    id: string;
    name: string;
    products: VoucherProductOption[];
    productsCount?: number;
};

export type VoucherFormState = {
    id: string;
    name: string;
    code: string;
    discount: string;
    isLimit: boolean;
    limit: string;
    productIds: string[];
    search: string;
    isNew?: boolean;
};
