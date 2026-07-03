from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Room, RoomParticipant, Message, SharedFile
from .serializers import UserSerializer, RoomSerializer, MessageSerializer, SharedFileSerializer

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


class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(is_active=True).order_date_created_at_desc() if hasattr(Room.objects, 'order_date_created_at_desc') else Room.objects.filter(is_active=True).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RoomDetailView(generics.RetrieveDestroyAPIView):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]


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
