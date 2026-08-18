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
    trigram: "Kan (坎)",
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
    trigram: "Kun (坤)",
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
    trigram: "Zhen (震)",
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
    trigram: "Xun (巽)",
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
    trigram: "Qian (乾)",
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
    trigram: "Dui (兌)",
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
    trigram: "Gen (艮)",
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
    trigram: "Li (離)",
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
    while (kua > 9) kua -= 9;
    if (kua === 5) kua = 2; // Dla mężczyzny Kua 5 przechodzi w Kun (2)
  } else {
    // Kobieta
    kua = isPost2000 ? (sum + 6) : (sum + 5);
    while (kua > 9) {
      kua = Math.floor(kua / 10) + (kua % 10);
    }
    if (kua === 5) kua = 8; // Dla kobiety Kua 5 przechodzi w Gen (8)
  }

  const data = KUA_DATA[kua] || KUA_DATA[1];
  return {
    kua,
    ...data
  };
}
