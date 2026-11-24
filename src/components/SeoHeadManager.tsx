import React, { useEffect } from 'react';
import type { Language } from '../utils/i18n';
import type { DeskIdeaItem } from '../utils/marketplaceLogic';
import type { AppRoutePath } from '../utils/navLogic';

interface SeoHeadManagerProps {
  path: AppRoutePath;
  lang: Language;
  marketplaceItems?: DeskIdeaItem[];
}

/**
 * Centralized declarative SEO controller mounted at the application root.
 * Dynamically imports seoLogic so the SSR-rendered initial load stays lean,
 * while still keeping document metadata and JSON-LD synchronized on route or locale changes.
 */
export const SeoHeadManager: React.FC<SeoHeadManagerProps> = ({
  path,
  lang,
  marketplaceItems,
}) => {
  useEffect(() => {
    let cancelled = false;
    void import('../utils/seoLogic').then(({ syncDocumentSeo }) => {
      if (!cancelled) {
        syncDocumentSeo(path, lang, marketplaceItems);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path, lang, marketplaceItems]);

  return null;
};
