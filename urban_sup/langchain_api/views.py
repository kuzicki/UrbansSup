from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ChatExchangeSerializer
from .models import ChatExchange, get_chat_history
from .langchain import get_rag_chain

class ChatView(APIView):
    def get(self, request, session_id):
        messages = get_chat_history(session_id)
        return Response({"messages": messages}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ChatExchangeSerializer(data=request.data)
        if serializer.is_valid():
            user_query = serializer.validated_data['user_query']
            session_id = serializer.validated_data['session_id']
            chat_history = get_chat_history(session_id)
            rag_chain = get_rag_chain()
            model_response = rag_chain.invoke({
                "input": user_query,
                "chat_history": chat_history
            })['answer']
            exchange = serializer.save(model_response=model_response)

            return Response(
                        {"response": exchange.model_response, "created_at": exchange.created_at},
                        status=status.HTTP_201_CREATED
                    )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
