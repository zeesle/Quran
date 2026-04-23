# Indo-Pak Quran Font Files

Place the downloaded `.ttf` files in this directory (`public/fonts/`) and the
app will automatically load them. No code changes needed.

---

## Arabic Quran Fonts

### Al-Qalam Quran Majeed
**Filename:** `AlQalamQuranMajeed.ttf`  
**Download:** https://www.alqalam.pk/download/  
**Style:** The standard Indo-Pak madrasa print style — clear Naskh with
distinctive Pakistani/Indian letter forms used in millions of printed Qurans.

### Noor-e-Hira
**Filename:** `NoorHira.ttf`  
**Download:** https://www.alqalam.pk/download/ (look for "Noor e Hira" font)  
**Style:** Elegant Pakistani print Quran font — slightly bolder than Al-Qalam,
very popular in modern Pakistani Quran publications.

### PDMS Saleem QuranFont
**Filename:** `PDMS_Saleem_QuranFont.ttf`  
**Download:** https://www.pdms.pk/  
**Style:** PDMS Indo-Pak Quran style — used widely in Pakistani digital Quran
software and mobile apps.

---

## Urdu Translation Fonts (optional enhancement)

### Jameel Noori Nastaleeq
**Filename:** `JameelNooriNastaleeq.ttf`  
**Download:** Search "Jameel Noori Nastaleeq font download" — widely mirrored
on Urdu typography and Islamic software sites.  
**Style:** The gold-standard Nastaliq font for Urdu text. Used in virtually
all Pakistani Urdu newspapers, books, and Quran translations.

### Nafees Nastaleeq
**Filename:** `NafeesNastaleeq.ttf`  
**Download:** http://www.cssforum.com.pk/off-topic-section/urdu-literature/  
**Style:** CRULP's open-source Nastaliq font — clean and well-hinted for
screen reading.

---

## How to add

1. Download the TTF file from the link above
2. Rename it exactly as shown (case-sensitive)
3. Place it in this folder (`artifacts/quran-reader/public/fonts/`)
4. The font will appear immediately in the app settings — no restart needed

The `@font-face` rules are already wired up in `src/index.css`.
