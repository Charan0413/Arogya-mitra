import { useState } from "react";
import api from "../services/api";
import "./ChatBox.css";

function ChatBox() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
  if (!message.trim()) return;

  setLoading(true);

  try {
    const userId = Number(localStorage.getItem("user_id"));

    const res = await api.post("/chat", {
      user_id: userId,
      message,
    });

    setReply(res.data.reply);
  } catch (err) {
    console.error(err);
    alert("Unable to contact AROMI.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="chat-card">

      <h2>🤖 AROMI AI Coach</h2>

      <p>
        Ask anything about fitness, nutrition, recovery or workouts.
      </p>

      <textarea
        rows="4"
        placeholder="Example: How can I lose belly fat?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={sendMessage}
        disabled={loading}
      >
        {loading ? "Thinking..." : "Ask AROMI"}
      </button>

      {reply && (
        <div className="reply-box">
          <h3>AROMI says</h3>

          <pre>{reply}</pre>
        </div>
      )}

    </div>
  );
}

export default ChatBox;