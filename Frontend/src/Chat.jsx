import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);

  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      return;
    }

    if (!prevChats?.length) return;

    const content = reply.split(" ");
    let idx = 0;

    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" "));
      idx++;
      if (idx >= content.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [prevChats, reply]);

  const renderMarkdown = (content) => (
    <ReactMarkdown
      rehypePlugins={[rehypeHighlight]}
      components={{
        p: ({ node, ...props }) => (
          <p className=" px-4 sm:px-4 mb- py-2 rounded-xl max-w-[700px] text-md text-left " {...props} />
        ),
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code className=" text-amber-400 px-1  rounded-md text-md sm:text-sm font-mono break-words" {...props} />
          ) : (
            <pre className="  rounded-xl my-2 overflow-x-auto text-md max-w-[700px] ">
              <code {...props} />
            </pre>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
  
  return (
    <div className="max-h-screen bg-customdark text-white">
      {/* Chat container full width on phones, centered on bigger screens */}
      <div className="chats w-full sm:max-w-[700px] mx-auto px-2 sm:px-4 py-6 sm:py-10">
        {newChat && (
          <h2 className="text-gray-400 text-center mb-4 sm:mb-6 text-sm sm:text-base">
            Start a New Chat!
          </h2>
        )}

        {prevChats?.slice(0, -1).map((chat, idx) => (
          <div
            key={idx}
            className={`my-2 sm:my-3 flex ${chat.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div className="flex flex-col max-w-[95%] sm:max-w-[700px]">
              {chat.role === "user" ? (
                <p className="bg-customdarkq px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base w-fit break-words whitespace-pre-wrap">
                  {chat.content}
                </p>
              ) : (
                renderMarkdown(chat.content)
              )}
            </div>
          </div>
        ))}

        {prevChats.length > 0 && (
          <div className="my-2 sm:my-3 flex justify-start">
            <div className="flex flex-col max-w-[95%] sm:max-w-[700px]">
              {latestReply === null
                ? renderMarkdown(prevChats[prevChats.length - 1].content)
                : renderMarkdown(latestReply)}
            </div>
          </div>
        )}
      </div>
    </div>
  );


}

export default Chat;