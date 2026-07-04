from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Room
from ..serializers import RoomSerializer, UserSerializer


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
