import os
import base64
import json
import requests
from typing import TypedDict
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI

load_dotenv()
print("📧 ALERT_RECIPIENT =", os.getenv("ALERT_RECIPIENT"))

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
llm = ChatOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    model="llama3-70b-8192"
)

class AlertState(TypedDict):
    data: dict
    condition: str
    alert: bool
    reason: str
    result: str

@tool
def parse_alert_condition_tool(prompt: str) -> str:
    """Convert user alert instruction into a valid Python boolean expression."""

    prompt = f"""
You are a condition generator for evaluating Python expressions.

Instructions:
- ONLY output a valid Python condition using one of these existing keys:
  fire_alarm, temperature, humidity, tvoc, eco2, pm1, pm2_5,
  aapl, msft, nvda, vix, spy, qqq, iwm
- Use operators: >, <, ==, !=, >=, <=
- DO NOT assume imaginary fields like "apple_stock"
- DO NOT explain anything. Output ONLY the raw condition.

Instruction: {prompt}
"""
    return llm.invoke(prompt).content.strip()

@tool
def check_custom_condition_tool(data: dict, condition: str) -> dict:
    """Evaluate a parsed Python condition string against incoming data."""

    def is_number(val):
        try:
            float(val)
            return True
        except:
            return False

    try:
        # Normalize keys: lowercase, replace spaces with underscores
        clean_data = {
            k.lower().replace(" ", "_"): float(v) if is_number(v) else v
            for k, v in data.items()
        }

        print("🔍 Evaluating condition:", condition)
        print("📦 Cleaned keys:", list(clean_data.keys()))
        print("📦 Cleaned data:", clean_data)

        alert = eval(condition, {}, clean_data)
        return {
            "alert": bool(alert),
            "reason": f"Condition met: {condition}" if alert else ""
        }

    except Exception as e:
        return {"alert": False, "reason": f"Invalid condition: {str(e)}"}

def get_gmail_service():
    creds = None
    token_path = 'token.json'
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

def send_gmail_oauth(subject: str, body: str, to: str):
    service = get_gmail_service()
    message = MIMEText(body)
    message['to'] = to
    message['from'] = 'me'
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    send_message = service.users().messages().send(userId='me', body={'raw': raw}).execute()
    return f"Email sent successfully. Message ID: {send_message['id']}"

@tool
def send_email_tool(subject: str, body: str) -> str:
    """Send an alert email using Gmail API via OAuth2."""
    to = os.getenv("ALERT_RECIPIENT")
    if not to or not isinstance(to, str):
        raise ValueError("Missing or invalid ALERT_RECIPIENT in .env")
    return send_gmail_oauth(subject, body, to)

def check_thresholds_node(state: AlertState):
    result = check_custom_condition_tool.invoke({
        "data": state["data"],
        "condition": state["condition"]
    })
    if not result["alert"]:
        print("✅ No alert triggered.")
    return {**state, **result}

def send_email_node(state: AlertState):
    email_result = send_email_tool.invoke({
        "subject": "🚨 Custom Alert Triggered",
        "body": f"Reason: {state['reason']}\n\nData:\n{json.dumps(state['data'], indent=2)}"
    })
    return {**state, "result": email_result}

def stream_healthcare_data():
    with requests.get("http://localhost:3001/healthcare-stream", stream=True) as response:
        for line in response.iter_lines():
            if line and line.startswith(b"data: "):
                raw_json = line[6:].decode("utf-8")
                try:
                    row = json.loads(raw_json)
                    yield row
                except Exception as e:
                    print("⚠️ Skipping bad row:", e)

def stream_iot_data():
    with requests.get("http://localhost:3001/iot-stream", stream=True) as response:
        for line in response.iter_lines():
            if line and line.startswith(b"data: "):
                raw_json = line[6:].decode("utf-8")
                try:
                    row = json.loads(raw_json)
                    yield row
                except Exception as e:
                    print("⚠️ Skipping bad IoT row:", e)

def stream_stock_data():
    with requests.get("http://localhost:3001/stock-stream", stream=True) as response:
        for line in response.iter_lines():
            if line and line.startswith(b"data: "):
                raw_json = line[6:].decode("utf-8")
                try:
                    row = json.loads(raw_json)
                    yield row
                except Exception as e:
                    print("⚠️ Skipping bad stock row:", e)

graph = StateGraph(AlertState)
graph.add_node("check_thresholds", check_thresholds_node)
graph.add_node("send_email", send_email_node)
graph.set_entry_point("check_thresholds")
graph.add_conditional_edges(
    "check_thresholds",
    lambda s: "send_email" if s["alert"] else "__end__",
    {
        "send_email": "send_email",
        "__end__": END
    }
)
graph.add_edge("send_email", END)
alert_graph = graph.compile()

if __name__ == "__main__":
    user_prompt = input("🧠 Enter your alert instruction: ")
    source = input("🌐 Source (Healthcare/IoT/Stock): ").strip().lower()
    condition = parse_alert_condition_tool.invoke({"prompt": user_prompt})
    print(f"🧠 Parsed condition: {condition}\n")

    stream_map = {
        "healthcare": stream_healthcare_data,
        "iot": stream_iot_data,
        "stock": stream_stock_data
    }

    stream_func = stream_map.get(source)
    if not stream_func:
        raise ValueError("Unsupported source. Use Healthcare, IoT, or Stock.")

    print(f"📡 Listening to /{source}-stream for alerts...")
    for row in stream_func():
        result = alert_graph.invoke({"data": row, "condition": condition})
        print("🔔 Agent processed:", json.dumps(result, indent=2))