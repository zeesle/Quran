import * as React from "react"

export type ArabicFont =
  | "amiri"
  | "amiri-quran"
  | "noto-naskh"
  | "scheherazade"
  | "lateef"
  | "reem-kufi"
  | "aref-ruqaa"
  | "markazi"
  | "el-messiri"
  | "noto-nastaliq"
  | "gulzar"
  | "mirza"
  | "alqalam"
  | "noor-hira"
  | "pdms"

export type FontSize = "sm" | "md" | "lg" | "xl"

export interface TranslationEdition {
  identifier: string
  language: string
  name: string
  flag: string
  direction: "rtl" | "ltr"
  columnLabel: string   // shown in mushaf column header
}

export const TRANSLATION_EDITIONS: TranslationEdition[] = [
  // ── Urdu ──────────────────────────────────────────────────────────────
  { identifier: "ur.jalandhry",  language: "Urdu",       name: "Fateh Muhammad Jalandhry", flag: "🇵🇰", direction: "rtl", columnLabel: "اردو ترجمہ" },
  { identifier: "ur.ahmedali",   language: "Urdu",       name: "Ahmed Ali",                flag: "🇵🇰", direction: "rtl", columnLabel: "اردو ترجمہ" },
  { identifier: "ur.maududi",    language: "Urdu",       name: "Sayyid Abul Ala Mawdudi", flag: "🇵🇰", direction: "rtl", columnLabel: "اردو ترجمہ" },
  { identifier: "ur.kanzuliman", language: "Urdu",       name: "Kanz ul Iman (Ahmad Raza Khan)", flag: "🇵🇰", direction: "rtl", columnLabel: "اردو ترجمہ" },
  // ── English ───────────────────────────────────────────────────────────
  { identifier: "en.sahih",      language: "English",    name: "Sahih International",      flag: "🇬🇧", direction: "ltr", columnLabel: "Translation" },
  { identifier: "en.pickthall",  language: "English",    name: "Pickthall",                flag: "🇬🇧", direction: "ltr", columnLabel: "Translation" },
  { identifier: "en.yusufali",   language: "English",    name: "Yusuf Ali",                flag: "🇬🇧", direction: "ltr", columnLabel: "Translation" },
  { identifier: "en.arberry",    language: "English",    name: "Arberry",                  flag: "🇬🇧", direction: "ltr", columnLabel: "Translation" },
  // ── Other ─────────────────────────────────────────────────────────────
  { identifier: "fr.hamidullah", language: "French",     name: "Muhammad Hamidullah",      flag: "🇫🇷", direction: "ltr", columnLabel: "Traduction" },
  { identifier: "tr.diyanet",    language: "Turkish",    name: "Diyanet İşleri",           flag: "🇹🇷", direction: "ltr", columnLabel: "Çeviri" },
  { identifier: "id.indonesian", language: "Indonesian", name: "Bahasa Indonesia",         flag: "🇮🇩", direction: "ltr", columnLabel: "Terjemahan" },
  { identifier: "ru.kuliev",     language: "Russian",    name: "Elmir Kuliev",             flag: "🇷🇺", direction: "ltr", columnLabel: "Перевод" },
  { identifier: "bn.bengali",    language: "Bengali",    name: "Bengali",                  flag: "🇧🇩", direction: "ltr", columnLabel: "অনুবাদ" },
  { identifier: "fa.ayati",      language: "Persian",    name: "Ayatullah Agha Mirza Mahdi Pooya", flag: "🇮🇷", direction: "rtl", columnLabel: "ترجمه" },
]

