import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "AP Music Star",
    avatar: "🎤",
    unread: 2,
    messages: [
      {
        id: 1,
        sender: "AP Music Star",
        text: "Welcome to AP-STREAM! 🎵",
      },
    ],
  },
  {
    id: 2,
    name: "Africa Creator",
    avatar: "🎨",
    unread: 1,
    messages: [
      {
        id: 2,
        sender: "Africa Creator",
        text: "Check out the new community features!",
      },
    ],
  },
  {
    id: 3,
    name: "Football Fans",
    avatar: "⚽",
    unread: 0,
    messages: [
      {
        id: 3,
        sender: "Football Fans",
        text: "Who is watching the match today?",
      },
    ],
  },
];

export default function ChatCalls({ addNotification }) {
  const [activeConversation, setActiveConversation] = useState(
    conversations[0]
  );

  const [conversationList, setConversationList] =
    useState(conversations);

  const [message, setMessage] = useState("");
  const [callType, setCallType] = useState(null);

  const unreadMessages = conversationList.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );

  function selectConversation(conversation) {
    setActiveConversation(conversation);

    setConversationList((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? { ...item, unread: 0 }
          : item
      )
    );
  }

  function sendMessage() {
    const text = message.trim();

    if (!text || !activeConversation) return;

    const newMessage = {
      id: Date.now(),
      sender: "You",
      text,
    };

    setConversationList((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                newMessage,
              ],
            }
          : conversation
      )
    );

    setActiveConversation((current) => ({
      ...current,
      messages: [...current.messages, newMessage],
    }));

    setMessage("");

    if (addNotification) {
      addNotification(
        "💬",
        "Message sent",
        `Message sent to ${activeConversation.name}.`
      );
    }
  }

  function startCall(type) {
    setCallType(type);

    if (addNotification) {
      addNotification(
        type === "voice" ? "📞" : "📹",
        "Call started",
        `${type === "voice" ? "Voice" : "Video"} call started with ${activeConversation.name}.`
      );
    }
  }

  return (
    <section className="chat-calls" id="messages">
      <div className="chat-header">
        <div>
          <p className="eyebrow">AP-STREAM SOCIAL</p>
          <h2>
            💬 Messages
            {unreadMessages > 0 && (
              <span className="message-count">
                {unreadMessages}
              </span>
            )}
          </h2>
          <p className="section-subtitle">
            Chat with artists, creators, fans and communities.
          </p>
        </div>
      </div>

      <div className="messaging-layout">
        <aside className="conversation-list">
          <h3>Conversations</h3>

          {conversationList.map((conversation) => (
            <button
              className={`conversation-item ${
                activeConversation.id === conversation.id
                  ? "active"
                  : ""
              }`}
              key={conversation.id}
              onClick={() => selectConversation(conversation)}
            >
              <span className="conversation-avatar">
                {conversation.avatar}
              </span>

              <span className="conversation-info">
                <strong>{conversation.name}</strong>

                <small>
                  {conversation.messages.at(-1)?.text ||
                    "No messages yet"}
                </small>
              </span>

              {conversation.unread > 0 && (
                <span className="unread-message">
                  {conversation.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="chat-window">
          <div className="chat-user-header">
            <div>
              <span className="chat-avatar">
                {activeConversation.avatar}
              </span>

              <strong>{activeConversation.name}</strong>
            </div>

            <div className="call-actions">
              <button
                onClick={() => startCall("voice")}
              >
                📞
              </button>

              <button
                onClick={() => startCall("video")}
              >
                📹
              </button>
            </div>
          </div>

          <div className="messages">
            {activeConversation.messages.map((item) => (
              <div
                className={`message ${
                  item.sender === "You"
                    ? "message-you"
                    : ""
                }`}
                key={item.id}
              >
                <strong>{item.sender}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder={`Message ${activeConversation.name}...`}
            />

            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>

      {callType && (
        <div className="call-panel">
          <h3>
            {callType === "voice"
              ? "📞 Voice Call"
              : "📹 Video Call"}
          </h3>

          <p>
            Call interface ready. Real-time calling will be
            connected with WebRTC and the AP-STREAM backend.
          </p>

          <button onClick={() => setCallType(null)}>
            End Call
          </button>
        </div>
      )}
    </section>
  );
}
