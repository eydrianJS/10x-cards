# 🚀 Deployment na Vercel

## Setup (pierwsza konfiguracja)

### 1. Przygotowanie kodu

Kod jest już gotowy! Adapter Vercel skonfigurowany.

### 2. Konfiguracja Vercel

#### A. Utwórz konto na Vercel

1. Wejdź na: https://vercel.com/signup
2. Zaloguj się przez GitHub

#### B. Import projektu

1. Kliknij **"Add New Project"**
2. Wybierz swoje repozytorium: `10devs`
3. Vercel automatycznie wykryje Astro

#### C. Skonfiguruj Environment Variables

W ustawieniach projektu dodaj te zmienne (WAŻNE!):

```
PUBLIC_SUPABASE_URL=<twój_url>
PUBLIC_SUPABASE_ANON_KEY=<twój_klucz>
OPENROUTER_API_KEY=<twój_klucz_ai>
```

**Gdzie znaleźć te wartości:**

- Supabase: Settings → API → Project URL i anon/public key
- OpenRouter: https://openrouter.ai/keys

#### D. Deploy!

1. Kliknij **"Deploy"**
2. Poczekaj 1-2 minuty
3. Gotowe! 🎉

---

## Automatyczne deployments

### Jak to działa?

- **Push do `main`** → automatyczny deployment na produkcję
- **Pull Request** → deployment preview z unikalnym URL
- **Każdy commit** → możesz zobaczyć podgląd

### URL twojej aplikacji

```
https://[nazwa-projektu].vercel.app
```

---

## Konfiguracja Custom Domain (opcjonalne)

Jeśli masz własną domenę:

1. W Vercel → Settings → Domains
2. Dodaj swoją domenę (np. `moje-fiszki.pl`)
3. Skonfiguruj DNS zgodnie z instrukcjami Vercel
4. Gotowe! Automatyczne HTTPS ✨

---

## Monitoring i Logi

### Sprawdzanie deploymentów

1. Wejdź na https://vercel.com/dashboard
2. Wybierz projekt
3. Zakładka **"Deployments"** → wszystkie wersje
4. Kliknij deployment → **"Logs"** → szczegóły

### Analytics (włączone!)

- Vercel Web Analytics już skonfigurowane
- Zobacz statystyki ruchu w zakładce **"Analytics"**

---

## Troubleshooting

### Deployment failed?

1. Sprawdź logi w Vercel
2. Upewnij się że `npm run build` działa lokalnie:
   ```bash
   npm run build
   ```

### Environment variables

- Zmienne zaczynające się od `PUBLIC_` są dostępne w przeglądarce
- Inne zmienne (np. `OPENROUTER_API_KEY`) są bezpieczne na serwerze

### Build czas

- Darmowy plan: 6000 minut build time / miesiąc
- Typowy build tego projektu: ~1-2 minuty

---

## Komendy pomocne

```bash
# Sprawdź czy build działa lokalnie
npm run build

# Przetestuj production build lokalnie
npm run preview

# Push zmian (automatyczny deployment)
git push origin main
```

---

## Limity Free Plan

- ✅ 100 GB bandwidth / miesiąc
- ✅ 100 GB-hours serverless / miesiąc
- ✅ 6000 minut build time / miesiąc
- ✅ Nieograniczone deployments
- ✅ Nieograniczone projekty

**Dla tej aplikacji w zupełności wystarczy!** 🎯
