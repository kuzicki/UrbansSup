from rest_framework import serializers
from .models import ChatExchange

class ChatExchangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatExchange
        fields = ['session_id', 'user_query', 'model_response', 'created_at']
        read_only_fields = ['model_response', 'created_at']
