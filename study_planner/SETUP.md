# Setup Instructions — Study Planner (Django + MySQL)

Prerequisites:
- Python 3.10+ (recommended)
- pip
- MySQL server and MySQL Workbench
- Virtualenv (recommended)

Steps:

1. Create & activate virtualenv

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Create MySQL database (Workbench or CLI)

Example SQL (run in Workbench):

```sql
CREATE DATABASE study_planner_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'planner_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON study_planner_db.* TO 'planner_user'@'localhost';
FLUSH PRIVILEGES;
```

4. Configure database credentials

Set environment variables before running the app (or edit `study_planner/study_planner/settings.py`):

Windows (PowerShell):

```powershell
$env:MYSQL_DATABASE='study_planner_db'
$env:MYSQL_USER='planner_user'
$env:MYSQL_PASSWORD='your_password'
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
```

5. Run migrations

```bash
cd study_planner
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser (for admin)

```bash
python manage.py createsuperuser
```

7. Run the development server

```bash
python manage.py runserver
```

8. Open the app

Visit `http://127.0.0.1:8000/` for the app and `http://127.0.0.1:8000/admin/` for Django admin.

Notes and extras:
- For real-time production features consider adding Django Channels.
- Use `mysqlclient` binary wheels or install MySQL dev headers if building from source.
