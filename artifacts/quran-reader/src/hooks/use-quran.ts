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
    urdu: Ayah;
  }[];
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

export function useSurahContent(number: number) {
  const [data, setData] = useState<SurahContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!number) return;
    
    async function fetchSurah() {
      try {
        setIsLoading(true);
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,ur.ahmedali`);
        if (!res.ok) throw new Error("Failed to fetch Surah content");
        const json = await res.json();
        
        const arabicEdition = json.data[0];
        const urduEdition = json.data[1];

        const combinedAyahs = arabicEdition.ayahs.map((ayah: Ayah, index: number) => ({
          arabic: ayah,
          urdu: urduEdition.ayahs[index]
        }));

        setData({
          number: arabicEdition.number,
          name: arabicEdition.name,
          englishName: arabicEdition.englishName,
          englishNameTranslation: arabicEdition.englishNameTranslation,
          revelationType: arabicEdition.revelationType,
          numberOfAyahs: arabicEdition.numberOfAyahs,
          ayahs: combinedAyahs
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchSurah();
  }, [number]);

  return { data, isLoading, error };
}
