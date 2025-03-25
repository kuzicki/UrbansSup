from django.db import models


class ChatExchange(models.Model):
    session_id = models.CharField(max_length=255)
    user_query = models.TextField()
    model_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_exchange"

    def __str__(self):
        return f"Log {id} for session {self.session_id}"


def get_chat_history(session_id: str):
    exchanges = ChatExchange.objects.filter(session_id=session_id).order_by(
        "created_at"
    )



    messages = []
    for exchange in exchanges:
        messages.extend(
            [
                {"role": "human", "content": exchange.user_query},
                {"role": "ai", "content": exchange.model_response},
            ]
        )

    return messages
