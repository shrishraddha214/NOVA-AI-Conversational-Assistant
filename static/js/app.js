/* ============================================================
   NOVA — FRONTEND APPLICATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {


    /* ========================================================
       ELEMENTS
    ======================================================== */

    const elements = {

        messages:
            document.getElementById("messages"),

        messageInput:
            document.getElementById("messageInput"),

        sendBtn:
            document.getElementById("sendBtn"),

        voiceBtn:
            document.getElementById("voiceBtn"),

        newChatBtn:
            document.getElementById("newChatBtn"),

        conversationList:
            document.getElementById("conversationList"),

        welcomeScreen:
            document.getElementById("welcomeScreen"),

        typingIndicator:
            document.getElementById("typingIndicator"),

        analyticsBtn:
            document.getElementById("analyticsBtn"),

        settingsBtn:
            document.getElementById("settingsBtn"),

        settingsModal:
            document.getElementById("settingsModal"),

        closeSettings:
            document.getElementById("closeSettings"),

        memoryToggle:
            document.getElementById("memoryToggle"),

        analysisToggle:
            document.getElementById("analysisToggle"),

        themeBtn:
            document.getElementById("themeBtn"),

        searchBtn:
            document.getElementById("searchBtn")

    };


    /* ========================================================
       STATE
    ======================================================== */

    let conversationId =
        localStorage.getItem(
            "nova_conversation_id"
        );


    if (!conversationId) {

        conversationId =
            generateConversationId();

        localStorage.setItem(
            "nova_conversation_id",
            conversationId
        );

    }


    let memoryEnabled =
        localStorage.getItem(
            "nova_memory_enabled"
        ) !== "false";


    let analysisEnabled =
        localStorage.getItem(
            "nova_analysis_enabled"
        ) !== "false";


    let isGenerating = false;

    let searchPanel = null;


    /* ========================================================
       VOICE STATE
    ======================================================== */

    let speechRecognition = null;

    let isRecording = false;

    let speechSupported = false;

    let voiceBaseText = "";


    /* ========================================================
       INITIAL SETTINGS
    ======================================================== */

    if (elements.memoryToggle) {

        elements.memoryToggle.checked =
            memoryEnabled;

    }


    if (elements.analysisToggle) {

        elements.analysisToggle.checked =
            analysisEnabled;

    }


    /* ========================================================
       ID GENERATOR
    ======================================================== */

    function generateConversationId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();

        }


        return (
            "nova-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );

    }


    /* ========================================================
       HTML ESCAPE
    ======================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;

    }


    /* ========================================================
       WELCOME
    ======================================================== */

    function hideWelcome() {

        if (!elements.welcomeScreen) {
            return;
        }

        elements.welcomeScreen.classList.add(
            "hidden"
        );

    }


    function showWelcome() {

        if (!elements.welcomeScreen) {
            return;
        }

        elements.welcomeScreen.classList.remove(
            "hidden"
        );

    }


    /* ========================================================
       TYPING
    ======================================================== */

    function showTyping() {

        if (!elements.typingIndicator) {
            return;
        }

        elements.typingIndicator.classList.remove(
            "hidden"
        );

        scrollToBottom();

    }


    function hideTyping() {

        if (!elements.typingIndicator) {
            return;
        }

        elements.typingIndicator.classList.add(
            "hidden"
        );

    }


    /* ========================================================
       SCROLL
    ======================================================== */

    function scrollToBottom() {

        const container =
            document.querySelector(
                ".chat-container"
            );


        if (!container) {
            return;
        }


        requestAnimationFrame(() => {

            container.scrollTo({

                top:
                    container.scrollHeight,

                behavior:
                    "smooth"

            });

        });

    }


    /* ========================================================
       MARKDOWN FORMATTER
    ======================================================== */

    function formatAssistantResponse(value) {

        const text =
            String(value ?? "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .trim();


        if (!text) {
            return "";
        }


        const lines =
            text.split("\n");


        const output = [];

        let inCodeBlock = false;

        let codeLines = [];


        function inlineMarkdown(line) {

            let html =
                escapeHTML(line);


            html = html.replace(
                /`([^`\n]+)`/g,
                "<code>$1</code>"
            );


            html = html.replace(
                /\*\*([^*\n]+)\*\*/g,
                "<strong>$1</strong>"
            );


            html = html.replace(
                /(^|[^\*])\*([^*\n]+)\*(?!\*)/g,
                "$1<em>$2</em>"
            );


            return html;

        }


        function flushCodeBlock() {

            if (!codeLines.length) {
                return;
            }


            const code =
                escapeHTML(
                    codeLines.join("\n")
                );


            output.push(
                `<pre><code>${code}</code></pre>`
            );


            codeLines = [];

        }


        function flushParagraph(
            paragraphLines
        ) {

            if (!paragraphLines.length) {
                return;
            }


            const paragraph =
                paragraphLines
                    .map(line =>
                        inlineMarkdown(line)
                    )
                    .join("<br>");


            output.push(
                `<p>${paragraph}</p>`
            );


            paragraphLines.length = 0;

        }


        let paragraphLines = [];

        let currentList = null;


        function closeList() {

            if (!currentList) {
                return;
            }


            output.push(
                `</${currentList}>`
            );


            currentList = null;

        }


        function openList(type) {

            if (currentList === type) {
                return;
            }


            closeList();

            currentList = type;


            output.push(
                `<${type}>`
            );

        }


        for (
            let i = 0;
            i < lines.length;
            i++
        ) {

            const rawLine =
                lines[i];


            const trimmed =
                rawLine.trim();


            if (
                trimmed.startsWith("```")
            ) {

                if (inCodeBlock) {

                    flushCodeBlock();

                    inCodeBlock = false;

                } else {

                    flushParagraph(
                        paragraphLines
                    );

                    closeList();

                    inCodeBlock = true;

                }

                continue;

            }


            if (inCodeBlock) {

                codeLines.push(
                    rawLine
                );

                continue;

            }


            if (!trimmed) {

                flushParagraph(
                    paragraphLines
                );

                closeList();

                continue;

            }


            const headingMatch =
                trimmed.match(
                    /^(#{1,3})\s+(.+)$/
                );


            if (headingMatch) {

                flushParagraph(
                    paragraphLines
                );

                closeList();


                const level =
                    headingMatch[1].length;


                const headingText =
                    inlineMarkdown(
                        headingMatch[2].trim()
                    );


                output.push(
                    `<h${level}>${headingText}</h${level}>`
                );


                continue;

            }


            const bulletMatch =
                trimmed.match(
                    /^[-*•]\s+(.+)$/
                );


            if (bulletMatch) {

                flushParagraph(
                    paragraphLines
                );

                openList("ul");


                output.push(
                    `<li>${inlineMarkdown(
                        bulletMatch[1]
                    )}</li>`
                );


                continue;

            }


            const numberedMatch =
                trimmed.match(
                    /^\d+\.\s+(.+)$/
                );


            if (numberedMatch) {

                flushParagraph(
                    paragraphLines
                );

                openList("ol");


                output.push(
                    `<li>${inlineMarkdown(
                        numberedMatch[1]
                    )}</li>`
                );


                continue;

            }


            closeList();


            paragraphLines.push(
                rawLine
            );

        }


        if (inCodeBlock) {

            flushCodeBlock();

        }


        flushParagraph(
            paragraphLines
        );


        closeList();


        return output.join("");

    }


    /* ========================================================
       ADD USER MESSAGE
    ======================================================== */

    function addUserMessage(content) {

        if (!elements.messages) {
            return null;
        }


        const message =
            document.createElement("div");


        message.className =
            "message user-message";


        const avatar =
            document.createElement("div");


        avatar.className =
            "message-avatar user-avatar";


        avatar.textContent =
            "S";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "message-wrapper";


        const messageContent =
            document.createElement("div");


        messageContent.className =
            "message-content";


        messageContent.textContent =
            String(content ?? "");


        wrapper.appendChild(
            messageContent
        );


        message.appendChild(
            avatar
        );


        message.appendChild(
            wrapper
        );


        elements.messages.appendChild(
            message
        );


        scrollToBottom();


        return message;

    }


    /* ========================================================
       ADD ASSISTANT MESSAGE
    ======================================================== */

    function addAssistantMessage(
        content,
        source = "gemini",
        userMessage = null
    ) {

        if (!elements.messages) {
            return null;
        }


        const safeContent =
            String(content ?? "");


        const message =
            document.createElement("div");


        message.className =
            "message assistant-message";


        if (userMessage) {

            message.dataset.userMessage =
                String(userMessage);

        }


        const avatar =
            document.createElement("div");


        avatar.className =
            "nova-avatar";


        avatar.textContent =
            "✦";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "message-wrapper";


        const messageContent =
            document.createElement("div");


        messageContent.className =
            "message-content";


        messageContent.innerHTML =
            formatAssistantResponse(
                safeContent
            );


        const actions =
            document.createElement("div");


        actions.className =
            "message-actions";


        /* COPY */

        const copyBtn =
            document.createElement("button");


        copyBtn.className =
            "message-action";


        copyBtn.type =
            "button";


        copyBtn.title =
            "Copy response";


        copyBtn.innerHTML =
            "⧉ <span>Copy</span>";


        copyBtn.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        navigator.clipboard &&
                        typeof navigator.clipboard.writeText ===
                            "function"
                    ) {

                        await navigator.clipboard.writeText(
                            safeContent
                        );

                    } else {

                        const textarea =
                            document.createElement(
                                "textarea"
                            );


                        textarea.value =
                            safeContent;


                        textarea.style.position =
                            "fixed";


                        textarea.style.opacity =
                            "0";


                        document.body.appendChild(
                            textarea
                        );


                        textarea.select();


                        document.execCommand(
                            "copy"
                        );


                        textarea.remove();

                    }


                    copyBtn.innerHTML =
                        "✓ <span>Copied</span>";


                    setTimeout(() => {

                        copyBtn.innerHTML =
                            "⧉ <span>Copy</span>";

                    }, 1500);


                } catch (error) {

                    console.error(
                        "[NOVA] Copy error:",
                        error
                    );

                }

            }
        );


        /* REGENERATE */

        const regenerateBtn =
            document.createElement("button");


        regenerateBtn.className =
            "message-action";


        regenerateBtn.type =
            "button";


        regenerateBtn.innerHTML =
            "↻ <span>Regenerate</span>";


        regenerateBtn.addEventListener(
            "click",
            async () => {

                await regenerateResponse(
                    message
                );

            }
        );


        actions.appendChild(
            copyBtn
        );


        actions.appendChild(
            regenerateBtn
        );


        wrapper.appendChild(
            messageContent
        );


        wrapper.appendChild(
            actions
        );


        message.appendChild(
            avatar
        );


        message.appendChild(
            wrapper
        );


        elements.messages.appendChild(
            message
        );


        scrollToBottom();


        return message;

    }


    /* ========================================================
       SEND MESSAGE
    ======================================================== */

    async function sendMessage() {

        if (
            !elements.messageInput ||
            isGenerating
        ) {

            return;

        }


        const message =
            elements.messageInput.value.trim();


        if (!message) {
            return;
        }


        const maxLength = 4000;


        if (
            message.length > maxLength
        ) {

            alert(
                `Message cannot exceed ${maxLength} characters.`
            );

            return;

        }


        isGenerating = true;


        hideWelcome();


        addUserMessage(
            message
        );


        elements.messageInput.value =
            "";


        autoResizeTextarea();


        if (elements.sendBtn) {

            elements.sendBtn.disabled =
                true;

        }


        if (elements.voiceBtn) {

            elements.voiceBtn.disabled =
                true;

        }


        showTyping();


        try {

            console.log(
                "[NOVA] Sending chat request..."
            );


            const response =
                await fetch(
                    "/api/chat",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                message:
                                    message,

                                conversation_id:
                                    conversationId,

                                memory_enabled:
                                    memoryEnabled,

                                analysis_enabled:
                                    analysisEnabled

                            })

                    }
                );


            let data = null;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            console.log(
                "[NOVA] Chat response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    `Request failed (${response.status}).`
                );

            }


            if (
                data?.success !== true
            ) {

                throw new Error(
                    data?.error ||
                    "NOVA could not respond."
                );

            }


            const responseText =
                String(
                    data?.response || ""
                ).trim();


            if (!responseText) {

                throw new Error(
                    "NOVA returned an empty response."
                );

            }


            hideTyping();


            addAssistantMessage(
                responseText,
                data?.source || "gemini",
                message
            );


            if (
                data?.conversation_id &&
                data.conversation_id !==
                    conversationId
            ) {

                conversationId =
                    data.conversation_id;


                localStorage.setItem(
                    "nova_conversation_id",
                    conversationId
                );

            }


            await loadConversations();


        } catch (error) {

            console.error(
                "[NOVA] Chat error:",
                error
            );


            hideTyping();


            let errorMessage =
                "I couldn't process that request right now. Please try again.";


            const errorText =
                String(
                    error?.message || ""
                ).toLowerCase();


            if (
                errorText.includes("quota") ||
                errorText.includes("429") ||
                errorText.includes("rate limit") ||
                errorText.includes("resource exhausted")
            ) {

                errorMessage =
                    "NOVA has temporarily reached its AI usage limit. Please try again later.";

            } else if (
                errorText.includes("api key") ||
                errorText.includes("authentication")
            ) {

                errorMessage =
                    "NOVA's AI service is not configured correctly.";

            } else if (
                errorText.includes("failed to fetch")
            ) {

                errorMessage =
                    "NOVA could not connect to the server. Please check that the Flask server is running.";

            }


            addAssistantMessage(
                errorMessage,
                "error",
                message
            );


        } finally {

            isGenerating =
                false;


            if (elements.sendBtn) {

                elements.sendBtn.disabled =
                    false;

            }


            if (elements.voiceBtn) {

                elements.voiceBtn.disabled =
                    false;

            }


            if (elements.messageInput) {

                elements.messageInput.focus();

            }

        }

    }


    /* ========================================================
       REGENERATE
    ======================================================== */

    async function regenerateResponse(
        currentMessage
    ) {

        if (
            !currentMessage ||
            isGenerating
        ) {

            return;

        }


        const userMessage =
            currentMessage.dataset.userMessage;


        if (!userMessage) {

            console.warn(
                "[NOVA] Cannot regenerate: associated user message not found."
            );

            return;

        }


        isGenerating = true;


        if (elements.sendBtn) {

            elements.sendBtn.disabled =
                true;

        }


        if (elements.voiceBtn) {

            elements.voiceBtn.disabled =
                true;

        }


        if (currentMessage.parentNode) {

            currentMessage.remove();

        }


        showTyping();


        try {

            const response =
                await fetch(
                    "/api/chat",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                message:
                                    userMessage,

                                conversation_id:
                                    conversationId,

                                memory_enabled:
                                    memoryEnabled,

                                analysis_enabled:
                                    analysisEnabled,

                                regenerate:
                                    true

                            })

                    }
                );


            let data = null;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    `Regeneration failed (${response.status}).`
                );

            }


            if (
                data?.success !== true
            ) {

                throw new Error(
                    data?.error ||
                    "Regeneration failed."
                );

            }


            const responseText =
                String(
                    data?.response || ""
                ).trim();


            if (!responseText) {

                throw new Error(
                    "Regeneration returned an empty response."
                );

            }


            hideTyping();


            addAssistantMessage(
                responseText,
                data?.source || "gemini",
                userMessage
            );


            if (
                data?.conversation_id &&
                data.conversation_id !==
                    conversationId
            ) {

                conversationId =
                    data.conversation_id;


                localStorage.setItem(
                    "nova_conversation_id",
                    conversationId
                );

            }


            await loadConversations();


        } catch (error) {

            console.error(
                "[NOVA] Regeneration error:",
                error
            );


            hideTyping();


            addAssistantMessage(
                "I couldn't regenerate that response right now. Please try again.",
                "error",
                userMessage
            );


        } finally {

            isGenerating =
                false;


            if (elements.sendBtn) {

                elements.sendBtn.disabled =
                    false;

            }


            if (elements.voiceBtn) {

                elements.voiceBtn.disabled =
                    false;

            }


            if (elements.messageInput) {

                elements.messageInput.focus();

            }

        }

    }


    /* ========================================================
       AUTO RESIZE TEXTAREA
    ======================================================== */

    function autoResizeTextarea() {

        if (!elements.messageInput) {
            return;
        }


        elements.messageInput.style.height =
            "auto";


        elements.messageInput.style.height =
            Math.min(
                elements.messageInput.scrollHeight,
                150
            ) + "px";

    }


    /* ========================================================
       ENTER TO SEND
    ======================================================== */

    if (elements.messageInput) {

        elements.messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();


                    if (!isGenerating) {

                        sendMessage();

                    }

                }

            }
        );


        elements.messageInput.addEventListener(
            "input",
            autoResizeTextarea
        );

    }


    /* ========================================================
       SEND BUTTON
    ======================================================== */

    if (elements.sendBtn) {

        elements.sendBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (!isGenerating) {

                    sendMessage();

                }

            }
        );

    }


    /* ========================================================
       PUSH-TO-TALK SPEECH RECOGNITION
    ======================================================== */

    function initializeSpeechRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            speechSupported = false;


            if (elements.voiceBtn) {

                elements.voiceBtn.classList.add(
                    "unsupported"
                );


                elements.voiceBtn.title =
                    "Speech recognition is not supported in this browser";

            }


            console.warn(
                "[NOVA] Speech recognition is not supported in this browser."
            );


            return;

        }


        speechSupported = true;


        speechRecognition =
            new SpeechRecognition();


        /*
         * Continuous speech allows the user
         * to speak naturally.
         */

        speechRecognition.continuous =
            true;


        /*
         * Interim results make text appear
         * while the user is speaking.
         */

        speechRecognition.interimResults =
            true;


        /*
         * Hindi + English mixed speech is
         * commonly used by the user.
         *
         * Browser will use its available
         * recognition language.
         */

        speechRecognition.lang =
            "en-IN";


        speechRecognition.maxAlternatives =
            1;


        speechRecognition.onstart =
            () => {

                isRecording = true;


                if (elements.voiceBtn) {

                    elements.voiceBtn.classList.add(
                        "recording"
                    );


                    elements.voiceBtn.textContent =
                        "●";


                    elements.voiceBtn.title =
                        "Release to stop";

                }

            };


        speechRecognition.onresult =
            event => {

                if (!elements.messageInput) {
                    return;
                }


                let finalTranscript =
                    "";


                let interimTranscript =
                    "";


                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    const transcript =
                        event.results[i][0].transcript;


                    if (
                        event.results[i].isFinal
                    ) {

                        finalTranscript +=
                            transcript;

                    } else {

                        interimTranscript +=
                            transcript;

                    }

                }


                /*
                 * Keep the original text that existed
                 * before the recording started.
                 */

                const separator =
                    voiceBaseText &&
                    !voiceBaseText.endsWith(" ")
                        ? " "
                        : "";


                const visibleText =
                    voiceBaseText +
                    separator +
                    finalTranscript +
                    interimTranscript;


                elements.messageInput.value =
                    visibleText;


                autoResizeTextarea();


                elements.messageInput.focus();

            };


        speechRecognition.onerror =
            event => {

                console.error(
                    "[NOVA] Speech recognition error:",
                    event.error
                );


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    alert(
                        "Microphone permission was denied. Please allow microphone access for NOVA in your browser."
                    );

                } else if (
                    event.error ===
                    "no-speech"
                ) {

                    /*
                     * No alert here.
                     * This is normal if the user
                     * releases without speaking.
                     */

                }

            };


        speechRecognition.onend =
            () => {

                /*
                 * If the user released the button,
                 * recording should finish normally.
                 */

                stopVoiceUI();

            };

    }


    /* ========================================================
       STOP VOICE UI
    ======================================================== */

    function stopVoiceUI() {

        isRecording = false;


        if (elements.voiceBtn) {

            elements.voiceBtn.classList.remove(
                "recording"
            );


            elements.voiceBtn.textContent =
                "🎙";


            elements.voiceBtn.title =
                "Hold to speak";

        }

    }


    /* ========================================================
       START RECORDING
    ======================================================== */

    function startRecording(event) {

        if (event) {

            event.preventDefault();

        }


        if (
            !speechSupported ||
            !speechRecognition ||
            isGenerating ||
            isRecording
        ) {

            return;

        }


        if (!elements.messageInput) {
            return;
        }


        /*
         * Save existing text so voice text
         * gets appended instead of replacing it.
         */

        voiceBaseText =
            elements.messageInput.value.trim();


        try {

            speechRecognition.start();

        } catch (error) {

            console.warn(
                "[NOVA] Could not start speech recognition:",
                error
            );

        }

    }


    /* ========================================================
       STOP RECORDING
    ======================================================== */

    function stopRecording(event) {

        if (event) {

            event.preventDefault();

        }


        if (
            !speechRecognition ||
            !isRecording
        ) {

            stopVoiceUI();

            return;

        }


        try {

            speechRecognition.stop();

        } catch (error) {

            console.warn(
                "[NOVA] Could not stop speech recognition:",
                error
            );


            stopVoiceUI();

        }

    }


    /* ========================================================
       VOICE BUTTON EVENTS
    ======================================================== */

    if (elements.voiceBtn) {

        /*
         * Desktop mouse
         */

        elements.voiceBtn.addEventListener(
            "mousedown",
            startRecording
        );


        elements.voiceBtn.addEventListener(
            "mouseup",
            stopRecording
        );


        elements.voiceBtn.addEventListener(
            "mouseleave",
            event => {

                if (isRecording) {

                    stopRecording(event);

                }

            }
        );


        /*
         * Mobile / touch
         */

        elements.voiceBtn.addEventListener(
            "touchstart",
            startRecording,
            {
                passive: false
            }
        );


        elements.voiceBtn.addEventListener(
            "touchend",
            stopRecording,
            {
                passive: false
            }
        );


        elements.voiceBtn.addEventListener(
            "touchcancel",
            stopRecording,
            {
                passive: false
            }
        );


        /*
         * Prevent normal click from creating
         * unwanted behaviour after touch/mouse.
         */

        elements.voiceBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

            }
        );

    }


    /* ========================================================
       SUGGESTION CARDS
    ======================================================== */

    document
        .querySelectorAll(
            ".suggestion-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const prompt =
                        card.dataset.prompt;


                    if (!prompt) {
                        return;
                    }


                    if (
                        elements.messageInput
                    ) {

                        elements.messageInput.value =
                            prompt;


                        autoResizeTextarea();


                        elements.messageInput.focus();

                    }

                }
            );

        });


    /* ========================================================
       NEW CONVERSATION
    ======================================================== */

    if (elements.newChatBtn) {

        elements.newChatBtn.addEventListener(
            "click",
            async () => {

                if (isGenerating) {
                    return;
                }


                conversationId =
                    generateConversationId();


                localStorage.setItem(
                    "nova_conversation_id",
                    conversationId
                );


                if (elements.messages) {

                    elements.messages.innerHTML =
                        "";

                }


                hideTyping();

                showWelcome();


                if (elements.messageInput) {

                    elements.messageInput.value =
                        "";

                    autoResizeTextarea();

                    elements.messageInput.focus();

                }


                await loadConversations();

            }
        );

    }


    /* ========================================================
       CONVERSATION HISTORY
    ======================================================== */

    async function loadConversations() {

        if (!elements.conversationList) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/conversations"
                );


            if (!response.ok) {

                throw new Error(
                    `Conversation request failed (${response.status}).`
                );

            }


            const data =
                await response.json();


            if (
                !data?.success ||
                !Array.isArray(
                    data.conversations
                ) ||
                data.conversations.length === 0
            ) {

                elements.conversationList.innerHTML = `
                    <div class="empty-history">
                        No conversations yet
                    </div>
                `;

                return;

            }


            renderConversations(
                data.conversations
            );


        } catch (error) {

            console.error(
                "[NOVA] Conversation loading error:",
                error
            );


            elements.conversationList.innerHTML = `
                <div class="empty-history">
                    Unable to load conversations
                </div>
            `;

        }

    }


    /* ========================================================
       RENDER CONVERSATIONS
    ======================================================== */

    function renderConversations(
        conversations
    ) {

        if (!elements.conversationList) {
            return;
        }


        elements.conversationList.innerHTML =
            "";


        conversations
            .slice(0, 50)
            .forEach(conversation => {

                const id =
                    conversation?.id;


                if (!id) {
                    return;
                }


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "conversation-item";


                if (
                    id === conversationId
                ) {

                    item.classList.add(
                        "active"
                    );

                }


                const title =
                    conversation.title ||
                    conversation.name ||
                    "New conversation";


                const relativeTime =
                    formatConversationTime(
                        conversation.updated_at ||
                        conversation.created_at
                    );


                item.innerHTML = `

                    <button
                        class="conversation-main"
                        type="button"
                    >

                        <span class="conversation-icon">
                            ✦
                        </span>

                        <span class="conversation-info">

                            <span class="conversation-item-title">
                                ${escapeHTML(title)}
                            </span>

                            <span class="conversation-time">
                                ${escapeHTML(relativeTime)}
                            </span>

                        </span>

                    </button>


                    <button
                        class="conversation-delete"
                        type="button"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                    >
                        ×
                    </button>

                `;


                const openButton =
                    item.querySelector(
                        ".conversation-main"
                    );


                if (openButton) {

                    openButton.addEventListener(
                        "click",
                        () => {

                            openConversation(
                                id
                            );

                        }
                    );

                }


                const deleteButton =
                    item.querySelector(
                        ".conversation-delete"
                    );


                if (deleteButton) {

                    deleteButton.addEventListener(
                        "click",
                        async event => {

                            event.stopPropagation();


                            const confirmed =
                                window.confirm(
                                    "Delete this conversation?"
                                );


                            if (!confirmed) {
                                return;
                            }


                            try {

                                const response =
                                    await fetch(
                                        `/api/conversations/${encodeURIComponent(id)}`,
                                        {
                                            method:
                                                "DELETE"
                                        }
                                    );


                                const data =
                                    await response.json();


                                if (
                                    !response.ok ||
                                    !data?.success
                                ) {

                                    throw new Error(
                                        data?.error ||
                                        "Unable to delete conversation."
                                    );

                                }


                                if (
                                    id === conversationId
                                ) {

                                    conversationId =
                                        generateConversationId();


                                    localStorage.setItem(
                                        "nova_conversation_id",
                                        conversationId
                                    );


                                    if (
                                        elements.messages
                                    ) {

                                        elements.messages.innerHTML =
                                            "";

                                    }


                                    hideTyping();

                                    showWelcome();

                                }


                                await loadConversations();


                            } catch (error) {

                                console.error(
                                    "[NOVA] Delete conversation error:",
                                    error
                                );


                                alert(
                                    error?.message ||
                                    "Unable to delete conversation."
                                );

                            }

                        }
                    );

                }


                elements.conversationList.appendChild(
                    item
                );

            });

    }


    /* ========================================================
       CONVERSATION TIME
    ======================================================== */

    function formatConversationTime(
        timestamp
    ) {

        if (!timestamp) {
            return "";
        }


        const date =
            new Date(timestamp);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        const now =
            new Date();


        const difference =
            Math.max(
                0,
                now.getTime() -
                date.getTime()
            );


        const minute =
            60 * 1000;


        const hour =
            60 * minute;


        const day =
            24 * hour;


        if (
            difference < minute
        ) {

            return "Just now";

        }


        if (
            difference < hour
        ) {

            return `${Math.floor(
                difference / minute
            )}m ago`;

        }


        if (
            difference < day
        ) {

            return `${Math.floor(
                difference / hour
            )}h ago`;

        }


        if (
            difference < 7 * day
        ) {

            return `${Math.floor(
                difference / day
            )}d ago`;

        }


        return date.toLocaleDateString(
            undefined,
            {
                day:
                    "numeric",

                month:
                    "short"
            }
        );

    }


    /* ========================================================
       OPEN CONVERSATION
    ======================================================== */

    async function openConversation(id) {

        if (
            !id ||
            isGenerating
        ) {

            return;

        }


        try {

            const response =
                await fetch(
                    `/api/conversations/${encodeURIComponent(id)}`
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data?.success
            ) {

                throw new Error(
                    data?.error ||
                    "Unable to load conversation."
                );

            }


            conversationId =
                id;


            localStorage.setItem(
                "nova_conversation_id",
                conversationId
            );


            if (elements.messages) {

                elements.messages.innerHTML =
                    "";

            }


            hideTyping();


            const messages =
                Array.isArray(
                    data.messages
                )
                    ? data.messages
                    : [];


            if (
                messages.length === 0
            ) {

                showWelcome();

            } else {

                hideWelcome();


                messages.forEach(
                    (message, index) => {

                        if (
                            message?.role ===
                            "user"
                        ) {

                            addUserMessage(
                                message.content
                            );

                        } else if (
                            message?.role ===
                            "assistant"
                        ) {

                            let associatedUserMessage =
                                null;


                            for (
                                let i = index - 1;
                                i >= 0;
                                i--
                            ) {

                                if (
                                    messages[i]?.role ===
                                    "user"
                                ) {

                                    associatedUserMessage =
                                        messages[i].content;

                                    break;

                                }

                            }


                            addAssistantMessage(
                                message.content,
                                "history",
                                associatedUserMessage
                            );

                        }

                    }
                );

            }


            const conversations =
                await getConversationList();


            renderConversations(
                conversations
            );


            scrollToBottom();


        } catch (error) {

            console.error(
                "[NOVA] Open conversation error:",
                error
            );


            alert(
                error?.message ||
                "Unable to open this conversation."
            );

        }

    }


    /* ========================================================
       GET CONVERSATION LIST
    ======================================================== */

    async function getConversationList() {

        try {

            const response =
                await fetch(
                    "/api/conversations"
                );


            if (!response.ok) {
                return [];
            }


            const data =
                await response.json();


            return Array.isArray(
                data?.conversations
            )
                ? data.conversations
                : [];


        } catch (error) {

            console.error(
                "[NOVA] Conversation list error:",
                error
            );


            return [];

        }

    }


    /* ========================================================
       SEARCH
    ======================================================== */

    function closeSearch() {

        if (searchPanel) {

            searchPanel.remove();

            searchPanel =
                null;

        }

    }


    function createSearchPanel() {

        const panel =
            document.createElement(
                "div"
            );


        panel.className =
            "search-panel";


        panel.innerHTML = `

            <div class="search-header">

                <strong>
                    Search NOVA
                </strong>

                <button
                    type="button"
                    class="close-btn"
                    id="novaSearchClose"
                >
                    ×
                </button>

            </div>


            <input
                type="text"
                id="novaSearchInput"
                placeholder="Search conversations..."
                autocomplete="off"
            >


            <div
                class="search-results"
                id="novaSearchResults"
            >

                <div class="empty-history">
                    Start typing to search.
                </div>

            </div>

        `;


        document.body.appendChild(
            panel
        );


        const input =
            panel.querySelector(
                "#novaSearchInput"
            );


        const closeBtn =
            panel.querySelector(
                "#novaSearchClose"
            );


        if (input) {
            input.focus();
        }


        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                closeSearch
            );

        }


        if (input) {

            input.addEventListener(
                "input",
                () => {

                    performSearch(
                        input.value.trim()
                    );

                }
            );

        }


        return panel;

    }


    async function performSearch(query) {

        if (!searchPanel) {
            return;
        }


        const resultsContainer =
            searchPanel.querySelector(
                "#novaSearchResults"
            );


        if (!resultsContainer) {
            return;
        }


        if (!query) {

            resultsContainer.innerHTML = `
                <div class="empty-history">
                    Start typing to search.
                </div>
            `;

            return;

        }


        resultsContainer.innerHTML = `
            <div class="search-loading">
                Searching NOVA...
            </div>
        `;


        try {

            const response =
                await fetch(
                    `/api/search?q=${encodeURIComponent(query)}`
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data?.success
            ) {

                throw new Error(
                    data?.error ||
                    "Search failed."
                );

            }


            const results =
                Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];


            if (
                results.length === 0
            ) {

                resultsContainer.innerHTML = `
                    <div class="empty-history">
                        No matching conversations found.
                    </div>
                `;

                return;

            }


            resultsContainer.innerHTML =
                results
                    .map(result => {

                        const title =
                            result?.title ||
                            "Conversation";


                        const preview =
                            result?.preview ||
                            result?.content ||
                            "";


                        const resultId =
                            result?.conversation_id ||
                            result?.id ||
                            "";


                        if (!resultId) {
                            return "";
                        }


                        return `

                            <button
                                type="button"
                                class="search-result"
                                data-conversation-id="${escapeHTML(resultId)}"
                            >

                                <strong>
                                    ${escapeHTML(title)}
                                </strong>

                                <p>
                                    ${escapeHTML(preview)}
                                </p>

                            </button>

                        `;

                    })
                    .join("");


            resultsContainer
                .querySelectorAll(
                    ".search-result"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const id =
                                button.dataset.conversationId;


                            if (!id) {
                                return;
                            }


                            closeSearch();


                            await openConversation(
                                id
                            );

                        }
                    );

                });


        } catch (error) {

            console.error(
                "[NOVA] Search error:",
                error
            );


            resultsContainer.innerHTML = `
                <div class="empty-history">
                    Search is temporarily unavailable.
                </div>
            `;

        }

    }


    /* ========================================================
       SEARCH BUTTON
    ======================================================== */

    if (elements.searchBtn) {

        elements.searchBtn.addEventListener(
            "click",
            () => {

                if (searchPanel) {

                    closeSearch();

                    return;

                }


                searchPanel =
                    createSearchPanel();

            }
        );

    }


    /* ========================================================
       ANALYTICS
    ======================================================== */

    if (elements.analyticsBtn) {

        elements.analyticsBtn.addEventListener(
            "click",
            openAnalytics
        );

    }


    async function openAnalytics() {

        let overlay =
            document.getElementById(
                "novaAnalyticsOverlay"
            );


        if (!overlay) {

            overlay =
                createAnalyticsOverlay();

        }


        overlay.classList.remove(
            "hidden"
        );


        await loadAnalytics();

    }


    function createAnalyticsOverlay() {

        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "novaAnalyticsOverlay";


        overlay.className =
            "modal-overlay";


        overlay.innerHTML = `

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <span class="modal-eyebrow">
                            NOVA INSIGHTS
                        </span>

                        <h3>
                            Analytics
                        </h3>

                    </div>


                    <button
                        class="close-btn"
                        id="closeAnalytics"
                        type="button"
                    >
                        ×
                    </button>

                </div>


                <div id="analyticsContent">
                    Loading...
                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const closeButton =
            overlay.querySelector(
                "#closeAnalytics"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {

                    overlay.classList.add(
                        "hidden"
                    );

                }
            );

        }


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.classList.add(
                        "hidden"
                    );

                }

            }
        );


        return overlay;

    }


    async function loadAnalytics() {

        const container =
            document.getElementById(
                "analyticsContent"
            );


        if (!container) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/analytics"
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data?.success
            ) {

                throw new Error(
                    data?.error ||
                    "Analytics unavailable."
                );

            }


            container.innerHTML = `

                <div
                    style="
                        display:grid;
                        grid-template-columns:repeat(2,1fr);
                        gap:10px;
                    "
                >

                    ${analyticsCard(
                        "Conversations",
                        data.total_conversations ?? 0
                    )}

                    ${analyticsCard(
                        "Messages",
                        data.total_messages ?? 0
                    )}

                    ${analyticsCard(
                        "User Messages",
                        data.user_messages ?? 0
                    )}

                    ${analyticsCard(
                        "Assistant Messages",
                        data.assistant_messages ?? 0
                    )}

                </div>

            `;


        } catch (error) {

            console.error(
                "[NOVA] Analytics error:",
                error
            );


            container.innerHTML = `
                <div class="empty-history">
                    Analytics are temporarily unavailable.
                </div>
            `;

        }

    }


    function analyticsCard(
        title,
        value
    ) {

        return `

            <div
                style="
                    padding:17px;
                    border:1px solid var(--border);
                    border-radius:14px;
                    background:var(--surface-soft);
                "
            >

                <small
                    style="
                        color:var(--text-muted);
                        font-size:10px;
                    "
                >
                    ${escapeHTML(title)}
                </small>


                <div
                    style="
                        margin-top:7px;
                        font-size:25px;
                        font-weight:700;
                    "
                >
                    ${escapeHTML(value)}

                </div>

            </div>

        `;

    }


    /* ========================================================
       SETTINGS
    ======================================================== */

    function openSettings() {

        if (!elements.settingsModal) {
            return;
        }


        elements.settingsModal.classList.remove(
            "hidden"
        );


        if (elements.memoryToggle) {

            elements.memoryToggle.checked =
                memoryEnabled;

        }


        if (elements.analysisToggle) {

            elements.analysisToggle.checked =
                analysisEnabled;

        }

    }


    function closeSettings() {

        if (!elements.settingsModal) {
            return;
        }


        elements.settingsModal.classList.add(
            "hidden"
        );

    }


    if (elements.settingsBtn) {

        elements.settingsBtn.addEventListener(
            "click",
            openSettings
        );

    }


    if (elements.closeSettings) {

        elements.closeSettings.addEventListener(
            "click",
            closeSettings
        );

    }


    if (elements.settingsModal) {

        elements.settingsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    elements.settingsModal
                ) {

                    closeSettings();

                }

            }
        );

    }


    /* ========================================================
       MEMORY
    ======================================================== */

    if (elements.memoryToggle) {

        elements.memoryToggle.addEventListener(
            "change",
            event => {

                memoryEnabled =
                    event.target.checked;


                localStorage.setItem(
                    "nova_memory_enabled",
                    String(memoryEnabled)
                );

            }
        );

    }


    /* ========================================================
       ANALYSIS
    ======================================================== */

    if (elements.analysisToggle) {

        elements.analysisToggle.addEventListener(
            "change",
            event => {

                analysisEnabled =
                    event.target.checked;


                localStorage.setItem(
                    "nova_analysis_enabled",
                    String(analysisEnabled)
                );

            }
        );

    }


    /* ========================================================
       THEME
    ======================================================== */

    function applyTheme(theme) {

        const normalizedTheme =
            theme === "dark"
                ? "dark"
                : "light";


        if (
            normalizedTheme === "dark"
        ) {

            document.body.classList.add(
                "dark-mode"
            );

        } else {

            document.body.classList.remove(
                "dark-mode"
            );

        }


        localStorage.setItem(
            "nova_theme",
            normalizedTheme
        );

    }


    const savedTheme =
        localStorage.getItem(
            "nova_theme"
        );


    if (savedTheme) {

        applyTheme(
            savedTheme
        );

    } else {

        applyTheme(
            "light"
        );

    }


    if (elements.themeBtn) {

        elements.themeBtn.addEventListener(
            "click",
            () => {

                const isDark =
                    document.body.classList.contains(
                        "dark-mode"
                    );


                applyTheme(
                    isDark
                        ? "light"
                        : "dark"
                );

            }
        );

    }


    /* ========================================================
       ESC KEY
    ======================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            if (searchPanel) {

                closeSearch();

            }


            if (
                elements.settingsModal &&
                !elements.settingsModal.classList.contains(
                    "hidden"
                )
            ) {

                closeSettings();

            }


            const analyticsOverlay =
                document.getElementById(
                    "novaAnalyticsOverlay"
                );


            if (
                analyticsOverlay &&
                !analyticsOverlay.classList.contains(
                    "hidden"
                )
            ) {

                analyticsOverlay.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* ========================================================
       INITIALIZE VOICE
    ======================================================== */

    initializeSpeechRecognition();


    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    autoResizeTextarea();

    loadConversations();


    console.log(
        "[NOVA] Frontend initialized."
    );

});