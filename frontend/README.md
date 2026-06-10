# Business Proposal Agent — Frontend

Next.js frontend for the AI proposal pipeline.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript

## Setup

```bash
npm install
cp .env.example .env.local
```

## Development

Start the FastAPI backend first (port 8000), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project structure

```
frontend/
├── app/
│   ├── api/proposal/   # Proxy to FastAPI backend
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/         # UI components
└── lib/                # Types, API client, utilities
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://127.0.0.1:8000` | FastAPI backend URL |
