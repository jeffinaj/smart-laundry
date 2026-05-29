from rest_framework import serializers
from laundry_api.users.models import CustomUser, AdminUser


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'phone_number', 'hostel_apartment']
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'hostel_apartment', 'address', 'city',
                  'profile_image', 'is_verified', 'total_bookings', 
                  'total_spent', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total_bookings', 'total_spent', 'created_at', 'updated_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'phone_number', 'hostel_apartment',
                  'address', 'city', 'profile_image']


class AdminUserSerializer(serializers.ModelSerializer):
    user_details = UserDetailSerializer(source='user', read_only=True)
    
    class Meta:
        model = AdminUser
        fields = ['id', 'user', 'user_details', 'role', 'permissions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
