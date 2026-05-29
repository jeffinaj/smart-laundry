import os
import functools
from flask import Flask, render_template, redirect, url_for, request, jsonify, session
import bcrypt

try:
    from backend.database import get_db_connection, DB_CONFIG
except ImportError:
    from database import get_db_connection, DB_CONFIG

app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change_this_secret_for_dev")
app.config.update({
    "SESSION_COOKIE_HTTPONLY": True,
    "SESSION_COOKIE_SAMESITE": "Lax",
    "SESSION_PERMANENT": False,
})


def get_request_payload():
    payload = request.get_json(silent=True)
    if payload:
        return payload
    return request.form.to_dict()


def process_signup(data):
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not name or not email or not phone or not password:
        return False, "All fields are required."

    if len(password) < 6:
        return False, "Password must be at least 6 characters."

    if not phone.isdigit() or len(phone) < 8:
        return False, "Enter a valid phone number."

    existing = query_user_by_email(email)
    if existing:
        return False, "Email already exists."

    try:
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, phone, password) VALUES (%s, %s, %s, %s)",
            (name, email, phone, password_hash),
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as error:
        print(f"Signup error: {error}")
        return False, "Failed to create account. Please try again."

    return True, "Account created successfully."


def process_login(data):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return False, "Email and password are required."

    try:
        user = query_user_by_email(email)
    except Exception as error:
        print(f"Login error querying user: {error}")
        return False, "Login failed. Please try again."

    if not user:
        return False, "Invalid credentials."

    try:
        stored_password = user["password"]
    except Exception:
        return False, "Invalid credentials."

    if not bcrypt.checkpw(password.encode("utf-8"), stored_password.encode("utf-8")):
        return False, "Invalid credentials."

    session.permanent = True
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_email"] = user["email"]
    session["user_phone"] = user["phone"]
    return True, "Logged in successfully."


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return view(**kwargs)
    return wrapped_view


def admin_login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if "admin_id" not in session:
            return redirect(url_for("admin_login"))
        return view(**kwargs)
    return wrapped_view


def query_admin_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    admin = None
    try:
        cursor.execute(
            "SELECT admin_id AS id, admin_name AS name, admin_email AS email, admin_password AS password FROM admins WHERE admin_email = %s",
            (email,),
        )
        admin = cursor.fetchone()
    except Exception:
        cursor.execute("SELECT id, name, email, password FROM admin_users WHERE email = %s", (email,))
        admin = cursor.fetchone()
    cursor.close()
    conn.close()
    return admin


STATUS_STAGES = [
    "Pending",
    "Pickup Scheduled",
    "Washing",
    "Drying",
    "Ironing",
    "Out for Delivery",
    "Delivered",
]

STATUS_ALIASES = {
    "Collected": "Pickup Scheduled",
}


def get_service_price(service_name):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT price, express_multiplier FROM services WHERE LOWER(name) = LOWER(%s) LIMIT 1",
        (service_name,),
    )
    service = cursor.fetchone()
    cursor.close()
    conn.close()
    if service:
        return float(service.get("price", 0.0)), float(service.get("express_multiplier", 1.25))
    return 5.5, 1.25


def calculate_booking_amount(service_name, quantity, weight, express, discount_code, delivery_type):
    base_price, express_multiplier = get_service_price(service_name)
    quantity = max(int(quantity), 1)
    weight = max(float(weight or 0), 0.0)
    subtotal = base_price * quantity
    weight_fee = weight * 20.0
    discount_amount = 0.0

    if discount_code == "bulk" and quantity >= 5:
        discount_amount = (subtotal + weight_fee) * 0.10
    elif discount_code == "loyalty":
        discount_amount = (subtotal + weight_fee) * 0.05
    elif discount_code == "seasonal":
        discount_amount = (subtotal + weight_fee) * 0.15

    taxable_amount = subtotal + weight_fee - discount_amount
    tax_amount = taxable_amount * 0.05
    delivery_fee = 75.0 if delivery_type == "Express" else 50.0
    total_amount = taxable_amount + tax_amount + delivery_fee

    if express:
        total_amount *= express_multiplier

    return {
        "subtotal": round(subtotal, 2),
        "weight_fee": round(weight_fee, 2),
        "discount_amount": round(discount_amount, 2),
        "tax_amount": round(tax_amount, 2),
        "delivery_fee": round(delivery_fee, 2),
        "total_amount": round(total_amount, 2),
    }


def generate_order_id():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT order_id FROM bookings WHERE order_id LIKE 'ORD%'")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    max_suffix = 1000
    for row in rows:
        order_value = None
        if isinstance(row, dict):
            order_value = row.get('order_id')
        elif isinstance(row, (list, tuple)):
            order_value = row[0]
        else:
            try:
                order_value = row[0]
            except Exception:
                order_value = None

        if isinstance(order_value, str) and order_value.startswith('ORD'):
            try:
                suffix = int(order_value[3:])
                if suffix > max_suffix:
                    max_suffix = suffix
            except Exception:
                continue

    return f"ORD{max_suffix + 1}"


def get_payment_column_name():
    return "booking_id" if DB_CONFIG.get("type") == "sqlite" else "order_id"


def create_payment_record(order_id, user_id, amount, payment_method="pending", payment_status="pending", transaction_id=None, upi_id=None, notes=None):
    column_name = get_payment_column_name()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if DB_CONFIG.get("type") == "sqlite":
            cursor.execute(
                f"INSERT INTO payments ({column_name}, user_id, amount, payment_method, payment_status, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                (order_id, user_id, amount, payment_method, payment_status, notes or "Payment created automatically after booking."),
            )
        else:
            cursor.execute(
                "INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, upi_id, payment_status, notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (order_id, user_id, amount, payment_method, transaction_id, upi_id, payment_status, notes or "Payment created automatically after booking."),
            )
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as error:
        print(f"Error creating payment record: {error}")
        return False


