import { useState } from "react";
import ChatBox from "./ChatBox";
import { FaRobot, FaTimes } from "react-icons/fa";
import "./FloatingChat.css";

function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fc-overlay" onClick={() => setOpen(false)}>
          <div className="fc-panel" onClick={(e) => e.stopPropagation()}>
            <button className="fc-close" onClick={() => setOpen(false)}>
              <FaTimes size={18} />
            </button>
            <ChatBox />
          </div>
        </div>
      )}
      <button className="fc-fab" onClick={() => setOpen(!open)}>
        {open ? <FaTimes size={22} /> : <FaRobot size={24} />}
      </button>
    </>
  );
}

export default FloatingChat;
