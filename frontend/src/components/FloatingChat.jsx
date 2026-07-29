import { useState, useEffect } from "react";
import ChatBox from "./ChatBox";
import { FaRobot } from "react-icons/fa";
import "./FloatingChat.css";

function FloatingChat() {
  const [open, setOpen] = useState(false);

  // When chat closes, notify pages to refresh plan data
  useEffect(() => {
    if (!open) {
      window.dispatchEvent(new CustomEvent("plans-updated"));
    }
  }, [open]);

  return (
    <>
      {open && (
        <div className="fc-overlay" onClick={() => setOpen(false)}>
          <div className="fc-panel" onClick={(e) => e.stopPropagation()}>
            <ChatBox onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
      {!open && (
        <button className="fc-fab" onClick={() => setOpen(true)}>
          <FaRobot size={24} />
        </button>
      )}
    </>
  );
}

export default FloatingChat;