def create_tracking_record(order_id, status, note=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tracking (order_id, current_status, updated_time, notes) VALUES (%s, %s, CURRENT_TIMESTAMP, %s)",
            (order_id, status, note),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as error:
        print(f"Error creating tracking record: {error}")
        return False


def get_tracking_history(order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT current_status, updated_time, notes FROM tracking WHERE order_id = %s ORDER BY updated_time ASC",
            (order_id,),
        )
        history = cursor.fetchall()
        cursor.close()
        conn.close()
        return history
    except Exception as error:
        print(f"Error fetching tracking history: {error}")
        return []


def query_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user


def create_notification(user_id, notification_type, title, message, order_id=None):
    """Create a notification for a user."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO notifications (user_id, order_id, type, title, message)
               VALUES (%s, %s, %s, %s, %s)""",
            (user_id, order_id, notification_type, title, message)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False


@app.route("/")
def index():
    if session.get("admin_id"):
        return redirect(url_for("admin_dashboard"))
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    if session.get("admin_id"):
        return redirect(url_for("admin_dashboard"))
    if request.method == "POST":
        data = get_request_payload() or {}
        success, message = process_login(data)
        if request.is_json:
            status_code = 200 if success else 401
            response = {"success": success, "message": message}
            if success:
                response["redirect"] = url_for("dashboard")
            return jsonify(response), status_code
        if success:
            return redirect(url_for("dashboard"))
        return render_template("login.html", message=message, message_type="error", form_data=data)
    return render_template("login.html", form_data={})


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        data = get_request_payload() or {}
        success, message = process_signup(data)
        if request.is_json:
            status_code = 200 if success else 400
            response = {"success": success, "message": message}
            if success:
                response["redirect"] = url_for("login")
            return jsonify(response), status_code
        if success:
            return redirect(url_for("login"))
        return render_template("signup.html", message=message, message_type="error", form_data=data)
    return render_template("signup.html", form_data={})


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@app.route("/book")
@login_required
def book_laundry():
    return render_template("book_laundry.html")


@app.route("/track")
def track():
    return render_template("track_order.html")

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if session.get("admin_id"):
        return redirect(url_for("admin_dashboard"))

    message = None
    message_type = None
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            message = "Email and password are required."
            message_type = "error"
            return render_template("admin_login.html", message=message, message_type=message_type)

        admin = query_admin_by_email(email)
        if not admin or not bcrypt.checkpw(password.encode("utf-8"), admin["password"].encode("utf-8")):
            message = "Invalid admin email or password."
            message_type = "error"
            return render_template("admin_login.html", message=message, message_type=message_type)

        session["admin_id"] = admin["id"]
        session["admin_name"] = admin["name"]
        session["admin_email"] = admin["email"]
        return redirect(url_for("admin_dashboard"))

    return render_template("admin_login.html")


@app.route("/admin/dashboard")
@admin_login_required
def admin_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) AS total_users FROM users")
    total_users = cursor.fetchone()["total_users"]
    cursor.execute("SELECT COUNT(*) AS total_orders, IFNULL(SUM(total_amount), 0) AS total_revenue FROM bookings")
    summary = cursor.fetchone()
    cursor.execute("SELECT COUNT(*) AS pending_payments FROM payments WHERE payment_status != 'paid'")
    pending_payments = cursor.fetchone()["pending_payments"]
    cursor.close()
    conn.close()
    return render_template(
        "admin_dashboard.html",
        admin_name=session.get("admin_name"),
        total_users=total_users,
        total_orders=summary["total_orders"],
        total_revenue=float(summary["total_revenue"]),
        pending_payments=pending_payments,
    )


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_id", None)
    session.pop("admin_name", None)
    session.pop("admin_email", None)
    return redirect(url_for("admin_login"))


# ----------------------
# Admin pages (protected)
# ----------------------
@app.route('/admin/users')
@admin_login_required
def admin_users_page():
    return render_template('admin_users.html')


@app.route('/admin/orders')
@admin_login_required
def admin_orders_page():
    return render_template('admin_orders.html')


@app.route('/admin/payments')
@admin_login_required
def admin_payments_page():
    return render_template('admin_payments.html')


@app.route('/admin/tracking')
@admin_login_required
def admin_tracking_page():
    return render_template('admin_tracking.html')


@app.route('/admin/notifications')
@admin_login_required
def admin_notifications_page():
    return render_template('admin_notifications.html')


@app.route('/admin/workers')
@admin_login_required
def admin_workers_page():
    return render_template('admin_workers.html')


@app.route('/admin/services')
@admin_login_required
def admin_services_page():
    return render_template('admin_services.html')


@app.route('/admin/reports')
@admin_login_required
def admin_reports_page():
    return render_template('admin_reports.html')


@app.route('/admin/settings')
@admin_login_required
def admin_settings_page():
    return render_template('admin_settings.html')


@app.route("/admin/api/login", methods=["POST"])
def admin_api_login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    admin = query_admin_by_email(email)
    if not admin:
        return jsonify({"success": False, "message": "Invalid admin credentials."}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), admin["password"].encode("utf-8")):
        return jsonify({"success": False, "message": "Invalid admin credentials."}), 401

    session["admin_id"] = admin["id"]
    session["admin_name"] = admin["name"]
    session["admin_email"] = admin["email"]

    return jsonify({"success": True, "message": "Admin logged in successfully.", "admin_name": admin["name"]})


