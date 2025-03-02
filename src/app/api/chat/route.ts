import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { getThreadId, saveThread } from "@/app/utils/threads";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

async function isThreadValid(threadId: string): Promise<boolean> {
  try {
    const thread = await openai.beta.threads.retrieve(threadId);
    console.log("🔍 Thread ID:", JSON.stringify(thread, null, 2));
    return true;
  } catch (error) {
    console.warn(`Thread ${threadId} not found or expired.`);
    return false;
  }
}

async function findOrCreateThread(userId: string): Promise<string> {
  let threadId = getThreadId(userId);

  if (threadId && await isThreadValid(threadId)) {
    console.log(`Using existing Thread ID: ${threadId}`);
    return threadId;
  }

  console.log(`Creating new Thread for user ${userId}...`);
  const newThread = await openai.beta.threads.create();
  threadId = newThread.id;
  saveThread(userId, threadId);

  console.log(`New Thread ID: ${threadId} created.`);
  return threadId;
}



export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    if (!prompt || !userId) {
      console.error("Missing prompt or userId");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`🔹 Received prompt: ${prompt} from user: ${userId}`);

    const threadId = await findOrCreateThread(userId);

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt
    });

    // הפעלת ה-Assistant עם השיחה
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!
    });

    console.log("Waiting for assistant response...");

    // **Wait for the Run to finish** and pull the response from the Assistant
    let runStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      console.log(`🔄 Run status: ${runStatus.status}`);
    } while (runStatus.status !== "completed");

    // **Retrieve the last message from the Assistant**
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantResponse = messages.data.find(msg => msg.role === "assistant");

    return NextResponse.json({ result: assistantResponse?.content || "⚠️ No response from assistant." });

  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json({ error: "Failed to generate response", details: error });
  }
}
