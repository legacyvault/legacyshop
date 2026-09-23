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
    referralId: string | null;
    referralCode: string;
    referralName: string;
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    orderTotal: number;
    discountAmount: number;
    usedAt: string;
};

export type ReferralResponse = {
    id: string;
    name: string;
    referral_code: string;
    discount: number | string;
    is_active: boolean | number;
    usage?: number | string;
    total_discount?: number | string;
    created_at: string;
};

export type ReferralUsageResponse = {
    id: string;
    referral_id: string | null;
    referral_code: string;
    referral_name: string;
    customer_name: string;
    customer_email: string;
    order_number: string;
    order_total: number | string;
    discount_amount: number | string;
    used_at: string;
};

export const toReferralCode = (referral: ReferralResponse): ReferralCode => ({
    id: referral.id,
    name: referral.name,
    code: referral.referral_code,
    discount: Number(referral.discount) || 0,
    isActive: Boolean(referral.is_active),
    totalUsage: Number(referral.usage ?? 0) || 0,
    totalDiscountGiven: Number(referral.total_discount ?? 0) || 0,
    createdAt: referral.created_at,
});

export const toReferralUsage = (usage: ReferralUsageResponse): ReferralUsage => ({
    id: usage.id,
    referralId: usage.referral_id,
    referralCode: usage.referral_code,
    referralName: usage.referral_name,
    customerName: usage.customer_name,
    customerEmail: usage.customer_email,
    orderNumber: usage.order_number,
    orderTotal: Number(usage.order_total) || 0,
    discountAmount: Number(usage.discount_amount) || 0,
    usedAt: usage.used_at,
});
