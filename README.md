# Dante

Eenvoudige cursuswebsite op [Aurora CMS](https://aurora.joostvanleeuwaarden.com/docs): aanmelden tot het maximum, en aanwezigheid per cursusdag door de docent.

## Functies

- Overzicht van Italiaanse cursussen (`season`, `level`, gekoppelde docent)
- Docentenlijst en -detail (`teacher`)
- Aanmelden per cursus zolang er plek is
- Docent-login met PIN → checklist per cursusdag

## Vereisten

- Node.js 22+
- Aurora-account met `siteKey` en Management token (`aur_…`)

## Lokaal starten

```bash
cp .env.example .env.local
# vul tokens / PIN in

npm install
npm run provision
npm run dev
```

Open [http://localhost:3002](http://localhost:3002). Docent: `/docent` met `TEACHER_PIN`.

## Deploy op Vercel (via GitHub)

1. Push deze repo naar [github.com/joostvanl/Dante](https://github.com/joostvanl/Dante).
2. In [vercel.com](https://vercel.com): **Add New Project** → import `joostvanl/Dante`.
3. Framework: Next.js (auto). Root directory: `.`
4. Zet deze **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_CMS_API_URL` | `https://aurora-api.joostvanleeuwaarden.com` |
| `NEXT_PUBLIC_CMS_SITE_KEY` | je site key |
| `CMS_MANAGEMENT_TOKEN` | `aur_…` (server-only) |
| `TEACHER_PIN` | docent-PIN |
| `TEACHER_SESSION_SECRET` | lange willekeurige string |

5. Deploy. Noteer de URL (bijv. `https://dante-….vercel.app`).
6. CORS in Aurora: zet `PUBLIC_SITE_ORIGIN=https://jouw-vercel-url` en run `npm run provision`, of voeg de origin toe in Admin → Website → Allowed origins.

## Content model (Aurora)

| Type | Rol |
|------|-----|
| `site_settings` | Globale settings — entry `default` (`heroImage`, `heroTitle`, `heroLead`) |
| `course` | Cursussen (`title`, `description`, `maxParticipants`, `enrollmentOpen`, `teacherSlug`, `season`, `level`) |
| `teacher` | Docenten (`name`, `specialty`, `bio`, `email`, `phone`) |
| `course_day` | Cursusdagen (`courseSlug` koppelt aan een cursus) |
| `enrollee` | Inschrijvers (slug `{email}-for-{courseSlug}` koppelt aan een cursus) |
| `attendance` | Aanwezigheid (slug `{enrollee}-at-{day}`) |

Routes: `/`, `/cursus/[slug]`, `/docenten`, `/docenten/[slug]`, `/aanmelden?cursus=…`, `/docent`.

Provision is idempotent: `npm run provision`.

## Raspberry Pi (Docker)

Op de Pi (64-bit OS + Docker):

```bash
cp .env.example .env
# vul env in

docker compose up -d --build
```

Alleen de Next.js-app draait op de Pi; Aurora blijft hosted. Zet na deploy je publieke origin:

```bash
PUBLIC_SITE_ORIGIN=https://jouw-domein.example npm run provision
```

## Omgevingsvariabelen

| Variabele | Waar | Doel |
|-----------|------|------|
| `NEXT_PUBLIC_CMS_API_URL` | client + server | Aurora API |
| `NEXT_PUBLIC_CMS_SITE_KEY` | client + server | Publiek lezen |
| `CMS_MANAGEMENT_TOKEN` | server only | Schrijven (inschrijven / aanwezigheid) |
| `TEACHER_PIN` | server only | Docent-login |
| `TEACHER_SESSION_SECRET` | server only | Cookie-handtekening |
