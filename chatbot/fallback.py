import re


def fallback_response(message: str) -> str:
    """
    Generate a lightweight local response when
    Gemini is unavailable or quota is exhausted.
    """

    text = str(message).strip().lower()

    # --------------------------------------------------------
    # NORMALIZE TEXT
    # --------------------------------------------------------

    normalized = re.sub(
        r"[^\w\s]",
        "",
        text
    )

    normalized = re.sub(
        r"\s+",
        " ",
        normalized
    ).strip()


    # --------------------------------------------------------
    # GREETINGS
    # --------------------------------------------------------

    greetings = {
        "hi",
        "hello",
        "hey",
        "hii",
        "hiii",
        "helo",
        "helloo",
        "heyy",
        "good morning",
        "good afternoon",
        "good evening"
    }

    if normalized in greetings:
        return (
            "Hello! I'm NOVA. "
            "How can I help you today?"
        )


    # --------------------------------------------------------
    # IDENTITY
    # --------------------------------------------------------

    if (
        "who are you" in normalized
        or "what are you" in normalized
        or "tell me about yourself" in normalized
    ):
        return (
            "I'm NOVA, a dynamic AI conversational "
            "assistant designed to understand context, "
            "maintain conversation history, and provide "
            "useful responses."
        )


    # --------------------------------------------------------
    # THANK YOU
    # --------------------------------------------------------

    if (
        "thank you" in normalized
        or "thanks" in normalized
        or "thank" in normalized
    ):
        return (
            "You're welcome! Let me know if you need "
            "anything else."
        )


    # --------------------------------------------------------
    # GOODBYE
    # --------------------------------------------------------

    if normalized in {
        "bye",
        "goodbye",
        "good bye",
        "see you",
        "see ya"
    }:
        return (
            "Goodbye! I'll be here whenever you need me."
        )


    # --------------------------------------------------------
    # HELP
    # --------------------------------------------------------

    if normalized in {
        "help",
        "help me",
        "can you help me"
    }:
        return (
            "Of course. Tell me what you're working on "
            "and I'll do my best to help."
        )


    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    return (
        "I'm having trouble reaching my AI service "
        "right now. Please try again in a moment."
    )