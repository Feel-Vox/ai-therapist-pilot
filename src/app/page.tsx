"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);

  const userId = "test-user-123";
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add the user message to history
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, userId: userId }),
      });

      const data = await res.json();

      // Retrieve the text from the array
      const botResponse = Array.isArray(data.result) && data.result.length > 0
        ? data.result[0].text?.value
        : "No response";

      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Error: No response from chatbot." }]);
    }

    setInput("");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Chatbot AI</h1>
      <div className="w-full max-w-lg bg-gray-100 p-4 rounded shadow-md h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-1 rounded-md ${
              msg.sender === "user" ? "bg-blue-500 text-white self-end ml-auto" : "bg-gray-300 text-black self-start mr-auto"
            } max-w-[75%]`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex w-full max-w-lg mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל שאלה..."
          className="border rounded p-2 flex-1"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        >
          Send
        </button>
      </div>
    </main>
  );
}
