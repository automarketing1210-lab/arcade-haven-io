import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, FileText, ImagePlus, Loader2, Pencil, Pin, Plus, RotateCcw, ShieldAlert, Trash2, Type, Wand2 } from "lucide-react";
import { randomNetlifyUrl, requestGeneration, shrinkImage } from "@/lib/ai-generate";
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
const emptyForm = (): Form => ({ slug: "", title: "", category: "Экшен", embedUrl: randomNetlifyUrl(), description: "", tags: "", controls: "WASD — движение\nМышь — прицел", image: coverOptions[0]?.image ?? "" });

const translit: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" };
const slugify = (text: string) => text.toLowerCase().split("").map(ch => translit[ch] ?? ch).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `game-${Date.now()}`;
// Accept a plain URL or a full <iframe src="..."> embed code from GameDistribution.
const extractUrl = (value: string) => { const match = value.match(/src=["']([^"']+)["']/i); const url = (match?.[1] ?? value).trim(); return /^https:\/\//i.test(url) ? url : ""; };

function AdminPage() {
  const { isAdmin, user } = useAuth(); const { catalog, saveGame, deleteGame, resetCatalog } = useCatalog();
  const [form, setForm] = useState<Form>(emptyForm); const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); const [busy, setBusy] = useState<Record<string, string>>({}); const [batchRunning, setBatchRunning] = useState(false);
  // Always merge into the latest stored version so sequential generations don't overwrite each other.
  const catalogRef = useRef(catalog); catalogRef.current = catalog;
  const patch = (slug: string, changes: Partial<Game>) => { const current = catalogRef.current.find(g => g.slug === slug); if (current) { const next = { ...current, ...changes }; catalogRef.current = catalogRef.current.map(g => g.slug === slug ? next : g); saveGame(next); void fetch("/api/pin-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ games: [next] }) }).catch(() => {}); } };
  const makeCover = async (game: Game, title: string, description: string) => { const { image } = await requestGeneration({ kind: "cover", category: game.category, title, description }); if (image) patch(game.slug, { image: await shrinkImage(image) }); };
  const run = async (game: Game, kind: "title" | "description" | "cover" | "all") => {
    setBusy(b => ({ ...b, [game.slug]: kind }));
    try {
      const avoid = catalogRef.current.map(g => g.title);
      if (kind === "title") { const r = await requestGeneration({ kind: "title", category: game.category, avoid }); if (r.title) patch(game.slug, { title: r.title }); }
      if (kind === "description") { const r = await requestGeneration({ kind: "description", category: game.category, title: game.title }); if (r.description) patch(game.slug, { description: r.description }); }
      if (kind === "cover") await makeCover(game, game.title, game.description);
      if (kind === "all") { const r = await requestGeneration({ kind: "both", category: game.category, avoid }); const title = r.title ?? game.title; const description = r.description ?? game.description; patch(game.slug, { title, description, embedUrl: randomNetlifyUrl() }); await makeCover(game, title, description); }
      toast.success(`«${game.title}»: готово`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Ошибка генерации"); throw error; }
    finally { setBusy(b => { const n = { ...b }; delete n[game.slug]; return n; }); }
  };
  const runBatch = async () => {
    setBatchRunning(true);
    for (const slug of [...selected]) { const game = catalogRef.current.find(g => g.slug === slug); if (!game) continue; try { await run(game, "cover"); setSelected(s => s.filter(x => x !== slug)); } catch { break; } }
    setBatchRunning(false);
  };
  const [pinning, setPinning] = useState(false);
  const unpinned = (() => { if (typeof window === "undefined") return 0; try { return (JSON.parse(localStorage.getItem("gamehaven-custom-games") ?? "[]") as Game[]).length; } catch { return 0; } })();
  // Saves every locally generated/edited game (covers included) into the site itself.
  const pinAll = async () => {
    setPinning(true);
    try {
      const custom = JSON.parse(localStorage.getItem("gamehaven-custom-games") ?? "[]") as Game[];
      const res = await fetch("/api/pin-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ games: custom }) });
      const json = await res.json().catch(() => ({})) as { error?: string; pinned?: number };
      if (!res.ok) throw new Error(json.error ?? `Ошибка ${res.status}`);
      localStorage.setItem("gamehaven-custom-games", "[]");
      toast.success(`Закреплено игр: ${json.pinned}`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось закрепить"); }
    finally { setPinning(false); }
  };
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
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">Администратор</p><h1 className="text-3xl font-black">Каталог игр</h1><p className="text-sm text-muted-foreground">Демо-режим: изменения видны только в этом браузере, пока вы их не закрепите.</p></div><div className="flex flex-wrap gap-2"><Button disabled={pinning || !unpinned} onClick={pinAll}>{pinning ? <Loader2 className="animate-spin" /> : <Pin />}Закрепить для всех ({unpinned})</Button><Button variant="secondary" onClick={() => { if (confirm("Вернуть исходный каталог?")) resetCatalog(); }}><RotateCcw />Сбросить каталог</Button></div></div>
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
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black">Все игры ({catalog.length})</h2><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === catalog.length ? [] : catalog.map(g => g.slug))}>{selected.length === catalog.length ? "Снять все" : "Выбрать все"}</Button><Button size="sm" disabled={!selected.length || batchRunning} onClick={runBatch}>{batchRunning ? <Loader2 className="animate-spin" /> : <ImagePlus />}Обложки для выбранных ({selected.length})</Button></div></div>
      {catalog.map(game => { const isBusy = (k: string) => busy[game.slug] === k; const any = !!busy[game.slug]; const checked = selected.includes(game.slug); return <div key={game.slug} className={`flex flex-wrap items-center gap-3 rounded-md border bg-card p-2 ${checked ? "border-primary" : "border-border"}`}>
        <button type="button" onClick={() => setSelected(checked ? selected.filter(s => s !== game.slug) : [...selected, game.slug])} aria-label={`Выбрать ${game.title}`} aria-pressed={checked} className={`grid size-6 shrink-0 place-items-center rounded border-2 ${checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{checked && <Check className="size-4" strokeWidth={3} />}</button>
        <img src={game.image} alt="" width={96} height={64} loading="lazy" className="h-12 w-20 rounded object-cover" />
        <div className="min-w-0 flex-1"><p className="truncate font-bold">{game.title}</p><p className="truncate text-xs text-muted-foreground">{game.category} · {game.embedUrl ?? "демо"}</p></div>
        <div className="flex flex-wrap gap-1">
          <Button variant="secondary" size="icon" disabled={any} title="Случайное название" aria-label={`Сгенерировать название для ${game.title}`} onClick={() => run(game, "title")}>{isBusy("title") ? <Loader2 className="animate-spin" /> : <Type />}</Button>
          <Button variant="secondary" size="icon" disabled={any} title="Сгенерировать описание" aria-label={`Сгенерировать описание для ${game.title}`} onClick={() => run(game, "description")}>{isBusy("description") ? <Loader2 className="animate-spin" /> : <FileText />}</Button>
          <Button variant="secondary" size="icon" disabled={any} title="Сгенерировать обложку" aria-label={`Сгенерировать обложку для ${game.title}`} onClick={() => run(game, "cover")}>{isBusy("cover") ? <Loader2 className="animate-spin" /> : <ImagePlus />}</Button>
          <Button size="icon" disabled={any} title="Сгенерировать всё: название, описание, ссылку и обложку" aria-label={`Сгенерировать всё для ${game.title}`} onClick={() => run(game, "all")}>{isBusy("all") ? <Loader2 className="animate-spin" /> : <Wand2 />}</Button>
          <Button variant="secondary" size="icon" onClick={() => edit(game)} aria-label={`Редактировать ${game.title}`}><Pencil /></Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Удалить «${game.title}»?`)) deleteGame(game.slug); }} aria-label={`Удалить ${game.title}`}><Trash2 /></Button>
        </div>
      </div>; })}
    </section>
  </div></PageShell>;
}
