# Real-Time Smart Laundry Management System - Setup Guide

## Project Structure

```
realtime_laundry/
├── backend/                 # Django REST + Channels Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── laundry_system/      # Project settings
│   │   ├── settings.py
│   │   ├── asgi.py         # Channels config
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── laundry/             # Django app
│       ├── models.py        # Database models
│       ├── serializers.py   # REST serializers
│       ├── views.py         # API views
│       ├── consumers.py     # WebSocket consumers
│       ├── routing.py       # WebSocket routing
│       └── urls.py
└── frontend/                # React + Tailwind
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/          # Page components
    │   ├── services/       # API & WebSocket services
    │   ├── store/          # Zustand state management
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## Prerequisites

- Python 3.10+
- Node.js 16+ and npm
- MySQL Server & MySQL Workbench
- Git

## Backend Setup

### 1. Create Virtual Environment

```bash
cd realtime_laundry/backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup MySQL Database

Open MySQL Workbench or MySQL CLI and run:

```sql
CREATE DATABASE realtime_laundry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'laundry_dev'@'localhost' IDENTIFIED BY 'LaundryDev@2024';

GRANT ALL PRIVILEGES ON realtime_laundry_db.* TO 'laundry_dev'@'localhost';

FLUSH PRIVILEGES;
```

### 4. Configure Environment Variables

Create a `.env` file in the backend folder:

```bash
# Windows PowerShell
$env:MYSQL_DATABASE='realtime_laundry_db'
$env:MYSQL_USER='laundry_dev'
$env:MYSQL_PASSWORD='LaundryDev@2024'
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
$env:DJANGO_DEBUG='True'
$env:DJANGO_SECRET_KEY='your-secure-secret-key-change-this-in-production'
```

Or create a `.env` file and set with `python-decouple`:

```env
MYSQL_DATABASE=realtime_laundry_db
MYSQL_USER=laundry_dev
MYSQL_PASSWORD=LaundryDev@2024
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=your-secure-secret-key-change-this-in-production
```

### 5. Run Migrations

```bash
cd realtime_laundry/backend
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 7. Start Backend Server

Use Daphne for ASGI (WebSockets):

```bash
daphne -b 127.0.0.1 -p 8000 laundry_system.asgi:application
```

Or for development without WebSockets:

```bash
python manage.py runserver
```

Backend will be available at: `http://127.0.0.1:8000`

Admin panel: `http://127.0.0.1:8000/admin`

## Frontend Setup

### 1. Install Dependencies

```bash
cd realtime_laundry/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## API Documentation

### Authentication Endpoints

```
POST /api/auth/register/
- Body: { username, email, password }

POST /api/auth/login/
- Body: { username, password }
- Returns: { access, refresh, user }
```

### Dashboard

```
GET /api/dashboard/
- Returns user dashboard data
- Auth: Required
```

### Bookings

```
GET /api/bookings/
- List user bookings

POST /api/bookings/
- Create new booking
- Body: booking form data

GET /api/bookings/{id}/
- Get booking detail

POST /api/bookings/{id}/update_status/
- Update booking status
- Body: { status, notes }
```

### Payments

```
GET /api/payments/
- List user payments
```

### Notifications

```
GET /api/notifications/
- List notifications

POST /api/notifications/{id}/mark_as_read/
- Mark as read

POST /api/notifications/mark_all_as_read/
- Mark all as read

GET /api/notifications/unread_count/
- Get unread count
```

## WebSocket Events

The application uses WebSockets for real-time updates.

### Connection

```
ws://127.0.0.1:8000/api/ws/notifications/
```

### Events Received

```javascript
// Booking notification
{
  type: 'notification',
  message: 'Your booking has been confirmed',
  booking_id: 123
}

// Status update
{
  type: 'status_update',
  booking_id: 123,
  status: 'washing',
  message: 'Laundry is now washing'
}

// Dashboard update
{
  type: 'dashboard_update',
  data: { /* updated dashboard data */ }
}
```

## Pricing Configuration

Modify pricing in `frontend/src/pages/BookLaundry.jsx`:

```javascript
const PRICES = {
  normal: 10,    // ₹/item
  premium: 20,   // ₹/item
  dryclean: 40,  // ₹/item
}

const GST_RATE = 0.18  // 18% GST
```

## Database Schema

### Users Table
- id, username, email, password, first_name, last_name, is_active, date_joined

### UserProfile Table
- id, user_id (FK), phone_number, address, created_at

### LaundryBooking Table
- id, user_id (FK), booking_id (unique), full_name, hostel_apartment, phone_number, laundry_type, clothes_count, pickup_date, pickup_time, delivery_preference, special_instructions, subtotal, gst, total_amount, status, created_at, updated_at

### Payment Table
- id, booking_id (FK, OneToOne), payment_id (unique), amount, status, payment_method, created_at, updated_at, paid_at

### OrderTracking Table
- id, booking_id (FK), status, timestamp, notes

### Notification Table
- id, user_id (FK), booking_id (FK), notification_type, title, message, is_read, created_at

### AdminProfile Table
- id, user_id (FK, OneToOne), is_active, department, created_at

## Deployment

### Production Setup

1. Set `DJANGO_DEBUG=False`
2. Update `ALLOWED_HOSTS` in settings.py
3. Use strong `DJANGO_SECRET_KEY`
4. Configure HTTPS/SSL
5. Use Redis for Channel Layers (in production)
6. Use Gunicorn + Nginx for serving

### Environment Variables for Production

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=very-secure-key-256-characters
MYSQL_DATABASE=realtime_laundry_prod
MYSQL_USER=laundry_prod
MYSQL_PASSWORD=strong-password
MYSQL_HOST=your-db-server.com
MYSQL_PORT=3306
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## Troubleshooting

### WebSocket Connection Issues

If WebSocket fails to connect:

1. Ensure Daphne is running
2. Check firewall settings
3. Verify `CHANNEL_LAYERS` config in settings.py
4. Check browser console for errors

### Database Connection Errors

1. Verify MySQL is running
2. Check credentials in environment variables
3. Ensure database exists
4. Run migrations again

### CORS Issues

Update `CORS_ALLOWED_ORIGINS` in settings.py if frontend domain changes.

## Support & Documentation

- Django Channels: https://channels.readthedocs.io/
- Django REST: https://www.django-rest-framework.org/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/

## License

MIT License - See LICENSE file for details
