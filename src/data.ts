import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Compass,
  FileText,
  Grid3X3,
  Home,
  Layers3,
  Lightbulb,
  Map,
  Route,
  Scale,
  Sparkles,
  SunMedium,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PropertyKey = "flat" | "multi" | "house" | "business";

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type PropertyType = {
  key: PropertyKey;
  title: string;
  short: string;
  scope: string;
  reportFocus: string[];
};

export type PricePlan = {
  id: string;
  title: string;
  price: string;
  period?: string;
  note: string;
  features: string[];
  featured?: boolean;
};

export const propertyTypes: PropertyType[] = [
  {
    key: "flat",
    title: "Mieszkanie",
    short: "1 poziom",
    scope: "plan, wejście, strony świata, funkcje pokojów",
    reportFocus: ["układ dzienny i nocny", "wejście oraz osie drzwi-okna", "światło dzienne"]
  },
  {
    key: "multi",
    title: "Mieszkanie wielopoziomowe",
    short: "2+ poziomy",
    scope: "kondygnacje, schody, pionowy przepływ, relacje funkcji",
    reportFocus: ["rola schodów", "funkcje pięter", "prywatność stref nocnych"]
  },
  {
    key: "house",
    title: "Dom",
    short: "dom i działka",
    scope: "bryła, wejście, kondygnacje, działka, otoczenie",
    reportFocus: ["relacja domu z działką", "front i zaplecze", "schody, ogród, wejście"]
  },
  {
    key: "business",
    title: "Lokal / biuro",
    short: "praca i sprzedaż",
    scope: "wejście klienta, recepcja, stanowiska, zaplecze",
    reportFocus: ["ścieżka klienta", "widoczność stanowisk", "koncentracja i przepływ pracy"]
  }
];

export const services: Service[] = [
  {
    id: "property-audit",
    title: "Audyt mieszkania i domu",
    description: "Plany jedno- i wielopoziomowe, domy, działki oraz układy deweloperskie.",
    icon: Home
  },
  {
    id: "business",
    title: "Biuro i lokal",
    description: "Gabinet, sala sprzedaży, recepcja, wejście klienta i zaplecze operacyjne.",
    icon: Building2
  },
  {
    id: "kua",
    title: "Profil Kua / Gua",
    description: "Osobiste kierunki, dopasowanie miejsca pracy, snu i codziennego działania.",
    icon: UserRound
  },
  {
    id: "dates",
    title: "Dobór daty",
    description: "Przeprowadzka, remont, otwarcie lokalu, podpisanie umowy lub start działań.",
    icon: CalendarClock
  },
  {
    id: "compare",
    title: "Porównanie 3 nieruchomości",
    description: "Ranking układów, czerwone flagi i rekomendacja wyboru obok siebie.",
    icon: Scale
  }
];

export const methods = [
  {
    name: "Forma",
    icon: Route,
    score: 82,
    description: "Otoczenie, proporcje, osłona, otwarcie, przebieg ruchu i braki w układzie."
  },
  {
    name: "Kompas",
    icon: Compass,
    score: 76,
    description: "Północ, front, kierunki sektorowe i korekta orientacji względem planu."
  },
  {
    name: "Bagua",
    icon: Grid3X3,
    score: 74,
    description: "Mapa 9 stref nakładana na lokal lub kondygnację, z kontrolą funkcji."
  },
  {
    name: "Pięć elementów",
    icon: Sparkles,
    score: 79,
    description: "Cykle tworzenia i kontroli, materiały, kolory, proporcje i równoważenie."
  },
  {
    name: "Kua / Gua",
    icon: UserRound,
    score: 70,
    description: "Profil użytkownika, korzystne kierunki i dopasowanie do codziennych miejsc."
  },
  {
    name: "Daty i cykle",
    icon: CalendarClock,
    score: 68,
    description: "Czas przeprowadzki, remontu i działań, gdy użytkownik poda wymagane dane."
  },
  {
    name: "Światło",
    icon: SunMedium,
    score: 81,
    description: "Dostęp do światła dziennego, strefy pracy i odpoczynku, rytm dnia."
  },
  {
    name: "Funkcja",
    icon: Lightbulb,
    score: 84,
    description: "Ergonomia, prywatność, trasy ruchu, konflikt funkcji i łatwość zmian."
  }
];

