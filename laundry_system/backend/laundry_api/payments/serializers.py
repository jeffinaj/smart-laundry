from rest_framework import serializers
from laundry_api.payments.models import Payment, PaymentHistory


class PaymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentHistory
        fields = ['id', 'status', 'message', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    history = PaymentHistorySerializer(read_only=True, many=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'payment_id', 'booking', 'user', 'amount', 'tax',
                  'total_amount', 'payment_method', 'status', 'transaction_id',
                  'receipt_url', 'payment_date', 'history', 'created_at', 'updated_at']
        read_only_fields = ['id', 'payment_id', 'user', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['booking', 'payment_method', 'amount']
    
    def create(self, validated_data):
        payment = Payment.objects.create(
            user=self.context['request'].user,
            total_amount=validated_data['amount'],
            tax=validated_data['amount'] * 0.18,
            **validated_data
        )
        # Add initial payment history entry
        PaymentHistory.objects.create(
            payment=payment,
            status='pending',
            message='Payment initiated'
        )
        return payment


class PaymentStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['status', 'transaction_id']
