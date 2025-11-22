import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IStocks, IVariants } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PencilLine, Trash2Icon } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

interface IStockFormData {
    id?: string | null;
    variant_id: string;
    remarks: string;
    quantity: number;
}

interface IStockErrorData {
    variant_id?: string;
    remarks?: string;
    quantity?: string;
}

interface IDialog {
    open: boolean;
    isOpen: Dispatch<SetStateAction<boolean>>;
    type: 'add' | 'delete' | 'edit';
    variantId: string;
    stock?: IStocks;
    //Inertia’s useForm
    data: IStockFormData;
    setData: (field: 'id' | 'variant_id' | 'remarks' | 'quantity', value: string) => void;
    errors: IStockErrorData;

    onSubmit: (e: React.FormEvent) => void;
}

export default function ViewVariant() {
    const { variant } = usePage().props;

    const selectedVariant: IVariants = variant as IVariants;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Product - Selection - View',
            href: '/products/variant/viewvar',
        },
    ];

    const formatRupiah = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('id-ID').format(Number(number));
    };

    const formatUsd = (value: string) => {
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('en-US').format(Number(number));
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
        variant_id: '',
        remarks: '',
        quantity: 0,
    });

    const editStockHandler = (stock: IStocks, type: 'edit' | 'delete') => {
        setSelectedStock(stock);
        isOpenEditStock(true);
    };

    const submitHandlder = (e: any) => {
        e.preventDefault();
        post(route('variant.add-stock'), {
            onSuccess: () => isOpenAddStock(false),
            onError: () => isOpenAddStock(true),
        });
    };

    const editSubmitHandler = (e: any) => {
        e.preventDefault();
        post(route('variant.update-stock'), {
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
                variantId={selectedVariant.id}
            />

            <AddStockDialog
                open={openEditStock}
                isOpen={isOpenEditStock}
                type={'edit'}
                onSubmit={editSubmitHandler}
                errors={errors}
                data={data}
                setData={setData}
                variantId={selectedVariant.id}
                stock={selectedStock}
            />

            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Product - Selection - View" />
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
                            <h1 className="mb-2 text-3xl font-bold text-foreground">Selection Details</h1>
                        </div>

                        {/* Total Stocks Card */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <div className="text-center">
                                <h2 className="mb-2 text-lg font-semibold text-card-foreground">Total Stocks</h2>
                                <div className="text-4xl font-bold text-primary">{selectedVariant.total_stock}</div>
                            </div>
                        </div>

                        {/* Stock Information Card */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-6 border-b border-border pb-2 text-xl font-semibold text-card-foreground">Selection Information</h2>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Type */}
                                <div className="col-span-2 space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Select</h3>
                                    <p className="text-lg font-semibold text-card-foreground capitalize">{selectedVariant.type}</p>
                                    {/* Color */}
                                    {selectedVariant.type === 'color' && (
                                        <div>
                                            <div className={`h-12 w-16 rounded-md`} style={{ backgroundColor: selectedVariant.color! }}></div>
                                            <p className="text-lg font-semibold text-card-foreground">Hex Code: {selectedVariant.color}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Name</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedVariant.name}</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Description</h3>
                                    <p className="text-lg leading-relaxed font-semibold text-card-foreground">{selectedVariant.description}</p>
                                </div>

                                {/* Division */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Option</h3>
                                    <p className="text-lg font-semibold text-card-foreground">{selectedVariant.division.name}</p>
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Price</h3>
                                    <p className="text-xl font-bold text-primary">Rp. {formatRupiah(selectedVariant.price.toString())}</p>
                                </div>

                                {/* USD Price */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Price (USD)</h3>
                                    <p className="text-xl font-bold text-primary">$ {formatUsd(selectedVariant.usd_price.toString())}</p>
                                </div>

                                {/* discount */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Discount</h3>
                                    <p className="text-xl font-bold text-primary">{selectedVariant.discount} %</p>
                                </div>
                            </div>
                        </div>

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
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedVariant.stocks.length > 0 ? (
                                            selectedVariant.stocks.map((item, index) => (
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
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-card-foreground">{item.remarks}</td>
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

function AddStockDialog({ open, isOpen, type, onSubmit, data, setData, errors, variantId, stock }: IDialog) {
    useEffect(() => {
        if (open) {
            if (type === 'edit') {
                setData('id', stock!.id);
                setData('variant_id', variantId);
                setData('quantity', stock!.quantity.toString());
                setData('remarks', stock!.remarks);
            } else if (type === 'add') {
                setData('variant_id', variantId);
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
