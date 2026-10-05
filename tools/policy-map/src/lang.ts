// Stand-in for the old Next.js LanguageContext: the static page sets <html lang>.
export function useLanguage(): { language: 'en' | 'ro' } {
    return { language: document.documentElement.lang === 'ro' ? 'ro' : 'en' };
}
