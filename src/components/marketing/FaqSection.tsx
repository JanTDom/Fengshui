import { ChevronRight } from "lucide-react";

const propertyFaqs = [
  {
    question: "Jak wygląda proces po opłaceniu dostępu?",
    answer:
      "Natychmiast po zatwierdzeniu zamówienia zostajesz przeniesiony do pełnoekranowego studia planistycznego (Workspace). Wgrywasz rzut w PDF, PNG lub JPG, nanosisz kluczowe meble i kierunek północy, a następnie jednym kliknięciem generujesz kompleksowy audyt Feng Shui z możliwością pobrania gotowego pliku PDF."
  },
  {
    question: "Czym różni się e-fengshui.pl od ogólnych poradników w internecie?",
    answer:
      "Nasz silnik analizuje Twój konkretny rzut z uwzględnieniem fizycznych osi ścian, okien, drzwi, proporcji pomieszczeń i kątów kompasu. Łączymy klasyczną Szkołę Formy (Luan Tou) i Bagua z nowoczesną ergonomią wnętrz, bez wprowadzania pseudonauki czy nierealistycznych obietnic."
  },
  {
    question: "Co jeśli nie znam dokładnej północy ani kąta kompasu?",
    answer:
      "W studiu możesz ustawić orientację ręcznie według kompasu w telefonie lub deweloperskiej róży wiatrów na rzucie. Jeśli dane są częściowe, system nadal w 100% poprawnie ocenia Szkołę Formy (bezpieczne pozycje łóżek, osie okno-drzwi, ciągi komunikacyjne)."
  },
  {
    question: "W jakim formacie mogę wgrać plan nieruchomości?",
    answer:
      "Obsługujemy pliki PDF (np. rzuty ze standardu deweloperskiego), pliki graficzne PNG, JPG, WEBP oraz zdjęcia prosto z iPhone w formacie HEIC/HEIF do 10 MB."
  },
  {
    question: "Jak działa pakiet porównania 3 nieruchomości (179 zł)?",
    answer:
      "Możesz wgrać do 3 różnych rzutów mieszkań przed zakupem. Silnik porównuje je w ustandaryzowanej skali 0–100 punktów, analizując doświetlenie, ustawność i łatwość adaptacji, tworząc tabelę decyzyjną ze wskazaniem najlepszego lokalu."
  }
];

export function FaqSection() {
  return (
    <section className="faq-section" id="faq">
      <div className="section-heading">
        <span className="section-kicker">Częste pytania</span>
        <h2>Wszystko, co warto wiedzieć przed startem</h2>
      </div>
      <div className="faq-list-clean">
        {propertyFaqs.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>
              <span>{item.question}</span>
              <ChevronRight className="faq-chevron" size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
