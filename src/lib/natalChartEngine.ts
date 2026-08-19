// Silnik Obliczeniowy Wykresu Urodzeniowego Budynku (Xuan Kong Fei Xing / Latające Gwiazdy)
import type { BuildingNatalChart, NatalPalace } from "../auditTypes";

export type BuildingPeriodInfo = {
  period: number;
  name: string;
  range: string;
  element: string;
  trigram: string;
  rulingEnergy: string;
};

export const PERIOD_DEFINITIONS: Record<number, BuildingPeriodInfo> = {
  1: { period: 1, name: "Okres 1", range: "1864–1883", element: "Woda", trigram: "Kan (Woda)", rulingEnergy: "Początek cyklu, energia Wody i dalekosiężnej mądrości." },
  2: { period: 2, name: "Okres 2", range: "1884–1903", element: "Ziemia", trigram: "Kun (Ziemia)", rulingEnergy: "Energia Ziemi matczynej, płodności i nieruchomości." },
  3: { period: 3, name: "Okres 3", range: "1904–1923", element: "Drewno", trigram: "Zhen (Grzmot)", rulingEnergy: "Energia dynamicznego wzrostu, innowacji i ekspansji." },
  4: { period: 4, name: "Okres 4", range: "1924–1943", element: "Drewno", trigram: "Xun (Wiatr)", rulingEnergy: "Energia edukacji, sztuki, kultury i komunikacji." },
  5: { period: 5, name: "Okres 5", range: "1944–1963", element: "Ziemia", trigram: "Tai Qi (Centrum)", rulingEnergy: "Centralny okres wielkich przemian i odbudowy." },
  6: { period: 6, name: "Okres 6", range: "1964–1983", element: "Metal", trigram: "Qian (Niebo)", rulingEnergy: "Energia autorytetu, prawa, dyscypliny i stabilnych struktur." },
  7: { period: 7, name: "Okres 7", range: "1984–2003", element: "Metal", trigram: "Dui (Jezioro)", rulingEnergy: "Energia handlu, wymiany informacji, radości i mediów." },
  8: { period: 8, name: "Okres 8", range: "2004–2023", element: "Ziemia", trigram: "Gen (Góra)", rulingEnergy: "Energia młodości, rozwoju technologii, wiedzy i nieruchomości." },
  9: { period: 9, name: "Okres 9", range: "2024–2043", element: "Ogień", trigram: "Li (Ogień)", rulingEnergy: "Obecny 20-letni cykl: transformacja, technologie AI, widoczność, uduchowienie i jasność." }
};

export function getBuildingPeriod(yearStr?: string | number): BuildingPeriodInfo {
  const year = Number(yearStr);
  if (!Number.isFinite(year) || year <= 0) {
    // Domyślnie budynek współczesny (Okres 8 lub 9)
    return PERIOD_DEFINITIONS[8];
  }

  if (year >= 2024) return PERIOD_DEFINITIONS[9];
  if (year >= 2004) return PERIOD_DEFINITIONS[8];
  if (year >= 1984) return PERIOD_DEFINITIONS[7];
  if (year >= 1964) return PERIOD_DEFINITIONS[6];
  if (year >= 1944) return PERIOD_DEFINITIONS[5];
  if (year >= 1924) return PERIOD_DEFINITIONS[4];
  if (year >= 1904) return PERIOD_DEFINITIONS[3];
  if (year >= 1884) return PERIOD_DEFINITIONS[2];
  return PERIOD_DEFINITIONS[1];
}

// 8 Kierunków w matrycy Luo Shu
const PALACE_CODES = [
  { code: "N", direction: "Północ", element: "Woda", palaceBase: 1 },
  { code: "NE", direction: "Północny wschód", element: "Ziemia", palaceBase: 8 },
  { code: "E", direction: "Wschód", element: "Drewno", palaceBase: 3 },
  { code: "SE", direction: "Południowy wschód", element: "Drewno", palaceBase: 4 },
  { code: "S", direction: "Południe", element: "Ogień", palaceBase: 9 },
  { code: "SW", direction: "Południowy zachód", element: "Ziemia", palaceBase: 2 },
  { code: "W", direction: "Zachód", element: "Metal", palaceBase: 7 },
  { code: "NW", direction: "Północny zachód", element: "Metal", palaceBase: 6 },
  { code: "C", direction: "Centrum (Tai Qi)", element: "Ziemia", palaceBase: 5 }
];

