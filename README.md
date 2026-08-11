# onelystopp

Frontend for the onelystopp revision platform — question bank, PYQ mixes, AI exams, answer marking, diagrams, interview practice, and progress tools.

## Stack

- Vite + React + TypeScript
- React Router
- Design system matched to the Uxcel-inspired reference in `public/inspiration-uxcel.png`

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Deploy to Netlify

Vercel Hobby cannot deploy private GitHub **organization** repos. Use Netlify instead (free).

### Option A — Netlify Dashboard

1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Import `OnelyStop/frontend` from GitHub
3. Build command: `npm run build` · Publish directory: `dist`
4. Deploy (`netlify.toml` in the repo already configures SPA redirects)

### Option B — Netlify CLI

```bash
npm i -g netlify-cli
npm run build
netlify login
netlify init
netlify deploy --prod
```

## Deploy to Vercel (requires Pro for private org repos)

This repo also includes `vercel.json`. Import `OnelyStop/frontend` on a **Pro** team, or transfer/mirror the repo under a personal GitHub account to use Hobby.

## Feature routes

| Route | Feature |
| --- | --- |
| `/` | Home study path |
| `/question-bank` | Question bank |
| `/past-papers` | Past paper finder |
| `/pyq-mix` | PYQ mix generator |
| `/ai-exams` | AI-curated exams |
| `/theory` | Theory & tricks |
| `/revision` | Revision guide |
| `/marker` | Answer / Essay / Long Answer Marker |
| `/diagrams` | Diagram generator |
| `/interview` | AI Interview |
| `/tutor` | AI tutor |
| `/progress` | Progress tracker |
| `/memory` | A* memory |
| `/notes` | Sticky notes |
