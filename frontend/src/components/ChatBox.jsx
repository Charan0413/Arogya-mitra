import { useState } from "react";
import api from "../services/api";
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";
import "./ChatBox.css";

/* ── strip markdown artifacts ── */
function stripMd(s) {
  return s
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/(?<!\w)\*(?!\*)/g, "")
    .trim();
}

function ChatBox() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const userId = Number(localStorage.getItem("user_id"));
      const res = await api.post("/chat", { user_id: userId, message });
      setReply(res.data.reply);
    } catch (err) {
      console.error(err);
      alert("Unable to contact AROMI.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="am-chat">
      <div className="am-chat-header">
        <div className="am-chat-avatar">
          <FaRobot size={20} />
        </div>
        <div>
          <h3>AROMI AI Coach</h3>
          <span className="am-chat-status">
            <span className="am-chat-dot" /> Online
          </span>
        </div>
      </div>

      <div className="am-chat-body">
        {reply && (
          <div className="am-chat-msg am-chat-bot">
            <div className="am-chat-msg-avatar">
              <FaRobot size={14} />
            </div>
            <div className="am-chat-bubble">
              {reply.split("\n").map((line, i) => {
                const trimmed = stripMd(line);
                if (!trimmed) return <br key={i} />;
                return <span key={i}>{trimmed}<br /></span>;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="am-chat-input-row">
        <textarea
          rows="2"
          placeholder="Ask AROMI about fitness, nutrition, recovery..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          className="am-chat-send"
          onClick={sendMessage}
          disabled={loading || !message.trim()}
        >
          {loading ? (
            <div className="am-chat-spinner" />
          ) : (
            <FaPaperPlane size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
