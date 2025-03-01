import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load environment variables
const systemContent = process.env.CONTENT?.replace(/\\n/g, "\n") || "Default: Virtual CBT Therapist.";
const limitations = process.env.LIMITATIONS?.replace(/\\n/g, "\n") || "";
const therapistTypes = process.env.THERAPIST_TYPES?.replace(/\\n/g, "\n") || "";
const learningConfig = process.env.AI_LEARNING?.replace(/\\n/g, "\n") || "";
const cbtTechniques = process.env.CBT_TECHNIQUES?.replace(/\\n/g, "\n") || "";

// Define base system instructions for the AI therapist
const baseInstructions = `
${systemContent}
\n\n🔹 **Mandatory Limitations:**\n${limitations}
\n\n🔹 **Available Therapist Types:**\n${therapistTypes}
\n\n🔹 **Continuous Learning and Self-Improvement:**\n${learningConfig}
\n\n🔹 **CBT Techniques Used:**\n${cbtTechniques}
`;

let firstInteraction = true; // Flag to track if this is the first interaction

export async function POST(req: Request) {
  try {
    const { prompt, therapistType } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Select therapist style (default: Empathetic and Supportive)
    let selectedTherapist = "Empathetic and Supportive"; 
    if (therapistType && therapistTypes.includes(therapistType)) {
      selectedTherapist = therapistType;
    }

    // Inform AI about the selected therapist style
    const therapistPrompt = `🔹 **Selected Therapist Style:** ${selectedTherapist}\n`;

    // Initialize chat history
    const messages: ChatCompletionMessageParam[] = [];

    // Display introduction only on the first interaction
    if (firstInteraction) {
      messages.push({ role: "system", content: `${baseInstructions}\n\n${therapistPrompt}` });
      messages.push({ role: "assistant", content: "Hello, my name is Dovi, and I’m glad you chose me to guide you. I’m here to support you on your journey. Let's begin!" });
      firstInteraction = false; // Ensure the introduction is shown only once
    }

    // Add user's message to the chat history
    messages.push({ role: "user", content: prompt });

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500, // Limits response length for clarity
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}




// יך להשתמש בעדכון הזה?
// 1️⃣ בצד ה-Frontend, יש לאפשר למשתמש לבחור את סוג המטפל (therapistType).
// 2️⃣ בשליחת הבקשה ל-API, יש לשלוח את prompt יחד עם therapistType (אם נבחר).
// 3️⃣ הבוט יתאים את סגנונו אוטומטית, ואם המטופל יבחר לעבור סגנון, ניתן לעדכן זאת בזמן אמת.