import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import am from "../locales/am.json";

export const LANG_STORAGE_KEY = "wanaw-lang";
export const SUPPORTED_LANGS = ["en", "am"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

function isAppLang(value: string | null): value is AppLang {
  return value === "en" || value === "am";
}

function detectBrowserLang(): AppLang {
  if (typeof navigator === "undefined") return "en";
  const codes = [
    navigator.language,
    ...(navigator.languages ?? []),
  ].filter(Boolean);
  for (const code of codes) {
    const base = code.split("-")[0]?.toLowerCase();
    if (base === "am") return "am";
  }
  return "en";
}

function getInitialLanguage(): AppLang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isAppLang(stored)) return stored;
  } catch {
    /* ignore */
  }
  return detectBrowserLang();
}

function applyDocumentLang(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

applyDocumentLang(i18n.language);

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLang(lng);
});

export default i18n;
