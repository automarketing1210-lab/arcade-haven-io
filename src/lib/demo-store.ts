import { useCallback, useMemo, useSyncExternalStore } from "react";
import { games as baseGames, type Game } from "@/lib/games";

// Demo mode: accounts and catalog edits live only in this browser's storage.
// Nobody can change what other visitors see.
const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  if (!cache.has(key)) {
    try { cache.set(key, JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback); } catch { cache.set(key, fallback); }
  }
  return cache.get(key) as T;
}
function write<T>(key: string, value: T) {
  cache.set(key, value);
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key) cache.delete(event.key); listener(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  const set = useCallback((next: T) => write(key, next), [key]);
  return [value, set] as const;
}

const EMPTY_LIST: string[] = [];
const EMPTY_GAMES: Game[] = [];
const EMPTY_VOTES: Record<string, "like" | "dislike"> = {};

export type Role = "admin" | "player";
export type Session = { login: string; role: Role; name: string };
export const demoAccounts: Record<string, { password: string; role: Role; name: string }> = {
  "111": { password: "111", role: "admin", name: "Администратор" },
  "222": { password: "222", role: "player", name: "Игрок" },
};

export function useAuth() {
  const [user, setUser] = useStored<Session | null>("gamehaven-session", null);
  const login = (loginName: string, password: string) => {
    const account = demoAccounts[loginName.trim()];
    if (!account || account.password !== password) return false;
    setUser({ login: loginName.trim(), role: account.role, name: account.name });
    return true;
  };
  return { user, login, logout: () => setUser(null), isAdmin: user?.role === "admin" };
}

export function useProfile() {
  const { user } = useAuth();
  const suffix = user ? `:${user.login}` : "";
  const [favorites, setFavorites] = useStored(`gamehaven-favorites${suffix}`, EMPTY_LIST);
  const [history, setHistory] = useStored(`gamehaven-history${suffix}`, EMPTY_LIST);
  const [completed, setCompleted] = useStored(`gamehaven-completed${suffix}`, EMPTY_LIST);
  const [votes, setVotes] = useStored(`gamehaven-votes${suffix}`, EMPTY_VOTES);
  return {
    favorites, history, completed, votes,
    toggleFavorite: (slug: string) => setFavorites(favorites.includes(slug) ? favorites.filter(item => item !== slug) : [slug, ...favorites]),
    markPlayed: (slug: string) => setHistory([slug, ...history.filter(item => item !== slug)].slice(0, 12)),
    toggleCompleted: (slug: string) => setCompleted(completed.includes(slug) ? completed.filter(item => item !== slug) : [slug, ...completed]),
    vote: (slug: string, value: "like" | "dislike") => {
      const next = { ...votes };
      if (next[slug] === value) delete next[slug]; else next[slug] = value;
      setVotes(next);
    },
  };
}

export function useCatalog() {
  const [custom, setCustom] = useStored("gamehaven-custom-games", EMPTY_GAMES);
  const [removed, setRemoved] = useStored("gamehaven-removed-games", EMPTY_LIST);
  const catalog = useMemo(() => [
    ...custom.filter(game => !baseGames.some(base => base.slug === game.slug)),
    ...baseGames.filter(game => !removed.includes(game.slug)).map(game => custom.find(item => item.slug === game.slug) ?? game),
  ], [custom, removed]);
  return {
    catalog,
    // Read the latest stored lists so async/sequential saves never overwrite each other.
    saveGame: (game: Game) => {
      const latest = read("gamehaven-custom-games", EMPTY_GAMES); const gone = read("gamehaven-removed-games", EMPTY_LIST);
      setCustom([game, ...latest.filter(item => item.slug !== game.slug)]);
      if (gone.includes(game.slug)) setRemoved(gone.filter(item => item !== game.slug));
    },
    deleteGame: (slug: string) => {
      const latest = read("gamehaven-custom-games", EMPTY_GAMES); const gone = read("gamehaven-removed-games", EMPTY_LIST);
      setCustom(latest.filter(item => item.slug !== slug));
      if (baseGames.some(game => game.slug === slug)) setRemoved([...gone, slug]);
    },
    resetCatalog: () => { setCustom([]); setRemoved([]); },
  };
}

export const coverOptions = Array.from(new Map(baseGames.map(game => [game.image, game.title])).entries()).map(([image, title]) => ({ image, title }));
