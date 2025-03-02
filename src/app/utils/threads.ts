import fs from "fs";
import path from "path";

const THREADS_FILE = path.join(process.cwd(), "threads.json");

// Function to load call history from JSON file
export function loadThreads(): Record<string, string> {
  if (fs.existsSync(THREADS_FILE)) {
    return JSON.parse(fs.readFileSync(THREADS_FILE, "utf-8"));
  }
  return {};
}

// Function to save a user's Thread ID
export function saveThread(userId: string, threadId: string): void {
  const threads = loadThreads();
  threads[userId] = threadId;
  fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2));
}

// Function to get an existing user's Thread ID
export function getThreadId(userId: string): string | undefined {
  const threads = loadThreads();
  return threads[userId];
}