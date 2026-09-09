from flask import Flask, render_template, request, jsonify

from config import Config
from database.db import Database
from chatbot.response_engine import ResponseEngine


# ============================================================
# APP
# ============================================================

app = Flask(__name__)
app.config.from_object(Config)


# ============================================================
# DATABASE
# ============================================================

db = Database()


# ============================================================
# RESPONSE ENGINE
# ============================================================

try:
    response_engine = ResponseEngine(db)
    print("[NOVA] Gemini service initialized.")

except Exception as error:
    response_engine = None

    print("[NOVA] Gemini initialization failed:")
    print(type(error).__name__, str(error))


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return render_template("index.html")


# ============================================================
# CHAT
# ============================================================

@app.post("/api/chat")
def chat():

    data = request.get_json(silent=True) or {}

    message = str(
        data.get("message", "")
    ).strip()

    conversation_id = str(
        data.get("conversation_id", "default")
    ).strip()

    memory_enabled = bool(
        data.get("memory_enabled", True)
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not message:
        return jsonify({
            "success": False,
            "error": "Message cannot be empty."
        }), 400

    if len(message) > Config.MAX_MESSAGE_LENGTH:
        return jsonify({
            "success": False,
            "error": "Message is too long."
        }), 400

    if not conversation_id:
        return jsonify({
            "success": False,
            "error": "Conversation ID is required."
        }), 400

    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    history = []

    if memory_enabled:
        history = db.get_messages(
            conversation_id,
            limit=Config.MAX_HISTORY_MESSAGES
        )

    print("\n[NOVA] Incoming message:")
    print(message)

    print("[NOVA] Conversation ID:")
    print(conversation_id)

    print("[NOVA] History messages:")
    print(len(history))

    # --------------------------------------------------------
    # AI SERVICE
    # --------------------------------------------------------

    if response_engine is None:
        return jsonify({
            "success": False,
            "error": "AI service is not configured."
        }), 503

    try:

        print("[NOVA] Calling response engine...")

        result = response_engine.generate(
            message=message,
            history=history
        )

        if result.get("fallback"):
            print(
                "[NOVA] Response generated using fallback."
            )
        else:
            print(
                "[NOVA] Response generated successfully."
            )

    except Exception as error:

        print(
            "\n========== NOVA CHAT ERROR =========="
        )

        print(type(error).__name__)
        print(str(error))

        print(
            "=====================================\n"
        )

        return jsonify({
            "success": False,
            "error": "AI service failed.",
            "details": str(error)
        }), 500

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    response = result.get(
        "response",
        ""
    )

    if not response:
        return jsonify({
            "success": False,
            "error": "AI returned an empty response."
        }), 500

    # --------------------------------------------------------
    # SAVE USER MESSAGE
    # --------------------------------------------------------

    if memory_enabled:

        db.add_message(
            conversation_id,
            "user",
            message
        )

        # ----------------------------------------------------
        # AUTOMATIC CONVERSATION TITLE
        # ----------------------------------------------------

        conversation = db.get_conversation(
            conversation_id
        )

        if conversation:

            if not conversation.get("title"):

                title = (
                    message
                    .replace("\n", " ")
                    .strip()
                )

                if len(title) > 45:
                    title = (
                        title[:45].rstrip()
                        + "..."
                    )

                db.update_conversation_title(
                    conversation_id,
                    title
                )

    # --------------------------------------------------------
    # SAVE ASSISTANT MESSAGE
    # --------------------------------------------------------

    if memory_enabled:

        db.add_message(
            conversation_id,
            "assistant",
            response
        )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return jsonify({

        "success": True,

        "response": response,

        "conversation_id": conversation_id,

        "memory_enabled": memory_enabled,

        "intent": result.get("intent"),

        "sentiment": result.get("sentiment"),

        "source": result.get("source"),

        "fallback": result.get(
            "fallback",
            False
        ),

        "quota_exceeded": result.get(
            "quota_exceeded",
            False
        )
    })


# ============================================================
# QUOTA STATUS
# ============================================================

@app.get("/api/quota")
def quota():

    if response_engine is None:
        return jsonify({
            "success": False,
            "error": "AI service is not configured."
        }), 503

    try:

        quota_status = (
            response_engine.get_quota_status()
        )

        return jsonify({
            "success": True,
            **quota_status
        })

    except Exception as error:

        print(
            "[NOVA] Quota status error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to retrieve quota status.",
            "details": str(error)
        }), 500


# ============================================================
# GET CONVERSATIONS
# ============================================================

@app.get("/api/conversations")
def get_conversations():

    try:

        conversations = db.get_conversations(
            limit=50
        )

        return jsonify({
            "success": True,
            "conversations": conversations
        })

    except Exception as error:

        print(
            "[NOVA] Conversation loading error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to load conversations.",
            "details": str(error)
        }), 500


# ============================================================
# GET SINGLE CONVERSATION
# ============================================================

@app.get(
    "/api/conversations/<conversation_id>"
)
def get_conversation(conversation_id):

    try:

        conversation = db.get_conversation(
            conversation_id
        )

        if conversation is None:
            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

        messages = db.get_messages(
            conversation_id,
            limit=100
        )

        return jsonify({
            "success": True,
            "conversation": conversation,
            "messages": messages
        })

    except Exception as error:

        print(
            "[NOVA] Conversation error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to load conversation.",
            "details": str(error)
        }), 500


# ============================================================
# SEARCH
# ============================================================

@app.get("/api/search")
def search():

    query = str(
        request.args.get("q", "")
    ).strip()

    if not query:
        return jsonify({
            "success": True,
            "results": []
        })

    try:

        results = db.search_messages(
            query,
            limit=30
        )

        return jsonify({
            "success": True,
            "query": query,
            "results": results
        })

    except Exception as error:

        print(
            "[NOVA] Search error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Search failed.",
            "details": str(error)
        }), 500


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/api/analytics")
def analytics():

    try:

        data = db.get_analytics()

        return jsonify({
            "success": True,
            **data
        })

    except Exception as error:

        print("[NOVA] Analytics error:")

        print(
            type(error).__name__,
            str(error)
        )

        return jsonify({
            "success": False,
            "error": "Analytics unavailable.",
            "details": str(error)
        }), 500


# ============================================================
# DELETE CONVERSATION
# ============================================================

@app.delete(
    "/api/conversations/<conversation_id>"
)
def delete_conversation(conversation_id):

    try:

        conversation = db.get_conversation(
            conversation_id
        )

        if conversation is None:
            return jsonify({
                "success": False,
                "error": "Conversation not found."
            }), 404

        db.delete_conversation(
            conversation_id
        )

        return jsonify({
            "success": True,
            "message": "Conversation deleted."
        })

    except Exception as error:

        print(
            "[NOVA] Delete error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to delete conversation.",
            "details": str(error)
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    try:

        database_ok = db.health_check()

    except Exception as error:

        print(
            "[NOVA] Database health check error:",
            error
        )

        database_ok = False

    ai_ok = response_engine is not None

    status = (
        "healthy"
        if database_ok and ai_ok
        else "degraded"
    )

    return jsonify({

        "success": True,

        "status": status,

        "database": database_ok,

        "ai_service": ai_ok
    })


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    if request.path.startswith("/api/"):

        return jsonify({
            "success": False,
            "error": "API endpoint not found."
        }), 404

    return render_template(
        "index.html"
    )


@app.errorhandler(500)
def internal_error(error):

    if request.path.startswith("/api/"):

        return jsonify({
            "success": False,
            "error": "Internal server error."
        }), 500

    return "Internal server error.", 500


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
