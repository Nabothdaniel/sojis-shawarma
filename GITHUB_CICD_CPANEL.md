# GitHub to cPanel CI/CD

This repo now includes a GitHub Actions workflow at `.github/workflows/deploy-cpanel.yml`.

It deploys on every push to `main` or when you trigger it manually from GitHub.

## What it deploys

- Frontend static export from `out/` to `public_html/`
- PHP backend code to `public_html/api/`
- Backend runtime env file to `public_html/api/.env`

## GitHub Secrets to add

Add these in `GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret`:

- `CPANEL_HOST`
  Example: `bamzysms.com` or your server hostname
- `CPANEL_USER`
  Your cPanel username
- `CPANEL_SSH_PRIVATE_KEY`
  The private key that matches a public key authorized in cPanel SSH Access
- `NEXT_PUBLIC_API_URL`
  Example: `https://bamzysms.com/api`
- `NEXT_PUBLIC_ENCRYPTION_KEY`
  Must match the backend encryption key
- `CPANEL_BACKEND_ENV`
  Full contents of the backend `.env` file to write on the server

## Recommended backend env content

Set `CPANEL_BACKEND_ENV` to the full server env, for example:

```env
SMSBOWER_API_KEY=your_real_smsbower_key
DB_CHARSET=utf8mb4
DB_HOST=localhost
DB_NAME=your_cpanel_database
DB_USER=your_cpanel_database_user
DB_PASS=your_database_password
MAIL_HOST=mail.bamzysms.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=noreply@bamzysms.com
MAIL_PASSWORD=your_mail_password
MAIL_FROM_ADDRESS=noreply@bamzysms.com
MAIL_FROM_NAME=BamzySMS
PLATFORM_ENCRYPTION_KEY=3+QsX8NQnI9fZL/vhnSPm1xOM98wPSK6ZnemE8agb0ZC8xF5GjCoOu9051lEv5xx
CORS_ALLOWED_ORIGINS=https://bamzysms.com,https://www.bamzysms.com
```

## cPanel SSH setup

1. In cPanel, open `SSH Access`.
2. Import or generate an SSH key pair.
3. Authorize the public key.
4. Put the matching private key into the GitHub secret `CPANEL_SSH_PRIVATE_KEY`.

## Notes

- The workflow assumes your cPanel web root is `/home/<cpanel-user>/public_html`.
- The backend path is `/home/<cpanel-user>/public_html/api`.
- Frontend deploy excludes `public_html/api/` so the API folder is not deleted.
- Backend deploy preserves runtime storage directories by recreating them and not deleting logs/cache explicitly.
- Your cPanel host needs `ssh`, `scp`, and `rsync` available for this workflow.

## First run checklist

1. Add all GitHub secrets.
2. Confirm SSH login works for the cPanel user.
3. Make sure the database already exists in cPanel.
4. Import `backend/database_production.sql` once if this is a fresh install.
5. Push to `main` or run the workflow manually from the `Actions` tab.
