import React, { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSurahContent, useWordByWord, type VerseWithWords } from "@/hooks/use-quran";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, ARABIC_FONTS, FONT_SIZES } from "@/components/settings-provider";

function toEasternDigits(num: number): string {
  const d = ["\u0660","\u0661","\u0662","\u0663","\u0664","\u0665","\u0666","\u0667","\u0668","\u0669"];
  return num.toString().replace(/\d/g, (c) => d[parseInt(c)]);
}

interface WordBlockProps {
  arabicWord: string;
  meaning: string;
  arabicFamily: string;
  arabicSize: string;
}

function WordBlock({ arabicWord, meaning, arabicFamily, arabicSize }: WordBlockProps) {
  const wordArabicSize = `calc(${arabicSize} * 0.65)`;
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/5 transition-colors cursor-default shadow-sm"
      data-testid="word-block"
    >
      <span
        className="text-foreground leading-relaxed"
        style={{ fontFamily: arabicFamily, fontSize: wordArabicSize }}
        dir="rtl"
      >
        {arabicWord}
      </span>
      <div className="w-full h-px bg-border/60" />
      <span className="text-[10px] text-primary font-semibold text-center leading-tight max-w-[90px] break-words uppercase tracking-wide">
        {meaning}
      </span>
    </div>
  );
}

interface WordByWordVerseProps {
  verse: VerseWithWords;
  urduText: string;
  urduStyle: React.CSSProperties;
  arabicFamily: string;
  arabicSize: string;
  verseNumber: number;
}

function WordByWordVerse({ verse, urduText, urduStyle, arabicFamily, arabicSize, verseNumber }: WordByWordVerseProps) {
  const words = verse.words.filter((w) => w.char_type_name === "word");

  return (
    <div className="relative pb-10 border-b border-border/30 last:border-0">
      {/* Ayah number badge */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-accent/40 bg-accent/5 text-primary">
          <span className="text-base font-arabic">{toEasternDigits(verseNumber)}</span>
        </div>
      </div>

      {/* Word-by-word grid — RTL flow */}
      <div
        className="flex flex-wrap gap-x-1 gap-y-3 mb-8 pb-6 border-b border-border/20"
        dir="rtl"
        data-testid={`wbw-verse-${verseNumber}`}
      >
        {words.map((word) => (
          <WordBlock
            key={word.id}
            arabicWord={word.text_uthmani}
            meaning={word.translation?.text ?? ""}
            arabicFamily={arabicFamily}
            arabicSize={arabicSize}
          />
        ))}
      </div>

      {/* Full Urdu translation below */}
      <div dir="rtl" className="pr-2">
        <p
          className="font-urdu text-muted-foreground text-right"
          style={urduStyle}
          dir="rtl"
        >
          {urduText}
        </p>
      </div>
    </div>
  );
}

export default function SurahView() {
  const { id } = useParams();
  const surahNumber = parseInt(id || "1", 10);
  const { data: surah, isLoading, error } = useSurahContent(surahNumber);
  const { arabicFont, fontSize } = useSettings();

  const [wordByWordEnabled, setWordByWordEnabled] = useState<boolean>(
    () => localStorage.getItem("quran-wbw") === "true"
  );

  const toggleWordByWord = useCallback(() => {
    setWordByWordEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("quran-wbw", String(next));
      return next;
    });
  }, []);

  const { data: wbwData, isLoading: wbwLoading } = useWordByWord(surahNumber, wordByWordEnabled);

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

  const bismillahUnicode =
    "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
  const bismillahPrefix = bismillahUnicode + " ";

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

          <div className="flex flex-col items-center gap-1">
            {isLoading ? (
              <Skeleton className="h-6 w-32 mx-auto" />
            ) : (
              <h2 className="font-semibold text-primary text-sm" data-testid="text-surah-name">
                {surah?.englishName}
              </h2>
            )}
            <button
              onClick={toggleWordByWord}
              data-testid="toggle-word-by-word"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                wordByWordEnabled
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
              }`}
            >
              <AlignLeft className="w-3 h-3" />
              Word by Word
            </button>
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

            {/* Bismillah */}
            {surah.number !== 9 && (
              <div className="text-center py-8 mb-8">
                <p
                  className="font-arabic text-foreground"
                  style={bismillahStyle}
                  data-testid="text-bismillah"
                >
                  {bismillahUnicode}
                </p>
              </div>
            )}

            {/* Word-by-word loading indicator */}
            {wordByWordEnabled && wbwLoading && (
              <div className="text-center py-4 mb-4">
                <p className="text-sm text-muted-foreground animate-pulse">Loading word-by-word translations...</p>
              </div>
            )}

            {/* Ayahs */}
            <div className="space-y-12">
              {surah.ayahs.map(({ arabic, urdu }, index) => {
                let arabicText = arabic.text;
                if (
                  surah.number !== 1 &&
                  surah.number !== 9 &&
                  index === 0 &&
                  arabicText.startsWith(bismillahPrefix)
                ) {
                  arabicText = arabicText.slice(bismillahPrefix.length);
                }

                const wbwVerse = wbwData?.find((v) => v.verse_number === arabic.numberInSurah);
                const showWbw = wordByWordEnabled && wbwVerse && !wbwLoading;

                return (
                  <AnimatePresence key={arabic.number} mode="wait">
                    {showWbw ? (
                      <motion.div
                        key="wbw"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        data-testid={`ayah-${arabic.numberInSurah}`}
                      >
                        <WordByWordVerse
                          verse={wbwVerse}
                          urduText={urdu.text}
                          urduStyle={urduStyle}
                          arabicFamily={fontConfig.family}
                          arabicSize={sizeConfig.arabicPx}
                          verseNumber={arabic.numberInSurah}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="normal"
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
                    )}
                  </AnimatePresence>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
