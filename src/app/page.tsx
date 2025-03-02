"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [correction, setCorrection] = useState<{ incorrect: string; index: number } | null>(null);
  const [correctedText, setCorrectedText] = useState("");

  const userId = "therapist-chat"; // Using a test user for now
  // Function to send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, userId: userId }) // Using a test user for now
      });

      const data = await res.json();

      console.log("📝 Assistant Response:", data.result);

      const assistantMessage = data.result || "No response from assistant.";

      setMessages((prev) => [...prev, { sender: "bot", text: assistantMessage }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Error processing request." }]);
    }

    setInput("");
  };

  // Function to submit a correction
  const submitCorrection = async () => {
    if (!correction || !correctedText.trim()) return;

    try {
      const res = await fetch("/api/update-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalMessage: correction.incorrect,
          correctedMessage: correctedText,
        })
      });

      const result = await res.json();
      console.log("🔄 Correction Sent:", result);

      if (result.success) {
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === correction.index ? { ...msg, text: correctedText } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error submitting correction:", error);
    }

    setCorrection(null);
    setCorrectedText("");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Chatbot AI - Therapist</h1>
      <div className="w-full max-w-lg bg-gray-100 p-4 rounded shadow-md h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 my-1 rounded-md ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
            {typeof msg.text === "string" ? msg.text : "Unsupported content format"}
            {msg.sender === "bot" && (
              <button 
                onClick={() => setCorrection({ incorrect: msg.text, index })} 
                className="ml-2 text-sm text-red-500 underline"
              >
                🛠 תקן תשובה
              </button>
            )}
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
          שלח
        </button>
      </div>

      {/* Correction Box */}
      {correction && (
        <div className="mt-4 p-2 border rounded w-full max-w-lg">
          <p className="font-bold">🔧 מתקנים את התשובה:</p>
          <p className="text-gray-600">{correction.incorrect}</p>
          <input
            type="text"
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            className="border p-1 w-full mt-2"
            placeholder="כתוב כאן את התשובה המתוקנת..."
          />
          <button 
            onClick={submitCorrection} 
            className="mt-2 bg-green-500 text-white px-4 py-1 rounded"
          >
            ✔️ שלח תיקון
          </button>
        </div>
      )}
    </main>
  );
}
