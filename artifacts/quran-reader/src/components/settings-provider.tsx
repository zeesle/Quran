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
  setArabicFont: (font: ArabicFont) => void
  setFontSize: (size: FontSize) => void
}

const SettingsContext = React.createContext<SettingsState>({
  arabicFont: "amiri",
  fontSize: "md",
  setArabicFont: () => null,
  setFontSize: () => null,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [arabicFont, setArabicFontState] = React.useState<ArabicFont>(
    () => (localStorage.getItem("quran-arabic-font") as ArabicFont) || "amiri"
  )
  const [fontSize, setFontSizeState] = React.useState<FontSize>(
    () => (localStorage.getItem("quran-font-size") as FontSize) || "md"
  )

  const setArabicFont = React.useCallback((font: ArabicFont) => {
    localStorage.setItem("quran-arabic-font", font)
    setArabicFontState(font)
  }, [])

  const setFontSize = React.useCallback((size: FontSize) => {
    localStorage.setItem("quran-font-size", size)
    setFontSizeState(size)
  }, [])

  const value = React.useMemo(
    () => ({ arabicFont, fontSize, setArabicFont, setFontSize }),
    [arabicFont, fontSize, setArabicFont, setFontSize]
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
