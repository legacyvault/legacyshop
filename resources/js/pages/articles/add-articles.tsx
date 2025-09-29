// @ts-nocheck

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, IArticle } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { LucideIcon } from 'lucide-react';
import {
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Loader2,
    Quote,
    Redo2,
    Strikethrough,
    Undo2,
} from 'lucide-react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

export default function AddArticlePage() {
    const page = usePage<{ article?: IArticle; id?: string }>();
    const article = page.props.article;
    const articleId = page.props.id ?? article?.id ?? '';
    const isEdit = Boolean(articleId);

    const pageTitle = isEdit ? 'Edit Article' : 'Add Article';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: '/articles' },
        { title: pageTitle, href: isEdit && articleId ? `/articles/add-articles/${articleId}` : '/articles/add-articles' },
    ];

    const [slugEditedManually, setSlugEditedManually] = useState<boolean>(Boolean(article));
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    const initialPublishedAt = useMemo(() => formatDatetimeLocal(article?.published_at ?? null), [article?.published_at]);

    const form = useForm<any>({
        id: articleId,
        title: article?.title ?? '',
        slug: article?.slug ?? '',
        content: (article?.content as any[]) ?? [],
        content_html: article?.content_html ?? '',
        is_published: article?.is_published ?? false,
        published_at: initialPublishedAt,
    });

    const { data, setData, post, processing, errors, reset, transform } = form;

    const starterKitExtension: any = (StarterKit as any).configure({
        heading: { levels: [1, 2, 3] },
    });
    const linkExtension: any = (Link as any).configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    });
    const imageExtension: any = (Image as any).configure({ HTMLAttributes: { class: 'rounded-md' } });
    const placeholderExtension: any = (Placeholder as any).configure({ placeholder: 'Write your article content…' });

    const editorOptions: any = {
        extensions: [starterKitExtension, linkExtension, imageExtension, placeholderExtension],
        content: article?.content ? { type: 'doc', content: article.content as any[] } : '',
        editorProps: {
            attributes: {
                class: 'min-h-[320px] focus:outline-none text-base leading-6',
            },
        },
        onUpdate: ({ editor }: { editor: any }) => {
            const json = editor.getJSON();
            setData('content', json.content ?? []);
            setData('content_html', editor.getHTML());
        },
    };

    const editor = useEditor(editorOptions, [article?.id]);
    const isEditorReady = Boolean(editor);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTitleChange = (value: string) => {
        setData('title', value);
        if (!slugEditedManually) {
            setData('slug', generateSlug(value));
        }
    };

    const handleSlugChange = (value: string) => {
        setSlugEditedManually(true);
        setData('slug', value);
    };

    const regenerateSlug = () => {
        setSlugEditedManually(false);
        setData('slug', generateSlug(data.title));
    };

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        setImageUploadError(null);
        setIsUploadingImage(true);

        try {
            const url = await uploadArticleImage(file);
            console.log(url);
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
            setImageUploadError(message);
        } finally {
            setIsUploadingImage(false);
            event.target.value = '';
        }
    };

    const handleToggleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Enter URL', previousUrl ?? 'https://');
        if (url === null) return;

        const trimmed = url.trim();

        if (trimmed === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editor) return;

        const editorJson = editor.getJSON();
        const editorHtml = editor.getHTML();

        setData('content', editorJson.content ?? []);
        setData('content_html', editorHtml);

        transform((formData) => ({
            ...formData,
            id: isEdit ? articleId : formData.id,
            content: editorJson.content ?? [],
            content_html: editorHtml,
            published_at: formData.is_published ? formData.published_at : null,
        }));

        const url = route(isEdit ? 'edit-article' : 'create-article');

        post(url, {
            preserveScroll: true,
            onSuccess: () => {
                if (!isEdit) {
                    reset();
                    editor.commands.clearContent(true);
                    setSlugEditedManually(false);
                }
            },
        });
    };

    const togglePublished = (checked: boolean) => {
        setData('is_published', checked);
        if (!checked) {
            setData('published_at', null);
        }
    };

    const handlePublishedDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setData('published_at', value ? value : null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Articles - ${pageTitle}`} />
            <div className="space-y-6 p-6">
                <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Compose a rich article with the editor and publish it for readers.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit('/admin-articles')}>
                            Back to Articles
                        </Button>
                        <Button type="submit" form="article-form" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                'Save Article'
                            )}
                        </Button>
                    </div>
                </header>

                <form id="article-form" className="grid gap-6 lg:grid-cols-[2fr_1fr]" onSubmit={handleSubmit}>
                    <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter article title"
                                value={data.title}
                                onChange={(event) => handleTitleChange(event.target.value)}
                                aria-invalid={Boolean(errors.title)}
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="slug">Slug</Label>
                                <Button type="button" size="sm" variant="ghost" onClick={regenerateSlug}>
                                    Regenerate
                                </Button>
                            </div>
                            <Input
                                id="slug"
                                placeholder="auto-generated-from-title"
                                value={data.slug}
                                onChange={(event) => handleSlugChange(event.target.value)}
                                aria-invalid={Boolean(errors.slug)}
                            />
                            <p className="text-xs text-muted-foreground">Edit the slug if you need a custom URL segment.</p>
                            <InputError message={errors.slug} />
                        </div>

                        <div className="space-y-2">
                            <Label>Content *</Label>
                            <div className="rounded-lg border border-input bg-background shadow-sm">
                                <div className="flex flex-wrap items-center gap-1 border-b border-input/60 bg-muted/30 px-3 py-2">
                                    <ToolbarButton
                                        icon={Bold}
                                        label="Bold"
                                        isActive={Boolean(editor?.isActive('bold'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleBold().run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Italic}
                                        label="Italic"
                                        isActive={Boolean(editor?.isActive('italic'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleItalic().run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Strikethrough}
                                        label="Strikethrough"
                                        isActive={Boolean(editor?.isActive('strike'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleStrike().run();
                                        }}
                                    />
                                    <ToolbarDivider />
                                    <ToolbarButton
                                        icon={Heading1}
                                        label="Heading 1"
                                        isActive={Boolean(editor?.isActive('heading', { level: 1 }))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleHeading({ level: 1 }).run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Heading2}
                                        label="Heading 2"
                                        isActive={Boolean(editor?.isActive('heading', { level: 2 }))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleHeading({ level: 2 }).run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Heading3}
                                        label="Heading 3"
                                        isActive={Boolean(editor?.isActive('heading', { level: 3 }))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleHeading({ level: 3 }).run();
                                        }}
                                    />
                                    <ToolbarDivider />
                                    <ToolbarButton
                                        icon={List}
                                        label="Bullet list"
                                        isActive={Boolean(editor?.isActive('bulletList'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleBulletList().run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={ListOrdered}
                                        label="Numbered list"
                                        isActive={Boolean(editor?.isActive('orderedList'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleOrderedList().run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Quote}
                                        label="Blockquote"
                                        isActive={Boolean(editor?.isActive('blockquote'))}
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().toggleBlockquote().run();
                                        }}
                                    />
                                    <ToolbarDivider />
                                    <ToolbarButton icon={LinkIcon} label="Insert link" disabled={!isEditorReady} onClick={handleToggleLink} />
                                    <ToolbarButton
                                        label="Insert image"
                                        icon={ImageIcon}
                                        onClick={handleImageButtonClick}
                                        disabled={!isEditorReady || isUploadingImage}
                                    >
                                        {isUploadingImage ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                                    </ToolbarButton>
                                    <ToolbarDivider />
                                    <ToolbarButton
                                        icon={Undo2}
                                        label="Undo"
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().undo().run();
                                        }}
                                    />
                                    <ToolbarButton
                                        icon={Redo2}
                                        label="Redo"
                                        disabled={!isEditorReady}
                                        onClick={() => {
                                            if (!editor) return;
                                            editor.chain().focus().redo().run();
                                        }}
                                    />
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInputChange} />
                                </div>
                                <EditorContent editor={editor} className="tiptap-editor min-h-[320px] px-3 py-4" />
                            </div>
                            <InputError message={errors.content as unknown as string} />
                            <InputError message={imageUploadError ?? undefined} />
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_published" className="text-base font-semibold">
                                    Publish
                                </Label>
                                <Checkbox
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(value) => togglePublished(value === true)}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enable publish to make the article visible. Set a publish date to schedule visibility.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="published_at">Publish date</Label>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={data.published_at ?? ''}
                                    onChange={handlePublishedDateChange}
                                    disabled={!data.is_published}
                                    aria-invalid={Boolean(errors.published_at)}
                                />
                                <InputError message={errors.published_at} />
                            </div>
                        </div>
                    </aside>
                </form>
            </div>
        </AppLayout>
    );
}

function generateSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 180);
}

function formatDatetimeLocal(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const pad = (input: number) => `${input}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function uploadArticleImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

    const response = await fetch(route('upload-article-img'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Image upload failed');
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        const data = await response.json();
        console.log(data);
        if (typeof data === 'string') return sanitizeUploadUrl(data);
        if (data && typeof data.url === 'string') return sanitizeUploadUrl(data.url);
    }

    const text = await response.text();
    return sanitizeUploadUrl(text);
}

function sanitizeUploadUrl(url: string): string {
    return url.replace(/^"|"$/g, '').trim();
}

interface ToolbarButtonProps {
    onClick?: () => void;
    icon?: LucideIcon;
    label: string;
    isActive?: boolean;
    disabled?: boolean;
    children?: ReactNode;
}

function ToolbarButton({ onClick, icon: Icon, label, isActive, disabled, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onPointerDown={(event) => {
                event.preventDefault();
            }}
            onClick={(event) => {
                event.preventDefault();
                if (disabled) return;
                onClick?.();
            }}
            disabled={disabled}
            title={label}
            aria-label={label}
            className={cn(
                'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
                isActive && 'border-primary bg-primary/10 text-primary shadow-sm',
                disabled && 'cursor-not-allowed opacity-60',
            )}
        >
            {children ?? (Icon ? <Icon className="size-4" /> : null)}
        </button>
    );
}

function ToolbarDivider() {
    return <span className="mx-1 hidden h-6 w-px bg-border last:hidden sm:block" />;
}
