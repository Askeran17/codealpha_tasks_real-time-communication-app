from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room, RoomParticipant, Message, SharedFile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class RoomSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Room
        fields = ('id', 'name', 'description', 'created_by', 'created_by_name', 'created_at', 'is_active')
        read_only_fields = ('id', 'created_by', 'created_at')

class RoomParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomParticipant
        fields = ('id', 'room', 'user', 'display_name', 'joined_at')

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'room', 'user', 'display_name', 'encrypted_content', 'iv', 'created_at')

class SharedFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SharedFile
        fields = ('id', 'room', 'user', 'display_name', 'file_name', 'file_size', 'file_type', 'file_url', 'iv', 'created_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
