import { IArticle } from '@/types';

export const getArticleText = (article: IArticle): string => {
    if (article.content_html) {
        return article.content_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (Array.isArray(article.content)) {
        return article.content
            .map((block) => {
                if (typeof block === 'string') return block;
                if (block && typeof block === 'object' && 'text' in block) return String(block.text);
                if (block && typeof block === 'object' && 'content' in block) return String(block.content);
                return '';
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return '';
};

export const getArticleExcerpt = (article: IArticle, length = 140): string => {
    const text = getArticleText(article);

    if (!text) return 'Discover the latest updates and insights from the Legacy Vault team.';

    if (text.length <= length) return text;

    return `${text.slice(0, length).trim()}…`;
};

export const getArticleReadTime = (article: IArticle): string | null => {
    const text = getArticleText(article);

    if (!text) return null;

    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));

    return `${minutes} min read`;
};

export const formatPublishedDate = (dateString: string | null): string => {
    if (!dateString) return 'Unpublished';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return 'Unpublished';

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const getArticleLink = (article: IArticle): string => {
    const identifier = article.slug && article.slug.trim().length > 0 ? article.slug : article.id;
    return `/articles/${identifier}`;
};
