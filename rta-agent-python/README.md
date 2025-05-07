# rta-agent-python

This project implements a **LangGraph dual-agent architecture** for real-time analytics and intelligence. It features both:

-  A **ReAct-style LangGraph agent** for answering analytical questions via SQL or fallback LLM.
-  An **autonomous alert agent** that monitors **live healthcare data** and sends Gmail alerts on threshold breaches.

---

## What It Does

### 📊 ReAct QA Agent (`/ask` endpoint)
* Accepts natural language questions.
* Generates SQL via **Groq's LLaMA-3** model.
* Executes SQL using **Supabase RPC**.
* Summarizes results in plain English.
* Falls back to LLM when:
  * SQL can't be generated
  * SQL returns empty results

### 🔔 Autonomous Healthcare Alert Agent
* Listens to **live `/healthcare-stream`** sensor data.
* Accepts alert instructions like:
  * `Alert me when temperature > 38`
  * `Notify me if oxygen_saturation < 95`
* Parses user prompt into a valid condition.
* Evaluates incoming data against condition.
* Sends **Gmail alerts via OAuth2** with custom, human-friendly messages.

---

## LangGraph Agent Architecture

```text
[Input Question]
      ↓
[Generate SQL] ──▶ [Fallback: LLM if no SQL]
      ↓
[Run SQL]      ──▶ [Fallback: LLM if empty result]
      ↓
[Summarize Result]
      ↓
[Answer]
```

---

## Tech Stack

* **LangGraph** – graph-based control flow for agents
* **LangChain** – LLM tool abstraction
* **Groq (LLaMA-3)** – fast, cost-efficient LLM
* **Supabase** – real-time SQL backend with RPC
* **FastAPI** – `/ask` endpoint
* **Gmail API (OAuth2)** – alert delivery

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-org/rta-agent-python.git
cd rta-agent-python
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

If missing:
```bash
pip install fastapi uvicorn python-dotenv langchain langchain-community langgraph supabase google-auth google-auth-oauthlib google-api-python-client
```

### 3. Create `.env`

```env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
ALERT_RECIPIENT=you@gmail.com
```

> Keep `credentials.json` and `token.json` in `.gitignore`

---

## Run the Agent

###  ReAct QA Server:
```bash
uvicorn main:app --reload --port 8001
```

###  (Optional) Manual Alert Agent:
```bash
python alert_agent.py
```

---

## Using `/ask`

```bash
curl -X POST http://localhost:8001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the average temperature in the last hour?", "source": "IoT"}'
```

### Example alert prompt:
```json
{
  "question": "Alert me when temperature > 38",
  "source": "Healthcare"
}
```

This dynamically launches the background agent.

---

## ✅ Features

- ✅ Dual-agent architecture (ReAct + Autonomous)
- ✅ Live stream monitoring on `/healthcare-stream`
- ✅ Alert parsing from natural-language prompts
- ✅ Safe `eval()`-based condition execution
- ✅ Real-time Gmail alerts with human-readable messages
- ✅ Clean console logs for debugging

---

## Structure

```bash
main.py               # FastAPI + LangGraph ReAct QA
alert_agent.py        # Streaming alert agent for Healthcare
credentials.json      # (OAuth2 client file – not tracked)
token.json            # (OAuth2 token – not tracked)
.gitignore            # Make sure sensitive files are excluded
```

---

## Security Notes

- Keep `.env`, `credentials.json`, and `token.json` out of version control
- Use OAuth2 app passwords or client credentials safely

---

---
