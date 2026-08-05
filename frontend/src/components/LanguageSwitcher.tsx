import { Check, Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

type LanguageSwitcherProps = { variant?: "compact" | "expanded" };

export default function LanguageSwitcher({ variant = "compact" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const expanded = variant === "expanded";

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={expanded
        ? "grid grid-cols-2 gap-2 rounded-xl bg-background/70 p-1.5 border border-border/80"
        : "flex items-center rounded-xl bg-secondary/70 p-1 border border-border/70 shadow-sm"}
    >
      {(["vi", "en"] as const).map((code) => {
        const active = language === code;
        const label = code === "vi" ? t("vietnamese") : t("english");
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={`relative flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-300 ease-out active:scale-95 ${expanded ? "min-w-[108px] px-3 py-2 text-xs" : "px-2.5 py-1.5 text-[11px]"} ${active ? "bg-card text-foreground shadow-sm ring-1 ring-border/80" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}
          >
            {active && <span className="absolute inset-0 rounded-lg bg-primary/[0.04] animate-in fade-in zoom-in-95 duration-300" />}
            <span className="relative leading-none">{code === "vi" ? "VN" : "EN"}</span>
            {expanded && <span className="relative truncate">{label}</span>}
            {active && <Check className="relative w-3 h-3 text-primary animate-in zoom-in duration-200" />}
          </button>
        );
      })}
      {!expanded && <Languages className="w-3.5 h-3.5 mx-1 text-primary/70" aria-hidden="true" />}
    </div>
  );
}
