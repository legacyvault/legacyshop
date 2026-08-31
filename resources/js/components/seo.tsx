import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type ReactElement } from 'react';

const MAX_DESCRIPTION_LENGTH = 155;

/**
 * Collapse arbitrary copy (including Portable Text-ish HTML from articles and
 * product descriptions) into a single-line meta description, cut on a word
 * boundary so Google doesn't render a truncated word.
 */
export function toMetaDescription(source: string | null | undefined, maxLength = MAX_DESCRIPTION_LENGTH) {
    if (!source) return undefined;

    const text = source
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        // Product and article copy is authored with light markdown, which would
        // otherwise show up verbatim in the search result snippet
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__|\*|_|`|~~)/g, '')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return undefined;
    if (text.length <= maxLength) return text;

    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');

    return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, '')}…`;
}

/**
 * Per-page <title>, meta description and canonical URL.
 *
 * Without a canonical, the filterable listing pages (`?q=`, `?page=`, `?tag_ids=`,
 * `?sort_by=` ...) present the same content under an unbounded number of URLs,
 * which splits ranking signals across them. `ziggy.location` is the request URL
 * with the query string already stripped, which is exactly the URL we want
 * search engines to consolidate on — unless a page passes its own.
 */
export default function Seo({
    title,
    description,
    canonical,
    noindex = false,
}: {
    title?: string;
    description?: string | null;
    canonical?: string;
    noindex?: boolean;
}) {
    const { ziggy } = usePage<SharedData>().props;

    const canonicalUrl = canonical ?? ziggy?.location;
    const metaDescription = toMetaDescription(description);

    // Inertia's <Head> parses its children, so hand it a clean element array
    // rather than `false`/`undefined` holes from inline conditionals.
    const tags: ReactElement[] = [];

    if (metaDescription) {
        tags.push(<meta key="description" head-key="description" name="description" content={metaDescription} />);
    }

    if (canonicalUrl) {
        tags.push(<link key="canonical" head-key="canonical" rel="canonical" href={canonicalUrl} />);
    }

    if (noindex) {
        tags.push(<meta key="robots" head-key="robots" name="robots" content="noindex, nofollow" />);
    }

    return <Head title={title}>{tags}</Head>;
}
