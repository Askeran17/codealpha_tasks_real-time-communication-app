from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.authtoken.models import Token
from .models import Room, RoomParticipant, Message, SharedFile, Recording, ScheduledMeeting
from .serializers import (
    UserSerializer, RoomSerializer, MessageSerializer, SharedFileSerializer,
    RecordingSerializer, ScheduledMeetingSerializer,
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        display_name = request.data.get('display_name', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        first_name = display_name or username
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name
        )

        # Create auth token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data
        })

    def patch(self, request):
        display_name = request.data.get('display_name')
        email = request.data.get('email')

        if display_name is not None:
            request.user.first_name = display_name

        # Registration uses the email as the username (see RegisterView), so
        # they're kept in sync here too, otherwise a changed email would no
        # longer match the username used to sign in.
        if email is not None and email != request.user.email:
            if User.objects.exclude(pk=request.user.pk).filter(Q(username=email) | Q(email=email)).exists():
                return Response(
                    {'error': 'Email already in use'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.email = email
            request.user.username = email

        request.user.save()

        return Response({
            'user': UserSerializer(request.user).data
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Current and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'error': 'New password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save()

        return Response({'success': True})


class RoomListCreateView(generics.ListCreateAPIView):
    """Lists only the requesting user's own rooms — like Zoom/Meet, rooms
    aren't a shared public directory. Joining someone else's room happens
    by ID/invite link instead (see RoomDetailView, which any authenticated
    user may still GET)."""
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(is_active=True, created_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Retrieval is intentionally open to any authenticated user — that's
    # what makes joining via a shared room ID/link possible. Updating
    # (currently just the `pinned` flag) and deletion are restricted to the
    # room's owner below.
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        if serializer.instance.created_by_id != self.request.user.id:
            raise PermissionDenied("Only the room owner can update this room.")
        # Only the pin state is editable via this endpoint — name/description
        # aren't exposed to renaming here to keep this a narrow, single-purpose update.
        serializer.save(pinned=serializer.validated_data.get('pinned', serializer.instance.pinned))

    def perform_destroy(self, instance):
        if instance.created_by_id != self.request.user.id:
            raise PermissionDenied("Only the room owner can delete this room.")
        instance.delete()


class RoomMessagesListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        return Message.objects.filter(room_id=room_id).order_by('created_at')[:100]


class RoomFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        files = SharedFile.objects.filter(room_id=room_id).order_by('-created_at')
        serializer = SharedFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, room_id):
        file_obj = request.FILES.get('file')
        file_name = request.data.get('file_name')
        file_size = request.data.get('file_size')
        file_type = request.data.get('file_type')
        display_name = request.data.get('display_name', request.user.username)
        iv = request.data.get('iv')

        if not file_obj or not file_name or not file_size or not file_type or not iv:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        shared_file = SharedFile.objects.create(
            room=room,
            user=request.user,
            display_name=display_name,
            file_name=file_name,
            file_size=int(file_size),
            file_type=file_type,
            file=file_obj,
            iv=iv
        )

        serializer = SharedFileSerializer(shared_file, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RoomRecordingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        recordings = Recording.objects.filter(room_id=room_id).order_by('-created_at')
        serializer = RecordingSerializer(recordings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, room_id):
        file_obj = request.FILES.get('file')
        file_size = request.data.get('file_size')
        mime_type = request.data.get('mime_type')
        display_name = request.data.get('display_name', request.user.username)
        iv = request.data.get('iv')
        duration_seconds = request.data.get('duration_seconds', 0)

        if not file_obj or not file_size or not mime_type or not iv:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        recording = Recording.objects.create(
            room=room,
            created_by=request.user,
            display_name=display_name,
            file=file_obj,
            file_size=int(file_size),
            mime_type=mime_type,
            iv=iv,
            duration_seconds=int(duration_seconds),
        )

        serializer = RecordingSerializer(recording, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RecordingListView(generics.ListAPIView):
    """Cross-room recordings dashboard — only the creator's own recordings."""
    serializer_class = RecordingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recording.objects.filter(created_by=self.request.user).order_by('-created_at')


class ScheduledMeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduledMeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScheduledMeeting.objects.filter(created_by=self.request.user).order_by('scheduled_at')

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description', '')
        scheduled_at = request.data.get('scheduled_at')
        duration_minutes = request.data.get('duration_minutes', 60)

        if not title or not scheduled_at:
            return Response(
                {'error': 'Title and scheduled_at are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        room = Room.objects.create(name=title, description=description, created_by=request.user)
        meeting = ScheduledMeeting.objects.create(
            room=room,
            created_by=request.user,
            scheduled_at=scheduled_at,
            duration_minutes=int(duration_minutes),
        )

        serializer = self.get_serializer(meeting)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScheduledMeetingDetailView(generics.DestroyAPIView):
    queryset = ScheduledMeeting.objects.all()
    serializer_class = ScheduledMeetingSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.created_by_id != self.request.user.id:
            raise PermissionDenied("Only the meeting owner can cancel this meeting.")
        # Room has on_delete=CASCADE back to this meeting, so deleting the
        # room also removes the ScheduledMeeting row.
        instance.room.delete()


class RecordingDetailView(generics.DestroyAPIView):
    queryset = Recording.objects.all()
    serializer_class = RecordingSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.created_by_id != self.request.user.id:
            raise PermissionDenied("Only the recording owner can delete this recording.")
        instance.delete()
