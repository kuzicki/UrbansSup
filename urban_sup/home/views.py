
def home_view(request):
    return render(request, 'home.html')

import requests
from django.shortcuts import render, redirect
from django.conf import settings

# home/views.py
from django.shortcuts import render, redirect

def login_view(request):
    if request.method == 'POST':
        # Connect to your actual API endpoint
        response = requests.post(
            f'http://{settings.ALLOWED_HOSTS[0]}:8000/langchain_api/login/',
            data={
                'username': request.POST.get('username'),
                'password': request.POST.get('password')
            }
        )
        
        if response.status_code == 200:
            access_token = response.json()['access_token']
            # Set token in cookies and localStorage
            res = redirect('home')
            res.set_cookie('jwt_token', access_token, httponly=True)
            return res
            
        return render(request, 'login.html', {'error': 'Invalid credentials'})
    
    return render(request, 'login.html')

def register_view(request):
    if request.method == 'POST':
        # Connect to your actual API endpoint
        response = requests.post(
            f'http://{settings.ALLOWED_HOSTS[0]}:8000/langchain_api/register/',
            data={
                'username': request.POST.get('username'),
                'password': request.POST.get('password')
            }
        )
        
        if response.status_code == 201:
            return redirect('login')
            
        return render(request, 'register.html', {'errors': response.json()})
    
    return render(request, 'register.html')
