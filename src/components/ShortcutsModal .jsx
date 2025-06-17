import { useEffect } from "react";
import { X } from "lucide-react";

const WelcomeShortcutsModal = ({ onClose, darkMode }) => {
  // Optional: Close modal on Esc key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ">
      <div className={`p-6 rounded-2xl max-w-lg w-full shadow-xl ${darkMode?"bg-neutral":"bg-white"} relative backdrop-blur-3xl`}>
        <h1 className="mb-5 text-xl font-bold font-mono text-center ">Here is a list of keyboard shortcuts</h1>
        <div className="flex items-center justify-center  ">
        <ul className="space-y-3 text-sm text-start">
          <li><kbd className="kbd text-black">Enter</kbd> — Send Message</li>
          <li><kbd className="kbd text-black">Ctrl + E</kbd> — Toggle Emoji Picker</li>
          <li><kbd className="kbd text-black">Ctrl + D</kbd> — Download Chat</li>
          <li><kbd className="kbd text-black">Ctrl + X</kbd> — Toggle Theme</li>
          <li><kbd className="kbd text-black">Ctrl + L</kbd> — Delete All Chats</li>
          <li><kbd className="kbd text-black">Ctrl + M</kbd> — Toggle Voice Mode</li>
          <li><kbd className="kbd text-black">Ctrl + Enter</kbd> — Start Voice Input</li>
          <li><kbd className="kbd text-black">Esc</kbd> — Close this help</li>
        </ul>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow hover:scale-105 transition"
          >
            Let’s Chat 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeShortcutsModal;
