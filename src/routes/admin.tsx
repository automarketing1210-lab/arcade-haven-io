import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, AuthButton } from "@/components/auth-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, type Category, type Game } from "@/lib/games";
import { coverOptions, useAuth, useCatalog } from "@/lib/demo-store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Панель администратора | GameHaven" },
    { name: "description", content: "Управление каталогом HTML5-игр GameHaven: добавление, редактирование и удаление." },
    { property: "og:title", content: "Панель администратора | GameHaven" },
    { property: "og:description", content: "Управление каталогом игр." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ]}),
  component: AdminPage,
});

type Form = { slug: string; title: string; category: Category; embedUrl: string; description: string; tags: string; controls: string; image: string };
const emptyForm = (): Form => ({ slug: "", title: "", category: "Экшен", embedUrl: "", description: "", tags: "", controls: "WASD — движение\nМышь — прицел", image: coverOptions[0]?.image ?? "" });

const translit: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" };
const slugify = (text: string) => text.toLowerCase().split("").map(ch => translit[ch] ?? ch).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `game-${Date.now()}`;
// Accept a plain URL or a full <iframe src="..."> embed code from GameDistribution.
const extractUrl = (value: string) => { const match = value.match(/src=["']([^"']+)["']/i); const url = (match?.[1] ?? value).trim(); return /^https:\/\//i.test(url) ? url : ""; };

function AdminPage() {
  const { isAdmin, user } = useAuth(); const { catalog, saveGame, deleteGame, resetCatalog } = useCatalog();
  const [form, setForm] = useState<Form>(emptyForm); const [editing, setEditing] = useState<string | null>(null);
  if (!isAdmin) return <PageShell><div className="grid min-h-[60vh] place-items-center px-4 text-center"><div><ShieldAlert className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-2xl font-black">{user ? "Нет доступа к админке" : "Войдите как администратор"}</h1><p className="mt-2 text-muted-foreground">Панель доступна только администратору.</p><div className="mt-5 flex justify-center gap-2">{user ? <Button asChild><Link to="/profile">Мой профиль</Link></Button> : <AuthButton />}</div></div></div></PageShell>;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }));
  const edit = (game: Game) => { setEditing(game.slug); setForm({ slug: game.slug, title: game.title, category: game.category, embedUrl: game.embedUrl ?? "", description: game.description, tags: game.tags.join(", "), controls: game.controls.join("\n"), image: game.image }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    const embedUrl = extractUrl(form.embedUrl);
    if (form.embedUrl.trim() && !embedUrl) { toast.error("Ссылка на игру должна начинаться с https://"); return; }
    const existing = editing ? catalog.find(game => game.slug === editing) : undefined;
    const slug = editing ?? slugify(form.title);
    if (!editing && catalog.some(game => game.slug === slug)) { toast.error("Игра с таким названием уже есть"); return; }
    saveGame({ ...(existing ?? { rating: 4.5, plays: 0, year: new Date().getFullYear(), badge: "НОВОЕ" as const, accent: "lime" as const }), slug, title: form.title.trim(), category: form.category, description: form.description.trim(), tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), controls: form.controls.split("\n").map(t => t.trim()).filter(Boolean), image: form.image || coverOptions[0]?.image || "", embedUrl: embedUrl || undefined });
    toast.success(editing ? "Игра обновлена" : "Игра добавлена");
    setEditing(null); setForm(emptyForm());
  };
  return <PageShell><div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">Администратор</p><h1 className="text-3xl font-black">Каталог игр</h1><p className="text-sm text-muted-foreground">Демо-режим: изменения видны только в этом браузере.</p></div><Button variant="secondary" onClick={() => { if (confirm("Вернуть исходный каталог?")) resetCatalog(); }}><RotateCcw />Сбросить каталог</Button></div>
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
      <h2 className="font-black md:col-span-2">{editing ? `Редактирование: ${form.title}` : "Новая игра"}</h2>
      <label className="space-y-1 text-sm">Название<Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Например, Moto X3M" /></label>
      <label className="space-y-1 text-sm">Категория<Select value={form.category} onValueChange={v => set("category", v as Category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-sm md:col-span-2">Ссылка или код iframe из GameDistribution<Input value={form.embedUrl} onChange={e => set("embedUrl", e.target.value)} placeholder="https://html5.gamedistribution.com/…/ или <iframe src=…>" /><span className="text-xs text-muted-foreground">Без ссылки запустится встроенная демо-игра. Найти игры: <a href="https://gamedistribution.com/" target="_blank" rel="noreferrer" className="text-primary underline">gamedistribution.com</a></span></label>
      <label className="space-y-1 text-sm md:col-span-2">Описание<Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} /></label>
      <label className="space-y-1 text-sm">Теги (через запятую)<Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="мото, трюки, онлайн" /></label>
      <label className="space-y-1 text-sm">Управление (каждая подсказка с новой строки)<Textarea value={form.controls} onChange={e => set("controls", e.target.value)} rows={3} /></label>
      <div className="space-y-2 text-sm md:col-span-2"><p>Обложка</p><div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">{coverOptions.map(option => <button type="button" key={option.image} onClick={() => set("image", option.image)} title={option.title} className={`overflow-hidden rounded-md border-2 ${form.image === option.image ? "border-primary" : "border-transparent"}`}><img src={option.image} alt={option.title} width={150} height={100} loading="lazy" className="aspect-[3/2] w-full object-cover" /></button>)}</div><Input value={coverOptions.some(o => o.image === form.image) ? "" : form.image} onChange={e => set("image", e.target.value)} placeholder="…или ссылка на свою картинку https://" /></div>
      <div className="flex gap-2 md:col-span-2"><Button type="submit"><Plus />{editing ? "Сохранить" : "Добавить игру"}</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Отмена</Button>}</div>
    </form>
    <section className="space-y-2"><h2 className="font-black">Все игры ({catalog.length})</h2>{catalog.map(game => <div key={game.slug} className="flex items-center gap-3 rounded-md border border-border bg-card p-2"><img src={game.image} alt="" width={96} height={64} loading="lazy" className="h-12 w-20 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{game.title}</p><p className="truncate text-xs text-muted-foreground">{game.category}{game.embedUrl ? " · GameDistribution" : " · демо"}</p></div><Button variant="secondary" size="icon" onClick={() => edit(game)} aria-label={`Редактировать ${game.title}`}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm(`Удалить «${game.title}»?`)) deleteGame(game.slug); }} aria-label={`Удалить ${game.title}`}><Trash2 /></Button></div>)}</section>
  </div></PageShell>;
}
