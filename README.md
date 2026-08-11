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

## Deploy to Vercel

This repo is Vercel-ready (`vercel.json` configures Vite build output and SPA rewrites for React Router).

### Option A — Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo `OnelyStop/frontend`
3. Framework Preset: **Vite** (auto-detected)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

Root Directory should be the repo root (this project is already at root).

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
