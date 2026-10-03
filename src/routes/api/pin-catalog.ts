import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Writes admin-edited games into the project source (works in the editor preview, where files are writable).
const GameSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(120), image: z.string() }).passthrough();
const Body = z.object({ games: z.array(GameSchema).max(500) });

export const Route = createFileRoute("/api/pin-catalog")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Неверные данные" }, { status: 400 });
        try {
          const fs = await import("node:fs/promises");
          const path = await import("node:path");
          const root = process.cwd();
          const jsonPath = path.join(root, "src/lib/pinned-games.json");
          const imgDir = path.join(root, "public/pinned");
          await fs.mkdir(imgDir, { recursive: true });
          let existing: any[] = [];
          try { existing = JSON.parse(await fs.readFile(jsonPath, "utf8")); } catch { existing = []; }
          const map = new Map(existing.map(g => [g.slug, g]));
          for (const game of parsed.data.games) {
            const next: any = { ...game };
            const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(game.image);
            if (match) {
              const ext = match[1] === "png" ? "png" : match[1] === "webp" ? "webp" : "jpg";
              const file = `${game.slug}-${Date.now()}.${ext}`;
              await fs.writeFile(path.join(imgDir, file), Buffer.from(match[2], "base64"));
              next.image = `/pinned/${file}`;
            }
            map.set(game.slug, next);
          }
          await fs.writeFile(jsonPath, JSON.stringify([...map.values()], null, 2) + "\n");
          return Response.json({ pinned: parsed.data.games.length });
        } catch (error) {
          return Response.json({ error: "Закрепить можно только в редакторе (предпросмотр Lovable)." }, { status: 500 });
        }
      },
    },
  },
});