@app.route("/admin/api/summary")
@admin_login_required
def admin_api_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total_users FROM users")
    total_users = cursor.fetchone()["total_users"]

    cursor.execute("SELECT COUNT(*) AS total_orders, IFNULL(SUM(price), 0) AS total_revenue FROM bookings")
    summary = cursor.fetchone()

    cursor.execute("SELECT status, COUNT(*) AS count FROM bookings GROUP BY status")
    status_counts = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "admin_name": session.get("admin_name", "Administrator"),
        "summary": {
            "total_users": total_users,
            "total_orders": summary["total_orders"],
            "total_revenue": float(summary["total_revenue"]),
            "status_counts": status_counts,
        },
    })


@app.route("/admin/api/users")
@admin_login_required
def admin_api_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "users": users})


@app.route("/admin/api/orders")
@admin_login_required
def admin_api_orders():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT b.id, b.user_id, u.name AS customer_name, u.email AS customer_email, b.booking_type, b.quantity, b.price, b.status, b.express_delivery, b.pickup_date, b.pickup_address, b.created_at "
        "FROM bookings b "
        "JOIN users u ON u.id = b.user_id "
        "ORDER BY b.created_at DESC"
    )
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "orders": orders, "statuses": STATUS_STAGES})


@app.route("/admin/api/order-status", methods=["POST"])
@admin_login_required
def admin_api_order_status():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    status = data.get("status", "").strip()

    if not order_id or not status:
        return jsonify({"success": False, "message": "Order ID and status are required."}), 400

    if status not in STATUS_STAGES:
        return jsonify({"success": False, "message": "Invalid status value."}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get order user_id before updating
    cursor.execute("SELECT user_id FROM bookings WHERE id = %s", (order_id,))
    order = cursor.fetchone()
    
    if not order:
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": "Order not found."}), 404
    
    # Update status
    cursor.execute("UPDATE bookings SET status = %s WHERE id = %s", (status, order_id))
    conn.commit()
    cursor.close()
    conn.close()

    # Create notification based on status change
    user_id = order['user_id']
    notification_map = {
        "Collected": ("🚚 Pickup Reminder", "Your laundry has been collected. Pickup completed!"),
        "Washing": ("🧼 Laundry in Progress", "Your clothes are now being washed."),
        "Drying": ("💨 Drying in Progress", "Your clothes are being dried."),
        "Ironing": ("👔 Ironing in Progress", "Your clothes are being ironed."),
        "Out for Delivery": ("📦 Out for Delivery", "Your laundry is on the way! Expected delivery today."),
        "Delivered": ("✅ Laundry Delivered", "Your laundry has been delivered. Thank you for using our service!"),
    }
    
    if status in notification_map:
        title, message = notification_map[status]
        create_notification(user_id, status.lower().replace(" ", "_"), title, message, order_id)

    return jsonify({"success": True, "message": "Order status updated successfully."})



@app.route("/admin/api/users/delete", methods=["POST"])
@admin_login_required
def admin_api_delete_user():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"success": False, "message": "User ID is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    deleted = cursor.rowcount
    cursor.close()
    conn.close()

    if not deleted:
        return jsonify({"success": False, "message": "User not found."}), 404

    return jsonify({"success": True, "message": "User deleted successfully."})


@app.route("/admin/api/services", methods=["GET", "POST"])
@admin_login_required
def admin_api_services():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == "GET":
        cursor.execute("SELECT id, name, description, price, express_multiplier FROM services ORDER BY name")
        services = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "services": services})

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    price = data.get("price")
    express_multiplier = data.get("express_multiplier", 1.0)

    if not name or price is None:
        return jsonify({"success": False, "message": "Service name and price are required."}), 400

    try:
        price = float(price)
        express_multiplier = float(express_multiplier)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid price or multiplier."}), 400

    cursor.execute(
        "INSERT INTO services (name, description, price, express_multiplier) VALUES (%s, %s, %s, %s)",
        (name, description, price, express_multiplier),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "message": "Service added successfully."})


@app.route("/admin/api/services/<int:service_id>", methods=["PUT", "DELETE"])
@admin_login_required
def admin_api_service_update(service_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == "DELETE":
        cursor.execute("DELETE FROM services WHERE id = %s", (service_id,))
        conn.commit()
        deleted = cursor.rowcount
        cursor.close()
        conn.close()
        if not deleted:
            return jsonify({"success": False, "message": "Service not found."}), 404
        return jsonify({"success": True, "message": "Service deleted successfully."})

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    price = data.get("price")
    express_multiplier = data.get("express_multiplier", 1.0)

    if not name or price is None:
        return jsonify({"success": False, "message": "Service name and price are required."}), 400

    try:
        price = float(price)
        express_multiplier = float(express_multiplier)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid price or multiplier."}), 400

    cursor.execute(
        "UPDATE services SET name = %s, description = %s, price = %s, express_multiplier = %s WHERE id = %s",
        (name, description, price, express_multiplier, service_id),
    )
    conn.commit()
    updated = cursor.rowcount
    cursor.close()
    conn.close()
    if not updated:
        return jsonify({"success": False, "message": "Service not found."}), 404
    return jsonify({"success": True, "message": "Service updated successfully."})


@app.route("/api/services")
def api_services():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, description, price, express_multiplier FROM services ORDER BY name")
    services = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "services": services})


