import * as React from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  useSettings,
  ARABIC_FONTS,
  FONT_SIZES,
  type ArabicFont,
  type FontSize,
} from "./settings-provider"

function SizeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`size-btn-${children}`}
      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {children}
    </button>
  )
}

export function SettingsPanel() {
  const { arabicFont, fontSize, setArabicFont, setFontSize } = useSettings()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-settings"
          className="text-foreground/80 hover:text-foreground"
          aria-label="Open display settings"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <h3 className="font-semibold text-sm mb-3">Display Settings</h3>

        {/* Font Size */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Font Size</p>
          <div className="flex gap-1.5">
            {FONT_SIZES.map((s) => (
              <SizeButton
                key={s.value}
                active={fontSize === s.value}
                onClick={() => setFontSize(s.value as FontSize)}
              >
                {s.label}
              </SizeButton>
            ))}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Arabic Font Style */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Arabic Script</p>
          <div className="flex flex-col gap-1.5">
            {ARABIC_FONTS.map((f) => (
              <button
                key={f.value}
                data-testid={`font-btn-${f.value}`}
                onClick={() => setArabicFont(f.value as ArabicFont)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors ${
                  arabicFont === f.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/50 text-foreground"
                }`}
              >
                <span className="text-sm">{f.label}</span>
                <span
                  style={{ fontFamily: f.family }}
                  className="text-xl leading-none"
                >
                  بِسْمِ
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
