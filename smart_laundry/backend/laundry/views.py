import json
from datetime import datetime
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import LaundryBooking, Payment, Notification, OrderTracking


def _json_response(data, status=200):
    return JsonResponse(data, status=status, safe=False)


def _booking_payload(booking):
    return {
        'id': booking.id,
        'name': booking.name,
        'room_number': booking.room_number,
        'phone_number': booking.phone_number,
        'clothes_type': booking.clothes_type,
        'clothes_count': booking.clothes_count,
        'wash_type': booking.wash_type,
        'pickup_date': booking.pickup_date.isoformat(),
        'pickup_time': booking.pickup_time.strftime('%H:%M'),
        'special_instructions': booking.special_instructions,
        'total_amount': float(booking.total_amount),
        'status': booking.status,
        'created_at': booking.created_at.isoformat(),
        'payment_status': booking.payment.status if hasattr(booking, 'payment') else 'pending',
        'tracking': [
            {'status': t.status, 'updated_at': t.updated_at.isoformat()}
            for t in booking.trackings.all()
        ],
    }


@ensure_csrf_cookie
def register_view(request):
    if request.method != 'POST':
        return _json_response({'error': 'Method not allowed'}, status=405)
    body = json.loads(request.body.decode('utf-8'))
    username = body.get('username')
    password = body.get('password')
    email = body.get('email')
    if not username or not password:
        return _json_response({'error': 'Username and password are required'}, status=400)
    if User.objects.filter(username=username).exists():
        return _json_response({'error': 'Username already exists'}, status=400)
    user = User.objects.create_user(username=username, email=email, password=password)
    login(request, user)
    return _json_response({'success': True, 'username': user.username})


@ensure_csrf_cookie
def login_view(request):
    if request.method != 'POST':
        return _json_response({'error': 'Method not allowed'}, status=405)
    body = json.loads(request.body.decode('utf-8'))
    username = body.get('username')
    password = body.get('password')
    user = authenticate(request, username=username, password=password)
    if user is None:
        return _json_response({'error': 'Invalid credentials'}, status=401)
    login(request, user)
    return _json_response({'success': True, 'username': user.username})


@login_required
def logout_view(request):
    logout(request)
    return _json_response({'success': True})


@login_required
def csrf_cookie_view(request):
    get_token(request)
    return _json_response({'csrf': True})


@login_required
def dashboard_view(request):
    user = request.user
    bookings = LaundryBooking.objects.filter(user=user)
    total_bookings = bookings.count()
    completed_orders = bookings.filter(status='delivered').count()
    pending_orders = bookings.exclude(status='delivered').count()
    payments = Payment.objects.filter(booking__user=user)
    total_paid = float(payments.filter(status='paid').aggregate(total=Sum('amount')).get('total') or 0)
    recent_notifications = list(
        Notification.objects.filter(user=user).order_by('-created_at')[:5].values('message', 'is_read', 'created_at')
    )
    return _json_response({
        'user': user.username,
        'total_bookings': total_bookings,
        'completed_orders': completed_orders,
        'pending_orders': pending_orders,
        'payment_summary': {
            'total_paid': total_paid,
            'payment_count': payments.count(),
        },
        'recent_notifications': recent_notifications,
        'recent_bookings': [
            _booking_payload(b) for b in bookings.order_by('-created_at')[:5]
        ],
    })


@login_required
def bookings_view(request):
    if request.method == 'GET':
        bookings = LaundryBooking.objects.filter(user=request.user).order_by('-created_at')
        return _json_response([_booking_payload(b) for b in bookings])

    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        try:
            booking = LaundryBooking.objects.create(
                user=request.user,
                name=data['name'],
                room_number=data['room_number'],
                phone_number=data['phone_number'],
                clothes_type=data['clothes_type'],
                clothes_count=int(data['clothes_count']),
                wash_type=data['wash_type'],
                pickup_date=datetime.fromisoformat(data['pickup_date']).date(),
                pickup_time=datetime.fromisoformat(data['pickup_time']).time(),
                special_instructions=data.get('special_instructions', ''),
                total_amount=float(data['total_amount']),
            )
        except Exception as exc:
            return _json_response({'error': str(exc)}, status=400)
        return _json_response(_booking_payload(booking), status=201)

    return _json_response({'error': 'Method not allowed'}, status=405)


@login_required
def booking_detail_view(request, pk):
    booking = get_object_or_404(LaundryBooking, pk=pk, user=request.user)
    if request.method == 'GET':
        return _json_response(_booking_payload(booking))

    if request.method == 'PUT':
        data = json.loads(request.body.decode('utf-8'))
        for field in ['name', 'room_number', 'phone_number', 'clothes_type', 'clothes_count', 'wash_type', 'pickup_date', 'pickup_time', 'special_instructions']:
            if field in data:
                setattr(booking, field, data[field])
        if 'total_amount' in data:
            booking.total_amount = float(data['total_amount'])
        booking.save()
        return _json_response(_booking_payload(booking))

    if request.method == 'DELETE':
        booking.delete()
        return _json_response({'success': True})

    return _json_response({'error': 'Method not allowed'}, status=405)


@login_required
def payments_view(request):
    payments = Payment.objects.filter(booking__user=request.user).order_by('-created_at')
    data = [
        {
            'booking_id': p.booking.id,
            'amount': float(p.amount),
            'status': p.status,
            'created_at': p.created_at.isoformat(),
            'paid_at': p.paid_at.isoformat() if p.paid_at else None,
        }
        for p in payments
    ]
    return _json_response(data)


@login_required
def notifications_view(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    return _json_response([
        {
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in notifications
    ])


@login_required
def order_tracking_view(request, booking_id):
    booking = get_object_or_404(LaundryBooking, pk=booking_id, user=request.user)
    history = [
        {'status': t.status, 'updated_at': t.updated_at.isoformat()}
        for t in booking.trackings.all()
    ]
    return _json_response({'booking_id': booking.id, 'tracking': history, 'current_status': booking.status})


def _is_admin(user):
    return user.is_staff or user.is_superuser


@user_passes_test(_is_admin)
@csrf_exempt
def admin_send_notification(request):
    if request.method != 'POST':
        return _json_response({'error': 'Method not allowed'}, status=405)
    data = json.loads(request.body.decode('utf-8'))
    target_user = get_object_or_404(User, pk=int(data.get('user_id', 0)))
    message = data.get('message', '')
    if not message:
        return _json_response({'error': 'Message required'}, status=400)
    Notification.objects.create(user=target_user, message=message)
    return _json_response({'success': True})
