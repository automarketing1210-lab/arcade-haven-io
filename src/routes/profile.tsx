import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Heart, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PageShell, AuthButton } from "@/components/auth-controls";
import type { Game } from "@/lib/games";
import { useAuth, useCatalog, useProfile } from "@/lib/demo-store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Мой профиль | GameHaven" },
    { name: "description", content: "Избранные, оценённые и пройденные игры в вашем профиле GameHaven." },
    { property: "og:title", content: "Мой профиль | GameHaven" },
    { property: "og:description", content: "Избранное, оценки и пройденные игры." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: ProfilePage,
});

function GameList({ title, icon, items }: { title: string; icon: ReactNode; items: Game[] }) {
  return <section className="rounded-lg border border-border bg-card p-4">
    <h2 className="flex items-center gap-2 font-black">{icon}{title}<span className="ml-auto text-sm text-muted-foreground">{items.length}</span></h2>
    {items.length ? <div className="mt-3 grid gap-2">{items.map(game => <Link key={game.slug} to="/game/$slug" params={{ slug: game.slug }} className="flex items-center gap-3 rounded-md p-1.5 hover:bg-accent"><img src={game.image} alt="" width={96} height={64} loading="lazy" className="h-10 w-16 rounded object-cover" /><span className="truncate font-bold">{game.title}</span><span className="ml-auto text-xs text-muted-foreground">{game.category}</span></Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Пока пусто</p>}
  </section>;
}

function ProfilePage() {
  const { user } = useAuth(); const { catalog } = useCatalog(); const profile = useProfile();
  const pick = (slugs: string[]) => slugs.map(slug => catalog.find(game => game.slug === slug)).filter((game): game is Game => Boolean(game));
  if (!user) return <PageShell><div className="grid min-h-[60vh] place-items-center px-4 text-center"><div><UserRound className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-2xl font-black">Войдите, чтобы открыть профиль</h1><div className="mt-5 flex justify-center"><AuthButton /></div></div></div></PageShell>;
  const voted = Object.entries(profile.votes);
  return <PageShell><div className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 lg:px-8">
    <div><p className="text-xs font-bold uppercase text-primary">Профиль · {user.role === "admin" ? "администратор" : "игрок"}</p><h1 className="text-3xl font-black">{user.name} {user.login}</h1></div>
    <div className="grid gap-4 md:grid-cols-2">
      <GameList title="Пройденные игры" icon={<CheckCircle2 className="text-primary" />} items={pick(profile.completed)} />
      <GameList title="Избранное" icon={<Heart className="text-favorite" />} items={pick(profile.favorites)} />
      <GameList title="Понравились" icon={<ThumbsUp className="text-primary" />} items={pick(voted.filter(([, v]) => v === "like").map(([slug]) => slug))} />
      <GameList title="Не понравились" icon={<ThumbsDown className="text-muted-foreground" />} items={pick(voted.filter(([, v]) => v === "dislike").map(([slug]) => slug))} />
      <GameList title="Недавно играли" icon={<Clock3 className="text-info" />} items={pick(profile.history)} />
    </div>
  </div></PageShell>;
}
