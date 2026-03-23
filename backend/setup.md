# Setup Instructions for BamzySMS Backend

## 1. Using XAMPP's PHP in Terminal
If you have XAMPP installed, you already have PHP. To use it in your terminal (to run `php backend/serve.php`), follow these steps:
1. Search for "Environment Variables" in your Windows search bar and select "Edit the system environment variables".
2. Click on "Environment Variables".
3. Under "System variables" (or "User variables"), find the "Path" variable and click "Edit".
4. Click "New" and add the path to your XAMPP PHP folder (usually `C:\xampp\php`).
5. Click OK on all windows.
6. Restart your terminal (VS Code terminal, Command Prompt, or PowerShell).
7. Type `php -v` to verify it works.

## 2. Database Credentials
### Local Development (XAMPP)
Open `backend/config/database.php` and set:
- `DB_HOST`: `localhost`
- `DB_USER`: `root`
- `DB_PASS`: (leave empty)
- `DB_NAME`: `bamzy_db` (Create this in phpMyAdmin)

### Production (CPanel)
1. Go to CPanel and use "MySQL Database Wizard" to create a database and user.
2. Grant all privileges to the user.
3. Update `backend/config/database.php` with the new credentials.

## 3. Running the Server
In your terminal, run:
```bash
php backend/serve.php
```
This will start the API at `http://localhost:8000`.
