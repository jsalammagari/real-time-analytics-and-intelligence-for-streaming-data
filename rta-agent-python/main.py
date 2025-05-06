# main.py (regenerated with greeting handler and LangGraph agent)

import os
import json
import re
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI
from langgraph.graph import StateGraph, END
from typing import TypedDict
from langchain_core.tools import tool
from supabase import create_client

load_dotenv()

llm = ChatOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    model="llama3-70b-8192"
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class AgentState(TypedDict):
    question: str
    source: str
    sql: str
    result: list
    reply: str

greeting_keywords = ["hi", "hello", "hey", "how are you", "good morning", "good evening", "what's up"]

def is_greeting(text: str) -> bool:
    text = text.lower().strip()
    return any(kw in text for kw in greeting_keywords)

@tool
def handle_greeting_tool(question: str) -> str:
    """Respond like a human to greetings or casual conversation."""
    prompt = f"""
    Respond naturally and casually as if you're having a light human conversation.
    Message: "{question}"
    """
    return llm.invoke(prompt).content.strip()

@tool
def generate_sql_tool(question: str, source: str) -> str:
    """Generate SQL query for the question based on the source table."""
    if source == "IoT":
        prompt = f"""
        Convert this into a SQL query.
        Table: iot_dataset (utc, temperature, humidity, tvoc, eco2, raw_h2, raw_ethanol, pressure, pm1, pm2_5, nc0_5, nc1_0, nc2_5, cnt, fire_alarm)
        Question: {question}
        Respond only with SQL or say \"I cannot answer this question.\"
        """
    elif source == "Stock":
        prompt = f"""
        Convert this into a SQL query.
        Table: stock_dataset (utc, spy, qqq, iwm, aapl, msft, nvda, vix)
        Question: {question}
        Respond only with SQL or say \"I cannot answer this question.\"
        """
    else:
        prompt = f"""
        Convert this into a SQL query.
        Table: healthcare_dataset (utc, heart_rate, blood_pressure, oxygen_saturation, respiratory_rate, temperature, Label)
        Question: {question}
        Respond only with SQL or say \"I cannot answer this question.\"
        """
    return llm.invoke(prompt).content.strip()

@tool
def run_sql_tool(sql: str) -> str:
    """Execute the SQL using Supabase RPC and return JSON result."""
    #sql = sql.strip().strip("`")
    sql = re.sub(r"```sql\\s*", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"```", "", sql).strip()
    if sql.lower().startswith("```sql"):
        sql = sql[6:].strip("`").strip()
    if sql.endswith(";"):
        sql = sql[:-1].strip()
    try:
        res = supabase.rpc("execute_sql", {"query_text": sql}).execute()
        if hasattr(res, "error") and res.error:
            print("Supabase error:", res.error.message)
            return json.dumps([])
        return json.dumps(res.data or [])
    except Exception as e:
        print("SQL execution error:", str(e))
        return json.dumps([])

@tool
def summarize_result_tool(question: str, result: str) -> str:
    """Summarize SQL result for user question."""
    prompt = f"""
    The user asked: \"{question}\"
    SQL Result: {result}

    Summarize this in a clear and concise way.
    """
    return llm.invoke(prompt).content.strip()

@tool
def fallback_llm_tool(question: str) -> str:
    """Use general knowledge to answer question if SQL fails."""
    prompt = f"""
    Answer the following question clearly and directly using your general knowledge:

    \"{question}\"

    Do not say you don't have access to real-time data. Provide the best possible answer.
    """
    return llm.invoke(prompt).content.strip()

# --- LangGraph Nodes ---

def handle_greeting_node(state: AgentState):
    reply = handle_greeting_tool.invoke({"question": state["question"]})
    return {**state, "reply": reply}

def generate_sql_node(state: AgentState):
    sql = generate_sql_tool.invoke({"question": state["question"], "source": state["source"]})
    print("Generated SQL:", sql)
    return {**state, "sql": sql}

def run_sql_node(state: AgentState):
    result = run_sql_tool.invoke({"sql": state["sql"]})
    print("SQL Result:", result)
    return {**state, "result": json.loads(result)}

def summarize_node(state: AgentState):
    reply = summarize_result_tool.invoke({
        "question": state["question"],
        "result": json.dumps(state["result"])
    })
    return {**state, "reply": reply}

def fallback_node(state: AgentState):
    reply = fallback_llm_tool.invoke({"question": state["question"]})
    return {**state, "reply": reply}

# --- LangGraph Conditions ---

def check_greeting_condition(state: AgentState):
    return "greeting" if is_greeting(state["question"]) else "generate_sql"

def check_sql_condition(state: AgentState):
    if not state["sql"] or "I cannot answer" in state["sql"]:
        return "fallback"
    return "run_sql"

def check_result_condition(state: AgentState):
    result = state.get("result")
    if not result or not isinstance(result, list) or len(result) == 0:
        return "fallback"
    return "summarize"

# --- LangGraph Setup ---

graph = StateGraph(AgentState)
graph.add_node("handle_greeting", handle_greeting_node)
graph.add_node("generate_sql", generate_sql_node)
graph.add_node("run_sql", run_sql_node)
graph.add_node("summarize", summarize_node)
graph.add_node("fallback", fallback_node)

graph.set_entry_point("handle_greeting")
graph.add_conditional_edges("handle_greeting", check_greeting_condition, {
    "greeting": END,
    "generate_sql": "generate_sql"
})
graph.add_conditional_edges("generate_sql", check_sql_condition, {
    "run_sql": "run_sql",
    "fallback": "fallback"
})
graph.add_conditional_edges("run_sql", check_result_condition, {
    "summarize": "summarize",
    "fallback": "fallback"
})
graph.add_edge("summarize", END)
graph.add_edge("fallback", END)

app_graph = graph.compile()

app = FastAPI()

class AskRequest(BaseModel):
    question: str
    source: str

@app.post("/ask")
async def ask(req: AskRequest):
    print(f"Incoming request: question='{req.question}', source='{req.source}'")
    try:
        result = app_graph.invoke({"question": req.question, "source": req.source})
        return {
    "reply": result["reply"],
    "sql": result.get("sql"),
    "result": result.get("result")
}

    except Exception as e:
        print("Agent execution error:", str(e))
        raise
