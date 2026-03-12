# SpeakQL 🎙️

**Talk to your database. See the results.**

SpeakQL is a generative BI web application that lets users query complex databases using natural language (text or voice). The system translates your words into optimized SQL, executes it, and instantly renders the results as beautiful, interactive charts.

## Architecture

```
┌────────────────────┐       ┌────────────────────────────────────────┐
│  Next.js Frontend  │       │          FastAPI Backend               │
│  ─────────────────  │  ───▶ │  ┌──────────┐   ┌──────────────────┐ │
│  • Chat input       │       │  │ AI Agent  │──▶│  MCP Servers     │ │
│  • Voice (Web Speech│       │  │ (LangChain│   │  • Postgres      │ │
│    API)             │       │  │  + LLM)   │   │  • ClickHouse    │ │
│  • Dynamic Charts   │       │  └──────────┘   │  • REST APIs     │ │
│    (Recharts)       │       │                  └──────────────────┘ │
└────────────────────┘       └────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) PostgreSQL for live queries

### Backend
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start querying!

## Project Structure
```
speak-ql/
├── server/          # FastAPI backend + AI agent + MCP servers
│   ├── main.py
│   ├── agent/       # LangChain text-to-SQL agent
│   └── mcp/         # Model Context Protocol data connectors
└── client/          # Next.js frontend with Recharts
    └── src/
        ├── app/
        └── components/
```

## License
MIT
