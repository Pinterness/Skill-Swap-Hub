import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Language = "vi" | "en";
const STORAGE_KEY = "skillSwapLanguage";

const translations = {
  vi: { language: "Ngôn ngữ", vietnamese: "Tiếng Việt", english: "English", chooseLanguage: "Chọn ngôn ngữ hiển thị", languageHint: "Áp dụng ngay và được lưu trên thiết bị này.", discover: "Khám phá", invitations: "Lời mời", sessions: "Buổi học", messages: "Tin nhắn", profile: "Hồ sơ", reviews: "Đánh giá", community: "Cộng đồng", about: "Về chúng tôi", login: "Đăng nhập", joinFree: "Tham gia miễn phí" },
  en: { language: "Language", vietnamese: "Tiếng Việt", english: "English", chooseLanguage: "Choose display language", languageHint: "Applied immediately and saved on this device.", discover: "Discover", invitations: "Invitations", sessions: "Sessions", messages: "Messages", profile: "Profile", reviews: "Reviews", community: "Community", about: "About us", login: "Log in", joinFree: "Join for free" },
} as const;

type TranslationKey = keyof typeof translations.vi;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "vi");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, t: (key) => translations[language][key] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
