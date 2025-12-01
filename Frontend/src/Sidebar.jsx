import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Sidebar({ isMobile = false, closeMobile }) {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
  } = useContext(MyContext);
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hoverLogo, setHoverLogo] = useState(false);

  // Fetch threads
  const getAllThreads = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch("https://guruzgpt.onrender.com/api/thread", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        }
        return;
      }

      const threads = await response.json();
      setAllThreads(threads.map(t => ({ threadId: t.threadId, title: t.title })));
    } catch (err) {
      toast.error("Error fetching threads.");
      console.error(err);
    }
  };

  // Fetch user email
  const getUserEmail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch("https://guruzgpt.onrender.com/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        }
        return;
      }

      const res = await response.json();
      setUserEmail(res.email || "No email provided");
    } catch (err) {
      console.error(err);
      setUserEmail(null);
    }
  };

  useEffect(() => {
    getAllThreads();
    getUserEmail();
  }, []);

  const createNewChat = () => {
    const newThreadId = uuidv1();
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(newThreadId);
    setPrevChats([]);
    if (isMobile && closeMobile) closeMobile();
  };

  const changeThread = async (threadId) => {
    setCurrThreadId(threadId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch(`https://guruzgpt.onrender.com/api/thread/${threadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) toast.error("Session expired");
        return;
      }

      const res = await response.json();
      setPrevChats(res);
      setNewChat(false);
      setReply(null);
      if (isMobile && closeMobile) closeMobile();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch(`https://guruzgpt.onrender.com/api/thread/${threadId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) toast.error("Session expired");
        return;
      }

      setAllThreads(prev => prev.filter(t => t.threadId !== threadId));
      if (threadId === currThreadId) createNewChat();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section
      className={`bg-neutral-900 text-gray-400 h-screen flex flex-col transition-all duration-300 
      ${isMobile ? "w-64" : collapsed ? "w-16" : "w-80"} 
      ${!isMobile ? "hidden md:flex" : ""}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between m-2 p-2 rounded-md hover:bg-gray-400/5 transition">
        <div
          onMouseEnter={() => setHoverLogo(true)}
          onMouseLeave={() => setHoverLogo(false)}
        >
          {collapsed && !isMobile ? (
            hoverLogo ? (
              <i
                className="fa-solid fa-arrows-left-right text-lg cursor-pointer"
                onClick={() => setCollapsed(false)}
              ></i>
            ) : (
              <img
                src="/images/guru.png"
                alt="logo"
                className="h-8 w-8 bg-white rounded-full object-cover"
              />
            )
          ) : (
            <img
              src="/images/guru.png"
              alt="logo"
              className="h-8 w-8 bg-white rounded-full object-cover"
            />
          )}
        </div>

        {!collapsed && !isMobile && (
          <button
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed(true)}
            className="ml-auto text-lg p-1"
          >
            <i className="fa-solid fa-arrows-left-right"></i>
          </button>
        )}

        {isMobile && closeMobile && (
          <button className="text-white text-xl p-1" onClick={closeMobile}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* New Chat */}
      <button
        onClick={createNewChat}
        className="flex items-center m-2 p-2 rounded-md hover:bg-gray-400/5 transition"
      >
        <i className="fa-solid fa-pen-to-square text-lg"></i>
        {(!collapsed || isMobile) && <span className="ml-2">Create New Chat</span>}
      </button>

      {/* Threads (Scrollable Middle Section) */}
      <div className="flex-1 overflow-y-auto m-2 p-2">
        {(!collapsed || isMobile) && <p className="text-sm mb-3">Chats</p>}

        {allThreads.length === 0 ? (
          (!collapsed || isMobile) && (
            <p className="text-sm text-gray-500">No threads available</p>
          )
        ) : (
          allThreads.map((thread) => (
            <div
              key={thread.threadId}
              onClick={() => changeThread(thread.threadId)}
              className={`relative flex items-center justify-between px-2 py-2 mb-1 text-sm rounded-md hover:bg-gray-400/5 cursor-pointer ${thread.threadId === currThreadId ? "bg-gray-400/5" : ""
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {collapsed && !isMobile ? (
                  <i className="fa-solid fa-comment-dots"></i>
                ) : (
                  <span className="truncate">
                    {thread.title || "Untitled"}
                  </span>
                )}
              </div>
              {(!collapsed || isMobile) && (
                <i
                  className="fa-solid fa-trash text-white hover:text-red-400 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(thread.threadId);
                  }}
                ></i>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer (Always at Bottom) */}
      <div className="p-2 m-2 text-sm text-center border-t border-white/50">
        {(!collapsed || isMobile) ? (
          <>
            <p>{userEmail || "Not logged in"}</p>
            <p>By GuruzGPT</p>
          </>
        ) : (
          <p className="text-xs">Guruz</p>
        )}
      </div>
    </section>
  );




}

export default Sidebar;
