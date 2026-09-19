export type ReferralFormState = {
    id: string;
    name: string;
    code: string;
    discount: string;
    isActive: boolean;
    isNew?: boolean;
};

export type ReferralCode = {
    id: string;
    name: string;
    code: string;
    discount: number;
    isActive: boolean;
    totalUsage: number;
    totalDiscountGiven: number;
    createdAt: string;
};

export type ReferralUsage = {
    id: string;
    referralId: string;
    referralCode: string;
    referralName: string;
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    orderTotal: number;
    discountAmount: number;
    usedAt: string;
};
