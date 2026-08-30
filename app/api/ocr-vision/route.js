import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("image");
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //"X-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Read the nutrition facts table in this image. Return ONLY a JSON object, no markdown, no explanation, in this exact shape: {"energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "sat_fat_g": number|null, "fiber_g": number|null}. Use per-100g values. If sodium isn't listed but salt is, convert: sodium_mg = salt_g * 1000 / 2.5. Use null for anything not present in the image.` },
            { inline_data: { mime_type: file.type, data: base64 } },
          ],
        }],
        generationConfig: { thinkingConfig: { thinkingLevel: "MINIMAL" }, maxOutputTokens: 300 },
      }),
    }
  );

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return NextResponse.json(JSON.parse(cleaned));
  } catch {
    console.error("Vision OCR parse failed:", raw);
    return NextResponse.json({ error: "Could not parse label." }, { status: 500 });
  }
}