// Mapowanie gwiazd dla okresów i orientacji
export function calculateBuildingNatalChart(
  constructionYearStr?: string,
  renovationYearStr?: string,
  facingAngleDeg = 180
): BuildingNatalChart {
  const effectiveYear = renovationYearStr && Number(renovationYearStr) > Number(constructionYearStr || 0)
    ? renovationYearStr
    : constructionYearStr;

  const periodInfo = getBuildingPeriod(effectiveYear);
  const p = periodInfo.period;
  const normalizedFacing = ((Math.round(facingAngleDeg) % 360) + 360) % 360;

  // Wyznaczenie kierunku fasady
  let facingDirName = "Południe (S)";
  let sittingDirName = "Północ (N)";

  if (normalizedFacing >= 338 || normalizedFacing < 23) {
    facingDirName = "Północ (N)";
    sittingDirName = "Południe (S)";
  } else if (normalizedFacing < 68) {
    facingDirName = "Północny Wschód (NE)";
    sittingDirName = "Południowy Zachód (SW)";
  } else if (normalizedFacing < 113) {
    facingDirName = "Wschód (E)";
    sittingDirName = "Zachód (W)";
  } else if (normalizedFacing < 158) {
    facingDirName = "Południowy Wschód (SE)";
    sittingDirName = "Północny Zachód (NW)";
  } else if (normalizedFacing < 203) {
    facingDirName = "Południe (S)";
    sittingDirName = "Północ (N)";
  } else if (normalizedFacing < 248) {
    facingDirName = "Południowy Zachód (SW)";
    sittingDirName = "Północny Wschód (NE)";
  } else if (normalizedFacing < 293) {
    facingDirName = "Zachód (W)";
    sittingDirName = "Wschód (E)";
  } else {
    facingDirName = "Północny Zachód (NW)";
    sittingDirName = "Południowy Wschód (SE)";
  }

  // Obliczenie gwiazd w 9 pałacach (dla danego okresu i kierunku)
  // Wzory klasyczne Xuan Kong Fei Xing
  const palaces: NatalPalace[] = PALACE_CODES.map((item) => {
    let mountainStar = ((p + item.palaceBase - 1) % 9) || 9;
    let waterStar = ((p + (10 - item.palaceBase) - 1) % 9) || 9;
    const baseStar = item.palaceBase;

    // Specjalne dopasowanie dla fasady i tyłu
    if (item.direction.includes(facingDirName.split(" ")[0])) {
      waterStar = p === 9 ? 9 : (p === 8 ? 8 : 9);
      mountainStar = (p === 9 ? 1 : (p === 8 ? 8 : 7));
    } else if (item.direction.includes(sittingDirName.split(" ")[0])) {
      mountainStar = p === 9 ? 9 : (p === 8 ? 8 : 9);
      waterStar = (p === 9 ? 1 : (p === 8 ? 8 : 7));
    }

    const isProsperousWater = waterStar === 9 || waterStar === 1 || waterStar === 8;
    const isProsperousMountain = mountainStar === 9 || mountainStar === 1 || mountainStar === 8;
    const hasFiveYellow = mountainStar === 5 || waterStar === 5 || baseStar === 5;
    const hasTwoBlack = mountainStar === 2 || waterStar === 2;

    let healthDesc = `Gwiazda Górska ${mountainStar}: `;
    if (isProsperousMountain) {
      healthDesc += "Wysoki potencjał witalny. Sektor znakomity na sypialnię główną lub strefę relaksu i budowania relacji.";
    } else if (mountainStar === 5) {
      healthDesc += "Wymaga ciszy i braku ciężkich prac remontowych. Wyciszaj energię minerałami lub metalem.";
    } else if (mountainStar === 2) {
      healthDesc += "Wskazana dbałość o sen i układ pokarmowy; unikaj czerwonych intensywnych barw.";
    } else {
      healthDesc += "Umiarkowana energia witalna; wspieraj naturalnym światłem i stonowaną kolorystyką.";
    }

    let wealthDesc = `Gwiazda Wodna ${waterStar}: `;
    if (isProsperousWater) {
      wealthDesc += "Główny sektor aktywności finansowej i rozwoju kariery. Idealny na wejście, salon lub strefę pracy Yang.";
    } else if (waterStar === 5) {
      wealthDesc += "Ryzyko zatorów finansowych przy nadmiernym hałasie. Zachowaj porządek i unikaj otwartego ognia.";
    } else {
      wealthDesc += "Stabilny przepływ; energia wymaga okresowego pobudzania ruchem i światłem.";
    }

    let remedy = "Harmonijny układ żywiołów.";
    if (hasFiveYellow) {
      remedy = "Wprowadź Żywioł Metalu (mosiądz, biel, obłe kształty), aby zneutralizować Gwiazdę 5 Żółtą.";
    } else if (hasTwoBlack) {
      remedy = "Zastosuj elementy Metalu i unikaj nadmiaru Ognia (świece, intensywna czerwień) w tym pałacu.";
    } else if (isProsperousWater) {
      remedy = "Wprowadź aktywność Yang: światło dzienne, roślinę o obłych liściach lub elegancką formę wodną.";
    }

    let period9Outlook = "W Okresie 9 (2024–2043) ";
    if (waterStar === 9 || mountainStar === 9) {
      period9Outlook += "sektor ten osiąga najwyższy poziom pomyślności w całym 20-letnim cyklu (Gwiazda Władcy Li).";
    } else if (waterStar === 1 || mountainStar === 1) {
      period9Outlook += "sektor ten niesie energię przyszłego pomyślnego wzrostu i nowych perspektyw.";
    } else {
      period9Outlook += "utrzymuje stabilny balans, wymagając jedynie regularnego wietrzenia i doświetlenia.";
    }

    return {
      direction: item.direction,
      code: item.code,
      mountain_star: mountainStar,
      base_star: baseStar,
      water_star: waterStar,
      nature: `${item.element} · Pałac ${item.palaceBase}`,
      health_relationships: healthDesc,
      wealth_career: wealthDesc,
      remedy_wu_xing: remedy,
      period9_outlook: period9Outlook
    };
  });

  const chartTypeName =
    p === 9
      ? "Wykres Okresu 9 (Li Gua – Ogień) z dominacją Gwiazdy 9 na Fasadzie"
      : p === 8
      ? "Wykres Okresu 8 (Gen Gua – Ziemia) w fazie transformacji Okresu 9"
      : `Wykres Urodzeniowy Okresu ${p} (${periodInfo.element})`;

  return {
    period: p,
    period_label: `${periodInfo.name} (${periodInfo.range}) · Żywioł ${periodInfo.element}`,
    period_element: periodInfo.element,
    construction_year: constructionYearStr || undefined,
    facing_direction: facingDirName,
    sitting_direction: sittingDirName,
    facing_angle_deg: normalizedFacing,
    chart_type: chartTypeName,
    summary: `Budynek wzniesiony/zamieszkany w ${periodInfo.name} (${periodInfo.range}) posiada unikalny zapis energetyczny Qi. Fasada skierowana na ${facingDirName} i tył na ${sittingDirName} determinują dystrybucję energii witalnej (Gwiazdy Górskie) i finansowej (Gwiazdy Wodne). Od 2024 roku budynek funkcjonuje w 20-letnim Okresie 9 (Li / Ogień), co wymaga aktywacji sektorów z Gwiazdą 9 i 1.`,
    palaces,
    period9_strategy: "W Okresie 9 (2024–2043) należy strategicznie przenieść główną aktywność domową i zawodową do sektorów z Gwiazdą 9 (najwyższy dobrostan) oraz Gwiazdą 1 (przyszłe szanse), wyciszając sektory ze starymi gwiazdami 5 i 2 przy pomocy żywiołu Metalu."
  };
}
