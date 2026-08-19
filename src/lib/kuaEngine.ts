// Kalkulator i Silnik Obliczeniowy Liczb Kua (Ba Zhai / Osiem Pałaców)

export type KuaElement = "Woda" | "Ziemia" | "Drewno" | "Metal" | "Ogień";
export type KuaGroup = "Grupa Wschodnia" | "Grupa Zachodnia";

export type KuaResult = {
  kua: number;
  element: KuaElement;
  trigram: string;
  group: KuaGroup;
  shengChi: string; // Sukces & Bogactwo
  tianYi: string;   // Zdrowie & Sen
  yanNian: string;  // Relacje & Partnerstwo
  fuWei: string;    // Spokój & Wewnętrzna siła
  inauspicious: string[];
  bedAdvice: string;
  deskAdvice: string;
  yearlyAdvice: string;
};

const KUA_DATA: Record<number, Omit<KuaResult, "kua">> = {
  1: {
    element: "Woda",
    trigram: "Kan (Woda)",
    group: "Grupa Wschodnia",
    shengChi: "Południowy Wschód (SE)",
    tianYi: "Wschód (E)",
    yanNian: "Południe (S)",
    fuWei: "Północ (N)",
    inauspicious: ["Zachód (Jue Ming)", "Północny Wschód (Wu Gui)", "Północny Zachód (Liu Sha)", "Południowy Zachód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Wschód (Zdrowie) lub Południowy Wschód (Witalność). Unikać wezgłowia na Zachód.",
    deskAdvice: "Biurko skierowane twarzą na Południowy Wschód lub Północ.",
    yearlyAdvice: "Wzmocnij strefę Północną i Południowo-Wschodnią akcentami Wody i Drewna."
  },
  2: {
    element: "Ziemia",
    trigram: "Kun (Ziemia)",
    group: "Grupa Zachodnia",
    shengChi: "Północny Wschód (NE)",
    tianYi: "Zachód (W)",
    yanNian: "Północny Zachód (NW)",
    fuWei: "Południowy Zachód (SW)",
    inauspicious: ["Północ (Jue Ming)", "Południowy Wschód (Wu Gui)", "Południe (Liu Sha)", "Wschód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Zachód (Zdrowie) lub Północny Wschód (Sukces). Unikać wezgłowia na Północ.",
    deskAdvice: "Biurko skierowane twarzą na Północny Wschód lub Północny Zachód.",
    yearlyAdvice: "Stabilizuj energię Ziemi w centrum i strefie SW ceramiką i ciepłymi barwami piasku."
  },
  3: {
    element: "Drewno",
    trigram: "Zhen (Grzmot)",
    group: "Grupa Wschodnia",
    shengChi: "Południe (S)",
    tianYi: "Północ (N)",
    yanNian: "Południowy Wschód (SE)",
    fuWei: "Wschód (E)",
    inauspicious: ["Zachód (Jue Ming)", "Północny Zachód (Wu Gui)", "Północny Wschód (Liu Sha)", "Południowy Zachód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Północ (Zdrowie) lub Południe (Witalność). Chronić strefę głowy przed kierunkami zachodnimi.",
    deskAdvice: "Twarz skierowana na Południe lub Wschód z solidnym oparciem pleców.",
    yearlyAdvice: "Wspieraj żywioł Drewna roślinami o obłych liściach w sektorze Wschodnim."
  },
  4: {
    element: "Drewno",
    trigram: "Xun (Wiatr)",
    group: "Grupa Wschodnia",
    shengChi: "Północ (N)",
    tianYi: "Południe (S)",
    yanNian: "Wschód (E)",
    fuWei: "Południowy Wschód (SE)",
    inauspicious: ["Północny Wschód (Jue Ming)", "Południowy Zachód (Wu Gui)", "Zachód (Liu Sha)", "Północny Zachód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Południe (Zdrowie) lub Północ (Najwyższa Witalność).",
    deskAdvice: "Biurko skierowane na Północ lub Południowy Wschód.",
    yearlyAdvice: "Dbaj o cyrkulację powietrza i światło dzienne w strefie SE."
  },
  6: {
    element: "Metal",
    trigram: "Qian (Niebo)",
    group: "Grupa Zachodnia",
    shengChi: "Zachód (W)",
    tianYi: "Północny Wschód (NE)",
    yanNian: "Południowy Zachód (SW)",
    fuWei: "Północny Zachód (NW)",
    inauspicious: ["Południe (Jue Ming)", "Wschód (Wu Gui)", "Północ (Liu Sha)", "Południowy Wschód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Północny Wschód (Zdrowie) lub Zachód. Bezwzględnie unikać głowy na Południe.",
    deskAdvice: "Biurko skierowane na Zachód lub Północny Zachód (Pozycja Lidera).",
    yearlyAdvice: "Akcenty mosiądzu i bieli w strefie NW chronią autorytet i stabilność finansową."
  },
  7: {
    element: "Metal",
    trigram: "Dui (Jezioro)",
    group: "Grupa Zachodnia",
    shengChi: "Północny Zachód (NW)",
    tianYi: "Południowy Zachód (SW)",
    yanNian: "Północny Wschód (NE)",
    fuWei: "Zachód (W)",
    inauspicious: ["Wschód (Jue Ming)", "Południe (Wu Gui)", "Południowy Wschód (Liu Sha)", "Północ (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Południowy Zachód (Zdrowie/Relacje) lub Północny Zachód.",
    deskAdvice: "Biurko z widokiem na Północny Zachód lub Zachód.",
    yearlyAdvice: "Wyciszaj strefę Zachodnią okrągłymi kształtami i subtelnym światłem."
  },
  8: {
    element: "Ziemia",
    trigram: "Gen (Góra)",
    group: "Grupa Zachodnia",
    shengChi: "Południowy Zachód (SW)",
    tianYi: "Północny Zachód (NW)",
    yanNian: "Zachód (W)",
    fuWei: "Północny Wschód (NE)",
    inauspicious: ["Południowy Wschód (Jue Ming)", "Północ (Wu Gui)", "Wschód (Liu Sha)", "Południe (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Północny Zachód (Zdrowie) lub Południowy Zachód.",
    deskAdvice: "Biurko skierowane na Południowy Zachód lub Północny Wschód (Nauka i Wiedza).",
    yearlyAdvice: "Strefa NE sprzyja skupieniu i medytacji, warto wprowadzić tam minerały lub ceramikę."
  },
  9: {
    element: "Ogień",
    trigram: "Li (Ogień)",
    group: "Grupa Wschodnia",
    shengChi: "Wschód (E)",
    tianYi: "Południowy Wschód (SE)",
    yanNian: "Północ (N)",
    fuWei: "Południe (S)",
    inauspicious: ["Północny Zachód (Jue Ming)", "Zachód (Wu Gui)", "Południowy Zachód (Liu Sha)", "Północny Wschód (Huo Hai)"],
    bedAdvice: "Głowa skierowana na Południowy Wschód (Zdrowie) lub Wschód. Unikać głowy na Północny Zachód.",
    deskAdvice: "Biurko skierowane na Wschód lub Południe.",
    yearlyAdvice: "W okresie 9 (2024-2043) Li Gua ma dominujący wpływ; dbaj o czystość energetyczną strefy Południowej."
  }
};

/**
 * Oblicza liczbę Kua i profil energetyczny na podstawie daty urodzenia i płci.
 */
export function calculateKua(birthDateStr: string, gender: "male" | "female" | string = "male"): KuaResult | null {
  if (!birthDateStr) return null;

  const date = new Date(birthDateStr);
  if (isNaN(date.getTime())) return null;

  let year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // W kalendarzu solarnym chiński nowy rok rozpoczyna się ok. 4 lutego (Li Chun).
  // Osoby urodzone przed 4 lutego należą do poprzedniego roku solarnego.
  if (month === 1 || (month === 2 && day < 4)) {
    year -= 1;
  }

  const lastTwoDigits = year % 100;
  let sum = Math.floor(lastTwoDigits / 10) + (lastTwoDigits % 10);
  while (sum > 9) {
    sum = Math.floor(sum / 10) + (sum % 10);
  }

  const isFemale = String(gender).toLowerCase().includes("fem") || String(gender).toLowerCase().includes("kob") || String(gender).toLowerCase().includes("k");
  const isPost2000 = year >= 2000;

  let kua = 0;
  if (!isFemale) {
    // Mężczyzna
    kua = isPost2000 ? (9 - sum) : (10 - sum);
    while (kua <= 0) kua += 9;
    if (kua === 5) kua = 2; // Dla mężczyzn Kua 5 przechodzi w Kua 2
  } else {
    // Kobieta
    kua = isPost2000 ? (6 + sum) : (5 + sum);
    while (kua > 9) kua -= 9;
    if (kua === 5) kua = 8; // Dla kobiet Kua 5 przechodzi w Kua 8
  }

  const data = KUA_DATA[kua];
  if (!data) return null;

  return {
    kua,
    ...data
  };
}

/**
 * Oblicza ziemską gałąź i żywioł godziny urodzenia (Filar Godziny BaZi / 12 podwójnych godzin).
 */
export function calculateBaZiHourPillar(birthTime?: string): {
  animal: string;
  element: string;
  stemBranch: string;
  significance: string;
} | null {
  if (!birthTime || !birthTime.includes(":")) return null;

  const [hoursStr, minutesStr] = birthTime.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || "0", 10);
  if (isNaN(hours)) return null;

  const totalMinutes = hours * 60 + (isNaN(minutes) ? 0 : minutes);

  // 23:00 (1380m) - 01:00 (60m): Szczur (Zi)
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
    return {
      animal: "Szczur (Zi)",
      element: "Woda Yang",
      stemBranch: "Zi (Woda)",
      significance: "Strefa głębokiej intuicji, regeneracji nocnej i wnikliwości."
    };
  }
  if (totalMinutes < 3 * 60) {
    return {
      animal: "Wół (Chou)",
      element: "Ziemia Yin",
      stemBranch: "Chou (Ziemia)",
      significance: "Cierpliwość, stabilność wewnętrzna, odporność na stres."
    };
  }
  if (totalMinutes < 5 * 60) {
    return {
      animal: "Tygrys (Yin)",
      element: "Drewno Yang",
      stemBranch: "Yin (Drewno)",
      significance: "Inicjatywa, odwaga w planowaniu, wczesna witalność twórcza."
    };
  }
  if (totalMinutes < 7 * 60) {
    return {
      animal: "Królik (Mao)",
      element: "Drewno Yin",
      stemBranch: "Mao (Drewno)",
      significance: "Wrażliwość estetyczna, dbałość o detale i harmonię relacji."
    };
  }
  if (totalMinutes < 9 * 60) {
    return {
      animal: "Smok (Chen)",
      element: "Ziemia Yang",
      stemBranch: "Chen (Ziemia)",
      significance: "Wielkie ambicje, wizjonerstwo i wysoka energia życiowa."
    };
  }
  if (totalMinutes < 11 * 60) {
    return {
      animal: "Wąż (Si)",
      element: "Ogień Yin",
      stemBranch: "Si (Ogień)",
      significance: "Strategiczne myślenie, przenikliwość i skupienie analityczne."
    };
  }
  if (totalMinutes < 13 * 60) {
    return {
      animal: "Koń (Wu)",
      element: "Ogień Yang",
      stemBranch: "Wu (Ogień)",
      significance: "Szczytowa aktywność dzienna Yang, ekspresja i charyzma."
    };
  }
  if (totalMinutes < 15 * 60) {
    return {
      animal: "Koza (Wei)",
      element: "Ziemia Yin",
      stemBranch: "Wei (Ziemia)",
      significance: "Kreatywność, spokój, zamiłowanie do komfortu i sztuki."
    };
  }
  if (totalMinutes < 17 * 60) {
    return {
      animal: "Małpa (Shen)",
      element: "Metal Yang",
      stemBranch: "Shen (Metal)",
      significance: "Elastyczność, bystrość umysłu i szybka adaptacja do zmian."
    };
  }
  if (totalMinutes < 19 * 60) {
    return {
      animal: "Kogut (You)",
      element: "Metal Yin",
      stemBranch: "You (Metal)",
      significance: "Precyzja, porządek, analityczna skrupulatność i zmysł praktyczny."
    };
  }
  if (totalMinutes < 21 * 60) {
    return {
      animal: "Pies (Xu)",
      element: "Ziemia Yang",
      stemBranch: "Xu (Ziemia)",
      significance: "Lojalność, ochrona granic domowych i poczucie odpowiedzialności."
    };
  }
  // 21:00 - 23:00: Dzik (Hai)
  return {
    animal: "Dzik (Hai · 亥)",
    element: "Woda Yin",
    stemBranch: "Hai (Woda)",
    significance: "Wyciszenie, otwartość na wiedzę i regeneracja psychiczna."
  };
}

/**
 * Konwertuje kąt w stopniach (0-360°) na kierunek geograficzny kompasu.
 */
export function degToDirectionName(deg: number): { code: string; label: string; element: string } {
  const normalized = ((Math.round(deg) % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return { code: "N", label: "Północ (N)", element: "Woda" };
  if (normalized >= 22.5 && normalized < 67.5) return { code: "NE", label: "Północny Wschód (NE)", element: "Ziemia" };
  if (normalized >= 67.5 && normalized < 112.5) return { code: "E", label: "Wschód (E)", element: "Drewno" };
  if (normalized >= 112.5 && normalized < 157.5) return { code: "SE", label: "Południowy Wschód (SE)", element: "Drewno" };
  if (normalized >= 157.5 && normalized < 202.5) return { code: "S", label: "Południe (S)", element: "Ogień" };
  if (normalized >= 202.5 && normalized < 247.5) return { code: "SW", label: "Południowy Zachód (SW)", element: "Ziemia" };
  if (normalized >= 247.5 && normalized < 292.5) return { code: "W", label: "Zachód (W)", element: "Metal" };
  return { code: "NW", label: "Północny Zachód (NW)", element: "Metal" };
}

/**
 * Określa strefę Siatki 9 Pałaców Bagua (Luo Shu) oraz roczny wpływ gwiazd w 2026 roku.
 */
export function getBaguaSectorForPoint(xPercent: number, yPercent: number, northAngle = 0): {
  code: string;
  name: string;
  element: string;
  trigram: string;
  annual2026Star: string;
  annualAdvice: string;
} {
  // Przeliczenie współrzędnych 3x3
  const col = Math.min(2, Math.max(0, Math.floor((xPercent / 100) * 3)));
  const row = Math.min(2, Math.max(0, Math.floor((yPercent / 100) * 3)));

  // Domyślna siatka rzutu (top-left do bottom-right)
  const defaultGrid = [
    ["NW", "N", "NE"],
    ["W", "CENTER", "E"],
    ["SW", "S", "SE"]
  ];

  const rawCode = defaultGrid[row][col];
  if (rawCode === "CENTER") {
    return {
      code: "CENTER",
      name: "Centrum (Tai Qi) · Serce Domu",
      element: "Ziemia",
      trigram: "Tai Qi",
      annual2026Star: "Roczna Gwiazda 3 Jadeitowa (Drewno)",
      annualAdvice: "W 2026 roku w centrum domu zaleca się unikanie głośnych prac remontowych. Wprowadź akcent Ognia (ciepłe światło 2700K), aby zneutralizować drażliwe Drewno 3."
    };
  }

  // Uwzględnienie obrotu północy
  const compassMap: Record<string, { name: string; element: string; trigram: string; star: string; advice: string }> = {
    N: {
      name: "Północ · Kariera i droga życiowa",
      element: "Woda",
      trigram: "Kan (Woda)",
      star: "Sui Po (Rozbijacz Roku) & Gwiazda 8 (Ziemia)",
      advice: "W 2026 roku strefa Północna wymaga ciszy. Śpij z wezgłowiem stabilnym, unikaj ciężkich wyburzeń w tym sektorze."
    },
    NE: {
      name: "Północny Wschód · Wiedza i spokój umysłu",
      element: "Ziemia",
      trigram: "Gen (Góra)",
      star: "Gwiazda 5 Żółta (Wu Wang)",
      advice: "W 2026 roku sektor NE gości gwiazdę 5 Żółtą. Bezwzględnie wycisz ten obszar, unikaj świec/czerwieni, zastosuj remedium Metalowe lub dźwięk dzwonków."
    },
    E: {
      name: "Wschód · Zdrowie i rodzina",
      element: "Drewno",
      trigram: "Zhen (Grzmot)",
      star: "Gwiazda 1 Biała (Zwycięstwo & Mądrość)",
      advice: "Sektor Wschodni jest w 2026 roku bardzo korzystny dla rozwoju i regeneracji. Sprzyja odpoczynkowi i nauce."
    },
    SE: {
      name: "Południowy Wschód · Bogactwo i obfitość",
      element: "Drewno",
      trigram: "Xun (Wiatr)",
      star: "Gwiazda 9 Fioletowa (Główny Dobrobyt Okresu 9)",
      advice: "Jeden z najsilniejszych sektorów w 2026 roku. Doskonałe miejsce na salon, gabinet lub aktywne rośliny biofilne."
    },
    S: {
      name: "Południe · Sława i uznanie",
      element: "Ogień",
      trigram: "Li (Ogień)",
      star: "Tai Sui (Władca Roku 2026 - Rok Konia)",
      advice: "W 2026 roku Tai Sui rezyduje na Południu. Nie siadaj twarzą bezpośrednio naprzeciw Południa (nie konfrontuj Tai Sui), lecz miej Południe za plecami jako oparcie."
    },
    SW: {
      name: "Południowy Zachód · Relacje i partnerstwo",
      element: "Ziemia",
      trigram: "Kun (Ziemia)",
      star: "Gwiazda 2 Czarna (Choroba)",
      advice: "W 2026 roku w sektorze SW zaleca się wzmocnienie odporności i dodanie akcentów Metalowych (np. mosiężna lampa, jasne tkaniny)."
    },
    W: {
      name: "Zachód · Dzieci i kreatywność",
      element: "Metal",
      trigram: "Dui (Jezioro)",
      star: "Gwiazda 6 Biała (Autorytet Niebiański)",
      advice: "Sektor Zachodni sprzyja w 2026 roku podejmowaniu strategicznych decyzji zawodowych i dyscyplinie pracy."
    },
    NW: {
      name: "Północny Zachód · Pomocni ludzie i podróże",
      element: "Metal",
      trigram: "Qian (Niebo)",
      star: "Gwiazda 4 Zielona (Edukacja & Romans)",
      advice: "Bardzo sprzyjający sektor dla gabinetu, nauki, pisania i budowania kontaktów partnerskich."
    }
  };

  const info = compassMap[rawCode] || compassMap.N;
  return {
    code: rawCode,
    name: info.name,
    element: info.element,
    trigram: info.trigram,
    annual2026Star: info.star,
    annualAdvice: info.advice
  };
}

export type ResidentEvaluationResult = {
  name: string;
  role: string;
  kua: number;
  group: string;
  element: string;
  assignedFurnitureLabel: string;
  currentFacingDirection: string;
  currentFacingDegrees: number;
  currentSector: string;
  isDirectionFavorable: boolean;
  directionQualityName: string; // np. "Tian Yi (Zdrowie)", "Huo Hai (Przeszkody)"
  annualStar2026: string;
  evaluationVerdict: string;
  correctionRecommendation: string;
};

/**
 * Przeprowadza konkretną ocenę FAKTYCZNEGO ustawienia łóżka/biurka domownika na rzucie.
 */
export function evaluateResidentPlacement(
  resident: { label: string; role?: string; birthDate?: string; gender?: string; birthTime?: string },
  marker: { label: string; facingDeg?: number | null; xPercent: number; yPercent: number } | undefined,
  northAngle = 0
): ResidentEvaluationResult {
  const rawKua = resident.birthDate ? calculateKua(resident.birthDate, resident.gender || "male") : null;
  const activeKua = rawKua || { kua: 1, ...KUA_DATA[1] };
  const hourPillar = resident.birthTime ? calculateBaZiHourPillar(resident.birthTime) : null;

  const facingDeg = marker?.facingDeg ?? 0;
  // Obliczenie rzeczywistego kierunku kompasowego z uwzględnieniem północy rzutu
  const trueCompassDeg = ((facingDeg + northAngle) % 360 + 360) % 360;
  const currentDir = degToDirectionName(trueCompassDeg);
  const currentSector = marker ? getBaguaSectorForPoint(marker.xPercent, marker.yPercent, northAngle) : getBaguaSectorForPoint(50, 50, northAngle);

  // Sprawdzenie zgodności kierunku z Kua
  const shengChiCode = activeKua.shengChi.match(/\(([A-Z]+)\)/)?.[1] || "";
  const tianYiCode = activeKua.tianYi.match(/\(([A-Z]+)\)/)?.[1] || "";
  const yanNianCode = activeKua.yanNian.match(/\(([A-Z]+)\)/)?.[1] || "";
  const fuWeiCode = activeKua.fuWei.match(/\(([A-Z]+)\)/)?.[1] || "";

  let isFavorable = false;
  let dirQuality = "Kierunek neutralny / do weryfikacji";

  if (currentDir.code === tianYiCode) {
    isFavorable = true;
    dirQuality = "Tian Yi (Doktor Niebios · zdrowie, regeneracja i spokojny sen)";
  } else if (currentDir.code === shengChiCode) {
    isFavorable = true;
    dirQuality = "Sheng Qi (Generowanie Energii · sukces finansowy i witalność)";
  } else if (currentDir.code === yanNianCode) {
    isFavorable = true;
    dirQuality = "Yan Nian (Długowieczność · harmonia małżeńska i relacje)";
  } else if (currentDir.code === fuWeiCode) {
    isFavorable = true;
    dirQuality = "Fu Wei (Stabilność · wewnętrzny spokój i koncentracja)";
  } else {
    // Niekorzystne
    isFavorable = false;
    const matchedInauspicious = activeKua.inauspicious.find((ina) => ina.includes(`(${currentDir.code})`));
    if (matchedInauspicious) {
      dirQuality = `Kierunek niekorzystny: ${matchedInauspicious}`;
    } else {
      dirQuality = `Kierunek poza grupą pomyślną ${activeKua.group}`;
    }
  }

  const isBed = marker?.label === "Łóżko";
  const isDesk = marker?.label === "Biurko";

  let verdict = "";
  let correction = "";

  if (isBed) {
    if (isFavorable) {
      verdict = `Wezgłowie łóżka skierowane na ${currentDir.label} jest w 100% zgodne z osobistym Kua ${activeKua.kua} (${dirQuality}). Zapewnia optymalną regenerację fazy REM i witalność biologiczną.`;
      correction = `Utrzymaj obecny kierunek wezgłowia (${currentDir.label}). Zadbaj o pełne oparcie ściany za głową (Czarny Żółw) i brak ostrego światła.`;
    } else {
      verdict = `Wezgłowie łóżka skierowane na ${currentDir.label} koliduje z osobistym profilem Kua ${activeKua.kua} (${dirQuality}). Może powodować płytki sen, mikrowybudzenia lub poranne zmęczenie.`;
      correction = `Zalecana korekta: obróć wezgłowie łóżka w stronę ${activeKua.tianYi} (optymalne dla zdrowia i regeneracji) lub ${activeKua.fuWei} (spokój psychiczny).`;
    }
  } else if (isDesk) {
    if (isFavorable) {
      verdict = `Wzrok przy biurku skierowany na ${currentDir.label} jest w pełni zgodny z osobistym Kua ${activeKua.kua} (${dirQuality}). Sprzyja jasności umysłu, skutecznym decyzjom i sukcesom finansowym.`;
      correction = `Bardzo dobre ustawienie kompasowe. Upewnij się, że zachowana jest równocześnie Szkoła Formy (pełna ściana za plecami, widok na wejście).`;
    } else {
      verdict = `Kierunek pracy przy biurku (${currentDir.label}) znajduje się w strefie osłabiającej Kua ${activeKua.kua} (${dirQuality}), co może sprzyjać rozpraszaniu uwagi i zmęczeniu decyzyjnemu.`;
      correction = `Zalecany obrót biurka: dla zarobków i biznesu wybierz kierunek Sheng Chi (${activeKua.shengChi}), natomiast do głębokiej pracy analitycznej i nauki wybierz Fu Wei (${activeKua.fuWei}).`;
    }
  } else {
    verdict = `Mebel w sektorze ${currentSector.name} oddziałuje na domownika energią ${currentSector.element}.`;
    correction = `Zadbaj o równowagę 5 żywiołów w tej strefie.`;
  }

  // Wypośrodkowanie (Forma vs Kua) & Roczne zakazy 2026
  const annualAfflictionNotice = `Roczne wpływy przestrzenne w 2026 roku:
• Tai Sui (Władca Roku): Sektor Południowy (S, 180°). Unikaj siedzenia twarzą bezpośrednio do Południa (zakaz konfrontacji z Tai Sui). Miej Południe za plecami dla oparcia. Zakaz wiercenia i remontów w S.
• Sui Po (Rozbijacz Roku): Sektor Północny (N, 0°). Unikaj hałasu i intensywnego przebywania.
• 5 Żółta (Wu Wang): Sektor Północno-Wschodni (NE). Strefa bezwzględnego wyciszenia – unikaj spania w NE, zakaz świec/ognia, zastosuj remedium metalowe (mosiądz/dzwonki).
• 2 Czarna (Gwiazda Chorób): Sektor Południowo-Zachodni (SW). Chroń zdrowie i układ pokarmowy elementem Metalu.`;

  const workDirectionsGuide = `Najlepsze kierunki i sektory do pracy dla Kua ${activeKua.kua}:
• Generowanie dochodów & Strategia (Sheng Chi): ${activeKua.shengChi}
• Głęboka koncentracja, pisanie & analityka (Fu Wei): ${activeKua.fuWei}
• Relacje biznesowe, negocjacje & partnerstwo (Yan Nian): ${activeKua.yanNian}
• Regeneracja i odporność (Tian Yi): ${activeKua.tianYi}`;

  const balancingPhilosophy = `Zasada Wypośrodkowania (Forma vs Kompas):
Zasada Szkoły Formy (solidna ściana za plecami + kontrola wzrokowa nad wejściem) MA PIERWSZEŃSTWO przed kierunkiem kompasowym. Siedzenie tyłem do drzwi tylko po to, by patrzeć w kierunek Sheng Chi, wywołuje podświadomy stres układu nerwowego. Jeśli geometria pokoju nie pozwala patrzeć w Sheng Chi przy ścianie za plecami, wybierz inny sprzyjający kierunek (Fu Wei lub Yan Nian) pod lekkim kątem lub ustaw biurko w sprzyjającym sektorze pokoju.`;

  if (hourPillar) {
    verdict += `\n[Filar Godziny BaZi: ${hourPillar.animal} · ${hourPillar.significance}]`;
  }

  return {
    name: resident.label,
    role: resident.role || "Domownik",
    kua: activeKua.kua,
    group: activeKua.group,
    element: activeKua.element,
    assignedFurnitureLabel: marker?.label || "Brak przypisanego mebla",
    currentFacingDirection: currentDir.label,
    currentFacingDegrees: trueCompassDeg,
    currentSector: currentSector.name,
    isDirectionFavorable: isFavorable,
    directionQualityName: dirQuality,
    annualStar2026: `${currentSector.annual2026Star}: ${currentSector.annualAdvice}\n${annualAfflictionNotice}`,
    evaluationVerdict: `${verdict}\n\n${workDirectionsGuide}\n\n${balancingPhilosophy}`,
    correctionRecommendation: correction
  };
}

