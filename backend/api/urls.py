from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/me/', views.UserMeView.as_view(), name='me'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    path('rooms/', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/<uuid:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<uuid:room_id>/messages/', views.RoomMessagesListView.as_view(), name='room-messages'),
    path('rooms/<uuid:room_id>/files/', views.RoomFilesView.as_view(), name='room-files'),
    path('rooms/<uuid:room_id>/recordings/', views.RoomRecordingsView.as_view(), name='room-recordings'),

    path('users/', views.UserListView.as_view(), name='user-list'),
    path('recordings/', views.RecordingListView.as_view(), name='recording-list'),
    path('recordings/<uuid:pk>/', views.RecordingDetailView.as_view(), name='recording-detail'),
    path('meetings/', views.ScheduledMeetingListCreateView.as_view(), name='meeting-list-create'),
    path('meetings/<uuid:pk>/', views.ScheduledMeetingDetailView.as_view(), name='meeting-detail'),
]
