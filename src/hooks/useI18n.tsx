import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

// Supported locales
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja';

// Translation dictionary type
type TranslationDictionary = Record<string, string>;
type Translations = Record<Locale, TranslationDictionary>;

// Default English translations (base)
const defaultTranslations: Translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.pricing': 'Pricing',
    'nav.demos': 'Demos',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.dashboard': 'Dashboard',
    
    // Products
    'products.vanguard': 'Vanguard MSP Platform',
    'products.safesuite': 'Wrayth',
    'products.aistudio': 'AI Studio',
    'products.safepass': 'Vault',
    'products.safescan': 'Scan',
    'products.safeweb': 'Watch',
    'products.safetrack': 'SafeTrack',
    'products.safeassist': 'SafeAssist',
    
    // Demo
    'demo.tryNow': 'Try Now',
    'demo.fullDemo': 'Full Demo',
    'demo.expand': 'Expand',
    'demo.collapse': 'Collapse',
    'demo.interactive': 'Interactive Demo',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    
    // Errors
    'error.notFound': 'Page not found',
    'error.unauthorized': 'Unauthorized access',
    'error.serverError': 'Server error',
  },
  es: {
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.retry': 'Reintentar',
    'nav.home': 'Inicio',
    'nav.products': 'Productos',
    'nav.pricing': 'Precios',
    'demo.tryNow': 'Probar Ahora',
    // Add more Spanish translations as needed
  },
  fr: {
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.retry': 'Réessayer',
    'nav.home': 'Accueil',
    'nav.products': 'Produits',
    'nav.pricing': 'Tarifs',
    'demo.tryNow': 'Essayer Maintenant',
    // Add more French translations as needed
  },
  de: {
    'common.loading': 'Laden...',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.retry': 'Wiederholen',
    'nav.home': 'Startseite',
    'nav.products': 'Produkte',
    'nav.pricing': 'Preise',
    'demo.tryNow': 'Jetzt Testen',
    // Add more German translations as needed
  },
  pt: {
    'common.loading': 'Carregando...',
    'common.error': 'Ocorreu um erro',
    'common.retry': 'Tentar novamente',
    'nav.home': 'Início',
    'nav.products': 'Produtos',
    'nav.pricing': 'Preços',
    'demo.tryNow': 'Experimentar Agora',
    // Add more Portuguese translations as needed
  },
  ja: {
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.retry': '再試行',
    'nav.home': 'ホーム',
    'nav.products': '製品',
    'nav.pricing': '料金',
    'demo.tryNow': '今すぐ試す',
    // Add more Japanese translations as needed
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
  translations?: Partial<Translations>;
}

/**
 * Internationalization provider for the application.
 * Wraps the app and provides translation functions.
 */
export function I18nProvider({ 
  children, 
  defaultLocale = 'en',
  translations: customTranslations 
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to get locale from localStorage or browser
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ultriumai-locale') as Locale;
      if (stored && Object.keys(defaultTranslations).includes(stored)) {
        return stored;
      }
      
      // Try browser language
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (Object.keys(defaultTranslations).includes(browserLang)) {
        return browserLang;
      }
    }
    return defaultLocale;
  });

  // Merge custom translations with defaults
  const translations = useMemo(() => {
    if (!customTranslations) return defaultTranslations;
    
    const merged: Translations = { ...defaultTranslations };
    for (const [lang, trans] of Object.entries(customTranslations)) {
      merged[lang as Locale] = { ...merged[lang as Locale], ...trans };
    }
    return merged;
  }, [customTranslations]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultriumai-locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Try current locale first, then fall back to English
    let text = translations[locale]?.[key] || translations.en[key] || key;
    
    // Replace parameters
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
      }
    }
    
    return text;
  }, [locale, translations]);

  const availableLocales = useMemo(() => Object.keys(translations) as Locale[], [translations]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    availableLocales,
  }), [locale, setLocale, t, availableLocales]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access internationalization functions.
 * 
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useI18n();
 * return <p>{t('common.loading')}</p>;
 * ```
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Standalone translation function for use outside React components.
 * Falls back to English.
 */
export function translate(key: string, locale: Locale = 'en'): string {
  return defaultTranslations[locale]?.[key] || defaultTranslations.en[key] || key;
}
