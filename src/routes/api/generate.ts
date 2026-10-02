import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const TEXT_MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

const Body = z.object({
  kind: z.enum(["title", "description", "both", "cover"]),
  category: z.string().max(60),
  title: z.string().max(200).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  avoid: z.array(z.string().max(200)).max(200).optional().default([]),
});

// Reads an SSE body and calls onEvent for each parsed JSON payload.
async function readSse(body: ReadableStream<Uint8Array>, onEvent: (type: string, data: any) => void) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
      let event = ""; const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      const raw = data.join("\n");
      if (!raw || raw === "[DONE]") continue;
      try { const json = JSON.parse(raw); onEvent(event || json.type || "", json); } catch { /* skip */ }
    }
  }
}

const errorResponse = async (res: Response) => {
  const text = await res.text().catch(() => "");
  let message = text;
  try { message = JSON.parse(text)?.error?.message ?? JSON.parse(text)?.message ?? text; } catch { /* plain */ }
  if (res.status === 402) message = "Закончились AI-кредиты. Пополните баланс в настройках рабочего пространства.";
  if (res.status === 429) message = "Слишком много запросов. Подождите немного и попробуйте снова.";
  return Response.json({ error: message || `Ошибка ${res.status}` }, { status: res.status });
};

async function generateText(apiKey: string, prompt: string) {
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: TEXT_MODEL, input: prompt, stream: true, store: false, reasoning: { effort: "low" } }),
  });
  if (!res.ok || !res.body) return { error: await errorResponse(res) };
  let text = ""; let failure = "";
  await readSse(res.body, (type, data) => {
    if (type === "response.output_text.delta") text += data.delta ?? "";
    if (type === "error" || type === "response.failed") failure = data?.error?.message ?? data?.response?.error?.message ?? "Ошибка генерации";
  });
  if (failure) return { error: Response.json({ error: failure }, { status: 502 }) };
  return { text };
}

async function generateCover(apiKey: string, prompt: string) {
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: "1536x1024", quality: "low", stream: true, partial_images: 1 }),
  });
  if (!res.ok || !res.body) return { error: await errorResponse(res) };
  let b64 = ""; let failure = ""; let any = false;
  await readSse(res.body, (type, data) => {
    if (type === "error") { failure = data?.error?.message ?? "Ошибка генерации"; any = true; }
    if (type === "image_generation.completed" && data.b64_json) { b64 = data.b64_json; any = true; }
    if (type === "image_generation.partial_image") any = true;
  });
  if (!any) {
    const replay = await fetch(`${GATEWAY}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: "1536x1024", quality: "low" }),
    });
    if (!replay.ok) return { error: await errorResponse(replay) };
    b64 = ((await replay.json()) as any)?.data?.[0]?.b64_json ?? "";
  }
  if (failure) return { error: Response.json({ error: failure }, { status: 502 }) };
  if (!b64) return { error: Response.json({ error: "Обложка не получена" }, { status: 502 }) };
  return { image: `data:image/png;base64,${b64}` };
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI не настроен" }, { status: 500 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Неверный запрос" }, { status: 400 });
        const { kind, category, title, description, avoid } = parsed.data;

        if (kind === "cover") {
          const prompt = `Premium luxurious key art cover for an HTML5 browser video game. Genre: ${category}. Game title: "${title}". Concept: ${description || title}. Cinematic lighting, rich saturated colors, polished AAA-quality illustration, dramatic composition, a clear central subject that directly depicts the title and concept, landscape 3:2. Absolutely no text, letters, logos or watermarks.`;
          const result = await generateCover(apiKey, prompt);
          return result.error ?? Response.json({ image: result.image });
        }

        const avoidList = avoid.length ? `\nНе повторяй эти названия: ${avoid.slice(0, 80).join("; ")}.` : "";
        const task = kind === "description"
          ? `Напиши описание для браузерной HTML5-игры жанра «${category}» с названием «${title}». 2–3 живых предложения на русском (до 300 символов), точно раскрывающих суть названия: что делает игрок, в чём цель и фишка. Верни JSON {"description": "..."}.`
          : kind === "title"
            ? `Придумай одно уникальное, звучное и короткое (1–3 слова) название на русском для браузерной HTML5-игры жанра «${category}».${avoidList} Верни JSON {"title": "..."}.`
            : `Придумай уникальную браузерную HTML5-игру жанра «${category}»: короткое звучное название на русском (1–3 слова) и описание из 2–3 живых предложений (до 300 символов), точно раскрывающее суть названия.${avoidList} Верни JSON {"title": "...", "description": "..."}.`;
        const result = await generateText(apiKey, `${task}\nОтвечай только JSON без пояснений.`);
        if (result.error) return result.error;
        const match = result.text.match(/\{[\s\S]*\}/);
        try {
          const json = JSON.parse(match?.[0] ?? "{}");
          return Response.json({
            title: typeof json.title === "string" ? json.title.trim().slice(0, 80) : undefined,
            description: typeof json.description === "string" ? json.description.trim().slice(0, 500) : undefined,
          });
        } catch {
          return Response.json({ error: "Не удалось разобрать ответ AI" }, { status: 502 });
        }
      },
    },
  },
});