@app.route("/api/track-order", methods=["POST"])
def api_track_order(order_id=None):
    if order_id is None:
        data = request.get_json() or {}
        order_id = data.get("order_id", "")

    if not order_id:
        return jsonify({"success": False, "message": "Order ID is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, order_id, customer_name, phone_number, booking_type, quantity, weight, pickup_date, pickup_address, delivery_type, express_delivery, total_amount AS price, status, payment_status, special_instructions, created_at FROM bookings WHERE id = %s OR order_id = %s LIMIT 1",
        (order_id, order_id),
    )
    order_data = cursor.fetchone()
    cursor.close()
    conn.close()

    if not order_data:
        return jsonify({"success": False, "message": "Order not found."}), 404

    normalized_status = STATUS_ALIASES.get(order_data["status"], order_data["status"])
    stage_index = STATUS_STAGES.index(normalized_status) if normalized_status in STATUS_STAGES else 0
    progress = int((stage_index / (len(STATUS_STAGES) - 1)) * 100)
    tracking_history = get_tracking_history(order_data["id"])

    return jsonify({
        "success": True,
        "order": order_data,
        "stages": STATUS_STAGES,
        "stage_index": stage_index,
        "progress": progress,
        "tracking_history": tracking_history,
    })


@app.route("/api/track/<order_id>", methods=["GET"])
def api_track(order_id):
    return api_track_order(order_id)


@app.route("/api/book", methods=["POST"])
@login_required
def api_book():
    return api_book_laundry()


@app.route("/api/book-laundry", methods=["POST"])
@login_required
def api_book_laundry():
    data = request.get_json() or {}
    booking_type = data.get("booking_type", "").strip() or data.get("service", "").strip()
    quantity = data.get("quantity", "")
    pickup_date = data.get("pickup_date", "").strip()
    pickup_address = data.get("pickup_address", "").strip()
    customer_name = data.get("customer_name", "").strip()
    phone_number = data.get("phone_number", "").strip()
    special_instructions = data.get("special_instructions", "").strip()
    express = data.get("express", False)
    discount_code = data.get("discount_code") or None
    weight = data.get("weight", 0)
    delivery_type = data.get("delivery_type", "Standard")
    total_amount = data.get("total_amount")

    if not customer_name or not phone_number or not booking_type or not quantity or not pickup_date or not pickup_address:
        return jsonify({"success": False, "message": "All booking fields are required."}), 400

    try:
        quantity = int(quantity)
        weight = float(weight or 0)
        total_amount = float(total_amount)
    except ValueError:
        return jsonify({"success": False, "message": "Quantity, weight, and total amount must be valid numbers."}), 400

    if quantity <= 0 or weight < 0 or total_amount <= 0:
        return jsonify({"success": False, "message": "Quantity, weight, and total amount must be valid values."}), 400

    calculations = calculate_booking_amount(booking_type, quantity, weight, express, discount_code, delivery_type)
    if round(calculations["total_amount"], 2) != round(total_amount, 2):
        total_amount = calculations["total_amount"]

    external_order_id = generate_order_id()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO bookings (order_id, user_id, customer_name, phone_number, booking_type, quantity, weight, pickup_date, pickup_address, delivery_type, express_delivery, price, discount_code, discount_amount, tax_amount, delivery_fee, total_amount, final_amount, status, payment_status, special_instructions) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            external_order_id,
            session["user_id"],
            customer_name,
            phone_number,
            booking_type,
            quantity,
            weight,
            pickup_date,
            pickup_address,
            delivery_type,
            int(bool(express)),
            calculations["total_amount"],
            discount_code,
            calculations["discount_amount"],
            calculations["tax_amount"],
            calculations["delivery_fee"],
            calculations["total_amount"],
            calculations["total_amount"],
            STATUS_STAGES[0],
            "pending",
            special_instructions,
        ),
    )
    conn.commit()
    booking_pk = cursor.lastrowid
    cursor.close()
    conn.close()

    create_payment_record(booking_pk, session["user_id"], calculations["total_amount"])
    create_tracking_record(booking_pk, STATUS_STAGES[0], "Booking created and pickup scheduled.")

    create_notification(
        session["user_id"],
        "order_placed",
        "Order Placed Successfully",
        f"Hello {customer_name}, your {booking_type} laundry order for {quantity} item(s) has been created. Pickup is scheduled for {pickup_date}.",
        booking_pk,
    )

    return jsonify({"success": True, "message": "Laundry booking created successfully.", "booking_id": booking_pk, "order_id": external_order_id})


@app.route('/my-bookings')
@login_required
def my_bookings_page():
    return render_template('my_bookings.html', user_name=session.get('user_name'))


@app.route('/api/bookings', methods=['GET'])
@login_required
def api_get_bookings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT order_id, id AS booking_id, user_id, customer_name, phone_number AS phone, booking_type AS laundry_type, quantity, weight, pickup_address, pickup_date, delivery_type, total_amount, discount_amount AS discount, discount_code, final_amount AS final_amount, payment_status, status AS order_status, created_at FROM bookings WHERE user_id = %s ORDER BY created_at DESC",
        (session['user_id'],)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    # normalize fields for frontend
    bookings = []
    for r in rows or []:
        # support both dict and sqlite3.Row
        def val(key, alt=None):
            try:
                if isinstance(r, dict):
                    return r.get(key, alt)
                return r[key]
            except Exception:
                return alt

        booking_id = val('booking_id') or val('id')
        total_amount = val('total_amount') or val('total') or 0
        final_amount = val('final_amount') or total_amount
        bookings.append({
            'booking_id': booking_id,
            'user_id': val('user_id'),
            'customer_name': val('customer_name'),
            'phone': val('phone') or val('phone_number'),
            'laundry_type': val('laundry_type') or val('booking_type'),
            'quantity': val('quantity'),
            'weight': val('weight'),
            'pickup_address': val('pickup_address'),
            'pickup_date': val('pickup_date'),
            'delivery_type': val('delivery_type'),
            'total_amount': total_amount,
            'discount': val('discount') or val('discount_amount') or 0,
            'final_amount': final_amount,
            'payment_status': val('payment_status'),
            'order_status': val('order_status') or val('status'),
            'created_at': val('created_at'),
        })
    return jsonify({'success': True, 'bookings': bookings})


