from chatbot.fallback import fallback_response
from chatbot.gemini import GeminiClient
from chatbot.quota_guard import QuotaGuard


class ResponseEngine:

    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(self, db):
        self.db = db

        # Gemini client
        self.gemini = GeminiClient()

        # Local quota protection.
        # Keep this below Gemini's actual free-tier limit.
        self.quota_guard = QuotaGuard(
            db=self.db,
            daily_limit=18
        )

    # ========================================================
    # GENERATE RESPONSE
    # ========================================================

    def generate(
        self,
        message: str,
        history: list | None = None
    ):
        """
        Generate a response using Gemini when quota is available.
        Falls back to the local fallback system when Gemini
        cannot be used.
        """

        # ----------------------------------------------------
        # QUOTA CHECK
        # ----------------------------------------------------

        if not self.quota_guard.can_make_request():
            print(
                "[NOVA] Local quota guard blocked Gemini request."
            )

            return {
                "response": fallback_response(message),
                "source": "fallback",
                "fallback": True,
                "quota_exceeded": True,
                "intent": None,
                "sentiment": None
            }

        # ----------------------------------------------------
        # GEMINI REQUEST
        # ----------------------------------------------------

        try:
            print(
                "[NOVA] Sending request to Gemini..."
            )

            # Reserve one request before sending it.
            #
            # This prevents multiple simultaneous requests
            # from bypassing the local quota limit.
            quota_result = self.quota_guard.record_request()

            # If the database refused the request, do not
            # contact Gemini.
            if isinstance(quota_result, dict):
                if not quota_result.get("available", True):
                    print(
                        "[NOVA] Quota became unavailable before Gemini request."
                    )

                    return {
                        "response": fallback_response(message),
                        "source": "fallback",
                        "fallback": True,
                        "quota_exceeded": True,
                        "intent": None,
                        "sentiment": None
                    }

            # ------------------------------------------------
            # CALL GEMINI
            # ------------------------------------------------

            response = self.gemini.generate_response(
                message=message,
                history=history
            )

            print(
                "[NOVA] Gemini response received."
            )

            return {
                "response": response,
                "source": "gemini",
                "fallback": False,
                "quota_exceeded": False,
                "intent": None,
                "sentiment": None
            }

        # ----------------------------------------------------
        # GEMINI ERROR
        # ----------------------------------------------------

        except Exception as error:

            error_text = str(error).lower()

            print(
                f"[NOVA] Gemini error: {error}"
            )

            # ------------------------------------------------
            # REAL GEMINI QUOTA / RATE-LIMIT ERROR
            # ------------------------------------------------

            if (
                "429" in error_text
                or "quota" in error_text
                or "too_many_requests" in error_text
                or "resource_exhausted" in error_text
            ):

                print(
                    "[NOVA] Gemini quota/rate limit reached."
                )

                # Do not manually modify the database here.
                # QuotaGuard/database remains responsible for
                # daily quota state and reset logic.
                self.quota_guard.mark_exhausted()

                return {
                    "response": fallback_response(message),
                    "source": "fallback",
                    "fallback": True,
                    "quota_exceeded": True,
                    "intent": None,
                    "sentiment": None
                }

            # ------------------------------------------------
            # OTHER GEMINI ERROR
            # ------------------------------------------------

            print(
                "[NOVA] Non-quota Gemini error."
            )

            return {
                "response": fallback_response(message),
                "source": "fallback",
                "fallback": False,
                "quota_exceeded": False,
                "intent": None,
                "sentiment": None
            }

    # ========================================================
    # QUOTA STATUS
    # ========================================================

    def get_quota_status(self):
        """
        Return the current quota status.
        """

        return self.quota_guard.get_status()