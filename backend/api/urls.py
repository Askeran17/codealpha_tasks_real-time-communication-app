from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/me/', views.UserMeView.as_view(), name='me'),
    
    path('rooms/', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/<uuid:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<uuid:room_id>/messages/', views.RoomMessagesListView.as_view(), name='room-messages'),
    path('rooms/<uuid:room_id>/files/', views.RoomFilesView.as_view(), name='room-files'),
]
