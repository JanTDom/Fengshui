---
name: gemini-spatial-prompter
description: Advanced multimodal prompt engineering framework for Google Gemini 3.7 Flash, specialized in high-accuracy architectural floor plan recognition, spatial layout parsing, and strictly typed JSON audit schema generation.
---

# Gemini Spatial Vision & Prompt Engineering Framework

Ten moduł standaryzuje zapytania multimodalne (Vision AI) do modelu **Google Gemini 3.7 Flash**, zapewniając bezbłędną analizę rzutów mieszkań i 100% deterministyczną strukturę wyjściową.

---

## 1. Reguły analizy multimodalnej rzutów architektonicznych

Podczas przekazywania obrazu rzutu do modelu Gemini, prompt systemowy wymusza następujący algorytm percepcji przestrzennej:

1. **Weryfikacja grubości i typologii ścian**:
   * *Ściany nośne / zewnętrzne*: grube linie, żelbet, szrafury – model traktuje je jako nienaruszalne stałe architektoniczne.
   * *Ścianki działowe*: cieńsze linie (10–12 cm) – model oznacza je jako podatne na wyburzenie lub modyfikację.
2. **Identyfikacja pionów instalacyjnych & stref mokrych**:
   * Szachty wentylacyjne, piony kanalizacyjne, podejścia wodne.
   * Zakaz rekomendowania przenoszenia kuchni/łazienki w miejsca oddalone od pionów bez uwzględnienia spadków grawitacyjnych.
3. **Detekcja drzwi i trajektorii otwierania (Skrzydła drzwi)**:
   * Wykrywanie łuku otwierania drzwi – weryfikacja kolizji z meblami lub zablokowania wejścia.
4. **Weryfikacja stolarki okiennej i doświetlenia naturalnego**:
   * Oznaczenie szerokości przeszkleń i orientacji słonecznej (nasłonecznienie poranne E vs popołudniowe W/SW).

---

## 2. Architektura Promptu Systemowego (System Instruction)

Struktura promptu w `api/generate-audit.js`:

```text
ROLA: Działasz jako licencjonowany doradca architektoniczny i ekspert klasycznego Feng Shui.
ZADANIE: Dokonaj rygorystycznej analizy przestrzennej załączonego rzutu nieruchomości na podstawie potwierdzonych danych wejściowych:
- Orientacja Północy (kąt): {northAngle}°
- Wejście do lokalu (współrzędne/kierunek): {entranceDirection}
- Typ nieruchomości: {propertyType}
- Główny cel klienta: {clientIntent}

ZASADY ODPOWIEDZI:
1. Odpowiedz WYŁĄCZNIE poprawnym obiektem JSON zgodnym ze schematem Zod.
2. Nigdy nie zgaduj brakujących danych – jeśli kąt północy nie został wskazany, oprzyj analizę na Szkole Formy i zaznacz stopień niepewności kompasowej.
3. Rekomendacje podziel na:
   - [BEZKOSZTOWE / NATYCHMIASTOWE]: przestawienie biurka/łóżka, zmiana funkcji pokoju.
   - [ŚREDNI KOSZT]: oświetlenie, zasłony akustyczne, żywioły, roślinność.
   - [PROJEKTOWE]: wyburzenia ścian działowych, zmiana kierunku otwierania drzwi.
```

---

## 3. Determinizm i Walidacja JSON (Zero Halucynacji)

- Wymuszenie parametru `response_mime_type: "application/json"`.
- Zastosowanie ścisłego schematu Zod (`AuditResponseSchema`), który natychmiast wychwytuje i naprawia ewentualne brakujące pola lub literówki kluczy.
- Obsługa fallbacków: w przypadku awarii sieci lub timeoutu API funkcja zwraca bezpieczną, strukturalną analizę domyślną z informacją o statusie.
