# NOVA — Dynamic AI Conversational Assistant

> A full-stack AI conversational assistant built with Flask, Google Gemini, JavaScript, and SQLite — designed to provide contextual conversations with persistent chat history, search, analytics, and user controls.

---

## ✨ What is NOVA?

**NOVA** is a dynamic AI conversational assistant that goes beyond a basic chatbot.

It combines an AI response engine with persistent conversation storage, context management, search, analytics, regeneration, and a modern responsive interface.

The project was built to explore how an AI assistant can be designed as a **complete application**, rather than simply connecting a frontend to an LLM API.

---

## 🚀 Key Features

| Feature                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| 🤖 AI Conversations    | Generates responses using Google Gemini              |
| 🧠 Context & Memory    | Maintains conversation context across messages       |
| 💾 Persistent History  | Stores conversations and messages in SQLite          |
| 🔄 Regenerate Response | Regenerate an assistant response when needed         |
| 🔎 Search              | Search through previously stored conversations       |
| 📊 Analytics           | View conversation and message activity               |
| ⚙️ User Controls       | Toggle memory and analysis features                  |
| 🌙 Theme Support       | Light and dark mode                                  |
| 📋 Copy Responses      | Copy generated responses directly from the interface |
| 🛡️ Error Handling     | Fallback responses and API/quota protection          |
| 📱 Responsive UI       | Designed for desktop and smaller screens             |

---

## 📸 Screenshots

### Main Chat Interface

![Main NOVA Chat Interface](screenshots/Main%20NOVA%20chat%20interface.png)

### Search

![Search Interface](screenshots/Search%20interface.png)

### Analytics

![Analytics Interface](screenshots/Analytical%20interface.png)

---

## 🏗️ Architecture

```text
                        ┌──────────────────────┐
                        │      NOVA UI         │
                        │ HTML / CSS / JS      │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │      Flask API       │
                        │       app.py         │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          ┌──────────────────┐          ┌──────────────────┐
          │ Response Engine  │          │    Database      │
          │ Context / Gemini │          │ SQLite / History │
          └────────┬─────────┘          └──────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Google Gemini API│
          └──────────────────┘
```

### Request Flow

```text
User Message
     ↓
Flask API
     ↓
Context Retrieval
     ↓
Quota / Request Checks
     ↓
Gemini Response Generation
     ↓
Response Processing
     ↓
Database Persistence
     ↓
Frontend Response
```

---

## 🧩 Project Structure

```text
NOVA — Dynamic AI Conversational Assistant/
│
├── app.py
├── config.py
├── requirements.txt
├── .env.example
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
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
└── screenshots/
    ├── Main NOVA chat interface.png
    ├── Search interface.png
    └── Analytical interface.png
```

---

## 🛠️ Tech Stack

### Backend

* Python
* Flask
* SQLite

### AI

* Google Gemini API
* Context-aware response generation

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Development

* Git & GitHub
* Python virtual environment
* REST API architecture

---

## 🔌 API Endpoints

| Endpoint                  | Method   | Purpose                                    |
| ------------------------- | -------- | ------------------------------------------ |
| `/api/chat`               | `POST`   | Send a message and generate an AI response |
| `/api/conversations`      | `GET`    | Retrieve conversation history              |
| `/api/conversations/<id>` | `GET`    | Retrieve a specific conversation           |
| `/api/conversations/<id>` | `DELETE` | Delete a conversation                      |
| `/api/search`             | `GET`    | Search stored messages                     |
| `/api/analytics`          | `GET`    | Retrieve usage analytics                   |
| `/health`                 | `GET`    | Application health check                   |

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shrishraddha214/NOVA-AI-Conversational-Assistant.git
cd NOVA-AI-Conversational-Assistant
```

### 2. Create a virtual environment

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file using `.env.example` as a template:

```env
SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///nova.db
DEBUG=True
GEMINI_MODEL=gemini-3.6-flash
MAX_MESSAGE_LENGTH=4000
MAX_HISTORY_MESSAGES=20
```

> **Never commit your `.env` file or API keys to GitHub.**

### 5. Run the application

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

---

## 🧠 How NOVA Works

When a user sends a message, NOVA:

1. Receives and validates the request through Flask.
2. Retrieves relevant conversation context.
3. Applies the configured memory and analysis settings.
4. Checks request/quota protection.
5. Sends the request to the Gemini API.
6. Processes the generated response.
7. Stores the conversation and response in SQLite.
8. Returns the result to the frontend.

This separation keeps the application modular and makes individual components easier to maintain or replace.

---

## 📊 Analytics

NOVA includes an analytics interface that tracks application usage such as:

* Total conversations
* Total messages
* User messages
* Assistant responses
* Conversation activity

The analytics layer is connected to the stored conversation data rather than using hard-coded values.

---

## 🔐 Security & Reliability

The project includes several safeguards:

* Environment variables for API credentials
* `.gitignore` protection for secrets and local databases
* Input length validation
* API error handling
* Gemini quota protection
* Fallback response handling
* Persistent local database storage

For public deployment, additional production security measures such as HTTPS, stronger secret management, authentication, rate limiting, and production-grade database infrastructure should be added.

---

## 📌 Current Limitations

NOVA is currently designed primarily as a **local/development application**.

Some areas that would need additional work for production deployment include:

* User authentication and authorization
* Production database
* Distributed rate limiting
* Cloud deployment
* Advanced observability and logging
* More sophisticated long-term memory
* Automated testing and CI/CD

---

## 🔮 Future Improvements

Planned areas for further development include:

* 🔐 User authentication
* ☁️ Cloud deployment
* 🧠 Long-term semantic memory
* 📎 File and document understanding
* 🎙️ Voice interaction
* 📈 More advanced analytics visualizations
* 🧪 Automated testing
* ⚡ Streaming AI responses

---

## 🎯 Project Objective

The main objective of NOVA was to build a complete AI-powered application while understanding the engineering challenges around:

* LLM API integration
* Context management
* Persistent conversations
* Backend API design
* Database integration
* Frontend state management
* Error and quota handling
* AI application architecture

---

## 👩‍💻 Author

**Shraddha Shri**

Computer Science Engineering
B.Tech — AKTU

---

## 📄 License

This project is intended for educational and portfolio purposes.
