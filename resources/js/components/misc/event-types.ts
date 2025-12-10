export type EventProductOption = {
    id: string;
    name: string;
    sku?: string | null;
    groupId?: string | null;
    groupName?: string;
    price?: number | null;
    usdPrice?: number | null;
};

export type EventGroupOption = {
    id: string;
    name: string;
    products: EventProductOption[];
    productsCount?: number;
};

export type EventFormState = {
    id: string;
    name: string;
    description: string;
    discount: string;
    isActive: boolean;
    productIds: string[];
    imageFile: File | null;
    imageUrl: string | null;
    search: string;
    isNew?: boolean;
};
