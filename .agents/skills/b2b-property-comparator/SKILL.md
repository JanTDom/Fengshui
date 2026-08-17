---
name: b2b-property-comparator
description: Decision engine and scoring algorithm for side-by-side comparative analysis of up to 3 properties (apartments, houses, offices) for home buyers, real estate investors, and interior design studios.
---

# Silnik Porównawczy Nieruchomości (3-Property Comparator)

Ten moduł definiuje algorytm scoringu, matrycę wag oraz generowanie raportu porównawczego dla 3 nieruchomości obok siebie (Pakiet Porównawczy 179 zł).

---

## 1. Algorytm Punktacji i Scoringu (0 – 100 pkt)

Każda nieruchomość jest oceniana w 5 niezależnych kategoriach z przypisanymi wagami:

| Kategoria oceny | Waga | Kryteria oceny architektonicznej i Feng Shui |
| :--- | :--- | :--- |
| **1. Układ funkcjonalny i proporcje** | **25%** | Foremność bryły (prostokąt vs L/T/nieregularny), brak martwych korytarzy, relacja strefy dziennej do nocnej. |
| **2. Światło dzienne i orientacja (Kompas)** | **25%** | Doświetlenie salonu i sypialni (okna na południe/zachód vs wyłącznie północ), kąt padania światła, brak ciemnych pokojów. |
| **3. Pozycja wejścia i przepływ Qi (Forma)** | **20%** | Widok z wejścia (czy widać od razu WC lub kuchnię), obecność osłony (Ming Tang), brak osi przelotowej drzwi-okno. |
| **4. Potencjał adaptacyjny (Elastyczność zmian)** | **15%** | Udział ścian działowych w stosunku do nośnych, możliwość wydzielenia gabinetu/dodatkowego pokoju, układ pionów. |
| **5. Higiena snu i strefa wypoczynku** | **15%** | Możliwość ustawienia łóżka w pozycji dominującej (pełna ściana, brak okna za głową, brak sąsiedztwa z głośnym pionem). |

---

## 2. Matryca Czerwonych Flag (Red Flags)

Automatyczne alerty obniżające punktację o 10–25 pkt:
- 🔴 **Krytyczny brak strefy Bagua**: Wycięcie w rzucie przekraczające 33% szerokości lokalu w sektorze Finansów (SE) lub Zdrowia (Centrum).
- 🔴 **Brak możliwości pozycji bezpiecznej w sypialni**: Układ wymuszający łóżko pod oknem lub w osi z drzwiami sypialni.
- 🔴 **Ciemna, zamknięta kuchnia/salon bez okna**: Naruszenie żywiołu Ognia/Światła.
- 🔴 **Słup konstrukcyjny w centrum strefy wypoczynku**: Stała emisja ostrej energii (Sha Qi).

---

## 3. Struktura Raportu Porównawczego

Raport generowany dla klienta zawiera:
1. **Podsumowanie decyzyjne & Zwycięzca rankingu**: Jednoznaczne wskazanie lokalu o najwyższym potencjale życiowym lub inwestycyjnym (np. *„Mieszkanie B uzyskuje 84/100 pkt i jest najbardziej ergonomicznym wyborem”*).
2. **Tabela zestawieniowa (Side-by-side)**: Przejrzyste porównanie parametrów, punktacji i ryzyk dla każdego z 3 lokali.
3. **Szacowany koszt adaptacji**: Estymacja nakładu pracy potrzebnego do zneutralizowania mankamentów (Niski / Średni / Znaczny).
