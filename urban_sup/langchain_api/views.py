from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ChatExchangeSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import ChatExchange, get_chat_history
from django.db.models import Subquery, OuterRef
from .langchain import get_rag_chain
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import uuid


class ChatView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        user = request.user
        messages = get_chat_history(session_id, user)
        return Response({"messages": messages}, status=status.HTTP_200_OK)

    def post(self, request):
        print(request.data)
        serializer = ChatExchangeSerializer(data=request.data)
        if serializer.is_valid():
            user_query = serializer.validated_data["user_query"]
            session_id = serializer.validated_data.get("session_id")
            if not session_id:
                session_id = str(uuid.uuid4())

            chat_history = get_chat_history(session_id, user=request.user)
            rag_chain = get_rag_chain()
            model_response = rag_chain.invoke(
                {"input": user_query, "chat_history": chat_history}
            )["answer"]
            exchange = serializer.save(
                model_response=model_response, session_id=session_id, user=request.user
            )

            return Response(
                {"response": exchange.model_response, "session_id": session_id},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get distinct sessions with their first message
        sessions = (
            ChatExchange.objects
            .filter(user=user)
            .values('session_id')
            .distinct()
            .annotate(
                first_message=Subquery(
                    ChatExchange.objects
                    .filter(session_id=OuterRef('session_id'))
                    .order_by('created_at')
                    .values('user_query')[:1]
                )
            )
            .order_by('-session_id')
        )

        # Format the response
        session_data = [
            {
                "session_id": session['session_id'],
                "first_message": session['first_message']
            } 
            for session in sessions
        ]

        return Response({"sessions": session_data}, status=status.HTTP_200_OK)

class UserRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully."},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        try:
            user = User.objects.get(username=username)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                    }
                )
            else:
                return Response(
                    {"message": "Invalid credentials."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            return Response(
                {"message": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
