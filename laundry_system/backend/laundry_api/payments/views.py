from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from laundry_api.payments.models import Payment, PaymentHistory
from laundry_api.payments.serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentStatusUpdateSerializer
)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = PaymentCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            payment = serializer.save()
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """Confirm payment after successful transaction"""
        payment = self.get_object()
        
        if payment.status != 'pending':
            return Response({'error': 'Payment already processed'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = 'completed'
        payment.payment_date = timezone.now()
        payment.save()
        
        # Add payment history entry
        PaymentHistory.objects.create(
            payment=payment,
            status='completed',
            message='Payment successful'
        )
        
        # Update booking status
        booking = payment.booking
        booking.status = 'confirmed'
        booking.save()
        
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Process refund for payment"""
        payment = self.get_object()
        
        if payment.status != 'completed':
            return Response({'error': 'Can only refund completed payments'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = 'refunded'
        payment.save()
        
        PaymentHistory.objects.create(
            payment=payment,
            status='refunded',
            message=f'Refund initiated - Amount: {payment.total_amount}'
        )
        
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """Get payment history for user"""
        payments = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def payment_stats(self, request):
        """Get payment statistics"""
        payments = self.get_queryset()
        
        stats = {
            'total_payments': payments.count(),
            'completed': payments.filter(status='completed').count(),
            'pending': payments.filter(status='pending').count(),
            'failed': payments.filter(status='failed').count(),
            'total_spent': float(payments.filter(status='completed').aggregate(
                total=models.Sum('total_amount'))['total'] or 0),
        }
        return Response(stats)
