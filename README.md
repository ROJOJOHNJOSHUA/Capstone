# Holy Family Parish — Digital Record Management System

**Putiao, Pilar, Sorsogon**

Full-stack application: **React + Tailwind** frontend, **PHP REST API** backend, **MySQL** database.

## Project structure

```
ParishSystem1/
├── client/          # React (Vite) + Tailwind
├── server/          # PHP JSON API (session auth)
├── database/        # MySQL schema & seed
├── auth/            # Legacy server-rendered PHP (optional)
└── ...
```

## Setup

### 1. Database

1. Start XAMPP (Apache + MySQL)
2. Import `database/schema.sql` in phpMyAdmin
3. Run: `php database/seed.php`

**Admin:** `admin@holyfamilyparish.com` / `admin123`

### 2. PHP API

- API base: `http://localhost/ParishSystem1/server/api`
- Configure `server/.env` with the database credentials, `CORS_ORIGIN`, `SESSION_SAMESITE=None`, and `SESSION_SECURE=true` for production.

### 3. React frontend

```bash
cd client
npm install
npm run dev
```

Open: **http://localhost:5173**

The Vite dev server proxies `/api` → `http://localhost/ParishSystem1/server/api` so session cookies work during development.

### Production build

```bash
cd client
npm run build
```

Deploy `client/dist` to Vercel with `VITE_API_URL=/api`.

Deploy the `server` directory so the API is available at `https://holyfamilyparish.tech/api`, and create a server-side `server/.env` (never commit it):

```dotenv
DB_HOST=your-infinityfree-mysql-host
DB_NAME=your-infinityfree-database
DB_USER=your-infinityfree-database-user
DB_PASS=your-infinityfree-database-password
CORS_ORIGIN=https://holyfamilyparish.vercel.app
SESSION_SAMESITE=None
SESSION_SECURE=true
TEXTBEE_API_KEY=your-textbee-api-key
TEXTBEE_DEVICE_ID=your-textbee-device-id
TEXTBEE_BASE_URL=https://api.textbee.dev/api/v1
```

The frontend uses credentialed requests, so the API must return CORS headers for `https://holyfamilyparish.vercel.app` and the production session cookie must be secure with `SameSite=None`.
SMS is sent by the VPS backend through TextBee, not by Vercel. The VPS must have all three `TEXTBEE_*` values in its server-side `.env`, and the configured Android device must be enabled and online.

## Features

- Register & login (PHP sessions + `withCredentials`)
- Parishioner: reservations, appointments, dashboard
- Admin: approve/reject bookings, centralized records CRUD with search
- Same MySQL database as the plain PHP pages
