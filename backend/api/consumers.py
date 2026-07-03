import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.authtoken.models import Token
from .models import Room, Message

class RoomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'room_{self.room_id}'

        # Authenticate user using token in query string
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token_key = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token_key = param.split('=')[1]
                break

        self.user = await self.get_user_from_token(token_key)

        if self.user.is_anonymous:
            # Reject connection if token is invalid or missing
            await self.close(code=4001)
        else:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Expects message format:
        {
            "type": "chat" | "offer" | "answer" | "ice-candidate" | "join" | "leave" | "media-state" | "draw",
            "room_id": "...",
            "from_user": "...",
            "to_user": "..." (optional, for unicasting WebRTC signalling),
            "display_name": "..." (optional),
            "payload": { ... }
        }
        """
        msg_type = content.get('type')
        
        # If it is a chat message, save to DB before broadcasting
        if msg_type == 'chat':
            payload = content.get('payload', {})
            encrypted_content = payload.get('content')
            iv = payload.get('iv')
            display_name = content.get('display_name', self.user.username)
            
            if encrypted_content:
                saved_msg = await self.save_message(
                    room_id=self.room_id,
                    display_name=display_name,
                    encrypted_content=encrypted_content,
                    iv=iv
                )
                if saved_msg:
                    # Update content with DB primary key and timestamp
                    content['id'] = str(saved_msg.id)
                    content['created_at'] = saved_msg.created_at.isoformat()

        # Broadcast the message to all participants in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'room_message',
                'message': content
            }
        )

    async def room_message(self, event):
        # Send message to WebSocket client
        await self.send_json(event['message'])

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        if not token_key:
            return AnonymousUser()
        try:
            token = Token.objects.select_related('user').get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return AnonymousUser()

    @database_sync_to_async
    def save_message(self, room_id, display_name, encrypted_content, iv):
        try:
            room = Room.objects.get(id=room_id)
            return Message.objects.create(
                room=room,
                user=self.user,
                display_name=display_name,
                encrypted_content=encrypted_content,
                iv=iv
            )
        except Exception as e:
            print(f"Error saving message: {e}")
            return None
