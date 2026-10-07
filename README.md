# CartoGraph

CartoGraph is a full-stack platform for understanding repository architecture through dependency graphs and AI-assisted analysis. It scans JavaScript and TypeScript code, builds a verified map of relationships, and helps teams reason about impact before making changes.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Data access: MongoDB, Redis, and background workers
- AI integration: LangChain/OpenAI-ready services

## Project structure

- `client/` — web application for dashboard, repository analysis, graph exploration, and auth flows
- `server/` — API layer, repository processing, authentication, and business logic
- `docker/` — Docker Compose setup for local services
- `frontend-design/` — design references and mockups

## Quick start

### 1) Install dependencies

```sh
npm install
cd client && npm install
cd ../server && npm install
```

### 2) Configure environment files

Copy the example env files before running the app:

```sh
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Set the required values for your local environment, especially `JWT_SECRET` in `server/.env`.

### 3) Start the app

Run the backend:

```sh
npm run server:dev
```

Run the frontend in a separate terminal:

```sh
cd client
npm run dev
```

The frontend typically runs on `http://localhost:5173` and the API on `http://localhost:5000`.

## Useful commands

From the repo root:

```sh
npm run check
npm run test
```

From the frontend:

```sh
cd client
npm run check
npm run build
```

From the backend:

```sh
cd server
npm run check
npm run test
npm run build
```

## Notes

- The app intentionally avoids executing repository code while scanning; it relies on static analysis and extracted metadata.
- Authentication and request validation are enforced in the API layer.
- Local env files are excluded from Git via the root `.gitignore`.

## License

This project is currently under the repository’s default project license unless otherwise noted.
