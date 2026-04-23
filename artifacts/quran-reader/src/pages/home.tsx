import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useSurahList } from "@/hooks/use-quran";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: surahs, isLoading, error } = useSurahList();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSurahs = useMemo(() => {
    if (!surahs) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return surahs.filter(s => 
      s.englishName.toLowerCase().includes(lowerQuery) || 
      s.englishNameTranslation.toLowerCase().includes(lowerQuery)
    );
  }, [surahs, searchQuery]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="text-center space-y-6 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-arabic text-primary mb-4">بسم الله الرحمن الرحيم</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A serene, sacred digital space for reading the Quran with Urdu translation.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-md mx-auto relative"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search Surah..."
              className="pl-10 h-12 text-lg rounded-full border-primary/20 bg-card focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-12">
          <p>Failed to load Surahs. Please check your connection and try again.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredSurahs.map((surah, i) => (
            <motion.div
              key={surah.number}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.02 > 0.5 ? 0 : i * 0.02 }}
            >
              <Link href={`/surah/${surah.number}`}>
                <div className="group block h-full bg-card hover:bg-accent/10 border border-border hover:border-primary/30 rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{surah.englishName}</h3>
                        <p className="text-xs text-muted-foreground">{surah.englishNameTranslation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h3 className="font-arabic text-2xl text-primary">{surah.name.replace('سُورَةُ ', '')}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {surah.revelationType}</span>
                    <span>{surah.numberOfAyahs} Ayahs</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {filteredSurahs.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No Surahs found matching "{searchQuery}"
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