@app.route('/api/bookings/<int:booking_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_booking_item(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM bookings WHERE id = %s', (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Booking not found.'}), 404

    # helper to access row/dict safely
    def bval(k, alt=None):
        try:
            if isinstance(booking, dict):
                return booking.get(k, alt)
            return booking[k]
        except Exception:
            return alt

    # ensure user owns booking
    if bval('user_id') != session['user_id']:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403

    if request.method == 'GET':
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'booking': booking})

    if request.method == 'PUT':
        data = request.get_json() or {}
        # Only allow updates if order not processed beyond pickup
        current_status = bval('status') or bval('order_status')
        if current_status and current_status not in (STATUS_STAGES[0],):
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Order cannot be updated once processing has started.'}), 400

        pickup_date = data.get('pickup_date')
        pickup_address = data.get('pickup_address')
        laundry_type = data.get('laundry_type')
        quantity = data.get('quantity')

        updates = []
        params = []
        if pickup_date:
            updates.append('pickup_date = %s')
            params.append(pickup_date)
        if pickup_address:
            updates.append('pickup_address = %s')
            params.append(pickup_address)
        if laundry_type:
            updates.append('booking_type = %s')
            params.append(laundry_type)
        if quantity is not None:
            try:
                q = int(quantity)
                updates.append('quantity = %s')
                params.append(q)
            except Exception:
                pass

        if not updates:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update.'}), 400

        params.append(booking_id)
        sql = f"UPDATE bookings SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(sql, tuple(params))
        conn.commit()
        cursor.close()
        conn.close()
        create_notification(session['user_id'], 'booking_updated', 'Booking updated', f'Your booking #{booking_id} was updated.', booking_id)
        return jsonify({'success': True, 'message': 'Booking updated successfully.'})

    if request.method == 'DELETE':
        # Allow delete only if not processed
        current_status = bval('status') or bval('order_status')
        if current_status and current_status not in (STATUS_STAGES[0],):
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Cannot cancel booking once processing has started.'}), 400

        cursor.execute('DELETE FROM bookings WHERE id = %s', (booking_id,))
        conn.commit()
        cursor.close()
        conn.close()
        create_notification(session['user_id'], 'booking_cancelled', 'Booking cancelled', f'Your booking #{booking_id} has been cancelled.')
        return jsonify({'success': True, 'message': 'Booking cancelled.'})



@app.route("/test-connection")
def test_connection():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Database connection successful.", "result": result})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/api/auth/signup", methods=["POST"])
def api_auth_signup():
    return api_signup()


@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = get_request_payload() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not name or not email or not phone or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters."}), 400

    if not phone.isdigit() or len(phone) < 8:
        return jsonify({"success": False, "message": "Enter a valid phone number."}), 400

    existing = query_user_by_email(email)
    if existing:
        return jsonify({"success": False, "message": "Email already exists."}), 400

    try:
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, phone, password) VALUES (%s, %s, %s, %s)",
            (name, email, phone, password_hash),
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as error:
        print(f"Signup error: {error}")
        return jsonify({"success": False, "message": "Failed to create account. Please try again."}), 500

    return jsonify({"success": True, "message": "Account created successfully.", "redirect": url_for("login")})


@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    return api_login()


@app.route("/api/login", methods=["POST"])
def api_login():
    data = get_request_payload() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    try:
        user = query_user_by_email(email)
    except Exception as error:
        print(f"Login error querying user: {error}")
        return jsonify({"success": False, "message": "Login failed. Please try again."}), 500

    if not user:
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    try:
        stored_password = user["password"]
    except Exception:
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), stored_password.encode("utf-8")):
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    session.permanent = True
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_email"] = user["email"]
    session["user_phone"] = user["phone"]

    return jsonify({"success": True, "message": "Logged in successfully.", "redirect": url_for("dashboard")})


@app.route("/api/user")
def api_user():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized."}), 401
    return jsonify({
        "success": True,
        "user": {
            "id": session["user_id"],
            "name": session["user_name"],
            "email": session["user_email"],
            "phone": session["user_phone"],
        },
    })


@app.route("/api/dashboard")
@login_required
def api_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT COUNT(*) AS active_orders FROM bookings WHERE user_id = %s AND status NOT IN ('Delivered', 'Cancelled')",
        (session["user_id"],),
    )
    active_orders = cursor.fetchone()["active_orders"]

    cursor.execute(
        "SELECT COUNT(*) AS completed_orders FROM bookings WHERE user_id = %s AND status = 'Delivered'",
        (session["user_id"],),
    )
    completed_orders = cursor.fetchone()["completed_orders"]

    cursor.execute(
        "SELECT COUNT(*) AS pending_pickup FROM bookings WHERE user_id = %s AND status = 'Pickup Scheduled'",
        (session["user_id"],),
    )
    pending_pickup = cursor.fetchone()["pending_pickup"]

    cursor.execute(
        "SELECT id, booking_type, quantity, total_amount, status, pickup_date FROM bookings WHERE user_id = %s ORDER BY created_at DESC LIMIT 5",
        (session["user_id"],),
    )
    recent_orders = cursor.fetchall()

    cursor.execute(
        "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = %s AND is_read = 0",
        (session["user_id"],),
    )
    unread_notifications = cursor.fetchone()["unread_count"]

    cursor.execute(
        "SELECT id, type, title, message, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 5",
        (session["user_id"],),
    )
    recent_notifications = cursor.fetchall()

    cursor.close()
    conn.close()

    activity_feed = [
        {
            "text": item["title"],
            "time": str(item["created_at"]),
        }
        for item in recent_notifications
    ]

    return jsonify({
        "success": True,
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "pending_pickup": pending_pickup,
        "recent_orders": recent_orders,
        "status_cards": [
            {"label": "Pending Pickup", "value": pending_pickup},
            {"label": "Active Orders", "value": active_orders},
            {"label": "Completed", "value": completed_orders},
            {"label": "Unread Notifications", "value": unread_notifications},
        ],
        "recent_notifications": recent_notifications,
        "activity": activity_feed,
        "unread_notifications": unread_notifications,
    })


