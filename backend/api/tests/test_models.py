from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase

from ..models import Message, Room, RoomParticipant, SharedFile


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
