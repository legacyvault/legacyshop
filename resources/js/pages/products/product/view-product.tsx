import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IProducts, IStocks, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ChevronDown, PencilLine, Trash2Icon } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

interface IStockFormData {
    id?: string | null;
    product_id: string;
    remarks: string;
    quantity: number;
}

interface IStockErrorData {
    product_id?: string;
    remarks?: string;
    quantity?: string;
}

interface IDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    productId: string;
    stock?: IStocks;
    //Inertia’s useForm
    data: IStockFormData;
    setData: (field: 'id' | 'product_id' | 'remarks' | 'quantity', value: string) => void;
    errors: IStockErrorData;

    onSubmit: (e: React.FormEvent) => void;
}

export default function ViewProduct() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Product - Product - View',
            href: '/products/subcategory/viewsub',
        },
    ];

    const { product } = usePage<SharedData>().props;

    const selectedProduct: IProducts = product as IProducts;

    // Derive lists for layout sections
    const subcategories = selectedProduct?.subcategories ?? [];
    const divisions = selectedProduct?.divisions ?? [];
    const variants = selectedProduct?.variants ?? [];

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const [openAddStock, isOpenAddStock] = useState(false);
    const [openEditStock, isOpenEditStock] = useState(false);
    const [selectedStock, setSelectedStock] = useState<IStocks>();

    const { data, setData, post, errors } = useForm<Required<IStockFormData>>({
        id: null,
        product_id: '',
        remarks: '',
        quantity: 0,
    });

    const editStockHandler = (stock: IStocks, type: 'edit' | 'delete') => {
        setSelectedStock(stock);
        isOpenEditStock(true);
    };

    const submitHandlder = (e: any) => {
        e.preventDefault();
        post(route('product.add-stock'), {
            onSuccess: () => isOpenAddStock(false),
            onError: () => isOpenAddStock(true),
        });
    };

    const editSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('product.update-stock'), {
            onSuccess: () => isOpenEditStock(false),
            onError: () => isOpenEditStock(true),
        });
    };

    return (
        <>
            <AddStockDialog
                open={openAddStock}
                isOpen={isOpenAddStock}
                type={'add'}
                onSubmit={submitHandlder}
                errors={errors}
                data={data}
                setData={setData}
                productId={selectedProduct.id}
            />

            <AddStockDialog
                open={openEditStock}
                isOpen={isOpenEditStock}
                type={'edit'}
                onSubmit={editSubmitHandler}
                errors={errors}
                data={data}
                setData={setData}
                productId={selectedProduct.id}
                stock={selectedStock}
            />

            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Product - Products - View" />
                <div className="min-h-screen bg-background p-6">
                    <div className="space-y-6">
                        <div className="flex space-x-4 pt-4">
                            <button
                                type="button"
                                className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80"
                                onClick={() => window.history.back()}
                            >
                                Back
                            </button>
                        </div>
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="mb-2 text-3xl font-bold text-foreground">Product Details</h1>
                        </div>

                        {/* Total Stocks Card */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <div className="text-center">
                                <h2 className="mb-2 text-lg font-semibold text-card-foreground">Total Stocks</h2>
                                <div className="text-4xl font-bold text-primary">{selectedProduct.total_stock}</div>
                            </div>
                        </div>

                        {/* Pictures */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-6 border-b border-border pb-2 text-xl font-semibold text-card-foreground">Pictures</h2>
                            {(selectedProduct.pictures?.length ?? 0) > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                                    {selectedProduct.pictures!.map((pic) => (
                                        <div key={pic.id} className="overflow-hidden rounded-lg border">
                                            <img src={pic.url} alt={selectedProduct.product_name} className="h-24 w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No pictures available.</p>
                            )}
                        </div>

                        {/* Stock Information Card */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-6 border-b border-border pb-2 text-xl font-semibold text-card-foreground">Product Basic Information</h2>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Name</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.product_name}</p>
                                </div>

                                {/* Product SKU */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">SKU</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.product_sku}</p>
                                </div>

                                {/* Showcase */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Showcase 'Top Selling'</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.is_showcase_top ? 'Yes' : 'No'}</p>
                                </div>

                                {/* Showcase */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Showcase 'Shop Picks of the Month'
                                    </h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.is_showcase_bottom ? 'Yes' : 'No'}</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Description</h3>
                                    <p className="leading-relaxed font-semibold text-card-foreground">{selectedProduct.description}</p>
                                </div>

                                {/* Unit */}
                                <div className="col-span-2 space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Collection</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.unit.name}</p>
                                </div>

                                {/* Sub Unit */}
                                <div className="col-span-2 space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Category</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedProduct.sub_unit.name}</p>
                                </div>

                                {/* Category */}
                                <div className="col-span-2 space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Variant</h3>
                                    <p className="text-lg font-semibold text-card-foreground">
                                        {selectedProduct.categories.map(
                                            (cat, i) => `${cat.name}${i + 1 === selectedProduct.categories.length ? '' : ', '}`,
                                        )}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="space-y-2 md:col-span-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Product Discount</h3>
                                    <p className="text-xl font-bold text-primary">{selectedProduct.product_discount}%</p>
                                </div>

                                {/* Price */}
                                <div className="space-y-2 md:col-span-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Product Price</h3>
                                    <p className="text-xl font-bold text-primary">Rp. {formatRupiah(selectedProduct.product_price.toString())}</p>
                                </div>
                            </div>
                        </div>

                        {/* Subcategories with Discounts */}
                        <Collapsible defaultOpen className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="text-xl font-semibold text-card-foreground">Types</h2>
                                <CollapsibleTrigger className="inline-flex h-8 w-8 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                    <ChevronDown className="h-5 w-5" />
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-6">
                                {subcategories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No type found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {subcategories.map((sc) => (
                                            <Collapsible key={sc.id} className="rounded-md border border-border p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Type</p>
                                                        <p className="text-base font-semibold text-card-foreground">{sc.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                            {`${sc.discount ?? 0}%`}
                                                        </span>
                                                        <CollapsibleTrigger className="inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                                            <ChevronDown className="h-4 w-4" />
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    Stock: {sc.total_stock?.toLocaleString?.() ?? sc.total_stock}
                                                </div>
                                                <CollapsibleContent className="mt-3 space-y-1 text-sm">
                                                    {sc.description ? <p className="text-card-foreground">{sc.description}</p> : null}
                                                    <p className="text-muted-foreground">Price: Rp. {formatRupiah(String(sc.price ?? 0))}</p>
                                                    <p className="text-muted-foreground">Divisions: {sc.divisions?.length ?? 0}</p>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Divisions with Discounts */}
                        <Collapsible defaultOpen className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="text-xl font-semibold text-card-foreground">Options</h2>
                                <CollapsibleTrigger className="inline-flex h-8 w-8 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                    <ChevronDown className="h-5 w-5" />
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-6">
                                {divisions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No options found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {divisions.map((dv) => (
                                            <Collapsible key={dv.id} className="rounded-md border border-border p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Option</p>
                                                        <p className="text-base font-semibold text-card-foreground">{dv.name}</p>
                                                        {dv?.sub_category?.name ? (
                                                            <p className="text-xs text-muted-foreground">Type: {dv.sub_category.name}</p>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                            {`${dv.discount ?? 0}%`}
                                                        </span>
                                                        <CollapsibleTrigger className="inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                                            <ChevronDown className="h-4 w-4" />
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    Stock: {dv.total_stock?.toLocaleString?.() ?? dv.total_stock}
                                                </div>
                                                <CollapsibleContent className="mt-3 space-y-1 text-sm">
                                                    {dv.description ? <p className="text-card-foreground">{dv.description}</p> : null}
                                                    <p className="text-muted-foreground">Price: Rp. {formatRupiah(String(dv.price ?? 0))}</p>
                                                    <p className="text-muted-foreground">Variants: {dv.variants?.length ?? 0}</p>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Variants with Discounts */}
                        <Collapsible defaultOpen className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="text-xl font-semibold text-card-foreground">Selection</h2>
                                <CollapsibleTrigger className="inline-flex h-8 w-8 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                    <ChevronDown className="h-5 w-5" />
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-6">
                                {variants.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No selections found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {variants.map((vr) => (
                                            <Collapsible key={vr.id} className="rounded-md border border-border p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Selection</p>
                                                        <p className="text-base font-semibold text-card-foreground">{vr.name}</p>
                                                        {vr?.type === 'color' && vr?.color ? (
                                                            <span className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                                                Color
                                                                <span
                                                                    className="inline-block h-3 w-3 rounded"
                                                                    style={{ backgroundColor: vr.color }}
                                                                />
                                                                <span>{vr.color}</span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                            {`${vr.discount ?? 0}%`}
                                                        </span>
                                                        <CollapsibleTrigger className="inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-muted data-[state=open]:rotate-180">
                                                            <ChevronDown className="h-4 w-4" />
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    Stock: {vr.total_stock?.toLocaleString?.() ?? vr.total_stock}
                                                </div>
                                                <CollapsibleContent className="mt-3 space-y-1 text-sm">
                                                    {vr.description ? <p className="text-card-foreground">{vr.description}</p> : null}
                                                    <p className="text-muted-foreground">Type: {vr.type || 'n/a'}</p>
                                                    <p className="text-muted-foreground">Price: Rp. {formatRupiah(String(vr.price ?? 0))}</p>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Stock History Table */}
                        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="border-b border-border p-6">
                                <h2 className="text-xl font-semibold text-card-foreground">Stock Purchase History</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Track of all stock purchases and additions</p>
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="button"
                                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                        onClick={() => isOpenAddStock(true)}
                                    >
                                        Add Stock
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Stock Added
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedProduct.stocks.length > 0 ? (
                                            selectedProduct.stocks.map((item, index) => (
                                                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-card-foreground">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                        {formatDate(item.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                                            +{item.quantity}
                                                        </span>
                                                    </td>
                                                    {index === 0 ? (
                                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">
                                                            <div className="flex gap-4">
                                                                <PencilLine onClick={() => editStockHandler(item, 'edit')}></PencilLine>
                                                                <Trash2Icon className="text-destructive"></Trash2Icon>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        <td></td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                    No stock purchase history available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}

function AddStockDialog({ open, isOpen, type, onSubmit, data, setData, errors, productId, stock }: IDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit') {
                setData('id', stock!.id);
                setData('product_id', productId);
                setData('quantity', stock!.quantity.toString());
                setData('remarks', stock!.remarks);
            } else if (type === 'add') {
                setData('product_id', productId);
                setData('quantity', '');
                setData('remarks', '');
            }
        }
    }, [open, type]);
    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle className="capitalize">{type} Categories</DialogTitle>
                    {type !== 'delete' ? (
                        <form method="POST" onSubmit={onSubmit}>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Quantity *</label>
                                <input
                                    type="text"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.quantity ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="0"
                                />
                                {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
                            </div>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Remarks</label>
                                <input
                                    type="text"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none ${
                                        errors.remarks ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter Remarks"
                                />
                                {errors.remarks && <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>}
                            </div>
                            <DialogClose asChild>
                                <Button type="submit" className="capitalize">
                                    {type}
                                </Button>
                            </DialogClose>
                        </form>
                    ) : (
                        <>
                            <span>Are you sure want to delete this category?</span>
                            <DialogClose asChild>
                                <Button className="capitalize">{type}</Button>
                            </DialogClose>
                        </>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
