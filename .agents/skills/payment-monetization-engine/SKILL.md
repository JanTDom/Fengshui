---
name: payment-monetization-engine
description: Architecture for Polish & international digital payments (BLIK, Przelewy24, Stripe Checkout), webhook fulfillment lifecycle, and Polish consumer law compliance for instant digital delivery.
---

# Silnik Monetyzacji, Płatności i Zgodności Prawnej

Ten moduł standaryzuje integrację bramek płatności, obsługę transakcji oraz wymagania prawne sprzedaży treści cyfrowych w Polsce i UE.

---

## 1. Architektura Płatności (Stripe / Przelewy24 / BLIK)

Dla rynku polskiego płatność **BLIK** oraz szybkie przelewy bankowe (Pay-by-link) stanowią ponad 70% konwersji koszykowej.

### Cykl życia transakcji (Transaction Lifecycle):
1. **Inicjalizacja (Frontend)**: Użytkownik wybiera pakiet (np. *Pełny raport 79 zł*) -> zapytanie do endpointu `/api/create-checkout-session`.
2. **Sesja płatności (Hosted Checkout)**: Przekierowanie do bezpiecznej sesji Stripe / P24 z obsługą BLIK, Apple Pay, Google Pay, kart.
3. **Webhook Fulfillment (`/api/webhooks/stripe`)**:
   * Odbiór podpisanego zdarzenia `checkout.session.completed`.
   * Zmiana statusu zamówienia w tabeli `audit_purchases` w Supabase na `status: 'paid'`.
   * Natychmiastowe odblokowanie pełnego raportu PDF i wysyłka powiadomienia e-mail.

---

## 2. Zgodność z prawem konsumenckim w Polsce (Prawo Cyfrowe)

Dostarczanie natychmiastowego raportu AI / PDF wymaga spełnienia obowiązków ustawy o prawach konsumenta:

1. **Klauzula natychmiastowego spełnienia świadczenia**:
   * Obowiązkowy checkbox przy finalizacji zakupu:
     *„Wyrażam zgodę na dostarczenie raportu cyfrowego przed upływem terminu do odstąpienia od umowy i przyjmuję do wiadomości, że wraz z pełnym wykonaniem usługi tracę prawo do odstąpienia od umowy.”*
2. **Transparentność cenowa (Dyrektywa Omnibus)**:
   * Wyraźne podanie ceny brutto z podatkiem VAT oraz informacja o najniższej cenie z ostatnich 30 dni w przypadku promocji.
3. **Klauzula informacyjna RODO**:
   * Informacja o administratorze danych, celu przetwarzania pliku rzutu oraz okresie retencji danych.
