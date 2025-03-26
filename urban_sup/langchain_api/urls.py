from django.urls import path
from .views import ChatView, UserLoginView, UserRegisterView, ChatListView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="create_response"),
    path("chat/sessions/", ChatListView.as_view(), name="session_list"),
    path("chat/<str:session_id>/", ChatView.as_view(), name="chat_history"),
    path("register/", UserRegisterView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]

