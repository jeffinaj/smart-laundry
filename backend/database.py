import os
import sqlite3
from mysql.connector import pooling, Error

# Check if we should use SQLite instead of MySQL
USE_SQLITE = os.environ.get("USE_SQLITE", "true").lower() in ("true", "1", "yes")

DB_CONFIG = None
SQLITE_DB = "smart_laundry.db"

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        if params is None:
            if isinstance(query, str) and "%s" in query:
                query = query.replace("%s", "?")
            return self._cursor.execute(query)

        if isinstance(query, str) and "%s" in query:
            query = query.replace("%s", "?")
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_of_params):
        if isinstance(query, str) and "%s" in query:
            query = query.replace("%s", "?")
        return self._cursor.executemany(query, seq_of_params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        return self._cursor.close()

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, dictionary=False):
        return SQLiteCursorWrapper(self._conn.cursor())

    def commit(self):
        return self._conn.commit()

    def close(self):
        return self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


if USE_SQLITE:
    # SQLite configuration
    DB_CONFIG = {
        "type": "sqlite",
        "database": os.environ.get("SQLITE_DATABASE", SQLITE_DB),
    }
else:
    # MySQL configuration
    DB_CONFIG = {
        "type": "mysql",
        "host": os.environ.get("MYSQL_HOST", "localhost"),
        "user": os.environ.get("MYSQL_USER", "root"),
        "password": os.environ.get("MYSQL_PASSWORD", "password"),
        "database": os.environ.get("MYSQL_DATABASE", "smart_laundry_db"),
        "port": int(os.environ.get("MYSQL_PORT", 3306)),
    }

POOL = None


def ensure_sqlite_schema(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'")
    if cursor.fetchone():
        existing_columns = [row[1] for row in cursor.execute("PRAGMA table_info(bookings)").fetchall()]
        if "order_id" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN order_id TEXT NOT NULL DEFAULT ''")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_order_id ON bookings(order_id)")
        if "customer_name" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN customer_name TEXT NOT NULL DEFAULT ''")
        if "phone_number" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN phone_number TEXT NOT NULL DEFAULT ''")
        if "weight" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN weight REAL DEFAULT 0.00")
        if "delivery_type" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN delivery_type TEXT DEFAULT 'Standard'")
        if "price" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN price REAL NOT NULL DEFAULT 0.00")
        if "discount_code" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN discount_code TEXT")
        if "discount_amount" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN discount_amount REAL DEFAULT 0.00")
        if "tax_amount" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN tax_amount REAL DEFAULT 0.00")
        if "delivery_fee" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN delivery_fee REAL DEFAULT 50.00")
        if "total_amount" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN total_amount REAL DEFAULT 0.00")
        if "final_amount" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN final_amount REAL DEFAULT 0.00")
        if "special_instructions" not in existing_columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN special_instructions TEXT")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tracking'")
    if not cursor.fetchone():
        cursor.execute(
            "CREATE TABLE tracking (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, current_status TEXT NOT NULL, notes TEXT, updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES bookings(id))"
        )
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'")
    if not cursor.fetchone():
        cursor.execute(
            "CREATE TABLE admins (admin_id INTEGER PRIMARY KEY AUTOINCREMENT, admin_name TEXT NOT NULL, admin_email TEXT NOT NULL UNIQUE, admin_password TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        )
    conn.commit()
    cursor.close()


def init_sqlite_db():
    db_path = DB_CONFIG["database"]
    full_db_path = os.path.abspath(db_path)
    os.makedirs(os.path.dirname(full_db_path), exist_ok=True) if os.path.dirname(full_db_path) else None

    conn = sqlite3.connect(full_db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        schema_path = os.path.join(os.path.dirname(__file__), "..", "database", "sqlite_schema.sql")
        with open(schema_path, "r", encoding="utf-8") as schema_file:
            schema_sql = schema_file.read()
        cursor.executescript(schema_sql)
        conn.commit()
    cursor.close()
    ensure_sqlite_schema(conn)
    conn.close()


def ensure_mysql_schema(conn):
    try:
        cursor = conn.cursor()
        cursor.execute("SHOW COLUMNS FROM bookings LIKE 'order_id'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE bookings ADD COLUMN order_id VARCHAR(24) NOT NULL UNIQUE")
        cursor.execute("SHOW COLUMNS FROM bookings LIKE 'final_amount'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00")
        cursor.close()
        conn.commit()
    except Exception as exc:
        print(f"MySQL schema ensure failed: {exc}")


def get_connection_pool():
    global POOL
    if POOL is None:
        try:
            if USE_SQLITE:
                # For SQLite, we don't use a pool, just return a connection object marker
                POOL = {"type": "sqlite"}
            else:
                POOL = pooling.MySQLConnectionPool(
                    pool_name="smart_laundry_pool",
                    pool_size=5,
                    pool_reset_session=True,
                    host=DB_CONFIG["host"],
                    user=DB_CONFIG["user"],
                    password=DB_CONFIG["password"],
                    database=DB_CONFIG["database"],
                    port=DB_CONFIG["port"],
                )
        except Error as exc:
            raise RuntimeError(f"Unable to create connection pool: {exc}") from exc
    return POOL


def get_db_connection():
    try:
        if USE_SQLITE:
            init_sqlite_db()
            conn = sqlite3.connect(DB_CONFIG["database"])
            conn.row_factory = sqlite3.Row
            return SQLiteConnectionWrapper(conn)
        else:
            pool = get_connection_pool()
            conn = pool.get_connection()
            ensure_mysql_schema(conn)
            return conn
    except Exception as exc:
        raise RuntimeError(f"Database connection failed: {exc}") from exc

