from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from .chroma import vectorstore


# Configure retriever for exact matches
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 2},
    # metadata_filter="немаксимальный класс объектов исследования"  # Add metadata filtering
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
            "You are a helpful AI assistant. Use the following context to answer the user's question. Answer with the information from the context and you must use all the words if they are appropriate to use so and all the info from the provided context.",
        ),
        ("system", "Context: {context}"),
        ("human", "{input}"),
    ]
)


def get_rag_chain(model="bambucha/saiga-llama3"):
    llm = ChatOllama(model=model, temperature=0.6,     num_ctx=2048,        # Reduce context window
    num_gpu=40,          # Max layers for 24GB VRAM
    main_gpu=0,          # Use primary GPU
    )
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    return rag_chain
