import sqlite3
from pathlib import Path
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo


# ============================================================
# DATABASE PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "nova.db"


class Database:

    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        database_path=DATABASE_PATH
    ):
        self.database_path = str(
            database_path
        )

        self.initialize()


    # ========================================================
    # CONNECTION
    # ========================================================

    def _connect(self):

        connection = sqlite3.connect(
            self.database_path,
            timeout=10
        )

        connection.row_factory = sqlite3.Row

        connection.execute(
            "PRAGMA foreign_keys = ON"
        )

        return connection


    # ========================================================
    # INITIALIZE DATABASE
    # ========================================================

    def initialize(self):

        with self._connect() as connection:

            # ------------------------------------------------
            # CONVERSATIONS
            # ------------------------------------------------

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )


            # ------------------------------------------------
            # MESSAGES
            # ------------------------------------------------

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,

                    FOREIGN KEY (
                        conversation_id
                    )
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
                )
                """
            )


            # ------------------------------------------------
            # QUOTA USAGE
            # ------------------------------------------------

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS quota_usage (
                    date TEXT PRIMARY KEY,
                    requests_used INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                )
                """
            )


            # ------------------------------------------------
            # CONVERSATION COLUMN MIGRATION
            # ------------------------------------------------

            columns = connection.execute(
                "PRAGMA table_info(conversations)"
            ).fetchall()

            column_names = {
                column["name"]
                for column in columns
            }

            if "title" not in column_names:

                connection.execute(
                    """
                    ALTER TABLE conversations
                    ADD COLUMN title TEXT
                    """
                )


            # ------------------------------------------------
            # MESSAGES INDEX
            # ------------------------------------------------

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_messages_conversation
                ON messages(conversation_id)
                """
            )


            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_messages_created
                ON messages(created_at)
                """
            )


            # ------------------------------------------------
            # CONVERSATIONS INDEX
            # ------------------------------------------------

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_conversations_updated
                ON conversations(updated_at)
                """
            )


            connection.commit()


    # ========================================================
    # CREATE CONVERSATION
    # ========================================================

    def create_conversation(
        self,
        conversation_id,
        title=None
    ):

        now = datetime.now(
            timezone.utc
        ).isoformat()

        with self._connect() as connection:

            connection.execute(
                """
                INSERT OR IGNORE INTO conversations
                (
                    id,
                    title,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    conversation_id,
                    title,
                    now,
                    now
                )
            )

            connection.commit()


    # ========================================================
    # UPDATE CONVERSATION TITLE
    # ========================================================

    def update_conversation_title(
        self,
        conversation_id,
        title
    ):

        title = str(
            title
        ).strip()

        if len(title) > 45:

            title = (
                title[:45].rstrip()
                + "..."
            )

        now = datetime.now(
            timezone.utc
        ).isoformat()

        with self._connect() as connection:

            connection.execute(
                """
                UPDATE conversations
                SET
                    title = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    title,
                    now,
                    conversation_id
                )
            )

            connection.commit()


    # ========================================================
    # ADD MESSAGE
    # ========================================================

    def add_message(
        self,
        conversation_id,
        role,
        content
    ):

        conversation_id = str(
            conversation_id
        ).strip()

        role = str(
            role
        ).strip()

        content = str(
            content
        ).strip()

        if not conversation_id:

            raise ValueError(
                "Conversation ID cannot be empty."
            )

        if role not in (
            "user",
            "assistant"
        ):

            raise ValueError(
                "Role must be 'user' or 'assistant'."
            )

        if not content:

            raise ValueError(
                "Message content cannot be empty."
            )


        # Make sure conversation exists.

        self.create_conversation(
            conversation_id
        )


        now = datetime.now(
            timezone.utc
        ).isoformat()


        with self._connect() as connection:

            connection.execute(
                """
                INSERT INTO messages
                (
                    conversation_id,
                    role,
                    content,
                    created_at
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    conversation_id,
                    role,
                    content,
                    now
                )
            )


            connection.execute(
                """
                UPDATE conversations
                SET updated_at = ?
                WHERE id = ?
                """,
                (
                    now,
                    conversation_id
                )
            )


            connection.commit()


    # ========================================================
    # GET MESSAGES
    # ========================================================

    def get_messages(
        self,
        conversation_id,
        limit=100
    ):

        limit = max(
            1,
            int(limit)
        )

        with self._connect() as connection:

            rows = connection.execute(
                """
                SELECT
                    id,
                    conversation_id,
                    role,
                    content,
                    created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (
                    conversation_id,
                    limit
                )
            ).fetchall()


        rows = list(
            reversed(rows)
        )


        return [
            {
                "id": row["id"],
                "conversation_id":
                    row["conversation_id"],
                "role": row["role"],
                "content": row["content"],
                "created_at":
                    row["created_at"]
            }
            for row in rows
        ]


    # ========================================================
    # GET SINGLE CONVERSATION
    # ========================================================

    def get_conversation(
        self,
        conversation_id
    ):

        with self._connect() as connection:

            row = connection.execute(
                """
                SELECT
                    id,
                    title,
                    created_at,
                    updated_at
                FROM conversations
                WHERE id = ?
                """,
                (
                    conversation_id,
                )
            ).fetchone()


        if row is None:

            return None


        return dict(row)


    # ========================================================
    # GET ALL CONVERSATIONS
    # ========================================================

    def get_conversations(
        self,
        limit=50
    ):

        limit = max(
            1,
            int(limit)
        )

        with self._connect() as connection:

            rows = connection.execute(
                """
                SELECT
                    c.id,
                    c.title,
                    c.created_at,
                    c.updated_at,

                    (
                        SELECT content
                        FROM messages m
                        WHERE
                            m.conversation_id = c.id
                            AND m.role = 'user'
                        ORDER BY m.id ASC
                        LIMIT 1
                    ) AS first_message,

                    (
                        SELECT COUNT(*)
                        FROM messages m2
                        WHERE
                            m2.conversation_id = c.id
                    ) AS message_count

                FROM conversations c

                ORDER BY c.updated_at DESC

                LIMIT ?
                """,
                (
                    limit,
                )
            ).fetchall()


        conversations = []


        for row in rows:

            item = dict(row)


            if not item["title"]:

                first_message = (
                    item["first_message"]
                    or "New conversation"
                )

                title = (
                    first_message
                    .replace("\n", " ")
                    .strip()
                )

                if len(title) > 45:

                    title = (
                        title[:45].rstrip()
                        + "..."
                    )

                item["title"] = title


            conversations.append(
                item
            )


        return conversations


    # ========================================================
    # SEARCH MESSAGES
    # ========================================================

    def search_messages(
        self,
        query,
        limit=30
    ):

        query = str(
            query
        ).strip()

        if not query:

            return []


        limit = max(
            1,
            int(limit)
        )

        pattern = f"%{query}%"


        with self._connect() as connection:

            rows = connection.execute(
                """
                SELECT
                    m.id,
                    m.conversation_id,
                    m.role,
                    m.content,
                    m.created_at,
                    c.title

                FROM messages m

                LEFT JOIN conversations c
                    ON c.id = m.conversation_id

                WHERE m.content LIKE ?

                ORDER BY m.id DESC

                LIMIT ?
                """,
                (
                    pattern,
                    limit
                )
            ).fetchall()


        results = []


        for row in rows:

            content = row["content"]

            preview = (
                content
                .replace("\n", " ")
                .strip()
            )

            if len(preview) > 100:

                preview = (
                    preview[:100]
                    + "..."
                )


            results.append(
                {
                    "id": row["id"],

                    "conversation_id":
                        row["conversation_id"],

                    "role":
                        row["role"],

                    "preview":
                        preview,

                    "content":
                        content,

                    "title":
                        row["title"]
                        or "Conversation",

                    "created_at":
                        row["created_at"]
                }
            )


        return results


    # ========================================================
    # ANALYTICS
    # ========================================================

    def get_analytics(self):

        with self._connect() as connection:

            # ------------------------------------------------
            # BASIC COUNTS
            # ------------------------------------------------

            total_conversations = connection.execute(
                """
                SELECT COUNT(*)
                FROM conversations
                """
            ).fetchone()[0]


            total_messages = connection.execute(
                """
                SELECT COUNT(*)
                FROM messages
                """
            ).fetchone()[0]


            user_messages = connection.execute(
                """
                SELECT COUNT(*)
                FROM messages
                WHERE role = 'user'
                """
            ).fetchone()[0]


            assistant_messages = connection.execute(
                """
                SELECT COUNT(*)
                FROM messages
                WHERE role = 'assistant'
                """
            ).fetchone()[0]


            first_message = connection.execute(
                """
                SELECT MIN(created_at)
                FROM messages
                """
            ).fetchone()[0]


            last_message = connection.execute(
                """
                SELECT MAX(created_at)
                FROM messages
                """
            ).fetchone()[0]


            # ------------------------------------------------
            # DAILY MESSAGE ACTIVITY
            # ------------------------------------------------

            daily_rows = connection.execute(
                """
                SELECT
                    substr(created_at, 1, 10) AS date,

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN role = 'user'
                            THEN 1
                            ELSE 0
                        END
                    ) AS user_messages,

                    SUM(
                        CASE
                            WHEN role = 'assistant'
                            THEN 1
                            ELSE 0
                        END
                    ) AS assistant_messages

                FROM messages

                GROUP BY
                    substr(created_at, 1, 10)

                ORDER BY date ASC
                """
            ).fetchall()


            # ------------------------------------------------
            # CONVERSATION ACTIVITY
            # ------------------------------------------------

            conversation_rows = connection.execute(
                """
                SELECT
                    substr(created_at, 1, 10) AS date,
                    COUNT(*) AS conversations

                FROM conversations

                GROUP BY
                    substr(created_at, 1, 10)

                ORDER BY date ASC
                """
            ).fetchall()


        # ----------------------------------------------------
        # FORMAT DAILY ACTIVITY
        # ----------------------------------------------------

        daily_activity = []


        for row in daily_rows:

            daily_activity.append(
                {
                    "date":
                        row["date"],

                    "total":
                        row["total"] or 0,

                    "user":
                        row["user_messages"] or 0,

                    "assistant":
                        row["assistant_messages"] or 0
                }
            )


        # ----------------------------------------------------
        # FORMAT CONVERSATION ACTIVITY
        # ----------------------------------------------------

        conversation_activity = []


        for row in conversation_rows:

            conversation_activity.append(
                {
                    "date":
                        row["date"],

                    "conversations":
                        row["conversations"] or 0
                }
            )


        # ----------------------------------------------------
        # ROLE DISTRIBUTION
        # ----------------------------------------------------

        role_distribution = [

            {
                "role": "User",
                "count": user_messages
            },

            {
                "role": "NOVA",
                "count": assistant_messages
            }

        ]


        # ----------------------------------------------------
        # RETURN
        # ----------------------------------------------------

        return {

            "total_conversations":
                total_conversations,

            "total_messages":
                total_messages,

            "user_messages":
                user_messages,

            "assistant_messages":
                assistant_messages,

            "first_activity":
                first_message,

            "last_activity":
                last_message,

            "daily_activity":
                daily_activity,

            "conversation_activity":
                conversation_activity,

            "role_distribution":
                role_distribution
        }


    # ========================================================
    # QUOTA — INDIA DATE
    # ========================================================

    def _quota_date(self):

        """
        Return today's quota date in IST.

        This means the quota automatically belongs
        to a new day after 12:00 AM India time.
        """

        india_time = datetime.now(
            ZoneInfo("Asia/Kolkata")
        )

        return india_time.date().isoformat()


    # ========================================================
    # QUOTA — CURRENT IST TIMESTAMP
    # ========================================================

    def _quota_now(self):

        """
        Return current timestamp in IST.
        """

        return datetime.now(
            ZoneInfo("Asia/Kolkata")
        ).isoformat()


    # ========================================================
    # QUOTA — GET USAGE
    # ========================================================

    def get_quota_usage(
        self,
        date=None
    ):

        if date is None:

            date = self._quota_date()


        with self._connect() as connection:

            row = connection.execute(
                """
                SELECT
                    date,
                    requests_used,
                    updated_at
                FROM quota_usage
                WHERE date = ?
                """,
                (
                    date,
                )
            ).fetchone()


        if row is None:

            return {

                "date":
                    date,

                "requests_used":
                    0,

                "updated_at":
                    None

            }


        return {

            "date":
                row["date"],

            "requests_used":
                int(
                    row["requests_used"] or 0
                ),

            "updated_at":
                row["updated_at"]

        }


    # ========================================================
    # QUOTA — GET STATUS
    # ========================================================

    def get_quota_status(
        self,
        daily_limit
    ):

        daily_limit = max(
            0,
            int(daily_limit)
        )


        usage = self.get_quota_usage()


        used = int(
            usage["requests_used"]
        )


        remaining = max(
            daily_limit - used,
            0
        )


        percentage = 0

        if daily_limit > 0:

            percentage = round(
                (
                    used
                    / daily_limit
                ) * 100,
                1
            )


        return {

            "date":
                usage["date"],

            "used":
                used,

            "limit":
                daily_limit,

            "remaining":
                remaining,

            "percentage":
                percentage,

            "available":
                used < daily_limit,

            "updated_at":
                usage["updated_at"]

        }


    # ========================================================
    # QUOTA — CONSUME REQUEST
    # ========================================================

    def consume_quota(
        self,
        daily_limit,
        date=None
    ):

        daily_limit = max(
            0,
            int(daily_limit)
        )


        if date is None:

            date = self._quota_date()


        now = self._quota_now()


        with self._connect() as connection:

            # ------------------------------------------------
            # GET TODAY'S USAGE
            # ------------------------------------------------

            row = connection.execute(
                """
                SELECT
                    requests_used
                FROM quota_usage
                WHERE date = ?
                """,
                (
                    date,
                )
            ).fetchone()


            current_usage = (

                int(
                    row["requests_used"]
                    or 0
                )

                if row is not None

                else 0

            )


            # ------------------------------------------------
            # LIMIT CHECK
            # ------------------------------------------------

            if current_usage >= daily_limit:

                return False


            # ------------------------------------------------
            # INCREMENT
            # ------------------------------------------------

            new_usage = (
                current_usage + 1
            )


            # ------------------------------------------------
            # INSERT / UPDATE
            # ------------------------------------------------

            connection.execute(
                """
                INSERT INTO quota_usage
                (
                    date,
                    requests_used,
                    updated_at
                )
                VALUES (?, ?, ?)

                ON CONFLICT(date)

                DO UPDATE SET

                    requests_used =
                        excluded.requests_used,

                    updated_at =
                        excluded.updated_at
                """,
                (
                    date,
                    new_usage,
                    now
                )
            )


            connection.commit()


        return True


    # ========================================================
    # QUOTA — CLEAN OLD RECORDS
    # ========================================================

    def cleanup_old_quota_records(
        self,
        keep_days=7
    ):

        keep_days = max(
            1,
            int(keep_days)
        )


        cutoff_date = (

            datetime.now(
                ZoneInfo("Asia/Kolkata")
            ).date()

            - timedelta(
                days=keep_days
            )

        ).isoformat()


        with self._connect() as connection:

            connection.execute(
                """
                DELETE FROM quota_usage
                WHERE date < ?
                """,
                (
                    cutoff_date,
                )
            )


            connection.commit()


    # ========================================================
    # DELETE CONVERSATION
    # ========================================================

    def delete_conversation(
        self,
        conversation_id
    ):

        with self._connect() as connection:

            # Foreign key CASCADE removes messages.

            connection.execute(
                """
                DELETE FROM conversations
                WHERE id = ?
                """,
                (
                    conversation_id,
                )
            )

            connection.commit()


    # ========================================================
    # DATABASE HEALTH CHECK
    # ========================================================

    def health_check(self):

        try:

            with self._connect() as connection:

                connection.execute(
                    "SELECT 1"
                ).fetchone()


                # ------------------------------------------------
                # VERIFY IMPORTANT TABLES
                # ------------------------------------------------

                tables = connection.execute(
                    """
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                    AND name IN (
                        'conversations',
                        'messages',
                        'quota_usage'
                    )
                    """
                ).fetchall()


                table_names = {
                    row["name"]
                    for row in tables
                }


                required_tables = {
                    "conversations",
                    "messages",
                    "quota_usage"
                }


                return (
                    required_tables
                    .issubset(table_names)
                )


        except sqlite3.Error as error:

            print(
                "[NOVA] Database health check failed:",
                error
            )

            return False