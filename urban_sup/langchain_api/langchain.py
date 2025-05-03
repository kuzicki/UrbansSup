from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from .chroma import vectorstore
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler


# Configure retriever for exact matches
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 10},
)

# Update the contextualization prompt to enforce exact matches
contextualize_q_system_prompt = (
    "Given a chat history and the latest user question "
    "which might reference context in the chat history, "
    "formulate a standalone question which can be understood "
    "without the chat history. Do NOT answer the question, "
    "just reformulate it if needed and otherwise return it as is."
)

contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

# Update QA prompt for strict format adherence
qa_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Answer in 10-20 sentences using ONLY the context. Follow these rules:
1. Be strictly concise
2. NEVER add explanations unless asked
3. If unsure, say "I don't have formalized knowledge about this""",
        ),
        ("system", "Context: {context}"),
        ("human", "{input}"),
    ]
)


def get_rag_chain(model="bambucha/saiga-llama3"):
    llm = ChatOllama(model=model, temperature=0.5,
        num_predict=300,     
        streaming=True,  # Enable streaming
        callbacks=[StreamingStdOutCallbackHandler()],  # Print tokens to stdout
        verbose=True
    )

    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    return rag_chain
