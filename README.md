# ✦ NOVA — Dynamic AI Conversational Assistant

NOVA is a full-stack AI conversational assistant built with **Python, Flask, Google Gemini, SQLite, HTML, CSS, and JavaScript**.

It provides an interactive conversational interface with persistent conversations, configurable memory, conversation search, analytics, response regeneration, quota protection, fallback handling, and a responsive frontend.

---

## 📌 Overview

NOVA is designed as a modular AI assistant rather than a simple chatbot interface.

The application separates its major responsibilities into independent layers:

* **Flask Application Layer** — handles HTTP requests and API routes
* **Response Engine** — coordinates AI response generation and fallback behavior
* **Gemini Integration** — communicates with Google's Gemini API
* **Database Layer** — manages conversations and messages using SQLite
* **Frontend Layer** — provides the interactive chat interface
* **Configuration Layer** — manages application configuration and environment variables
* **Quota Management** — tracks and controls AI request usage

---

## ✨ Features

### 🤖 AI Conversation

* AI-powered conversational responses using Google Gemini
* Multi-turn conversations
* Configurable conversation history
* Message validation and length limits
* User-friendly handling of AI/API failures

### 🧠 Conversation Memory

NOVA maintains conversation context using previously stored messages.

Users can enable or disable conversation memory through the Settings interface.

When memory is enabled, relevant previous messages are retrieved and passed to the response engine.

### 💬 Conversation Management

* Create new conversations
* Automatically generate conversation titles
* View recent conversations
* Reopen previous conversations
* Delete conversations
* Persist the active conversation ID in browser storage

### 🔎 Conversation Search

NOVA provides search across stored messages.

Search results can include:

* Matching message content
* Message role
* Conversation title
* Conversation ID
* Timestamp
* Message preview

Search is handled through the backend database layer and exposed through the search API.

### 📊 Analytics

NOVA provides application-level usage analytics, including:

* Total conversations
* Total messages
* User messages
* Assistant messages
* First recorded activity
* Latest recorded activity
* Daily message activity
* Conversation activity
* User/NOVA message distribution

### 🔄 Regenerate Responses

Users can regenerate an individual NOVA response.

The frontend associates assistant responses with their corresponding user messages so that the correct prompt can be regenerated.

### 📋 Copy Responses

AI responses include a copy action so users can quickly copy generated content.

### 🎨 Theme Support

NOVA includes a theme toggle for switching the appearance of the chat interface.

### ⚙️ Settings

The Settings interface provides controls for:

* Conversation memory
* AI analysis display

### 🛡️ Error & Quota Handling

NOVA handles common AI service and application failures, including:

* API authentication errors
* Rate-limit and quota errors
* Server connection failures
* Empty AI responses
* Invalid requests
* Message validation errors

The application also tracks AI usage and provides quota information through a dedicated API endpoint.

---

## 📸 Screenshots

### Main Chat Interface

![NOVA Chat Interface](screenshots/chat-interface.png)

### Search

![NOVA Search](screenshots/search.png)

### Analytics

![NOVA Analytics](screenshots/analytics.png)

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      User / Browser  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    HTML / CSS / JS   │
                         │       Frontend       │
                         └──────────┬───────────┘
                                    │
                              HTTP / JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Flask          │
                         │     Application      │
                         └──────────┬───────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
          ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
          │ Response       │ │ Database     │ │ Configuration│
          │ Engine         │ │ Layer        │ │ Layer        │
          └───────┬────────┘ └──────┬───────┘ └──────────────┘
                  │                 │
                  ▼                 ▼
          ┌────────────────┐ ┌──────────────┐
          │ Google Gemini  │ │    SQLite    │
          │      API       │ │   Database   │
          └────────────────┘ └──────────────┘
```

---

## 📂 Project Structure

```text
NOVA-AI-Conversational-Assistant/
│
├── app.py
├── config.py
├── requirements.txt
├── .env.example
├── .gitignore
│
├── chatbot/
│   ├── context.py
│   ├── fallback.py
│   ├── gemini.py
│   ├── quota_guard.py
│   └── response_engine.py
│
├── database/
│   └── db.py
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
└── templates/
    └── index.html
