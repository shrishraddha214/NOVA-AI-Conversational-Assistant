import os
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


class Config:

    # ========================================================
    # APPLICATION
    # ========================================================

    APP_NAME = "NOVA"
    APP_VERSION = "1.0.0"


    # ========================================================
    # SECURITY
    # ========================================================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "nova-development-key"
    )


    # ========================================================
    # GEMINI
    # ========================================================

    GEMINI_API_KEY = os.getenv(
        "GEMINI_API_KEY"
    )

    GEMINI_MODEL = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.6-flash"
    )


    # ========================================================
    # DATABASE
    # ========================================================

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///nova.db"
    )


    # ========================================================
    # APPLICATION SETTINGS
    # ========================================================

    DEBUG = os.getenv(
        "DEBUG",
        "True"
    ).lower() == "true"

    MAX_MESSAGE_LENGTH = int(
        os.getenv(
            "MAX_MESSAGE_LENGTH",
            "4000"
        )
    )

    MAX_HISTORY_MESSAGES = int(
        os.getenv(
            "MAX_HISTORY_MESSAGES",
            "20"
        )
    )


    # ========================================================
    # QUOTA
    # ========================================================

    GEMINI_DAILY_LIMIT = int(
        os.getenv(
            "GEMINI_DAILY_LIMIT",
            "18"
        )
    )