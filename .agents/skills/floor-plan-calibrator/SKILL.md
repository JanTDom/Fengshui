---
name: floor-plan-calibrator
description: Technical framework for processing floor plan images (PDF, PNG, JPG, WebP, HEIC/HEIF), coordinate normalization, North Arrow angle calibration, and user spatial annotation handling.
---

# Rzuty Architektoniczne, Kalibracja i Przetwarzanie Obrazu

Ten moduł standaryzuje obsługę techniczną plików rzutów mieszkań, kalibrację kąta północy oraz interaktywne oznaczanie przestrzeni w [src/AuditBuilder.tsx](file:///Users/macbookpro/Documents/ChatGPT/FENG%20SHUI/src/AuditBuilder.tsx).

---

## 1. Obsługa formatów i pre-processing graficzny

Obsługiwane typy plików:
- **PDF** (wektorowe lub rastrowe rzuty od deweloperów).
- **PNG / JPG / WebP** (standardowe zrzuty i skany).
- **HEIC / HEIF** (zdjęcia z urządzeń Apple – automatyczna konwersja do JPEG po stronie klienta lub w migracji Supabase).

### Reguły optymalizacji obrazu przed wysyłką do Vision AI:
1. **Maksymalny rozmiar**: 10 MB.
2. **Skalowanie rozdzielczości**: Dłuższa krawędź skalowana do 2048px (idealny kompromis między ostrością detali architektonicznych a szybkością odpowiedzi Gemini).
3. **Korekta kontrastu i bieli**: Wyrównanie poziomów szarości, aby cienkie linie ścian działowych i napisy metraży były wyraźnie czytelne dla OCR.

---

## 2. Kalibracja Kąta Północy (North Arrow Calibration)

Matematyka obrotu i orientacji siatki kompasu:

- Kąt $\theta \in [0^\circ, 360^\circ)$, gdzie $0^\circ$ oznacza Północ skierowaną pionowo w górę ekranu.
- Zmiana kąta rotuje siatkę 9 Pałaców Bagua o kąt $\theta$:
  $$\text{Kąt Sektora}_i = (\text{Kąt Bazowy}_i + \theta) \pmod{360^\circ}$$
- Weryfikacja: Wskaźnik w UI obraca się płynnie z krokiem $1^\circ$ i zatwierdzeniem pozycji przez użytkownika.

---

## 3. Układ współrzędnych i adnotacje (Markers & Annotations)

- Wszystkie punkty (drzwi wejściowe, łóżko, biurko, kuchenka) są zapisywane w znormalizowanych współrzędnych względnych:
  $$x_{\text{norm}} = \frac{x_{\text{px}}}{\text{szerokość}_{\text{px}}}, \quad y_{\text{norm}} = \frac{y_{\text{px}}}{\text{wysokość}_{\text{px}}}$$
- Pozwala to na bezbłędne skalowanie znaczników na urządzeniach mobilnych, tabletach i desktopie bez rozjeżdżania się pozycji na rzucie.
