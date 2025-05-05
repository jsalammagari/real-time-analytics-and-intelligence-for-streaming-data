# rta-agent-python

This project implements a **LangGraph ReAct-style agent** for answering analytical questions using structured and unstructured data sources. The agent is designed for **real-time analytics and intelligence** in domains such as IoT, stock markets, and healthcare.

---

## What It Does

* Accepts natural language questions via a `/ask` API.
* Generates SQL queries using **Groq's LLaMA-3 model** via LangGraph nodes.
* Executes SQL against **Supabase** datasets using a PostgreSQL RPC.
* Summarizes results in plain English.
* Falls back to Groq LLM directly when:

  * SQL cannot be generated
  * SQL executes but returns no results

---

## Agent Architecture (LangGraph + ReAct)

```
[Input Question]
      ↓
[Node] Generate SQL (Groq)
      ↓
[Condition]
      ├─ No SQL or invalid → Fallback LLM (Groq)
      ↓
[Node] Run SQL (Supabase RPC)
      ↓
[Condition]
      ├─ Empty results → Fallback LLM (Groq)
      ↓
[Node] Summarize Result (Groq)
      ↓
[Output Answer]
```

---

## Tech Stack

* **LangGraph** for ReAct-style agent loop
* **LangChain** & `langchain-community` for model/tool abstractions
* **Groq API** running **LLaMA-3** for fast and cheap LLM usage
* **Supabase** for SQL execution via custom RPC function
* **FastAPI** for serving the `/ask` endpoint

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

> If `requirements.txt` is missing, manually run:

```bash
pip install fastapi uvicorn python-dotenv langchain langchain-community langgraph supabase
```

### 3. Create `.env`

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

> Optionally, for OpenAI fallback testing:

```env
OPENAI_API_KEY=your_openai_api_key
```

---

## Run the Server

```bash
uvicorn main:app --reload --port 8000
```

Now you can hit the API:

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the average temperature today?", "source": "IoT"}'
```

---

## ✅ Recent Changes

* ✅ Switched LLM backend to **Groq's LLaMA-3**
* ✅ Built a full **LangGraph ReAct agent**
* ✅ Added fallback logic for unanswerable/empty SQL results
* ✅ Clean prompt engineering for SQL generation + summarization
* ✅ Modular tool definitions and conditional edges
* ✅ FastAPI endpoint `/ask` for external use

---

## Structure

```bash
main.py                 # FastAPI + LangGraph agent logic
.env                    # API keys and credentials
requirements.txt        # Dependencies
```

---

## Security Notes

* Make sure `.env` is in your `.gitignore`
* Never hardcode your API keys or expose them in version control

---

## Future Improvements

* Add unit tests and validation for tool outputs
* Deploy as container or serverless function
* Support more domains/datasets dynamically

---
