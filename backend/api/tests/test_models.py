from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from ..models import Message, Recording, Room, RoomParticipant, ScheduledMeeting, SharedFile


class RoomModelTests(TestCase):
    def test_str_returns_room_name(self):
        room = Room.objects.create(name='Standup Room')
        self.assertEqual(str(room), 'Standup Room')

    def test_deleting_user_keeps_room_with_null_creator(self):
        user = User.objects.create_user(username='creator', password='pw123456')
        room = Room.objects.create(name='Orphaned Room', created_by=user)

        user.delete()
        room.refresh_from_db()

        self.assertIsNone(room.created_by)

    def test_pinned_defaults_to_false(self):
        room = Room.objects.create(name='Unpinned Room')
        self.assertFalse(room.pinned)


class RoomParticipantModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='participant', password='pw123456')
        self.room = Room.objects.create(name='Team Room')

    def test_str_includes_display_name_and_room(self):
        participant = RoomParticipant.objects.create(
            room=self.room, user=self.user, display_name='Participant'
        )
        self.assertEqual(str(participant), 'Participant in Team Room')

    def test_user_cannot_join_the_same_room_twice(self):
        RoomParticipant.objects.create(room=self.room, user=self.user, display_name='Participant')

        with self.assertRaises(IntegrityError):
            RoomParticipant.objects.create(room=self.room, user=self.user, display_name='Participant Again')


class MessageModelTests(TestCase):
    def test_str_includes_sender_and_room(self):
        user = User.objects.create_user(username='sender', password='pw123456')
        room = Room.objects.create(name='Chat Room')
        message = Message.objects.create(
            room=room, user=user, display_name='Sender',
            encrypted_content='ciphertext', iv='iv-value'
        )
        self.assertEqual(str(message), 'Msg from Sender in Chat Room')

    def test_deleting_room_cascades_to_messages(self):
        user = User.objects.create_user(username='sender', password='pw123456')
        room = Room.objects.create(name='Chat Room')
        Message.objects.create(
            room=room, user=user, display_name='Sender',
            encrypted_content='ciphertext', iv='iv-value'
        )

        room.delete()

        self.assertEqual(Message.objects.count(), 0)


class SharedFileModelTests(TestCase):
    def test_str_includes_file_name_and_room(self):
        user = User.objects.create_user(username='uploader', password='pw123456')
        room = Room.objects.create(name='File Room')
        upload = SimpleUploadedFile('doc.bin', b'data', content_type='application/octet-stream')

        shared_file = SharedFile.objects.create(
            room=room, user=user, display_name='Uploader',
            file_name='doc.txt', file_size=4, file_type='text/plain',
            file=upload, iv='iv-value'
        )

        self.assertEqual(str(shared_file), 'File doc.txt in File Room')


class RecordingModelTests(TestCase):
    def test_str_includes_room_name_and_timestamp(self):
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        upload = SimpleUploadedFile('call.webm', b'encrypted-bytes', content_type='application/octet-stream')

        recording = Recording.objects.create(
            room=room, created_by=user, display_name='Recording - today',
            file=upload, file_size=15, mime_type='video/webm', iv='iv-value', duration_seconds=42
        )

        self.assertIn('Standup Room', str(recording))

    def test_duration_seconds_defaults_to_zero(self):
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        upload = SimpleUploadedFile('call.webm', b'x', content_type='application/octet-stream')

        recording = Recording.objects.create(
            room=room, created_by=user, display_name='Recording', file=upload,
            file_size=1, mime_type='video/webm',
        )

        self.assertEqual(recording.duration_seconds, 0)

    def test_deleting_room_cascades_to_recordings(self):
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        upload = SimpleUploadedFile('call.webm', b'x', content_type='application/octet-stream')
        Recording.objects.create(
            room=room, created_by=user, display_name='Recording', file=upload,
            file_size=1, mime_type='video/webm',
        )

        room.delete()

        self.assertEqual(Recording.objects.count(), 0)

    def test_deleting_creator_cascades_to_recordings(self):
        # Unlike Room.created_by (SET_NULL), a Recording is worthless without
        # its owner, so it cascades — there's no "orphaned recording" concept.
        user = User.objects.create_user(username='recorder', password='pw123456')
        room = Room.objects.create(name='Standup Room')
        upload = SimpleUploadedFile('call.webm', b'x', content_type='application/octet-stream')
        Recording.objects.create(
            room=room, created_by=user, display_name='Recording', file=upload,
            file_size=1, mime_type='video/webm',
        )

        user.delete()

        self.assertEqual(Recording.objects.count(), 0)


class ScheduledMeetingModelTests(TestCase):
    def test_str_includes_room_name_and_schedule(self):
        user = User.objects.create_user(username='organizer', password='pw123456')
        room = Room.objects.create(name='Design Sync')
        scheduled_at = timezone.now()

        meeting = ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=scheduled_at)

        self.assertIn('Design Sync', str(meeting))

    def test_duration_minutes_defaults_to_sixty(self):
        user = User.objects.create_user(username='organizer', password='pw123456')
        room = Room.objects.create(name='Design Sync')

        meeting = ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=timezone.now())

        self.assertEqual(meeting.duration_minutes, 60)

    def test_room_can_only_have_one_scheduled_meeting(self):
        user = User.objects.create_user(username='organizer', password='pw123456')
        room = Room.objects.create(name='Design Sync')
        ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=timezone.now())

        with self.assertRaises(IntegrityError):
            ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=timezone.now())

    def test_deleting_room_cascades_to_scheduled_meeting(self):
        user = User.objects.create_user(username='organizer', password='pw123456')
        room = Room.objects.create(name='Design Sync')
        ScheduledMeeting.objects.create(room=room, created_by=user, scheduled_at=timezone.now())

        room.delete()

        self.assertEqual(ScheduledMeeting.objects.count(), 0)
