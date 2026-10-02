// Client helpers for admin AI generation. Covers are shrunk to small JPEGs so they fit in browser storage.
type Kind = "title" | "description" | "both" | "cover";

export async function requestGeneration(body: { kind: Kind; category: string; title?: string; description?: string; avoid?: string[] }) {
  const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { title?: string; description?: string; image?: string; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `Ошибка ${res.status}`);
  return json;
}

export function shrinkImage(dataUrl: string, width = 600, height = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Не удалось обработать обложку"));
    img.src = dataUrl;
  });
}

const adjectives = ["extraordinary", "brilliant", "cosmic", "golden", "silent", "lucky", "velvet", "rapid", "mystic", "neon", "frosty", "radiant"];
const nouns = ["choux", "falcon", "comet", "pixel", "otter", "nebula", "maple", "quasar", "ember", "lynx", "harbor", "sprite"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
export const randomNetlifyUrl = () => `https://${pick(adjectives)}-${pick(nouns)}-${Math.random().toString(16).slice(2, 8)}.netlify.app/`;