```

### Main Components

| Component                    | Responsibility                        |
| ---------------------------- | ------------------------------------- |
| `app.py`                     | Flask application and REST API routes |
| `config.py`                  | Application configuration             |
| `chatbot/gemini.py`          | Gemini API integration                |
| `chatbot/response_engine.py` | Response generation orchestration     |
| `chatbot/context.py`         | Conversation context handling         |
| `chatbot/fallback.py`        | Fallback response handling            |
| `chatbot/quota_guard.py`     | AI request quota protection           |
| `database/db.py`             | SQLite database operations            |
| `templates/index.html`       | Main application interface            |
| `static/js/app.js`           | Frontend application logic            |
| `static/css/style.css`       | UI styling                            |
| `requirements.txt`           | Python dependencies                   |

---

## 🔌 API Endpoints

### Application

| Method | Endpoint | Purpose                   |
| ------ | -------- | ------------------------- |
| `GET`  | `/`      | Serves the NOVA interface |

### Chat

| Method | Endpoint    | Purpose                 |
| ------ | ----------- | ----------------------- |
| `POST` | `/api/chat` | Generate an AI response |

The chat API supports conversation IDs, memory configuration, analysis configuration, and response regeneration.

### Conversations

| Method   | Endpoint                               | Purpose                       |
| -------- | -------------------------------------- | ----------------------------- |
| `GET`    | `/api/conversations`                   | Retrieve recent conversations |
| `GET`    | `/api/conversations/<conversation_id>` | Retrieve a conversation       |
| `DELETE` | `/api/conversations/<conversation_id>` | Delete a conversation         |

### Search

| Method | Endpoint                | Purpose                |
| ------ | ----------------------- | ---------------------- |
| `GET`  | `/api/search?q=<query>` | Search stored messages |

### Analytics

| Method | Endpoint         | Purpose                        |
| ------ | ---------------- | ------------------------------ |
| `GET`  | `/api/analytics` | Retrieve application analytics |

### Quota

| Method | Endpoint     | Purpose                               |
| ------ | ------------ | ------------------------------------- |
| `GET`  | `/api/quota` | Retrieve current AI quota information |

---

## 🛠️ Tech Stack

### Backend

* Python
* Flask
* REST-style JSON APIs

### AI

* Google Gemini API
* Modular response-generation architecture
* Fallback handling
* Quota protection

### Database

* SQLite
* Conversation persistence
* Message storage
* Search
* Analytics
* Quota tracking

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Fetch API
* Browser Local Storage

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shrishraddha214/NOVA-AI-Conversational-Assistant.git
```

Navigate into the project:

```bash
cd NOVA-AI-Conversational-Assistant
```

### 2. Create a Virtual Environment

**Windows**

```bash
python -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate
```

**macOS/Linux**

```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as the template.

Example:

```env
SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///nova.db
DEBUG=True
GEMINI_MODEL=gemini-3.6-flash
MAX_MESSAGE_LENGTH=4000
MAX_HISTORY_MESSAGES=20
```

**Never commit `.env` or any real API key to GitHub.**

### 5. Run NOVA

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

---

## 🔐 Security

Sensitive configuration is kept outside the repository.

Environment variables are used for secrets such as API credentials.

The following are excluded through `.gitignore`:

```text
.env
nova.db
*.sqlite
*.sqlite3
__pycache__/
*.pyc
.venv/
venv/
```

A `.env.example` file is provided as a safe configuration template.

**Never commit API keys, passwords, tokens, or private database files.**

---

## 💾 Data Persistence

NOVA uses SQLite for local data persistence.

The database stores information required for:

* Conversations
* Messages
* Conversation titles
* Search
* Analytics
* Quota tracking

The local database file is intentionally excluded from GitHub.

When another user clones the project, they can create and use their own local database without receiving the developer's conversation history.

---

## 🧠 Conversation Flow

A typical NOVA request follows this flow:

```text
User enters message
        │
        ▼
Frontend validation
        │
        ▼
POST /api/chat
        │
        ▼
Flask request validation
        │
        ▼
Load conversation history
(if memory is enabled)
        │
        ▼
Response Engine
        │
        ├──────────────► Quota / fallback handling
        │
        ▼
Google Gemini
        │
        ▼
Generated response
        │
        ▼
Store conversation messages
        │
        ▼
Return JSON response
        │
        ▼
Frontend renders response
```

---

## 📊 Analytics Flow

```text
SQLite Messages
       │
       ▼
Database Analytics Queries
       │
       ├── Total messages
       ├── User messages
       ├── Assistant messages
       ├── Activity dates
       └── Conversation activity
       │
       ▼
/api/analytics
       │
       ▼
NOVA Analytics Interface
```

---

## 🧪 Error Handling

NOVA provides application-level handling for common failure conditions, including:

* Empty messages
* Messages exceeding the configured length
* Invalid requests
* Missing conversation IDs
* AI service initialization failures
* Invalid API responses
* Authentication/API key failures
* Rate-limit and quota errors
* Server connection failures
* Empty AI responses

The frontend converts common backend/API failures into user-friendly messages instead of exposing raw backend errors directly.

---

## 🚧 Current Limitations

NOVA is currently designed as a local/full-stack project rather than a production multi-user platform.

Current limitations include:

* SQLite is used as the local database.
* Authentication and user accounts are not implemented.
* AI usage depends on the configured Gemini account and quota.
* AI responses may occasionally be inaccurate.
* Conversation memory is limited to the configured history window.
* A valid Gemini API configuration is required for AI responses.

---

## 🔮 Future Improvements

Possible future development areas include:

* User authentication and multi-user support
* PostgreSQL production database
* Streaming AI responses
* File/document upload and RAG-based question answering
* Web search and grounded responses
* Multimodal image input
* Advanced analytics dashboards
* Message feedback and evaluation metrics
* Improved intent classification
* Voice input
* Production deployment
* Automated testing and CI/CD

---

## 🎯 Project Objectives

NOVA was developed to demonstrate practical implementation of:

* AI API integration
* Conversational application design
* Backend API development
* Database persistence
* Context-aware conversations
* Frontend/backend communication
* Error and quota handling
* Analytics
* Modular software architecture
* Secure environment-variable configuration

---

## 🚀 Project Status

**Status: Completed**

The current version includes the core conversational assistant, persistent conversation management, search, analytics, configurable memory, response regeneration, quota handling, fallback handling, and a responsive frontend.

---

## 👩‍💻 Author

**Shraddha Shri**

Computer Science Engineering
B.Tech

---

## 📄 License

This project is intended for educational, portfolio, and demonstration purposes.
