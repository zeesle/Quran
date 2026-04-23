import * as React from "react"

export type ArabicFont = "amiri" | "noto-naskh" | "scheherazade"
export type FontSize = "sm" | "md" | "lg" | "xl"

export const ARABIC_FONTS: { value: ArabicFont; label: string; family: string }[] = [
  { value: "amiri", label: "Amiri", family: "'Amiri', serif" },
  { value: "noto-naskh", label: "Noto Naskh Arabic", family: "'Noto Naskh Arabic', serif" },
  { value: "scheherazade", label: "Scheherazade", family: "'Scheherazade New', serif" },
]

export const FONT_SIZES: { value: FontSize; label: string; arabicPx: string; urduPx: string }[] = [
  { value: "sm", label: "Small", arabicPx: "1.6rem", urduPx: "1rem" },
  { value: "md", label: "Medium", arabicPx: "2rem", urduPx: "1.25rem" },
  { value: "lg", label: "Large", arabicPx: "2.5rem", urduPx: "1.5rem" },
  { value: "xl", label: "Extra Large", arabicPx: "3rem", urduPx: "1.75rem" },
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
