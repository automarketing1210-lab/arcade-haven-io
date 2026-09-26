import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/components/game-portal";
import { games } from "@/lib/games";

export const Route = createFileRoute("/game/$slug")({
  loader: ({ params }) => { const game = games.find(item => item.slug === params.slug); if (!game) throw notFound(); return game; },
  head: ({ loaderData }) => { const title = loaderData ? `${loaderData.title} — играть онлайн | GameHaven` : "Игра не найдена | GameHaven"; const description = loaderData?.description ?? "Запрошенная игра не найдена."; return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }; },
  notFoundComponent: () => <div className="grid min-h-screen place-items-center bg-background px-4 text-center"><div><Gamepad2 className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-3xl font-black">Игра не найдена</h1><Button asChild className="mt-6"><Link to="/">Вернуться в каталог</Link></Button></div></div>,
  component: GamePage,
});

function GamePage() {
  const game = Route.useLoaderData(); const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => { try { setFavorites(JSON.parse(localStorage.getItem("gamehaven-favorites") ?? "[]")); } catch { setFavorites([]); } }, []);
  const toggle = () => { const next = favorites.includes(game.slug) ? favorites.filter(item => item !== game.slug) : [game.slug, ...favorites]; setFavorites(next); localStorage.setItem("gamehaven-favorites", JSON.stringify(next)); };
  const played = () => { try { const current: string[] = JSON.parse(localStorage.getItem("gamehaven-history") ?? "[]"); localStorage.setItem("gamehaven-history", JSON.stringify([game.slug, ...current.filter(item => item !== game.slug)].slice(0,12))); } catch { localStorage.setItem("gamehaven-history", JSON.stringify([game.slug])); } };
  return <main className="min-h-screen bg-background text-foreground"><div className="border-b border-border"><div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-8"><Button variant="ghost" size="icon" asChild><Link to="/" aria-label="Назад в каталог"><ArrowLeft /></Link></Button><Link to="/" className="flex items-center gap-2 font-black"><Gamepad2 className="text-primary" />GAME<span className="text-primary">HAVEN</span></Link></div></div><GamePlayer game={game} favorite={favorites.includes(game.slug)} onFavorite={toggle} onPlayed={played} embedded /></main>;
}
