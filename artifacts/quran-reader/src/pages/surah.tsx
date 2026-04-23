import React from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSurahContent } from "@/hooks/use-quran";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, ARABIC_FONTS, FONT_SIZES } from "@/components/settings-provider";

function toEasternDigits(num: number): string {
  const easternDigits = ["\u0660","\u0661","\u0662","\u0663","\u0664","\u0665","\u0666","\u0667","\u0668","\u0669"];
  return num.toString().replace(/\d/g, (d) => easternDigits[parseInt(d)]);
}

export default function SurahView() {
  const { id } = useParams();
  const surahNumber = parseInt(id || "1", 10);
  const { data: surah, isLoading, error } = useSurahContent(surahNumber);
  const { arabicFont, fontSize } = useSettings();

  const fontConfig = ARABIC_FONTS.find((f) => f.value === arabicFont) ?? ARABIC_FONTS[0];
  const sizeConfig = FONT_SIZES.find((s) => s.value === fontSize) ?? FONT_SIZES[1];

  const arabicStyle: React.CSSProperties = {
    fontFamily: fontConfig.family,
    fontSize: sizeConfig.arabicPx,
    lineHeight: 2.5,
  };

  const bismillahStyle: React.CSSProperties = {
    fontFamily: fontConfig.family,
    fontSize: `calc(${sizeConfig.arabicPx} * 1.05)`,
    lineHeight: 2.2,
  };

  const urduStyle: React.CSSProperties = {
    fontSize: sizeConfig.urduPx,
    lineHeight: 2.2,
  };

  const prevSurah = surahNumber > 1 ? surahNumber - 1 : null;
  const nextSurah = surahNumber < 114 ? surahNumber + 1 : null;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-destructive mb-4">Failed to load Surah. Please try again.</p>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Sticky Sub-Header */}
      <div className="sticky top-16 z-40 bg-card/90 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          {prevSurah ? (
            <Link href={`/surah/${prevSurah}`}>
              <Button variant="ghost" size="sm" className="gap-1" data-testid="button-prev-surah">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
            </Link>
          ) : (
            <div className="w-[88px]" />
          )}

          <div className="text-center">
            {isLoading ? (
              <Skeleton className="h-6 w-32 mx-auto" />
            ) : (
              <h2 className="font-semibold text-primary" data-testid="text-surah-name">{surah?.englishName}</h2>
            )}
          </div>

          {nextSurah ? (
            <Link href={`/surah/${nextSurah}`}>
              <Button variant="ghost" size="sm" className="gap-1" data-testid="button-next-surah">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <div className="w-[88px]" />
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        {isLoading ? (
          <div className="space-y-12">
            <div className="text-center space-y-4 py-8 border-b border-border/50">
              <Skeleton className="h-12 w-48 mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4 pb-8 border-b border-border/30">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-5/6 ml-auto" />
                <Skeleton className="h-6 w-full mt-6" />
                <Skeleton className="h-6 w-4/5 ml-auto" />
              </div>
            ))}
          </div>
        ) : surah ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Surah Header */}
            <div className="text-center py-10 mb-8 border-b border-border/50">
              <h1
                className="font-arabic text-primary mb-4"
                style={{ ...arabicStyle, fontSize: `calc(${sizeConfig.arabicPx} * 1.3)` }}
                data-testid="text-surah-arabic-name"
              >
                {surah.name}
              </h1>
              <p className="text-lg text-muted-foreground">{surah.englishNameTranslation}</p>
              <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full">
                  {surah.revelationType}
                </span>
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full">
                  {surah.numberOfAyahs} Ayahs
                </span>
              </div>
            </div>

            {/* Bismillah — shown for all surahs except Al-Tawbah (9) */}
            {surah.number !== 9 && (
              <div className="text-center py-8 mb-8">
                <p
                  className="font-arabic text-foreground"
                  style={bismillahStyle}
                  data-testid="text-bismillah"
                >
                  {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
                </p>
              </div>
            )}

            {/* Ayahs */}
            <div className="space-y-12">
              {surah.ayahs.map(({ arabic, urdu }, index) => {
                let arabicText = arabic.text;
                const bismillahPrefix = "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650 ";
                if (surah.number !== 1 && surah.number !== 9 && index === 0 && arabicText.startsWith(bismillahPrefix)) {
                  arabicText = arabicText.slice(bismillahPrefix.length);
                }

                return (
                  <motion.div
                    key={arabic.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="relative pb-10 border-b border-border/30 last:border-0"
                    data-testid={`ayah-${arabic.numberInSurah}`}
                  >
                    <div className="flex flex-col gap-8">
                      {/* Arabic */}
                      <div className="flex items-start gap-4 flex-row-reverse" dir="rtl">
                        <div className="flex-shrink-0 mt-2 flex items-center justify-center w-12 h-12 rounded-full border-2 border-accent/40 bg-accent/5 text-primary">
                          <span className="text-lg font-arabic">{toEasternDigits(arabic.numberInSurah)}</span>
                        </div>
                        <p
                          className="font-arabic text-foreground text-right flex-1 pt-1"
                          style={arabicStyle}
                          data-testid={`text-arabic-${arabic.numberInSurah}`}
                          dir="rtl"
                        >
                          {arabicText}
                        </p>
                      </div>

                      {/* Urdu */}
                      <div className="pr-16" dir="rtl">
                        <p
                          className="font-urdu text-muted-foreground text-right"
                          style={urduStyle}
                          data-testid={`text-urdu-${arabic.numberInSurah}`}
                          dir="rtl"
                        >
                          {urdu.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
