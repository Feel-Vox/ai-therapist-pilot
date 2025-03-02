import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { correctedMessage, originalMessage } = await req.json();

    if (!correctedMessage || !originalMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`🔄 Updating Assistant Instructions: 
      Incorrect: "${originalMessage}" 
      Corrected: "${correctedMessage}"`);

    // Retrieve current instructions
    const assistant = await openai.beta.assistants.retrieve(process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!);
    const existingInstructions = assistant.instructions || "";

    // Check if the correction already exists to avoid duplication
    if (existingInstructions.includes(`Incorrect: "${originalMessage}"`)) {
      return NextResponse.json({ message: "Correction already exists", success: true });
    }

    // ✅ **הוספת הוראה מפורשת לשימוש בתיקון**
    const updatedInstructions = `${existingInstructions}

🔹 **Mandatory Correction Rule:**  
- If a correction exists in the "Corrections Log", always use it instead of generating a new response.  
- Before responding, check if a correction exists for a similar user input and apply the corrected answer.

🔹 **Corrections Log:**  
- Incorrect: "${originalMessage}"  
- Corrected: "${correctedMessage}"  
`;

    // 3️⃣ **שליחת ההוראות המעודכנות ל-Assistant**
    await openai.beta.assistants.update(process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!, {
      instructions: updatedInstructions
    });

    console.log("✅ Assistant updated successfully!");

    return NextResponse.json({ success: true, message: "Assistant updated successfully" });

  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json({ error: "Failed to update assistant", details: error }, { status: 500 });
  }
}
