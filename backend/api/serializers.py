from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room, RoomParticipant, Message, SharedFile, Recording, ScheduledMeeting

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class RoomSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Room
        fields = ('id', 'name', 'description', 'created_by', 'created_by_name', 'created_at', 'is_active', 'pinned')
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

class RecordingSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    room_name = serializers.ReadOnlyField(source='room.name')

    class Meta:
        model = Recording
        fields = (
            'id', 'room', 'room_name', 'created_by', 'created_by_name', 'display_name',
            'file_url', 'file_size', 'mime_type', 'iv', 'duration_seconds', 'created_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class ScheduledMeetingSerializer(serializers.ModelSerializer):
    room_id = serializers.UUIDField(source='room.id', read_only=True)
    room_name = serializers.ReadOnlyField(source='room.name')
    room_description = serializers.ReadOnlyField(source='room.description')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = ScheduledMeeting
        fields = (
            'id', 'room_id', 'room_name', 'room_description', 'created_by', 'created_by_name',
            'scheduled_at', 'duration_minutes', 'created_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at')
