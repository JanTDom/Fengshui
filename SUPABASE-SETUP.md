# Supabase setup

Projekt Supabase został utworzony i połączony z Vercel przez zmienne `VITE_*`.

- Project: `plan-harmonii`
- Project ref: `xvgxhquhwxssgpzkcfsp`
- Region: `eu-central-1`
- API URL: `https://xvgxhquhwxssgpzkcfsp.supabase.co`

## Zmienne środowiskowe

Vercel ma ustawione publiczne zmienne Supabase dla `Production`, `Preview` i `Development`.
Sekret Gemini jest ustawiony w Vercel dla `Production` i `Preview` jako `Sensitive`; lokalnie dodaj go do `.env.local`, jeśli chcesz testować realne generowanie przez `vercel dev`.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.7-flash
```

Nie używaj `service_role` ani secret key w frontendzie. Do frontu używamy publishable key `sb_publishable_...`, a nie legacy service key.
`GEMINI_API_KEY` jest zmienną serwerową dla Vercel Function i nie może mieć prefiksu `VITE_`.

## Migracje

Migracje znajdują się w:

```text
supabase/migrations/0001_plan_harmonii_core.sql
supabase/migrations/0002_plan_harmonii_fk_indexes.sql
```

`0001` tworzy tabele:

- `audit_purchases`
- `audit_projects`
- `audit_files`
- `audit_reports`
- `leads`

Wszystkie tabele mają włączone RLS. Dane audytów, plików i raportów są widoczne tylko dla właściciela. Leady mogą być dodawane anonimowo, ale nie są publicznie odczytywane.

`0002` dodaje indeksy pod klucze obce wskazane przez Supabase performance advisor.

`20260815190903_audit_intake_public_mvp` dodaje:

- `audit_intakes` - anonimowy zapis zgłoszenia audytu, plików i wyniku raportu bez publicznego odczytu;
- bucket `floor-plans` - prywatne plany PDF/PNG/JPG/WEBP do 10 MB;
- bucket `report-pdfs` - prywatne PDF-y raportów do 10 MB;
- RLS dla storage oparty o pierwszy segment ścieżki równy `auth.uid()`.

## Storage

W pełnej wersji używamy prywatnych bucketów:

- `floor-plans`
- `report-pdfs`

Pliki planów mieszkań/domów należy traktować jako dane wrażliwe. Dostęp powinien iść przez ścieżki z `user_id` oraz podpisane URL-e albo przez Edge Function.

Buckety są już utworzone w Supabase. W obecnym MVP frontend przesyła plik inline do Vercel Function, a `audit_intakes` zapisuje metadane i raport. Kolejny krok produkcyjny to przełączenie większych plików na upload do `floor-plans` i analizę przez podpisany URL albo Gemini Files API.
