# main.py

import os
import json
import re
import threading
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI
from langgraph.graph import StateGraph, END
from typing import TypedDict
from langchain_core.tools import tool
from supabase import create_client
from alert_agent import alert_graph, parse_alert_condition_tool, stream_healthcare_data, stream_iot_data

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

greeting_keywords = [
    "hi", "hello", "hey", "how are you", "good morning", "good evening",
    "what's up", "whats up", "sup", "yo", "howdy", "heya", "hiya"
]

def is_greeting(text: str) -> bool:
    text = text.lower().strip()
    return any(text.startswith(kw) or kw in text for kw in greeting_keywords)

@tool
def handle_greeting_tool(question: str) -> str:
    """Respond in a friendly, human-like way to casual greetings or light conversation."""
    prompt = f"""
You are a friendly assistant having a casual chat. Respond warmly and naturally, like a person—not like a definition or dictionary.
Keep your answer short and expressive (1-2 sentences max). No formal tone. No definitions.

User: "{question}"
Assistant:"""
    return llm.invoke(prompt).content.strip()

@tool
def generate_sql_tool(question: str, source: str) -> str:
    """Generate a SQL SELECT query or return I_CANNOT_ANSWER if not possible."""
    if source == "IoT":
        prompt = f"""
You are a SQL generator. Convert the user's question to a valid SQL SELECT query.
Table: iot_dataset (utc, temperature, humidity, tvoc, eco2, raw_h2, raw_ethanol, pressure, pm1, pm2_5, nc0_5, nc1_0, nc2_5, cnt, fire_alarm)
Use PostgreSQL syntax (e.g., CURRENT_TIMESTAMP - INTERVAL '1 hour').
If the question involves AQI or air quality index, return a query that selects eco2, tvoc, pm1, pm2_5.
Respond ONLY with SQL. No comments, markdown, or explanations. Return I_CANNOT_ANSWER if unsure.

Question: {question}
"""
    elif source == "Stock":
        prompt = f"""
You are a SQL generator. Convert the user's question to a valid SQL SELECT query.
Table: stock_dataset (utc, spy, qqq, iwm, aapl, msft, nvda, vix)
Respond ONLY with SQL. No comments, markdown, or explanations. Return I_CANNOT_ANSWER if unsure.

Question: {question}
"""
    else:
        prompt = f"""
You are a SQL generator. Convert the user's question to a valid SQL SELECT query.
Table: healthcare_dataset (utc, heart_rate, blood_pressure, oxygen_saturation, respiratory_rate, temperature, Label)
Respond ONLY with SQL. No comments, markdown, or explanations. Return I_CANNOT_ANSWER if unsure.

Question: {question}
"""
    return llm.invoke(prompt).content.strip()

@tool
def run_sql_tool(sql: str) -> str:
    """Execute SQL on Supabase and return result as JSON string."""
    sql = re.sub(r"```sql\\s*", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"```", "", sql).strip()
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
    """Summarize a SQL result based on the user's question."""
    prompt = f"""
You are an assistant summarizing SQL results for users in a natural, helpful way.

Question: "{question}"
SQL Result: {result}

Instructions:
- If the question is about AQI, calculate it using:
  AQI = (eco2 * 0.25) + (tvoc * 0.25) + (pm1 * 0.25) + (pm2_5 * 0.25)
  Then say: "The current AQI is 52. It is considered 'Moderate'."
  AQI categories:
    0–50: Good
    51–100: Moderate
    >100: Unhealthy

- Otherwise, give a clear answer in simple terms. No mention of SQL.
"""
    return llm.invoke(prompt).content.strip()

@tool
def fallback_llm_tool(question: str) -> str:
    """Fallback answer using general knowledge when SQL fails."""
    prompt = f"""
Answer the following question directly using general knowledge:
"{question}"
Be clear and helpful.
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
    if not state["sql"] or "I_CANNOT_ANSWER" in state["sql"]:
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
        if re.search(r"\b(alert|notify|warn)\b", req.question.lower()):
            parsed = parse_alert_condition_tool.invoke({"prompt": req.question})
            print("🧠 Parsed condition:", parsed)

            def monitor():
                stream_func = stream_healthcare_data if req.source.lower() == "healthcare" else stream_iot_data
                for row in stream_func():
                    result = alert_graph.invoke({"data": row, "condition": parsed})
                    print("🔔 Alert Agent Output:", json.dumps(result, indent=2))

            thread = threading.Thread(target=monitor, daemon=True)
            thread.start()

            return {"reply": f"✅ Alert agent is now monitoring {req.source} based on your condition."}

        result = app_graph.invoke({"question": req.question, "source": req.source})
        return {
            "reply": result["reply"],
            "sql": result.get("sql"),
            "result": result.get("result")
        }
    except Exception as e:
        print("Agent execution error:", str(e))
        raise