@app.route("/payment", defaults={"order_ref": None})
@app.route("/payment/<order_ref>")
@login_required
def payment_page(order_ref=None):
    # Render the checkout page and allow frontend JS to fetch latest unpaid booking dynamically.
    return render_template("payment_checkout.html", order=None, order_id=order_ref or "")


@app.route("/api/payment/checkout", methods=["POST"])
@login_required
def api_payment_checkout():
    data = request.get_json() or {}
    order_ref = data.get("order_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if order_ref:
        booking_id = None
        try:
            booking_id = int(order_ref)
        except (TypeError, ValueError):
            booking_id = None

        if booking_id is not None:
            cursor.execute(
                "SELECT * FROM bookings WHERE user_id = %s AND (id = %s OR order_id = %s) LIMIT 1",
                (session["user_id"], booking_id, order_ref),
            )
        else:
            cursor.execute(
                "SELECT * FROM bookings WHERE user_id = %s AND order_id = %s LIMIT 1",
                (session["user_id"], order_ref),
            )
    else:
        cursor.execute(
            "SELECT * FROM bookings WHERE user_id = %s AND payment_status != 'paid' ORDER BY created_at DESC LIMIT 1",
            (session["user_id"],),
        )

    order = cursor.fetchone()
    cursor.close()
    conn.close()

    if not order:
        return jsonify({"success": False, "message": "No unpaid booking found."}), 404

    return jsonify({
        "success": True,
        "order": {
            "id": order["id"],
            "order_id": order.get("order_id") or str(order["id"]),
            "type": order["booking_type"],
            "quantity": order["quantity"],
            "weight": float(order.get("weight") or 0),
            "delivery_type": order["delivery_type"],
            "pickup_date": str(order["pickup_date"]),
            "pickup_address": order["pickup_address"],
            "express_delivery": bool(order.get("express_delivery")),
            "amount": float(order.get("total_amount") or order.get("price") or 0),
            "discount": float(order.get("discount_amount") or order.get("discount") or 0),
            "final_amount": float(order.get("final_amount") or order.get("total_amount") or order.get("price") or 0),
            "payment_status": order["payment_status"],
            "order_status": order["status"],
            "payment_method": order.get("payment_method") if "payment_method" in order else None,
            "user_name": session["user_name"],
            "user_email": session["user_email"],
            "user_phone": session["user_phone"],
        },
    })


@app.route("/api/payment/process", methods=["POST"])
@login_required
def api_payment_process():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    payment_method = data.get("payment_method", "").strip().lower()
    upi_id = data.get("upi_id", "").strip() if payment_method == "upi" else None

    if not order_id or not payment_method:
        return jsonify({"success": False, "message": "Order ID and payment method are required."}), 400

    if payment_method not in ["cod", "upi", "card"]:
        return jsonify({"success": False, "message": "Invalid payment method."}), 400

    if payment_method == "upi" and not upi_id:
        return jsonify({"success": False, "message": "UPI ID is required for UPI payments."}), 400

    normalized_method = "cash" if payment_method == "cod" else payment_method

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    booking_id = None
    try:
        booking_id = int(order_id)
    except (TypeError, ValueError):
        booking_id = None

    if booking_id is not None:
        cursor.execute(
            "SELECT * FROM bookings WHERE user_id = %s AND (id = %s OR order_id = %s) LIMIT 1",
            (session["user_id"], booking_id, order_id),
        )
    else:
        cursor.execute(
            "SELECT * FROM bookings WHERE user_id = %s AND order_id = %s LIMIT 1",
            (session["user_id"], order_id),
        )

    order = cursor.fetchone()

    if not order:
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": "Order not found."}), 404

    import uuid
    transaction_id = str(uuid.uuid4())[:12].upper()

    payment_status = "paid"
    payment_amount = float(order["total_amount"] or order["price"] or 0)
    reference_column = get_payment_column_name()
    current_status = order.get("status") or order.get("order_status") or STATUS_STAGES[0]

    try:
        if DB_CONFIG.get("type") == "sqlite":
            cursor.execute(
                f"INSERT INTO payments ({reference_column}, user_id, amount, payment_method, payment_status, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                (order_id, session["user_id"], payment_amount, normalized_method, payment_status, f"Payment record created via {normalized_method.upper()}"),
            )
        else:
            cursor.execute(
                "INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, upi_id, payment_status, notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (order_id, session["user_id"], payment_amount, normalized_method, transaction_id, upi_id, payment_status, f"Payment record created via {normalized_method.upper()}"),
            )

        cursor.execute(
            "UPDATE bookings SET payment_method = %s, payment_status = %s, status = %s WHERE id = %s",
            (normalized_method, payment_status, current_status, order["id"]),
        )
        conn.commit()
        cursor.close()
        conn.close()

        if payment_status == "paid":
            create_notification(
                session["user_id"],
                "payment",
                "Payment Received",
                f"Your payment for order #{order_id} has been completed successfully.",
                order_id,
            )
            create_tracking_record(order_id, "Payment Completed", "Payment completed successfully.")
            create_tracking_record(order_id, STATUS_STAGES[0], "Pickup is scheduled after payment confirmation.")
        else:
            create_notification(
                session["user_id"],
                "payment",
                "Cash on Delivery Registered",
                f"Cash on delivery was selected for order #{order_id}. Please pay when your laundry is delivered.",
                order_id,
            )

        return jsonify({
            "success": True,
            "message": f"Payment successful via {normalized_method.upper()}.",
            "transaction_id": transaction_id,
            "payment_status": payment_status,
        })
    except Exception as error:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/payment/history")
@login_required
def api_payment_history():
    reference_column = get_payment_column_name()
    join_clause = f"JOIN bookings b ON p.{reference_column} = b.id"
    columns = "p.id, p.user_id, p.amount, p.payment_method, p.transaction_id, p.payment_status, p.created_at, b.booking_type, b.quantity"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        f"SELECT {columns} FROM payments p {join_clause} WHERE p.user_id = %s ORDER BY p.created_at DESC",
        (session["user_id"],),
    )
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "payments": payments})


