# Office Inventory Tracking System (ITS)

A self-hosted web application for managing office hardware, software licenses, customer-provided assets, procurement, and asset assignments. Runs on an internal LAN server (Ubuntu 24.04).

## Quick Start

```bash
git clone <repo> && cd inventory-its
cp server/.env.example server/.env   # fill in passwords
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key \
  -out certs/server.crt -sha256 -days 3650 -nodes \
  -subj "/CN=inventory.local"
docker compose up -d --build
docker compose exec api npx knex migrate:latest
docker compose exec api npx knex seed:run
```

## Access

- Application: `https://localhost`
- API: `https://localhost/api`
- Default admin: `admin@office.local` / `Admin@1234`

## Services

| Service  | Port | Description                       |
|----------|------|-----------------------------------|
| nginx    | 80/443 | Reverse proxy + TLS              |
| client  | 5173  | React SPA (Vite build)           |
| api     | 3001  | Express REST API                 |
| postgres| 5432  | PostgreSQL 16 database           |

## Tech Stack

- **Backend:** Node.js 20, Express 4, Knex.js, PostgreSQL 16
- **Frontend:** React 18, Vite 5, React Router 6, Tailwind CSS 3
- **Auth:** JWT (access 15 min, refresh 7 days HTTP-only cookie)
- **Charts:** Recharts
- **Icons:** lucide-react

## Roles

| Role               | Permissions                                              |
|--------------------|---------------------------------------------------------|
| admin              | Full access to everything                                |
| inventory_manager  | Full inventory CRUD, procurement, reports                |
| project_manager    | View inventory, approve reallocations, project reports   |
| manager            | View inventory, approve procurement within budget        |
| engineer           | View own assets, create procurement, self-approve < limit|
| auditor            | Read-only all data, export reports                        |

## Asset Numbering

Asset numbers are auto-generated: `PREFIX-00001` (e.g., LAP-00001, DES-00001, TST-00001). Each asset type has its own sequential counter.

## Development

```bash
# Server
cd server && npm install && npm run dev

# Client
cd client && npm install && npm run dev
```
