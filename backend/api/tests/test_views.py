from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from ..models import Message, Recording, Room, ScheduledMeeting, SharedFile


class AuthViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.me_url = reverse('me')

        self.user_data = {
            'username': 'testuser',
            'password': 'testpassword123',
            'email': 'test@example.com',
            'display_name': 'Test User'
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_register_requires_username_and_password(self):
        response = self.client.post(self.register_url, {'username': 'onlyusername'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicate_username(self):
        self.client.post(self.register_url, self.user_data, format='json')
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(username='testuser').count(), 1)

    def test_login_user(self):
        self.client.post(self.register_url, self.user_data, format='json')

        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_rejects_wrong_password(self):
        self.client.post(self.register_url, self.user_data, format='json')

        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        reg_response = self.client.post(self.register_url, self.user_data, format='json')
        token = reg_response.data['token']

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_patch_me_updates_display_name_and_email(self):
        reg_response = self.client.post(self.register_url, self.user_data, format='json')
        token = reg_response.data['token']

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        response = self.client.patch(self.me_url, {
            'display_name': 'New Name',
            'email': 'new@example.com',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['first_name'], 'New Name')
        self.assertEqual(response.data['user']['email'], 'new@example.com')
        # Registration uses the email as the username, so it must stay in
        # sync or the user could no longer sign in with their new email.
        self.assertEqual(response.data['user']['username'], 'new@example.com')

    def test_patch_me_rejects_email_already_in_use(self):
        self.client.post(self.register_url, self.user_data, format='json')
        other_reg = self.client.post(self.register_url, {
            'username': 'otheruser',
            'password': 'password123',
            'email': 'other@example.com',
            'display_name': 'Other User',
        }, format='json')

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + other_reg.data['token'])
        response = self.client.patch(self.me_url, {'email': 'test@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_me_requires_authentication(self):
        response = self.client.patch(self.me_url, {'display_name': 'New Name'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.change_password_url = reverse('change-password')
        self.user = User.objects.create_user(username='pwuser', password='oldpassword123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_change_password_success(self):
        response = self.client.post(self.change_password_url, {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

    def test_change_password_rejects_wrong_current_password(self):
        response = self.client.post(self.change_password_url, {
            'current_password': 'wrongpassword',
            'new_password': 'newpassword456',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpassword123'))

    def test_change_password_rejects_short_new_password(self):
        response = self.client.post(self.change_password_url, {
            'current_password': 'oldpassword123',
            'new_password': 'abc',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_requires_authentication(self):
        self.client.credentials()
        response = self.client.post(self.change_password_url, {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoomViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.room_list_url = reverse('room-list-create')

        self.user = User.objects.create_user(username='owner', password='pw123456')
        self.other_user = User.objects.create_user(username='intruder', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)

    def authenticate(self, token):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

    def test_room_creation(self):
        self.authenticate(self.token)
        response = self.client.post(self.room_list_url, {
            'name': 'Collaboration Room',
            'description': 'A room for video calls and whiteboards'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Collaboration Room')
        self.assertEqual(response.data['created_by_name'], 'owner')
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(Room.objects.first().created_by, self.user)

    def test_room_unauthenticated(self):
        response = self.client.post(self.room_list_url, {
            'name': 'No Auth Room',
            'description': 'Should fail'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_rooms_excludes_inactive(self):
        Room.objects.create(name='Active Room', created_by=self.user, is_active=True)
        Room.objects.create(name='Archived Room', created_by=self.user, is_active=False)

        self.authenticate(self.token)
        response = self.client.get(self.room_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [room['name'] for room in response.data]
        self.assertIn('Active Room', names)
        self.assertNotIn('Archived Room', names)

    def test_list_rooms_excludes_other_users_rooms(self):
        # Rooms aren't a shared public directory (like Zoom/Meet) — the
        # list endpoint should only ever return the caller's own rooms.
        Room.objects.create(name='My Room', created_by=self.user)
        Room.objects.create(name='Someone Elses Room', created_by=self.other_user)

        self.authenticate(self.token)
        response = self.client.get(self.room_list_url)

        names = [room['name'] for room in response.data]
        self.assertIn('My Room', names)
        self.assertNotIn('Someone Elses Room', names)

    def test_retrieve_room_detail(self):
        room = Room.objects.create(name='Detail Room', created_by=self.user)

        self.authenticate(self.token)
        response = self.client.get(reverse('room-detail', args=[room.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(room.id))

    def test_any_authenticated_user_can_retrieve_room_by_id(self):
        # This is what makes "join by invite link/ID" possible: retrieval
        # isn't scoped to the owner, only creation/listing/deletion are.
        room = Room.objects.create(name='Shared Room', created_by=self.user)

        self.authenticate(self.other_token)
        response = self.client.get(reverse('room-detail', args=[room.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_missing_room_returns_404(self):
        self.authenticate(self.token)
        response = self.client.get(reverse('room-detail', args=['00000000-0000-0000-0000-000000000000']))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_delete_room(self):
        room = Room.objects.create(name='Deletable Room', created_by=self.user)

        self.authenticate(self.token)
        response = self.client.delete(reverse('room-detail', args=[room.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Room.objects.filter(id=room.id).exists())

    def test_non_owner_cannot_delete_room(self):
        room = Room.objects.create(name='Protected Room', created_by=self.user)

        self.authenticate(self.other_token)
        response = self.client.delete(reverse('room-detail', args=[room.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Room.objects.filter(id=room.id).exists())

    def test_owner_can_pin_room(self):
        room = Room.objects.create(name='Pinnable Room', created_by=self.user)

        self.authenticate(self.token)
        response = self.client.patch(reverse('room-detail', args=[room.id]), {'pinned': True}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room.refresh_from_db()
        self.assertTrue(room.pinned)

    def test_owner_can_unpin_room(self):
        room = Room.objects.create(name='Pinned Room', created_by=self.user, pinned=True)

        self.authenticate(self.token)
        response = self.client.patch(reverse('room-detail', args=[room.id]), {'pinned': False}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room.refresh_from_db()
        self.assertFalse(room.pinned)

    def test_non_owner_cannot_pin_room(self):
        room = Room.objects.create(name='Protected Room', created_by=self.user)

        self.authenticate(self.other_token)
        response = self.client.patch(reverse('room-detail', args=[room.id]), {'pinned': True}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        room.refresh_from_db()
        self.assertFalse(room.pinned)


class RoomMessagesViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='chatter', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.room = Room.objects.create(name='Chat Room', created_by=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_lists_messages_in_chronological_order(self):
        older = Message.objects.create(
            room=self.room, user=self.user, display_name='chatter',
            encrypted_content='cipher-1', iv='iv-1'
        )
        newer = Message.objects.create(
            room=self.room, user=self.user, display_name='chatter',
            encrypted_content='cipher-2', iv='iv-2'
        )

        response = self.client.get(reverse('room-messages', args=[self.room.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item['id'] for item in response.data]
        self.assertEqual(returned_ids, [str(older.id), str(newer.id)])

    def test_messages_require_authentication(self):
        self.client.credentials()
        response = self.client.get(reverse('room-messages', args=[self.room.id]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoomFilesViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='uploader', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.room = Room.objects.create(name='File Room', created_by=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_upload_file(self):
        upload = SimpleUploadedFile('secret.bin', b'encrypted-bytes', content_type='application/octet-stream')

        response = self.client.post(reverse('room-files', args=[self.room.id]), {
            'file': upload,
            'file_name': 'secret.txt',
            'file_size': 15,
            'file_type': 'text/plain',
            'display_name': 'uploader',
            'iv': 'some-iv',
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SharedFile.objects.count(), 1)
        self.assertEqual(response.data['file_name'], 'secret.txt')
        self.assertIsNotNone(response.data['file_url'])

    def test_upload_file_missing_fields_returns_400(self):
        response = self.client.post(reverse('room-files', args=[self.room.id]), {
            'file_name': 'secret.txt',
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SharedFile.objects.count(), 0)

    def test_upload_file_for_missing_room_returns_404(self):
        upload = SimpleUploadedFile('secret.bin', b'encrypted-bytes', content_type='application/octet-stream')

        response = self.client.post(
            reverse('room-files', args=['00000000-0000-0000-0000-000000000000']), {
                'file': upload,
                'file_name': 'secret.txt',
                'file_size': 15,
                'file_type': 'text/plain',
                'iv': 'some-iv',
            }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lists_files_newest_first(self):
        upload_a = SimpleUploadedFile('a.bin', b'aaa', content_type='application/octet-stream')
        upload_b = SimpleUploadedFile('b.bin', b'bbb', content_type='application/octet-stream')

        first = SharedFile.objects.create(
            room=self.room, user=self.user, display_name='uploader',
            file_name='a.txt', file_size=3, file_type='text/plain', file=upload_a, iv='iv-a'
        )
        second = SharedFile.objects.create(
            room=self.room, user=self.user, display_name='uploader',
            file_name='b.txt', file_size=3, file_type='text/plain', file=upload_b, iv='iv-b'
        )

        response = self.client.get(reverse('room-files', args=[self.room.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item['id'] for item in response.data]
        self.assertEqual(returned_ids, [str(second.id), str(first.id)])


class RoomRecordingsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='recorder', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.room = Room.objects.create(name='Call Room', created_by=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_upload_recording(self):
        upload = SimpleUploadedFile('call.webm', b'encrypted-bytes', content_type='application/octet-stream')

        response = self.client.post(reverse('room-recordings', args=[self.room.id]), {
            'file': upload,
            'display_name': 'Recording - today',
            'file_size': 16,
            'mime_type': 'video/webm',
            'iv': 'some-iv',
            'duration_seconds': 42,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Recording.objects.count(), 1)
        self.assertEqual(response.data['duration_seconds'], 42)
        self.assertIsNotNone(response.data['file_url'])

    def test_upload_recording_missing_fields_returns_400(self):
        response = self.client.post(reverse('room-recordings', args=[self.room.id]), {
            'display_name': 'Recording',
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Recording.objects.count(), 0)

    def test_upload_recording_for_missing_room_returns_404(self):
        upload = SimpleUploadedFile('call.webm', b'x', content_type='application/octet-stream')

        response = self.client.post(
            reverse('room-recordings', args=['00000000-0000-0000-0000-000000000000']), {
                'file': upload,
                'display_name': 'Recording',
                'file_size': 1,
                'mime_type': 'video/webm',
                'iv': 'some-iv',
            }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lists_recordings_newest_first(self):
        upload_a = SimpleUploadedFile('a.webm', b'aaa', content_type='application/octet-stream')
        upload_b = SimpleUploadedFile('b.webm', b'bbb', content_type='application/octet-stream')
        first = Recording.objects.create(
            room=self.room, created_by=self.user, display_name='First',
            file=upload_a, file_size=3, mime_type='video/webm',
        )
        second = Recording.objects.create(
            room=self.room, created_by=self.user, display_name='Second',
            file=upload_b, file_size=3, mime_type='video/webm',
        )

        response = self.client.get(reverse('room-recordings', args=[self.room.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item['id'] for item in response.data]
        self.assertEqual(returned_ids, [str(second.id), str(first.id)])


class RecordingListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='owner', password='pw123456')
        self.other_user = User.objects.create_user(username='someone_else', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.room = Room.objects.create(name='Shared Room', created_by=self.user)

    def test_only_returns_own_recordings(self):
        upload_a = SimpleUploadedFile('mine.webm', b'aaa', content_type='application/octet-stream')
        upload_b = SimpleUploadedFile('theirs.webm', b'bbb', content_type='application/octet-stream')
        Recording.objects.create(
            room=self.room, created_by=self.user, display_name='Mine',
            file=upload_a, file_size=3, mime_type='video/webm',
        )
        Recording.objects.create(
            room=self.room, created_by=self.other_user, display_name='Theirs',
            file=upload_b, file_size=3, mime_type='video/webm',
        )

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        response = self.client.get(reverse('recording-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['display_name'] for r in response.data]
        self.assertIn('Mine', names)
        self.assertNotIn('Theirs', names)

    def test_requires_authentication(self):
        response = self.client.get(reverse('recording-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RecordingDetailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='owner', password='pw123456')
        self.other_user = User.objects.create_user(username='intruder', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)
        self.room = Room.objects.create(name='Call Room', created_by=self.user)
        upload = SimpleUploadedFile('call.webm', b'encrypted-bytes', content_type='application/octet-stream')
        self.recording = Recording.objects.create(
            room=self.room, created_by=self.user, display_name='Recording',
            file=upload, file_size=15, mime_type='video/webm',
        )

    def test_owner_can_delete_recording(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        response = self.client.delete(reverse('recording-detail', args=[self.recording.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Recording.objects.filter(id=self.recording.id).exists())

    def test_non_owner_cannot_delete_recording(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.other_token.key)
        response = self.client.delete(reverse('recording-detail', args=[self.recording.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recording.objects.filter(id=self.recording.id).exists())

    def test_delete_missing_recording_returns_404(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        response = self.client.delete(reverse('recording-detail', args=['00000000-0000-0000-0000-000000000000']))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ScheduledMeetingViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='organizer', password='pw123456')
        self.other_user = User.objects.create_user(username='intruder', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_create_meeting_also_creates_its_room(self):
        response = self.client.post(reverse('meeting-list-create'), {
            'title': 'Design Sync',
            'description': 'Weekly design chat',
            'scheduled_at': '2026-08-01T10:00:00Z',
            'duration_minutes': 45,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ScheduledMeeting.objects.count(), 1)
        self.assertEqual(Room.objects.count(), 1)
        room = Room.objects.first()
        self.assertEqual(room.name, 'Design Sync')
        self.assertEqual(room.description, 'Weekly design chat')
        self.assertEqual(response.data['room_name'], 'Design Sync')
        self.assertEqual(response.data['duration_minutes'], 45)

    def test_create_meeting_requires_title_and_scheduled_at(self):
        response = self.client.post(reverse('meeting-list-create'), {
            'description': 'Missing title and date',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ScheduledMeeting.objects.count(), 0)
        self.assertEqual(Room.objects.count(), 0)

    def test_list_only_returns_own_meetings(self):
        own_room = Room.objects.create(name='My Meeting', created_by=self.user)
        ScheduledMeeting.objects.create(room=own_room, created_by=self.user, scheduled_at=timezone.now())
        other_room = Room.objects.create(name='Their Meeting', created_by=self.other_user)
        ScheduledMeeting.objects.create(room=other_room, created_by=self.other_user, scheduled_at=timezone.now())

        response = self.client.get(reverse('meeting-list-create'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [m['room_name'] for m in response.data]
        self.assertIn('My Meeting', names)
        self.assertNotIn('Their Meeting', names)

    def test_owner_can_cancel_meeting_and_its_room_is_removed(self):
        room = Room.objects.create(name='Cancel Me', created_by=self.user)
        meeting = ScheduledMeeting.objects.create(room=room, created_by=self.user, scheduled_at=timezone.now())

        response = self.client.delete(reverse('meeting-detail', args=[meeting.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ScheduledMeeting.objects.filter(id=meeting.id).exists())
        self.assertFalse(Room.objects.filter(id=room.id).exists())

    def test_non_owner_cannot_cancel_meeting(self):
        room = Room.objects.create(name='Protected Meeting', created_by=self.user)
        meeting = ScheduledMeeting.objects.create(room=room, created_by=self.user, scheduled_at=timezone.now())

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.other_token.key)
        response = self.client.delete(reverse('meeting-detail', args=[meeting.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(ScheduledMeeting.objects.filter(id=meeting.id).exists())
        self.assertTrue(Room.objects.filter(id=room.id).exists())

    def test_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(reverse('meeting-list-create'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
