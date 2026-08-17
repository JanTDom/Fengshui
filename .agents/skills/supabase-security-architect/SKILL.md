---
name: supabase-security-architect
description: Security framework for Supabase PostgreSQL, Row Level Security (RLS) policies, Private Storage bucket signed URL generation, and key segregation.
---

# Bezpieczeństwo Supabase & Architektura RLS

Ten moduł standaryzuje bezpieczeństwo bazy danych PostgreSQL, separację uprawnień oraz ochronę prywatnych plików rzutów mieszkań i wygenerowanych raportów PDF.

---

## 1. Separacja kluczy i ról dostępowych

1. **Frontend (`VITE_SUPABASE_PUBLISHABLE_KEY`)**:
   * Używa wyłącznie publicznego/anonimowego klucza `anon` / `publishable`.
   * Posiada dostęp WYŁĄCZNIE przez polityki RLS.
   * Całkowity zakaz umieszczania `service_role` w kodzie frontendu.
2. **Serverless Functions (`SUPABASE_SERVICE_ROLE_KEY` na Vercel)**:
   * Używany tylko w środowisku Node.js do zadań administracyjnych (webhooki płatności, automatyczne generowanie PDF, czyszczenie starych rzutów).

---

## 2. Architektura Row Level Security (RLS)

Zasady bezpieczeństwa w plikach migracji [supabase/migrations/](file:///Users/macbookpro/Documents/ChatGPT/FENG%20SHUI/supabase/migrations/):

```sql
-- Dostęp do audytów tylko dla zalogowanego właściciela
ALTER TABLE audit_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own projects"
ON audit_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own projects"
ON audit_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Anonimowy koszyk i zbieranie leadów (`audit_intakes` & `leads`):
* Pozwala na `INSERT` dla użytkowników anonimowych bez logowania.
* Całkowicie blokuje publiczny `SELECT` – nikt z zewnątrz nie może podejrzeć listy leadów ani cudzych zgłoszeń.

---

## 3. Bezpieczeństwo Storage (Bucket `floor-plans` i `report-pdfs`)

1. **Prywatne buckety**: Wszystkie pliki rzutów mieszkań są domyślnie prywatne (`public = false`).
2. **Podpisane adresy URL (Signed URLs)**:
   * Dostęp do pliku raportu PDF lub rzutu odbywa się wyłącznie przez wygasający URL wygenerowany przez Supabase SDK:
     ```typescript
     const { data } = await supabase.storage
       .from('report-pdfs')
       .createSignedUrl(`reports/${reportId}.pdf`, 3600); // Wygasa po 1h
     ```
3. **Izolacja katalogów w Storage**:
   * Ścieżki w buckecie są prefiksowane identyfikatorem użytkownika (`${userId}/${fileId}.png`).
