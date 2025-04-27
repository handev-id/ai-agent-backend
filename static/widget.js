(function () {
  const script = document.createElement("script");
  script.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
  script.integrity =
    "sha384-mkQ3/7FUtcGyoppY6bz/PORYoGqOl7/aSUMn2ymDOJcapfS6PHqxhRTMh1RR0Q6+";
  script.crossOrigin = "anonymous";
  script.onload = () => {
    afterInit();
  };
  document.head.appendChild(script);
})();

function generateUserId(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let userId = "";
  for (let i = 0; i < length; i++) {
    userId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return userId;
}

const userId = generateUserId(12);

const theme = window.theme || "#1f2937";
let agent = {};

function afterInit() {
  const socket = io("http://localhost:3001", {
    transports: ["websocket"],
    auth: {
      userId,
      token: window.clientId,
    },
  });

  // Create chat widget container
  const chatWidgetContainer = document.createElement("div");
  chatWidgetContainer.id = "chat-widget-container";
  document.body.appendChild(chatWidgetContainer);

  // Inject the HTML with pure CSS classes
  chatWidgetContainer.innerHTML = `
    <div id="chat-bubble" class="chat-bubble">
      <div id="chat-icon" class="chat-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div id="chat-close" class="chat-close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"></path>
        </svg>
      </div>
    </div>
    <div id="chat-popup-container" class="chat-popup-container">
      <div id="chat-popup" class="chat-popup">
        <div id="chat-header" class="chat-header">
        <svg style="font-size: 1.3rem;" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M64 224h13.5c24.7 56.5 80.9 96 146.5 96s121.8-39.5 146.5-96H384c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16h-13.5C345.8 39.5 289.6 0 224 0S102.2 39.5 77.5 96H64c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16zm40-88c0-22.1 21.5-40 48-40h144c26.5 0 48 17.9 48 40v24c0 53-43 96-96 96h-48c-53 0-96-43-96-96v-24zm72 72l12-36 36-12-36-12-12-36-12 36-36 12 36 12 12 36zm151.6 113.4C297.7 340.7 262.2 352 224 352s-73.7-11.3-103.6-30.6C52.9 328.5 0 385 0 454.4v9.6c0 26.5 21.5 48 48 48h80v-64c0-17.7 14.3-32 32-32h128c17.7 0 32 14.3 32 32v64h80c26.5 0 48-21.5 48-48v-9.6c0-69.4-52.9-125.9-120.4-133zM272 448c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm-96 0c-8.8 0-16 7.2-16 16v48h32v-48c0-8.8-7.2-16-16-16z"></path></svg>
          <h3 id="agent-name" style="color:#fff;"></h3>
          <button id="close-popup" class="close-popup-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="chat-messages" class="chat-messages"></div>
        <div id="typing-indicator" class="typing-indicator">Typing...</div>
        <div id="chat-input-container" class="chat-input-container">
          <div class="input-wrapper">
            <input type="text" id="chat-input" class="chat-input" placeholder="Type your message...">
            <button id="chat-submit" class="chat-submit">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add CSS styles
  const style = document.createElement("style");
  style.textContent = `
    /* Base styles */
    #chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .chat-bubble {
      width: 64px;
      height: 64px;
      background-color: ${theme};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .chat-icon, .chat-close {
      transition: transform 0.5s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chat-icon svg, .chat-close svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    
    .chat-close {
      display: none;
      position: absolute;
    }
    
    .chat-popup-container {
      display: none;
    }
    
    .chat-popup {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 70vh;
      max-height: 70vh;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      transform: scale(0.8);
      opacity: 0;
      transform-origin: bottom right;
      transition: transform 0.3s ease, opacity 0.3s ease;
      z-index: 999;
    }
    
    .chat-popup.show {
      transform: scale(1);
      opacity: 1;
    }
    
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: ${theme};
      color: white;
      border-radius: 8px 8px 0 0;
    }
    
    .chat-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .close-popup-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-popup-btn svg {
      width: 24px;
      height: 24px;
    }
    
    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }
    
    .typing-indicator {
      display: none;
      font-size: 14px;
      opacity: 0.5;
      margin: 0 16px 12px;
      width: 60px;
      position: absolute;
      bottom: 80px;
      animation: bounce 1s infinite;
    }
    
    .chat-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .input-wrapper {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .chat-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px 16px;
      outline: none;
      font-size: 14px;
    }
    
    .chat-input:focus {
      border-color: ${theme};
    }
    
    .chat-submit {
      background-color: ${theme};
      color: white;
      border-radius: 6px;
      padding: 8px 16px;
      cursor: pointer;
      border: none;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    
    .chat-submit:hover {
      background-color: #111827;
    }
    
    /* Message styles */
    .message-container {
      margin-bottom: 12px;
      display: flex;
    }
    
    .user-message {
      justify-content: flex-end;
    }
    
    .agent-message {
      justify-content: flex-start;
    }
    
    .message-bubble {
      font-size: 14px;
      white-space: pre-line;
      border-radius: 8px;
      padding: 8px 16px;
      max-width: 70%;
      line-height: 1.4;
    }
    
    .user-message .message-bubble {
      background-color: ${theme};
      color: white;
    }
    
    .agent-message .message-bubble {
      background-color: #e5e7eb;
      color: #111827;
    }
    
    /* Text formatting */
    .message-bubble strong {
      font-weight: bold;
    }
    
    .message-bubble em {
      font-style: italic;
    }
    
    /* Animations */
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .chat-popup {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
      
      .typing-indicator {
        bottom: 90px;
      }
    }
  `;
  document.head.appendChild(style);

  // Add event listeners
  const chatInput = document.getElementById("chat-input");
  const chatSubmit = document.getElementById("chat-submit");
  const chatMessages = document.getElementById("chat-messages");
  const chatBubble = document.getElementById("chat-bubble");
  const closePopup = document.getElementById("close-popup");
  const chatIcon = document.getElementById("chat-icon");
  const chatClose = document.getElementById("chat-close");
  const typingIndicator = document.getElementById("typing-indicator");
  const agentName = document.getElementById("agent-name");

  chatSubmit.addEventListener("click", function () {
    const message = chatInput.value.trim();
    if (!message) return;

    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
    onUserRequest(message);
  });

  chatInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      chatSubmit.click();
    }
  });

  chatBubble.addEventListener("click", function () {
    togglePopup();
  });

  closePopup.addEventListener("click", function () {
    togglePopup();
  });

  function togglePopup() {
    const chatPopupContainer = document.getElementById("chat-popup-container");
    const chatPopup = document.getElementById("chat-popup");

    if (
      chatPopupContainer.style.display === "none" ||
      !chatPopupContainer.style.display
    ) {
      chatPopupContainer.style.display = "block";
      chatIcon.style.display = "none";
      chatIcon.style.transform = "rotate(180deg)";
      chatClose.style.display = "block";

      setTimeout(() => {
        chatPopup.classList.add("show");
        chatClose.style.transform = "rotate(180deg)";
      }, 10);
    } else {
      chatPopup.classList.remove("show");
      chatClose.style.transform = "none";
      chatClose.style.display = "none";
      chatIcon.style.display = "block";

      setTimeout(() => {
        chatPopupContainer.style.display = "none";
      }, 300);

      setTimeout(() => {
        chatIcon.style.transform = "none";
      }, 10);
    }
  }

  function onUserRequest(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "message-container user-message";

    const bubbleElement = document.createElement("div");
    bubbleElement.className = "message-bubble";
    bubbleElement.textContent = message;

    messageElement.appendChild(bubbleElement);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    socket.emit("send-message", {
      userId,
      text: message,
      clientId: window.clientId,
    });
  }

  socket.on(`agent:${userId}`, (data) => {
    agentName.innerHTML = data.name;
  });

  socket.on(`reply-message:${userId}`, (msg) => {
    reply(msg);
  });

  socket.on(`agent-typing:${userId}`, (isTyping) => {
    typingIndicator.style.display = isTyping ? "block" : "none";
  });

  function reply(message) {
    const formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "- <em>$1</em>");

    const messageElement = document.createElement("div");
    messageElement.className = "message-container agent-message";

    const bubbleElement = document.createElement("div");
    bubbleElement.className = "message-bubble";
    bubbleElement.innerHTML = formattedMessage;

    messageElement.appendChild(bubbleElement);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}
