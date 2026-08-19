const faqs = [
  {
    q: "W jakim formacie mogę wgrać plan mieszkania lub domu?",
    a: "Obsługujemy pliki PDF (np. rzut deweloperski lub projekt architektoniczny), pliki graficzne JPG, PNG, WEBP oraz zdjęcia rzutu wykonane smartfonem."
  },
  {
    q: "Czy muszę znać dokładny kąt północy?",
    a: "Nie jest to wymagane na starcie. Możesz skorzystać z oznaczenia róży wiatrów na rzucie deweloperskim lub dopasować kierunek intuicyjnym suwakiem w aplikacji."
  },
  {
    q: "Co jeśli w rzucie brakuje niektórych mebli?",
    a: "W naszym dedykowanym Studio Planowania możesz w kilka sekund nanieść i obrócić precyzyjne symbole łóżek, biurek, sof, szaf i drzwi, aby przetestować różne ustawienia."
  },
  {
    q: "Jak szybko otrzymam raport po zakupie?",
    a: "Dostęp do Studia Planowania otrzymujesz natychmiast po opłaceniu (BLIK, P24, karta). Raport PDF generuje się w ciągu ok. 15–20 sekund od kliknięcia 'ANALIZUJ FENG SHUI'."
  },
  {
    q: "Czy e-fengshui.pl wymaga wprowadzania magicznych figurek czy dzwonków?",
    a: "Absolutnie nie. Nasz system łączy klasyczną Szkołę Formy (Luan Tou) i podział Bagua ze współczesną architekturą wnętrz, ergonomią, doświetleniem i psychologią środowiskową."
  },
  {
    q: "Czy mogę otrzymać fakturę VAT?",
    a: "Tak, wystawiamy faktury VAT dla firm i jednoosobowych działalności gospodarczych (architektów, projektantów, pośredników nieruchomości)."
  }
];

export function FaqSection() {
  return (
    <section className="mkt-faq-section" id="faq">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <span className="mkt-kicker">Często Zadawane Pytania</span>
          <h2>Wszystko, co warto wiedzieć przed analizą</h2>
          <p>
            Przejrzyste zasady działania, wymagania techniczne i metodologia e-fengshui.pl.
          </p>
        </div>

        <div className="mkt-faq-grid">
          {faqs.map((item) => (
            <article key={item.q} className="mkt-faq-card">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
