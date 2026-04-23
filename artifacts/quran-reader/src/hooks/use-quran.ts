import { useState, useEffect } from "react";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
}

export interface SurahContent {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: {
    arabic: Ayah;
    translation: Ayah;
  }[];
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  char_type_name: string;
  translation: { text: string };
  transliteration?: { text: string };
}

export interface VerseWithWords {
  id: number;
  verse_number: number;
  verse_key: string;
  words: Word[];
}

export function useSurahList() {
  const [data, setData] = useState<Surah[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSurahs() {
      try {
        setIsLoading(true);
        const res = await fetch("https://api.alquran.cloud/v1/surah");
        if (!res.ok) throw new Error("Failed to fetch Surahs");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchSurahs();
  }, []);

  return { data, isLoading, error };
}

export function useSurahContent(number: number, translationEdition = "ur.jalandhry") {
  const [data, setData] = useState<SurahContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!number) return;

    async function fetchSurah() {
      try {
        setIsLoading(true);
        setData(null);
        const res = await fetch(
          `https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,${translationEdition}`
        );
        if (!res.ok) throw new Error("Failed to fetch Surah content");
        const json = await res.json();

        const arabicEdition = json.data[0];
        const translationEditionData = json.data[1];

        const combinedAyahs = arabicEdition.ayahs.map((ayah: Ayah, index: number) => ({
          arabic: ayah,
          translation: translationEditionData.ayahs[index],
        }));

        setData({
          number: arabicEdition.number,
          name: arabicEdition.name,
          englishName: arabicEdition.englishName,
          englishNameTranslation: arabicEdition.englishNameTranslation,
          revelationType: arabicEdition.revelationType,
          numberOfAyahs: arabicEdition.numberOfAyahs,
          ayahs: combinedAyahs,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchSurah();
  }, [number, translationEdition]);

  return { data, isLoading, error };
}

export function useWordByWord(surahNumber: number, enabled: boolean) {
  const [data, setData] = useState<VerseWithWords[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!surahNumber || !enabled) return;

    let cancelled = false;

    async function fetchAll() {
      try {
        setIsLoading(true);
        setData(null);

        const firstRes = await fetch(
          `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?words=true&word_fields=text_uthmani,translation&per_page=50&page=1`
        );
        if (!firstRes.ok) throw new Error("Failed to fetch word-by-word data");
        const firstJson = await firstRes.json();

        const totalPages: number = firstJson.pagination.total_pages;
        let allVerses: VerseWithWords[] = firstJson.verses;

        if (totalPages > 1) {
          const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
          const rest = await Promise.all(
            pageNums.map((page) =>
              fetch(
                `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?words=true&word_fields=text_uthmani,translation&per_page=50&page=${page}`
              ).then((r) => r.json())
            )
          );
          for (const page of rest) {
            allVerses = [...allVerses, ...page.verses];
          }
        }

        if (!cancelled) setData(allVerses);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [surahNumber, enabled]);

  return { data, isLoading, error };
}
