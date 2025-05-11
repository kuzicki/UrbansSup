from django.urls import path
from .views import home_view, login_view, register_view

urlpatterns = [
    path('home/', home_view, name='home'),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
]
