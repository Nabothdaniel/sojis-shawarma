# BamzySMS cPanel Deployment Guide

This project is deployed as:
- Frontend: static Next.js export in `public_html/`
- Backend: PHP API in `public_html/api/`
- Database: MySQL database created in cPanel

## 1. Prepare Frontend Build

From project root:

```bash
npm install
cp .env.production.example .env.production
npm run build
```

This generates static files in `out/`.

Upload the full contents of `out/` into `public_html/`.

## 2. Deploy Backend API

Create this structure in cPanel File Manager:

```text
public_html/
  api/
    index.php
    .htaccess
    config/
    src/
    storage/
```

Copy these local folders/files into `public_html/api/`:
- `backend/public/index.php` -> `public_html/api/index.php`
- `backend/public/.htaccess` -> `public_html/api/.htaccess`
- `backend/config/`
- `backend/src/`
- `backend/storage/`

Also copy:
- `backend/.env` (or `backend/.env.example` renamed to `.env` and filled with real values)

Recommended final location:
- `public_html/api/.env`

## 3. Configure Backend Environment

Set these in `public_html/api/.env`:

```env
DB_HOST=localhost
DB_NAME=cpanel_db_name
DB_USER=cpanel_db_user
DB_PASS=cpanel_db_password
DB_CHARSET=utf8mb4
SMSBOWER_API_KEY=your_smsbower_api_key
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 4. Create Database and Import Schema

1. In cPanel, create database + user and grant ALL PRIVILEGES.
2. Open phpMyAdmin.
3. Import:
   - `backend/database.sql`
   - `backend/migrations.sql`

## 5. Verify URLs

- Frontend: `https://yourdomain.com`
- API health check example: `https://yourdomain.com/api/countries`

If API responds with JSON, routing is correct.

## 6. Notes

- Frontend uses `NEXT_PUBLIC_API_URL` and defaults to `/api`.
- Backend CORS is controlled by `CORS_ALLOWED_ORIGINS`.
- If Bearer auth fails on cPanel, ensure `public_html/api/.htaccess` is present.
- For GitHub Actions based CI/CD over SSH, see `GITHUB_CICD_CPANEL.md`.
