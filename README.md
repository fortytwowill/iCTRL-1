# InventoryCTRL (iCTRL)

![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-6.4-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-green)

InventoryCTRL is a fully self-hosted, open-source inventory management system built with React, TypeScript, Better Auth, Drizzle ORM, and Mantine UI. It replaces proprietary SaaS dependencies with a transparent, unlimited-use architecture.

## Features

- **Unlimited Scale:** No restrictions on users, items, or organizations.
- **Self-Hosted:** Deploy on your own infrastructure using Docker.
- **Modern Stack:** Powered by Better Auth for security and Drizzle ORM for type-safe database interactions.
- **Mantine UI:** A clean, responsive, and accessible user interface.
- **Advanced Workflows:** Barcode/QR scanning, project allocation, and detailed transaction logs.
- **AI Assistant:** Integrated Puter AI support for intelligent inventory queries.

## Quick Start (Docker)

The easiest way to run iCTRL is using Docker Compose:

```bash
git clone https://github.com/fortytwowill/iCTRL.git
cd iCTRL
cp .env.example .env
docker compose up -d
```

Open `http://localhost:3000` in your browser.

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and update the `DATABASE_URL`.

3. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Project Structure

```text
iCTRL/
  src/                   # Frontend application (React + Mantine)
  server/                # Backend API (Express + Better Auth)
  drizzle/               # Database schema and migrations
  docs/                  # Documentation
```

## License

MIT License. See [LICENSE](LICENSE) for details.