from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import User
from django.test import TransactionTestCase
from rest_framework.authtoken.models import Token

from .. import routing
from ..models import Message, Room

application = URLRouter(routing.websocket_urlpatterns)


class RoomConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='caller', password='pw123456')
        self.token = Token.objects.create(user=self.user)
        self.room = Room.objects.create(name='Signalling Room', created_by=self.user)

    async def connect(self, token_key):
        communicator = WebsocketCommunicator(
            application, f"/ws/room/{self.room.id}/?token={token_key}"
        )
        connected, _ = await communicator.connect()
        return communicator, connected

    async def test_rejects_connection_without_a_valid_token(self):
        communicator, connected = await self.connect('not-a-real-token')
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_accepts_connection_with_a_valid_token(self):
        communicator, connected = await self.connect(self.token.key)
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_broadcasts_chat_message_to_room_group(self):
        communicator, connected = await self.connect(self.token.key)
        self.assertTrue(connected)

        await communicator.send_json_to({
            'type': 'chat',
            'room_id': str(self.room.id),
            'from_user': 'caller',
            'display_name': 'caller',
            'payload': {'content': 'encrypted-hello', 'iv': 'iv-value'},
        })

        response = await communicator.receive_json_from()

        self.assertEqual(response['type'], 'chat')
        self.assertEqual(response['payload']['content'], 'encrypted-hello')
        self.assertIn('id', response)
        self.assertIn('created_at', response)

        await communicator.disconnect()

    async def test_chat_message_is_persisted(self):
        communicator, connected = await self.connect(self.token.key)
        self.assertTrue(connected)

        await communicator.send_json_to({
            'type': 'chat',
            'room_id': str(self.room.id),
            'display_name': 'caller',
            'payload': {'content': 'encrypted-hello', 'iv': 'iv-value'},
        })
        await communicator.receive_json_from()
        await communicator.disconnect()

        saved = await Message.objects.aget(room=self.room)
        self.assertEqual(saved.encrypted_content, 'encrypted-hello')
        self.assertEqual(saved.user_id, self.user.id)

    async def test_non_chat_messages_are_relayed_without_persistence(self):
        communicator, connected = await self.connect(self.token.key)
        self.assertTrue(connected)

        await communicator.send_json_to({
            'type': 'ice-candidate',
            'room_id': str(self.room.id),
            'from_user': 'caller',
            'payload': {'candidate': 'fake-candidate'},
        })

        response = await communicator.receive_json_from()

        self.assertEqual(response['type'], 'ice-candidate')
        self.assertEqual(await Message.objects.acount(), 0)

        await communicator.disconnect()
