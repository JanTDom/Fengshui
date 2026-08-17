---
name: przelewy24-integrator
description: Specialized integration framework for Przelewy24 (P24) Polish payment gateway, REST API v1, BLIK one-click, Pay-by-link bank transfers, SHA-384 signature calculation, and webhook verification lifecycles.
---

# Przelewy24 (P24) Integration & BLIK Payment Framework

Ten moduł standaryzuje pełną integrację polskiej bramki płatności **Przelewy24 (P24)** – od rejestracji transakcji, przez płatności **BLIK**, po bezpieczną weryfikację webhooków i odblokowywanie raportów.

---

## 1. Architektura i Konfiguracja Środowisk

Przelewy24 operuje na dwóch niezależnych środowiskach:

| Parametr | Środowisko Testowe (Sandbox) | Środowisko Produkcyjne |
| :--- | :--- | :--- |
| **Panel administracyjny** | `https://sandbox.przelewy24.pl/panel` | `https://panel.przelewy24.pl` |
| **API Base URL** | `https://sandbox.przelewy24.pl/api/v1` | `https://secure.przelewy24.pl/api/v1` |
| **Adres bramki dla klienta** | `https://sandbox.przelewy24.pl/trnRequest/{token}` | `https://secure.przelewy24.pl/trnRequest/{token}` |

### Wymagane zmienne środowiskowe:
```bash
P24_MERCHANT_ID=123456
P24_POS_ID=123456
P24_API_KEY=twoj_klucz_api_z_panelu
P24_CRC_KEY=twoj_klucz_crc_do_podpisu_sha384
P24_IS_SANDBOX=true # false na produkcji
```

---

## 2. Rejestracja Transakcji (`/api/v1/transaction/register`)

Kwoty w Przelewy24 są **zawsze podawane w groszach jako integer** (np. `79 zł = 7900`).

### Algorytm obliczania sygnatury SHA-384:
Przed wysłaniem żądania należy wygenerować sumę kontrolną SHA-384 z ciągu JSON:
```text
{"sessionId":"{sessionId}","merchantId":{merchantId},"amount":{amount},"currency":"PLN","crc":"{P24_CRC_KEY}"}
```

### Przykładowy payload żądania:
```json
{
  "merchantId": 123456,
  "posId": 123456,
  "sessionId": "audit_c8f2a1b0-2026-08-17",
  "amount": 7900,
  "currency": "PLN",
  "description": "Plan Harmonii - Pełny Raport Feng Shui",
  "email": "klient@domena.pl",
  "country": "PL",
  "language": "pl",
  "urlReturn": "https://twojadomena.pl/audyt/wynik?session_id=audit_c8f2a1b0-2026-08-17",
  "urlStatus": "https://twojadomena.pl/api/webhooks/przelewy24",
  "sign": "obliczona_suma_sha384"
}
```
**Odpowiedź**: Przelewy24 zwraca `token`. Frontend przekierowuje użytkownika na `https://secure.przelewy24.pl/trnRequest/${token}` (lub otwiera natywną formatkę BLIK).

---

## 3. Bezpieczna Obsługa Webhooka (`/api/webhooks/przelewy24`)

Gdy klient zapłaci (np. kodem BLIK), Przelewy24 wysyła powiadomienie `POST` na `urlStatus`.

### 3-etapowy proces weryfikacji:
1. **Odebranie powiadomienia**:
   * Odczyt pól: `merchantId`, `posId`, `sessionId`, `amount`, `orderId`, `sign`.
2. **Weryfikacja podpisu przychodzącego**:
   * Obliczenie SHA-384 z:
     ```text
     {"merchantId":{merchantId},"posId":{posId},"sessionId":"{sessionId}","amount":{amount},"originAmount":{originAmount},"currency":"PLN","orderId":{orderId},"methodId":{methodId},"statement":"{statement}","crc":"{P24_CRC_KEY}"}
     ```
   * Porównanie z przekazanym polem `sign`.
3. **Potwierdzenie transakcji (Verify Call – `/api/v1/transaction/verify`)**:
   * Aplikacja wysyła `PUT /api/v1/transaction/verify` z wyliczonym podpisem SHA-384 dla potwierdzenia.
   * Po kodzie HTTP 200: zmiana statusu w bazie Supabase (`status: 'paid'`) i wygenerowanie/odblokowanie raportu.
   * Endpoint webhooka odpowiada statusem `HTTP 200 {"status": "OK"}`.

---

## 4. Natywna Płatność BLIK (In-App / One-Click)

Przelewy24 umożliwia wpisanie 6-cyfrowego kodu BLIK bezpośrednio na Twojej stronie bez opuszczania koszyka:
- Metoda płatności `method: 154` (BLIK).
- Przekazanie parametru `blikCode: "123456"` w żądaniu rejestracji.
- Użytkownik potwierdza transakcję w aplikacji swojego banku na telefonie w ciągu 60 sekund.
