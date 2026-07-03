from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Room, Message, SharedFile

class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.room_list_url = reverse('room-list-create')
        
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

    def test_login_user(self):
        # First register
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Then login
        login_data = {
            'username': 'testuser',
            'password': 'testpassword123'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_room_creation(self):
        # Register and login to get token
        reg_response = self.client.post(self.register_url, self.user_data, format='json')
        token = reg_response.data['token']
        
        # Authenticate client
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        
        # Create room
        room_data = {
            'name': 'Collaboration Room',
            'description': 'A room for video calls and whiteboards'
        }
        response = self.client.post(self.room_list_url, room_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Collaboration Room')
        self.assertEqual(Room.objects.count(), 1)

    def test_room_unauthenticated(self):
        # Attempt to create room without authentication
        room_data = {
            'name': 'No Auth Room',
            'description': 'Should fail'
        }
        response = self.client.post(self.room_list_url, room_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