@app.route("/invoice/<order_ref>")
@login_required
def invoice(order_ref):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    reference_column = get_payment_column_name()

    booking_id = None
    try:
        booking_id = int(order_ref)
    except (TypeError, ValueError):
        booking_id = None

    if booking_id is not None:
        cursor.execute(
            f"SELECT b.*, p.transaction_id, p.payment_method FROM bookings b "
            f"LEFT JOIN payments p ON b.id = p.{reference_column} "
            "WHERE b.user_id = %s AND (b.id = %s OR b.order_id = %s) LIMIT 1",
            (session["user_id"], booking_id, order_ref),
        )
    else:
        cursor.execute(
            f"SELECT b.*, p.transaction_id, p.payment_method FROM bookings b "
            f"LEFT JOIN payments p ON b.id = p.{reference_column} "
            "WHERE b.user_id = %s AND b.order_id = %s LIMIT 1",
            (session["user_id"], order_ref),
        )

    order = cursor.fetchone()
    cursor.close()
    conn.close()

    if not order:
        return redirect(url_for("dashboard"))
    return render_template("invoice.html", order=order)


@app.route("/api/invoice/<order_ref>")
@login_required
def api_invoice(order_ref):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    reference_column = get_payment_column_name()

    booking_id = None
    try:
        booking_id = int(order_ref)
    except (TypeError, ValueError):
        booking_id = None

    if booking_id is not None:
        cursor.execute(
            f"SELECT b.*, p.transaction_id, p.payment_method, p.payment_status FROM bookings b "
            f"LEFT JOIN payments p ON b.id = p.{reference_column} "
            "WHERE b.user_id = %s AND (b.id = %s OR b.order_id = %s) LIMIT 1",
            (session["user_id"], booking_id, order_ref),
        )
    else:
        cursor.execute(
            f"SELECT b.*, p.transaction_id, p.payment_method, p.payment_status FROM bookings b "
            f"LEFT JOIN payments p ON b.id = p.{reference_column} "
            "WHERE b.user_id = %s AND b.order_id = %s LIMIT 1",
            (session["user_id"], order_ref),
        )

    order = cursor.fetchone()
    cursor.close()
    conn.close()

    if not order:
        return jsonify({"success": False, "message": "Order not found."}), 404

    return jsonify({
        "success": True,
        "invoice": {
            "order_id": order.get("order_id") or order["id"],
            "customer_name": session["user_name"],
            "customer_email": session["user_email"],
            "customer_phone": session["user_phone"],
            "booking_type": order["booking_type"],
            "quantity": order["quantity"],
            "pickup_date": str(order["pickup_date"]),
            "pickup_address": order["pickup_address"],
            "express_delivery": bool(order["express_delivery"]),
            "amount": float(order["total_amount"] or order["price"]),
            "payment_method": order.get("payment_method") or "Not paid",
            "payment_status": order["payment_status"] or "pending",
            "transaction_id": order["transaction_id"] or "N/A",
            "created_at": str(order["created_at"]),
        },
    })


@app.route("/payment-history")
@login_required
def payment_history():
    return render_template("payment_history.html")


@app.route("/notifications")
@login_required
def notifications_page():
    return render_template("notifications.html")


@app.route("/admin/api/payments")
@admin_login_required
def admin_api_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    reference_column = get_payment_column_name()
    cursor.execute(
        f"SELECT p.*, u.name, u.email, b.booking_type FROM payments p "
        "JOIN users u ON p.user_id = u.id "
        f"JOIN bookings b ON p.{reference_column} = b.id "
        "ORDER BY p.created_at DESC"
    )
    payments = cursor.fetchall()
    cursor.execute("SELECT COUNT(*) AS total_payments, IFNULL(SUM(amount), 0) AS total_collected FROM payments WHERE payment_status = 'completed'")
    summary = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "payments": payments,
        "summary": {
            "total_payments": summary["total_payments"],
            "total_collected": float(summary["total_collected"]),
        },
    })


# Notification Routes
@app.route("/api/notifications")
@login_required
def api_notifications():
    """Fetch user notifications."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (session["user_id"],)
    )
    notifications = cursor.fetchall()
    
    # Get unread count
    cursor.execute(
        "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = %s AND is_read = 0",
        (session["user_id"],)
    )
    unread = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "notifications": notifications,
        "unread_count": unread["unread_count"]
    })


@app.route("/api/notifications/mark-read", methods=["POST"])
@login_required
def api_mark_notification_read():
    """Mark a notification as read."""
    data = request.get_json() or {}
    notification_id = data.get("notification_id")

    if not notification_id:
        return jsonify({"success": False, "message": "Notification ID is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = %s AND user_id = %s",
        (notification_id, session["user_id"])
    )
    conn.commit()
    updated = cursor.rowcount
    cursor.close()
    conn.close()

    if not updated:
        return jsonify({"success": False, "message": "Notification not found."}), 404

    return jsonify({"success": True, "message": "Notification marked as read."})


@app.route("/api/notifications/mark-all-read", methods=["POST"])
@login_required
def api_mark_all_notifications_read():
    """Mark all notifications as read."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE notifications SET is_read = 1 WHERE user_id = %s AND is_read = 0",
        (session["user_id"],)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "All notifications marked as read."})


