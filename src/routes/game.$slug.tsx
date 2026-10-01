import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/components/game-portal";
import { PageShell } from "@/components/auth-controls";
import { games } from "@/lib/games";
import { useCatalog } from "@/lib/demo-store";

export const Route = createFileRoute("/game/$slug")({
  loader: ({ params }) => games.find(item => item.slug === params.slug) ?? null,
  head: ({ loaderData }) => { const title = loaderData ? `${loaderData.title} — играть онлайн | GameHaven` : "Игра | GameHaven"; const description = loaderData?.description ?? "Играйте бесплатно в браузере на GameHaven."; return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }; },
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams(); const { catalog } = useCatalog();
  const game = catalog.find(item => item.slug === slug);
  if (!game) return <PageShell><div className="grid min-h-[70vh] place-items-center px-4 text-center"><div><Gamepad2 className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-3xl font-black">Игра не найдена</h1><Button asChild className="mt-6"><Link to="/">Вернуться в каталог</Link></Button></div></div></PageShell>;
  return <PageShell><GamePlayer game={game} embedded /></PageShell>;
}
