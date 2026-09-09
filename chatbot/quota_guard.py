from datetime import datetime, timezone

class QuotaGuard:

    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        db,
        daily_limit=18
    ):
        self.db = db
        self.daily_limit = int(daily_limit)

    # ========================================================
    # TODAY
    # ========================================================

    def _today(self):
        """
        Return today's date in UTC.

        The database is responsible for deciding whether
        the stored quota belongs to today and resetting it
        when necessary.
        """

        return datetime.now(
            timezone.utc
        ).date().isoformat()

    # ========================================================
    # STATUS
    # ========================================================

    def get_status(self):
        """
        Return the current quota status from the database.
        """

        status = self.db.get_quota_status(
            daily_limit=self.daily_limit
        )

        if not isinstance(status, dict):
            return {
                "available": False,
                "remaining": 0,
                "daily_limit": self.daily_limit,
                "used": 0
            }

        return status

    # ========================================================
    # CAN MAKE REQUEST
    # ========================================================

    def can_make_request(self):
        """
        Check whether another Gemini request is allowed.
        """

        status = self.get_status()

        return bool(
            status.get(
                "available",
                False
            )
        )

    # ========================================================
    # CONSUME REQUEST
    # ========================================================

    def consume(self):
        """
        Reserve/consume one request from the local quota.

        The database remains the single source of truth.
        """

        return self.db.consume_quota(
            daily_limit=self.daily_limit
        )

    # ========================================================
    # RECORD REQUEST
    #
    # Kept as an alias for ResponseEngine compatibility.
    # ========================================================

    def record_request(self):
        return self.consume()

    # ========================================================
    # MARK EXHAUSTED
    #
    # Gemini itself can report that the real API quota has
    # been exhausted before our local 18-request limit.
    #
    # The database quota remains the source of truth, so we
    # do not modify it directly here.
    # ========================================================

    def mark_exhausted(self):
        """
        Marking exhaustion is intentionally handled by the
        database quota logic.

        This method is kept so ResponseEngine can safely call
        it when Gemini returns a quota/rate-limit error.
        """

        return None

    # ========================================================
    # REMAINING REQUESTS
    # ========================================================

    def remaining(self):
        """
        Return the number of locally available requests.
        """

        status = self.get_status()

        try:
            return max(
                0,
                int(
                    status.get(
                        "remaining",
                        0
                    )
                )
            )

        except (TypeError, ValueError):
            return 0

    # ========================================================
    # LIMIT REACHED
    # ========================================================

    def is_exhausted(self):
        """
        Return True when no Gemini request is available.
        """

        return not self.can_make_request()
