export type Country = {
    name: string;
    code: string;
    flag: string;
    continent: string;
};

export type ShippingZone = {
    id: string;
    name: string;
    description: string;
    price: string;
    search: string;
    selectedCountries: string[];
};
