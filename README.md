# Smart Laundry Management System

A beginner-friendly full-stack laundry management project built with:
- Frontend: HTML5, CSS3, JavaScript
- Backend: Python Flask
- Database: MySQL

## Project structure
- `backend/` — Flask application code
- `static/` — CSS and JavaScript files
- `templates/` — Flask HTML templates
- `frontend/` — static frontend starter page and notes
- `database/` — SQL schema file

## Setup
1. Install Python packages:

   ```powershell
   python -m pip install -r requirements.txt
   ```

2. Create the database using MySQL Workbench or the command line:

   - Open `database/schema.sql`
   - Run it in MySQL Workbench

3. Configure environment variables (optional):

   - `MYSQL_HOST` (default: `localhost`)
   - `MYSQL_PORT` (default: `3306`)
   - `MYSQL_USER` (default: `root`)
   - `MYSQL_PASSWORD` (default: empty)
   - `MYSQL_DATABASE` (default: `smart_laundry`)
   - `FLASK_SECRET_KEY` (recommended for production)

4. Run the app:

   ```powershell
   python backend/app.py
   ```

5. Open your browser:

   - `http://localhost:5000/login`
   - `http://localhost:5000/signup`

## Notes
- Passwords are hashed with `bcrypt`
- Login uses Flask session authentication
- API calls are handled using Flask backend endpoints
