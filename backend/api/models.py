import uuid
from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    pinned = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class RoomParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_memberships')
    display_name = models.CharField(max_length=255)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f"{self.display_name} in {self.room.name}"

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    display_name = models.CharField(max_length=255)
    encrypted_content = models.TextField()
    iv = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg from {self.display_name} in {self.room.name}"

class SharedFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='files')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    display_name = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=255)
    file = models.FileField(upload_to='shared_files/')
    iv = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File {self.file_name} in {self.room.name}"

class Recording(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='recordings')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recordings')
    display_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='recordings/')
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=255)
    iv = models.CharField(max_length=255, blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recording of {self.room.name} ({self.created_at})"

class ScheduledMeeting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='scheduled_meeting')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_meetings')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.room.name} at {self.scheduled_at}"
