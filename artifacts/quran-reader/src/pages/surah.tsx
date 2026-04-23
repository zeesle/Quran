import React, { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight, AlignLeft, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSurahContent, useWordByWord, type VerseWithWords } from "@/hooks/use-quran";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, ARABIC_FONTS, FONT_SIZES } from "@/components/settings-provider";
import { TajweedText } from "@/components/tajweed-text";

function toEasternDigits(num: number): string {
  const d = ["\u0660","\u0661","\u0662","\u0663","\u0664","\u0665","\u0666","\u0667","\u0668","\u0669"];
  return num.toString().replace(/\d/g, (c) => d[parseInt(c)]);
}

// Decorative star border row
function StarRow() {
  return (
    <div
      className="text-center py-2 px-3 select-none overflow-hidden"
      style={{ background: "hsl(var(--accent) / 0.08)", color: "hsl(var(--accent))", fontSize: "0.7rem", letterSpacing: "0.15em" }}
      aria-hidden
    >
      {"✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦"}
    </div>
  );
}

// Inline verse-end ornament (U+06DD Arabic End of Ayah)
function VerseMarker({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center font-arabic align-middle mx-1"
      style={{
        color: "hsl(var(--accent))",
        fontSize: "1.4em",
        lineHeight: 1,
        position: "relative",
        top: "-0.05em",
      }}
    >
      &#x6DD;
      <span
        style={{
          position: "absolute",
          fontSize: "0.45em",
          fontFamily: "inherit",
          color: "hsl(var(--foreground))",
          fontWeight: 600,
          letterSpacing: 0,
        }}
      >
        {toEasternDigits(n)}
      </span>
    </span>
  );
}

interface WordBlockProps {
  arabicWord: string;
  meaning: string;
  arabicFamily: string;
  arabicSize: string;
}

