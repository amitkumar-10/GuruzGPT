import Chat from "./Chat.jsx";
import Sidebar from "./Sidebar.jsx";
import { MyContext } from "./MyContext.jsx";
import { UserContext } from "./UserContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    setAllThreads,
    setCurrThreadId,
  } = useContext(MyContext);

  const { setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // user dropdown
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch reply
  const getReply = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setNewChat(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in");
        navigate("/login");
        return;
      }

      const response = await fetch("https://guruzgpt.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, threadId: currThreadId }),
      });

      if (!response.ok) {
        const errRes = await response.json();
        toast.error(errRes.message || "Failed to fetch reply");
        return;
      }

      const res = await response.json();
      setReply(res.reply);

      // Refresh threads
      const threadResponse = await fetch("https://guruzgpt.onrender.com/api/thread", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (threadResponse.ok) {
        const threads = await threadResponse.json();
        setAllThreads(threads.map(t => ({ threadId: t.threadId, title: t.title })));
      }
    } catch (err) {
      toast.error("Error fetching reply");
      console.error(err);
    }
    setLoading(false);
  };

  // Append reply to chat
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats(prev => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
    }
    setPrompt("");
  }, [reply]);

  // User dropdown click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setReply(null);
    setPrompt("");
    setPrevChats([]);
    setAllThreads([]);
    setCurrThreadId(null);
    setNewChat(true);
    setUser(null);
    toast.success("Logged out successfully");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="bg-customdark max-h-screen w-full flex flex-col relative">
      {/* Navbar */}
      <div className="w-full flex justify-between items-center px-4 py-3 border-b border-white/10">
        <span className="text-white font-medium tracking-wide flex items-center gap-2">
          {/* Hamburger only on mobile */}
          <button
            id="hamburger-btn"
            className="md:hidden mr-3 text-xl"
            onClick={() => setIsMobileOpen(true)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          GuruzGPT <i className="fa-solid fa-chevron-down text-xs"></i>
        </span>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className=" h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-white hover:bg-gray-800 transition"
            onClick={() => setIsOpen(prev => !prev)}
          >
           <i className="fa-regular fa-user"></i>
          </div>
          {isOpen && (
            <div className="absolute top-12 right-0 w-44 bg-neutral-800 p-2 rounded-md text-sm shadow-lg z-50">
              <div className="px-3 py-2 cursor-pointer hover:bg-gray-100/10 rounded-md">Settings</div>
              <div className="px-3 py-2 cursor-pointer hover:bg-gray-100/10 rounded-md">Upgrade plan</div>
              <div
                className="px-3 py-2 cursor-pointer hover:bg-red-500 hover:text-white text-red-400 rounded-md"
                onClick={handleLogout}
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed top-0 left-0 w-64 h-full bg-neutral-900 shadow-lg z-50 transform transition-transform duration-300">
            <button className="absolute top-4 right-4 text-white text-xl" onClick={() => setIsMobileOpen(false)}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
            <Sidebar isMobile={true} closeMobile={() => setIsMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4">
        <Chat />
      </div>

      {loading && (
        <div className="flex justify-center items-center py-2">
          <ScaleLoader color="#d1d1d1ff" loading={loading} />
        </div>
      )}

      {/* Input box */}
      <div className="w-full flex flex-col justify-center items-center p-4 border-t border-white/10">
        <div className="w-full max-w-2xl relative">
          <input
            placeholder="Ask anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
            className="w-full bg-white/5 p-4 pr-12 text-sm rounded-xl shadow-md focus:outline-none text-white placeholder-gray-400"
          />
          <button
            onClick={getReply}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          GuruzGPT can make mistakes. Check important info. See Cookie Preferences.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