@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
@login_required
def api_delete_notification(notification_id):
    """Delete a notification."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM notifications WHERE id = %s AND user_id = %s",
        (notification_id, session["user_id"])
    )
    conn.commit()
    deleted = cursor.rowcount
    cursor.close()
    conn.close()

    if not deleted:
        return jsonify({"success": False, "message": "Notification not found."}), 404

    return jsonify({"success": True, "message": "Notification deleted."})


# Analytics Routes
@app.route("/analytics")
@admin_login_required
def analytics_page():
    """Render analytics page."""
    return render_template("analytics.html")


@app.route("/api/analytics/summary")
@admin_login_required
def api_analytics_summary():
    """Get summary statistics for analytics."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total bookings
        cursor.execute("SELECT COUNT(*) AS count FROM bookings")
        total_bookings = cursor.fetchone()['count']
        
        # Total revenue (completed payments)
        cursor.execute("SELECT IFNULL(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'completed'")
        total_revenue = float(cursor.fetchone()['total'])
        
        # Active orders (not delivered)
        cursor.execute("SELECT COUNT(*) AS count FROM bookings WHERE status != 'Delivered'")
        active_orders = cursor.fetchone()['count']
        
        # Completed orders
        cursor.execute("SELECT COUNT(*) AS count FROM bookings WHERE status = 'Delivered'")
        completed_orders = cursor.fetchone()['count']
        
        # Total users
        cursor.execute("SELECT COUNT(*) AS count FROM users")
        total_users = cursor.fetchone()['count']
        
        # Average order value
        cursor.execute("SELECT IFNULL(AVG(price), 0) AS avg FROM bookings")
        avg_order_value = float(cursor.fetchone()['avg'])
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "summary": {
                "total_bookings": total_bookings,
                "total_revenue": total_revenue,
                "active_orders": active_orders,
                "completed_orders": completed_orders,
                "total_users": total_users,
                "avg_order_value": avg_order_value
            }
        })
    except Exception as e:
        print(f"Error fetching analytics summary: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/analytics/revenue")
@admin_login_required
def api_analytics_revenue():
    """Get monthly revenue data."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get revenue for last 12 months
        cursor.execute("""
            SELECT 
                DATE_TRUNC(DATE(created_at), MONTH) AS month,
                IFNULL(SUM(amount), 0) AS revenue
            FROM payments
            WHERE payment_status = 'completed' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_TRUNC(DATE(created_at), MONTH)
            ORDER BY month ASC
        """)
        
        # If DATE_TRUNC doesn't work, use alternative
        try:
            revenue_data = cursor.fetchall()
        except:
            cursor.close()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    IFNULL(SUM(amount), 0) AS revenue
                FROM payments
                WHERE payment_status = 'completed' 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            """)
            revenue_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Format data for chart
        months = [item['month'] if isinstance(item['month'], str) else item['month'].strftime('%Y-%m') for item in revenue_data]
        revenues = [float(item['revenue']) for item in revenue_data]
        
        return jsonify({
            "success": True,
            "months": months,
            "revenues": revenues
        })
    except Exception as e:
        print(f"Error fetching revenue data: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/analytics/orders")
@admin_login_required
def api_analytics_orders():
    """Get monthly orders count."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get orders for last 12 months
        cursor.execute("""
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS order_count,
                SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS completed
            FROM bookings
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        """)
        
        orders_data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        months = [item['month'] for item in orders_data]
        total_orders = [item['order_count'] for item in orders_data]
        completed = [item['completed'] for item in orders_data]
        
        return jsonify({
            "success": True,
            "months": months,
            "total_orders": total_orders,
            "completed": completed
        })
    except Exception as e:
        print(f"Error fetching orders data: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/analytics/services")
@admin_login_required
def api_analytics_services():
    """Get top services used."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get service popularity
        cursor.execute("""
            SELECT 
                booking_type,
                COUNT(*) AS count,
                AVG(price) AS avg_price
            FROM bookings
            GROUP BY booking_type
            ORDER BY count DESC
            LIMIT 10
        """)
        
        services_data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        services = [item['booking_type'] for item in services_data]
        counts = [item['count'] for item in services_data]
        avg_prices = [float(item['avg_price']) for item in services_data]
        
        return jsonify({
            "success": True,
            "services": services,
            "counts": counts,
            "avg_prices": avg_prices
        })
    except Exception as e:
        print(f"Error fetching services data: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/analytics/bookings-trend")
@admin_login_required
def api_analytics_bookings_trend():
    """Get monthly bookings trend."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get bookings trend for last 12 months
        cursor.execute("""
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS bookings,
                SUM(CASE WHEN express_delivery = 1 THEN 1 ELSE 0 END) AS express
            FROM bookings
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        """)
        
        bookings_data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        months = [item['month'] for item in bookings_data]
        regular_bookings = [item['bookings'] - item['express'] for item in bookings_data]
        express_bookings = [item['express'] for item in bookings_data]
        
        return jsonify({
            "success": True,
            "months": months,
            "regular": regular_bookings,
            "express": express_bookings
        })
    except Exception as e:
        print(f"Error fetching bookings trend: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
