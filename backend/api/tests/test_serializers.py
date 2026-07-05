from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from ..models import Recording, Room, ScheduledMeeting
from ..serializers import RecordingSerializer, RoomSerializer, ScheduledMeetingSerializer, UserSerializer


class UserSerializerTests(TestCase):
    def test_exposes_expected_fields_only(self):
        user = User.objects.create_user(
            username='jane', password='pw123456', email='jane@example.com', first_name='Jane'
        )

        data = UserSerializer(user).data

        self.assertEqual(set(data.keys()), {'id', 'username', 'email', 'first_name', 'last_name'})
        self.assertEqual(data['username'], 'jane')
        self.assertNotIn('password', data)


class RoomSerializerTests(TestCase):
    def test_created_by_name_reflects_creator_username(self):
        user = User.objects.create_user(username='creator', password='pw123456')
        room = Room.objects.create(name='Design Review', created_by=user)

        data = RoomSerializer(room).data

        self.assertEqual(data['created_by_name'], 'creator')
        self.assertEqual(data['name'], 'Design Review')

    def test_created_by_and_created_at_are_read_only(self):
        user = User.objects.create_user(username='creator', password='pw123456')
        serializer = RoomSerializer(data={
            'name': 'New Room',
            'description': 'desc',
            'created_by': user.id,
            'created_at': '2020-01-01T00:00:00Z',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('created_by', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)

    def test_pinned_defaults_to_false_in_serialized_output(self):
        room = Room.objects.create(name='Fresh Room')
        data = RoomSerializer(room).data
        self.assertFalse(data['pinned'])


class RecordingSerializerTests(TestCase):
    def test_exposes_file_url_room_name_and_creator_name(self):
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        upload = SimpleUploadedFile('call.webm', b'encrypted-bytes', content_type='application/octet-stream')
        recording = Recording.objects.create(
            room=room, created_by=user, display_name='Recording - today',
            file=upload, file_size=15, mime_type='video/webm', iv='iv-value', duration_seconds=42
        )

        data = RecordingSerializer(recording).data

        self.assertEqual(data['room_name'], 'Standup Room')
        self.assertEqual(data['created_by_name'], 'recorder')
        self.assertEqual(data['duration_seconds'], 42)
        self.assertIsNotNone(data['file_url'])

    def test_created_by_and_created_at_are_read_only(self):
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        serializer = RecordingSerializer(data={
            'room': room.id,
            'created_by': user.id,
            'created_at': '2020-01-01T00:00:00Z',
            'display_name': 'Recording',
            'file_size': 10,
            'mime_type': 'video/webm',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('created_by', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)


class ScheduledMeetingSerializerTests(TestCase):
    def test_flattens_room_fields_onto_the_meeting(self):
        user = User.objects.create_user(username='organizer', password='pw123456')
        room = Room.objects.create(name='Design Sync', description='Weekly design chat')
        meeting = ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=timezone.now())

        data = ScheduledMeetingSerializer(meeting).data

        self.assertEqual(data['room_id'], str(room.id))
        self.assertEqual(data['room_name'], 'Design Sync')
        self.assertEqual(data['room_description'], 'Weekly design chat')
        self.assertEqual(data['created_by_name'], 'organizer')
        self.assertEqual(data['duration_minutes'], 60)