export const pricePlans: PricePlan[] = [
  {
    id: "scan",
    title: "Szybki skan",
    price: "39 zł",
    note: "Dla pierwszej oceny planu lub najmu.",
    features: ["1 plan do 120 m2", "Skrót wielometodowy", "Wynik ogólny", "3 priorytety zmian"]
  },
  {
    id: "full",
    title: "Pełny raport",
    price: "79 zł",
    note: "Najlepszy wybór przed zakupem lub remontem.",
    featured: true,
    features: [
      "1 plan do 150 m2",
      "Pełna analiza AI Feng Shui",
      "PDF i raport online",
      "Rekomendacje metodami"
    ]
  },
  {
    id: "compare",
    title: "Pakiet 3 nieruchomości",
    price: "179 zł",
    note: "Dla kupujących, rodzin i inwestorów.",
    features: [
      "3 plany do 150 m2 każdy",
      "Tabela porównawcza",
      "Ranking potencjału",
      "Rekomendacja wyboru"
    ]
  },
  {
    id: "studio",
    title: "Studio / Agent",
    price: "249 zł",
    period: "/ mies.",
    note: "Dla projektantów wnętrz i pośredników.",
    features: [
      "Do 12 raportów miesięcznie",
      "Historia audytów",
      "Eksport PDF dla klienta",
      "Priorytetowa kolejka"
    ]
  }
];

export const sourceColumns = [
  {
    title: "Szkoła Formy",
    detail: "Ukształtowanie terenu, osłona, otwarcie, wejście, proporcje i ruch.",
    bullets: ["Góry i woda", "Ming tang", "Oś wejścia", "Kontekst miejsca"]
  },
  {
    title: "Kompas i kierunki",
    detail: "Orientacja planu względem północy, frontu i sektorów.",
    bullets: ["Luo Pan", "24 góry", "Kierunki sektorowe", "Front i sitting"]
  },
  {
    title: "Bagua i 9 stref",
    detail: "Mapa stref funkcji nakładana na lokal, dom albo kondygnację.",
    bullets: ["9 stref", "Funkcja kontra sektor", "Braki w planie", "Priorytety"]
  },
  {
    title: "Pięć elementów",
    detail: "Równowaga cykli, materiałów, barw, form i natężenia bodźców.",
    bullets: ["Sheng", "Ke", "Dominanta elementu", "Korekta nadmiaru"]
  },
  {
    title: "BaZi / Kua / Gua",
    detail: "Profil użytkownika i kierunki stosowane tylko przy podanych danych.",
    bullets: ["Ming Gua", "Kierunki", "Profil miejsca", "Zakres niepewności"]
  },
  {
    title: "Ergonomia i światło",
    detail: "Branżowe kryteria komfortu przestrzeni: funkcja, światło, akustyka.",
    bullets: ["Światło dzienne", "Prywatność", "Trasy ruchu", "Wentylacja"]
  }
];

export const reportDeliverables = [
  {
    title: "Raport główny",
    description: "Wynik, mapa metod, najważniejsze ryzyka i rekomendacje priorytetowe.",
    icon: FileText
  },
  {
    title: "Mapa kondygnacji",
    description: "Dla domu i mieszkań 2+ poziomy: osobne mapy pięter i relacja schodów.",
    icon: Layers3
  },
  {
    title: "Rejestr źródeł",
    description: "Każdy wniosek ma oznaczoną metodę, dane wejściowe i poziom pewności.",
    icon: BadgeCheck
  },
  {
    title: "Plan działań",
    description: "Co można zrobić bez remontu, co wymaga projektu, czego nie ruszać w ciemno.",
    icon: Map
  }
];
