from database.db import Database


class ConversationMemory:

    def __init__(
        self,
        max_messages=20
    ):

        self.max_messages = max_messages

        self.database = Database()

    def add_message(
        self,
        conversation_id,
        role,
        content
    ):

        self.database.add_message(
            conversation_id,
            role,
            content
        )

    def get_history(
        self,
        conversation_id
    ):

        return self.database.get_messages(
            conversation_id,
            self.max_messages
        )

    def clear(
        self,
        conversation_id
    ):

        self.database.delete_conversation(
            conversation_id
        )

    def get_all_conversations(self):

        return self.database.get_conversations()