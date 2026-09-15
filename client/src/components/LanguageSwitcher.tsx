import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdLanguage } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import type { AppLang } from "../i18n/config";

type Props = {
  className?: string;
  buttonClassName?: string;
  align?: "left" | "right";
};

export default function LanguageSwitcher({
  className = "",
  buttonClassName = "flex items-center gap-2 border px-3 py-1 rounded",
  align = "right",
}: Props) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const current = i18n.language.startsWith("am") ? "am" : "en";
  const shortLabel = current === "am" ? t("nav.currentLanguageShort") : "EN";

  const select = (lng: AppLang) => {
    void i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={buttonClassName}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("nav.language")}
      >
        <MdLanguage aria-hidden />
        <span>{shortLabel}</span>
        <IoIosArrowDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1 min-w-[140px] bg-white shadow-lg rounded border border-gray-100 text-sm z-[60] ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="listbox"
        >
          <button
            type="button"
            role="option"
            aria-selected={current === "en"}
            onClick={() => select("en")}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
          >
            {t("nav.english")}
          </button>
          <button
            type="button"
            role="option"
            aria-selected={current === "am"}
            onClick={() => select("am")}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
          >
            {t("nav.amharic")}
          </button>
        </div>
      )}
    </div>
  );
}