function WordBlock({ arabicWord, meaning, arabicFamily, arabicSize }: WordBlockProps) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/5 transition-colors cursor-default shadow-sm"
      data-testid="word-block"
    >
      <span
        className="text-foreground leading-relaxed"
        style={{ fontFamily: arabicFamily, fontSize: `calc(${arabicSize} * 0.65)` }}
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
    <div className="pb-8 border-b border-border/30 last:border-0">
      <div className="flex justify-end mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-accent/40 bg-accent/5 text-primary">
          <span className="text-base font-arabic">{toEasternDigits(verseNumber)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-1 gap-y-3 mb-6 pb-6 border-b border-border/20" dir="rtl" data-testid={`wbw-verse-${verseNumber}`}>
        {words.map((word) => (
          <WordBlock key={word.id} arabicWord={word.text_uthmani} meaning={word.translation?.text ?? ""} arabicFamily={arabicFamily} arabicSize={arabicSize} />
        ))}
      </div>
      <div dir="rtl">
        <p className="font-urdu text-right" style={{ ...urduStyle, color: "hsl(var(--primary))" }} dir="rtl">{urduText}</p>
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
  const [tajweedEnabled, setTajweedEnabled] = useState<boolean>(
    () => localStorage.getItem("quran-tajweed") === "true"
  );

  const toggleWordByWord = useCallback(() => {
    setWordByWordEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("quran-wbw", String(next));
      return next;
    });
  }, []);

  const toggleTajweed = useCallback(() => {
    setTajweedEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("quran-tajweed", String(next));
      return next;
    });
  }, []);

  const { data: wbwData, isLoading: wbwLoading } = useWordByWord(surahNumber, wordByWordEnabled);

  const fontConfig = ARABIC_FONTS.find((f) => f.value === arabicFont) ?? ARABIC_FONTS[0];
  const sizeConfig = FONT_SIZES.find((s) => s.value === fontSize) ?? FONT_SIZES[1];

  const arabicStyle: React.CSSProperties = {
    fontFamily: fontConfig.family,
    fontSize: sizeConfig.arabicPx,
    lineHeight: 2.4,
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
        <Link href="/"><Button variant="outline">Return Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Sticky Sub-Header */}
      <div className="sticky top-16 z-40 bg-card/90 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          {prevSurah ? (
            <Link href={`/surah/${prevSurah}`}>
              <Button variant="ghost" size="sm" className="gap-1" data-testid="button-prev-surah">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
            </Link>
          ) : <div className="w-[88px]" />}

          <div className="flex flex-col items-center gap-1">
            {isLoading ? (
              <Skeleton className="h-6 w-32 mx-auto" />
            ) : (
              <h2 className="font-semibold text-primary text-sm" data-testid="text-surah-name">{surah?.englishName}</h2>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleWordByWord}
                data-testid="toggle-word-by-word"
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  wordByWordEnabled
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                }`}
              >
                <AlignLeft className="w-3 h-3" />
                Word by Word
              </button>
              <button
                onClick={toggleTajweed}
                data-testid="toggle-tajweed"
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  tajweedEnabled
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-transparent text-muted-foreground border-border hover:border-accent/60 hover:text-accent-foreground"
                }`}
              >
                <Palette className="w-3 h-3" />
                Tajweed
              </button>
            </div>
          </div>

          {nextSurah ? (
            <Link href={`/surah/${nextSurah}`}>
              <Button variant="ghost" size="sm" className="gap-1" data-testid="button-next-surah">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : <div className="w-[88px]" />}
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-0 border border-border/40 rounded">
                <Skeleton className="h-20 m-3" />
                <Skeleton className="h-20 m-3" />
              </div>
            ))}
          </div>
        ) : surah ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

            {/* Surah Header */}
            <div className="text-center py-10 mb-6">
              <h1
                className="font-arabic text-primary mb-3"
                style={{ ...arabicStyle, fontSize: `calc(${sizeConfig.arabicPx} * 1.3)` }}
                data-testid="text-surah-arabic-name"
              >
                {surah.name}
              </h1>
              <p className="text-base text-muted-foreground mb-1">{surah.englishName} — {surah.englishNameTranslation}</p>
              <div className="flex items-center justify-center gap-3 mt-4 text-sm text-muted-foreground">
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full">{surah.revelationType}</span>
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full">{surah.numberOfAyahs} Ayahs</span>
              </div>
            </div>

            {/* Tajweed legend */}
            {tajweedEnabled && !wordByWordEnabled && (
              <div className="mb-5 p-3 rounded-xl border border-border/50 bg-card/60 flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs">
                {[
                  { label: "Normal",             color: "#2144C1" },
                  { label: "Ghunna",             color: "#FF7E1E" },
                  { label: "Qalqalah",           color: "#DD0008" },
                  { label: "Ikhfa",              color: "#9400A8" },
                  { label: "Idgham (Ghunna)",    color: "#169777" },
                  { label: "Idgham (no Ghunna)", color: "#169200" },
                  { label: "Iqlab",              color: "#26BFFD" },
                  { label: "Madd",               color: "#537FFF" },
                  { label: "Silent",             color: "#000000" },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1 font-medium" style={{ color }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Word-by-word mode: full-width stacked layout */}
            {wordByWordEnabled ? (
              <div className="space-y-8">
                {wbwLoading && (
                  <p className="text-center text-sm text-muted-foreground animate-pulse py-4">Loading word-by-word translations...</p>
                )}
                {surah.ayahs.map(({ arabic, urdu }, index) => {
                  let arabicText = arabic.text;
                  if (surah.number !== 1 && surah.number !== 9 && index === 0 && arabicText.startsWith(bismillahPrefix)) {
                    arabicText = arabicText.slice(bismillahPrefix.length);
                  }
                  const wbwVerse = wbwData?.find((v) => v.verse_number === arabic.numberInSurah);

                  return (
                    <AnimatePresence key={arabic.number} mode="wait">
                      {wbwVerse && !wbwLoading ? (
                        <motion.div key="wbw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} data-testid={`ayah-${arabic.numberInSurah}`}>
                          <WordByWordVerse verse={wbwVerse} urduText={urdu.text} urduStyle={urduStyle} arabicFamily={fontConfig.family} arabicSize={sizeConfig.arabicPx} verseNumber={arabic.numberInSurah} />
                        </motion.div>
                      ) : (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-8 border-b border-border/30 last:border-0" data-testid={`ayah-${arabic.numberInSurah}`}>
                          <div dir="rtl" className="mb-4">
                            <p className="font-arabic text-foreground text-right leading-loose" style={arabicStyle} dir="rtl">
                              {tajweedEnabled ? <TajweedText as="span" text={arabicText} style={arabicStyle} className="text-foreground" /> : arabicText}
                              {" "}<VerseMarker n={arabic.numberInSurah} />
                            </p>
                          </div>
                          <div dir="rtl">
                            <p className="font-urdu text-right" style={{ ...urduStyle, color: "hsl(var(--primary))" }} dir="rtl">{urdu.text}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>
            ) : (
              /* ── Two-column mushaf layout ── */
              <div
                className="rounded-sm overflow-hidden"
                style={{
                  border: "3px solid hsl(var(--accent) / 0.7)",
                  boxShadow: "0 0 0 6px hsl(var(--accent) / 0.12), 0 4px 24px hsl(var(--accent) / 0.15)",
                }}
              >
                <StarRow />

                {/* Bismillah — spans both columns */}
                {surah.number !== 9 && (
                  <div
                    className="text-center py-5 border-b"
                    style={{ borderColor: "hsl(var(--accent) / 0.35)", background: "hsl(var(--accent) / 0.04)" }}
                    data-testid="text-bismillah"
                  >
                    {tajweedEnabled ? (
                      <TajweedText text={bismillahUnicode} style={bismillahStyle} className="text-foreground text-center" />
                    ) : (
                      <p className="font-arabic text-foreground text-center" style={bismillahStyle} dir="rtl">{bismillahUnicode}</p>
                    )}
                  </div>
                )}

                {/* Column header labels */}
                <div
                  className="grid grid-cols-2 text-xs font-semibold tracking-widest uppercase"
                  dir="rtl"
                  style={{ borderBottom: "1px solid hsl(var(--accent) / 0.35)", background: "hsl(var(--accent) / 0.06)" }}
                >
                  <div className="py-2 px-4 text-right" style={{ borderLeft: "1px solid hsl(var(--accent) / 0.35)", color: "hsl(var(--accent))" }}>
                    عربی
                  </div>
                  <div className="py-2 px-4 text-right" style={{ color: "hsl(var(--primary))" }}>
                    اردو ترجمہ
                  </div>
                </div>

                {/* Ayah rows */}
                {surah.ayahs.map(({ arabic, urdu }, index) => {
                  let arabicText = arabic.text;
                  if (surah.number !== 1 && surah.number !== 9 && index === 0 && arabicText.startsWith(bismillahPrefix)) {
                    arabicText = arabicText.slice(bismillahPrefix.length);
                  }

                  return (
                    <motion.div
                      key={arabic.number}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4 }}
                      className="grid grid-cols-2"
                      dir="rtl"
                      style={{
                        borderBottom: index < surah.ayahs.length - 1 ? "1px solid hsl(var(--accent) / 0.25)" : "none",
                        background: index % 2 === 0 ? "transparent" : "hsl(var(--accent) / 0.025)",
                      }}
                      data-testid={`ayah-${arabic.numberInSurah}`}
                    >
                      {/* Arabic column (right in RTL) */}
                      <div
                        className="p-4 md:p-5"
                        dir="rtl"
                        style={{ borderLeft: "1px solid hsl(var(--accent) / 0.25)" }}
                      >
                        <p
                          className="font-arabic text-foreground text-right leading-loose"
                          style={arabicStyle}
                          dir="rtl"
                          data-testid={`text-arabic-${arabic.numberInSurah}`}
                        >
                          {tajweedEnabled ? (
                            <TajweedText as="span" text={arabicText} style={arabicStyle} className="text-foreground" />
                          ) : arabicText}
                          {" "}
                          <VerseMarker n={arabic.numberInSurah} />
                        </p>
                      </div>

                      {/* Urdu column (left in RTL) */}
                      <div className="p-4 md:p-5" dir="rtl">
                        <p
                          className="font-urdu text-right leading-loose"
                          style={{ ...urduStyle, color: "hsl(var(--primary))" }}
                          data-testid={`text-urdu-${arabic.numberInSurah}`}
                          dir="rtl"
                        >
                          {urdu.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                <StarRow />
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
