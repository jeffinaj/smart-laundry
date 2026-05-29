# Smart Laundry Setup

## Backend Setup

1. Create a virtual environment:

```bash
cd smart_laundry/backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Create the MySQL database in MySQL Workbench:

```sql
CREATE DATABASE smart_laundry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'laundry_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_laundry_db.* TO 'laundry_user'@'localhost';
FLUSH PRIVILEGES;
```

4. Set environment variables:

PowerShell:

```powershell
$env:MYSQL_DATABASE='smart_laundry_db'
$env:MYSQL_USER='laundry_user'
$env:MYSQL_PASSWORD='your_password'
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
$env:DJANGO_DEBUG='True'
```

5. Run migrations and create a superuser:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

6. Start the backend:

```bash
python manage.py runserver
```

## Frontend Setup

1. Open a new terminal and navigate to frontend

```bash
cd smart_laundry/frontend
npm install
npm run dev
```

2. Open the application in the browser:

`http://localhost:5173`

## Notes

- The frontend proxies API requests to `http://127.0.0.1:8000`.
- Use the admin at `http://127.0.0.1:8000/admin/` to manage bookings, payments, users, and notifications.
