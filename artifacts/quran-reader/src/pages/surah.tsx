import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSurahContent } from "@/hooks/use-quran";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to convert western digits to eastern arabic numerals
function toEasternDigits(num: number): string {
  const easternDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().replace(/\d/g, d => easternDigits[parseInt(d)]);
}

export default function SurahView() {
  const { id } = useParams();
  const surahNumber = parseInt(id || "1", 10);
  const { data: surah, isLoading, error } = useSurahContent(surahNumber);

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
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
            </Link>
          ) : <div className="w-[88px]"></div>}
          
          <div className="text-center">
            {isLoading ? (
              <Skeleton className="h-6 w-32 mx-auto" />
            ) : (
              <h2 className="font-semibold text-primary">{surah?.englishName}</h2>
            )}
          </div>

          {nextSurah ? (
            <Link href={`/surah/${nextSurah}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : <div className="w-[88px]"></div>}
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
              <h1 className="text-5xl md:text-6xl font-arabic text-primary mb-4 leading-normal">
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
                <h2 className="text-4xl md:text-5xl font-arabic text-foreground leading-normal">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </h2>
              </div>
            )}

            {/* Ayahs */}
            <div className="space-y-12">
              {surah.ayahs.map(({ arabic, urdu }, index) => {
                // If it's the first ayah of a surah (except Fatiha and Tawbah), 
                // the API includes Bismillah in the first ayah's text.
                // We should strip it if we already displayed it.
                let arabicText = arabic.text;
                const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ";
                if (surah.number !== 1 && surah.number !== 9 && index === 0 && arabicText.startsWith(bismillah)) {
                  arabicText = arabicText.replace(bismillah, "");
                }

                return (
                  <motion.div 
                    key={arabic.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="relative pb-10 border-b border-border/30 last:border-0"
                  >
                    <div className="flex flex-col gap-8">
                      {/* Arabic */}
                      <div className="flex items-start gap-4 flex-row-reverse" dir="rtl">
                        <div className="flex-shrink-0 mt-2 flex items-center justify-center w-12 h-12 rounded-full border-2 border-accent/40 bg-accent/5 text-primary relative">
                          <span className="text-lg font-arabic">{toEasternDigits(arabic.numberInSurah)}</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-arabic text-foreground leading-[2.5] text-right flex-1 pt-1">
                          {arabicText}
                        </p>
                      </div>

                      {/* Urdu */}
                      <div className="pr-16" dir="rtl">
                        <p className="text-xl md:text-2xl font-urdu text-muted-foreground leading-[2.2] text-right">
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
