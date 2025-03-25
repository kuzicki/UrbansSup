from django.urls import path
from .views import ChatView

urlpatterns = [
    path("chat", ChatView.as_view(), name="create_response"),
    path("chat/<str:session_id>", ChatView.as_view(), name="chat_history"),
]
