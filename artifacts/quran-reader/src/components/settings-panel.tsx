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
      <PopoverContent className="w-80 p-4" align="end">
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
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-0.5">
            {ARABIC_FONTS.map((f, i) => (
              <React.Fragment key={f.value}>
                {/* Separator before South Asian group */}
                {i > 0 && f.region && !ARABIC_FONTS[i - 1].region && (
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">South Asian</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <button
                  data-testid={`font-btn-${f.value}`}
                  onClick={() => setArabicFont(f.value as ArabicFont)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md border transition-colors text-left ${
                    arabicFont === f.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">
                      {f.region && <span className="mr-1 text-base">{f.region}</span>}
                      {f.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none">{f.description}</span>
                  </div>
                  <span
                    style={{ fontFamily: f.family }}
                    className="text-2xl leading-none shrink-0 ml-2"
                    dir="rtl"
                  >
                    بِسْمِ
                  </span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
