# Ghostie Visualization

Frontend for the Ghostie Business Intelligence platform — a sentiment analysis dashboard built with React, Vite, and Material UI.

![CI](https://github.com/RyanYoon2005/Ghostie_visualization/actions/workflows/ci.yml/badge.svg)

## Overview

Ghostie Visualization provides a real-time view of public sentiment for any business, aggregated from Google Maps reviews, NewsAPI articles, and Reddit posts. It connects to the Ghostie microservices backend (middleware, analytical model, data collection, data retrieval).

**Key features:**
- Sentiment analysis with animated score gauge and source breakdown
- Leaderboard of tracked businesses ranked by sentiment score
- Sentiment history chart with multi-company comparison and best-fit trend line
- Favourites system with persistent starred businesses
- Data collection and retrieval dashboards
- Animated dark-theme UI with aurora colour palette

## Tech Stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev)
- [MUI v9](https://mui.com) (Material UI) — dark theme, custom aurora palette
- [Recharts](https://recharts.org) — sentiment history charts
- [React Router v7](https://reactrouter.com)
- [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com) — unit tests

## Getting Started

### Prerequisites

- Node.js 20+
- The Ghostie backend services running (or a configured API base URL)

### Install & run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

### Environment

Create a `.env` file in the project root if you need to point at a non-default API:

```
VITE_API_BASE_URL=https://your-api-gateway-url
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## CI/CD

GitHub Actions runs on every push and pull request to `main`/`master`:

1. **Lint** — ESLint across all `.js`/`.jsx` files
2. **Test & Coverage** — Vitest with v8 coverage (minimum 20% threshold), coverage report uploaded as an artifact
3. **Build** — `vite build` to catch compile-time errors, `dist/` uploaded as an artifact

## Project Structure

```
src/
├── api/          # API client factory
├── auth/         # Auth context and sign-in page
├── components/   # Shared UI components (ScoreGauge, StatsCard, SentimentBadge, …)
├── context/      # React contexts (BusinessContext, ToastContext)
├── hooks/        # Custom hooks (useFavourites)
├── pages/        # Route-level page components
└── test/         # Vitest unit tests
```

## Team

SENG3011 — Group project