export const ARABIC_FONTS: {
  value: ArabicFont
  label: string
  family: string
  description: string
  region?: string
  requiresFile?: string   // filename needed in public/fonts/
}[] = [
  { value: "amiri",        label: "Amiri",              family: "'Amiri', serif",             description: "Classical Naskh" },
  { value: "amiri-quran",  label: "Amiri Quran",        family: "'Amiri Quran', serif",        description: "Quran-optimised" },
  { value: "scheherazade", label: "Scheherazade",        family: "'Scheherazade New', serif",   description: "Traditional Naskh" },
  { value: "noto-naskh",   label: "Noto Naskh Arabic",  family: "'Noto Naskh Arabic', serif",  description: "Clean & modern" },
  { value: "lateef",       label: "Lateef",             family: "'Lateef', serif",             description: "Elegant Naskh" },
  { value: "reem-kufi",    label: "Reem Kufi",          family: "'Reem Kufi', sans-serif",     description: "Geometric Kufic" },
  { value: "aref-ruqaa",   label: "Aref Ruqaa",         family: "'Aref Ruqaa', serif",         description: "Ruqah handwriting" },
  { value: "markazi",      label: "Markazi Text",       family: "'Markazi Text', serif",       description: "Compact & readable" },
  { value: "el-messiri",   label: "El Messiri",         family: "'El Messiri', sans-serif",    description: "Contemporary" },
  { value: "noto-nastaliq",label: "Noto Nastaliq Urdu", family: "'Noto Nastaliq Urdu', serif", description: "South Asian Nastaliq", region: "🇵🇰🇮🇳" },
  { value: "gulzar",       label: "Gulzar",             family: "'Gulzar', serif",             description: "Pakistani Nastaliq",   region: "🇵🇰🇮🇳" },
  { value: "mirza",        label: "Mirza",              family: "'Mirza', serif",              description: "Subcontinental style", region: "🇵🇰🇮🇳" },
  // Indo-Pak Quran print fonts — require manual font file upload (see public/fonts/README.md)
  { value: "alqalam",  label: "Al-Qalam Quran Majeed",  family: "'Al-Qalam Quran Majeed', serif",  description: "Indo-Pak madrasa print", region: "🇵🇰🇮🇳", requiresFile: "AlQalamQuranMajeed.ttf" },
  { value: "noor-hira",label: "Noor-e-Hira",            family: "'Noor-e-Hira', serif",            description: "Pakistani print Quran",  region: "🇵🇰🇮🇳", requiresFile: "NoorHira.ttf" },
  { value: "pdms",     label: "PDMS Saleem QuranFont",  family: "'PDMS Saleem QuranFont', serif",  description: "PDMS Indo-Pak style",    region: "🇵🇰🇮🇳", requiresFile: "PDMS_Saleem_QuranFont.ttf" },
]

export const FONT_SIZES: { value: FontSize; label: string; arabicPx: string; urduPx: string }[] = [
  { value: "sm", label: "Small",       arabicPx: "1.6rem", urduPx: "1rem" },
  { value: "md", label: "Medium",      arabicPx: "2rem",   urduPx: "1.25rem" },
  { value: "lg", label: "Large",       arabicPx: "2.5rem", urduPx: "1.5rem" },
  { value: "xl", label: "Extra Large", arabicPx: "3rem",   urduPx: "1.75rem" },
]

type SettingsState = {
  arabicFont: ArabicFont
  fontSize: FontSize
  translationEdition: string
  setArabicFont: (font: ArabicFont) => void
  setFontSize: (size: FontSize) => void
  setTranslationEdition: (id: string) => void
}

const SettingsContext = React.createContext<SettingsState>({
  arabicFont: "amiri",
  fontSize: "md",
  translationEdition: "ur.jalandhry",
  setArabicFont: () => null,
  setFontSize: () => null,
  setTranslationEdition: () => null,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [arabicFont, setArabicFontState] = React.useState<ArabicFont>(
    () => (localStorage.getItem("quran-arabic-font") as ArabicFont) || "amiri"
  )
  const [fontSize, setFontSizeState] = React.useState<FontSize>(
    () => (localStorage.getItem("quran-font-size") as FontSize) || "md"
  )
  const [translationEdition, setTranslationEditionState] = React.useState<string>(
    () => localStorage.getItem("quran-translation") || "ur.jalandhry"
  )

  const setArabicFont = React.useCallback((font: ArabicFont) => {
    localStorage.setItem("quran-arabic-font", font)
    setArabicFontState(font)
  }, [])

  const setFontSize = React.useCallback((size: FontSize) => {
    localStorage.setItem("quran-font-size", size)
    setFontSizeState(size)
  }, [])

  const setTranslationEdition = React.useCallback((id: string) => {
    localStorage.setItem("quran-translation", id)
    setTranslationEditionState(id)
  }, [])

  const value = React.useMemo(
    () => ({ arabicFont, fontSize, translationEdition, setArabicFont, setFontSize, setTranslationEdition }),
    [arabicFont, fontSize, translationEdition, setArabicFont, setFontSize, setTranslationEdition]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return React.useContext(SettingsContext)
}
