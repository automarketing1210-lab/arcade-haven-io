import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Gamepad2, LogIn, LogOut, Settings, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/demo-store";

export function AuthButton() {
  const { user, login, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const submit = (loginName: string, pass: string) => {
    if (login(loginName, pass)) { setOpen(false); setError(false); setName(""); setPassword(""); } else setError(true);
  };
  if (user) return <div className="flex items-center gap-2">
    <Button variant="secondary" asChild className="h-11"><Link to={isAdmin ? "/admin" : "/profile"}>{isAdmin ? <Settings /> : <UserRound />}<span className="hidden md:inline">{isAdmin ? "Админка" : "Профиль"}</span></Link></Button>
    <Button variant="ghost" size="icon" className="size-11" onClick={logout} aria-label="Выйти"><LogOut /></Button>
  </div>;
  return <>
    <Button className="h-11" onClick={() => setOpen(true)}><LogIn /><span className="hidden md:inline">Войти</span></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm border-border bg-background">
      <DialogTitle>Вход в GameHaven</DialogTitle>
      <DialogDescription>Демо-режим: данные хранятся только в этом браузере.</DialogDescription>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); submit(name, password); }}>
        <Input value={name} onChange={event => setName(event.target.value)} placeholder="Логин" autoComplete="username" />
        <Input value={password} onChange={event => setPassword(event.target.value)} placeholder="Пароль" type="password" autoComplete="current-password" />
        {error && <p className="text-sm text-destructive">Неверный логин или пароль</p>}
        <Button type="submit" className="w-full">Войти</Button>
      </form>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => submit("111", "111")}><Settings />Как 111 (админ)</Button>
        <Button variant="secondary" onClick={() => submit("222", "222")}><UserRound />Как 222 (игрок)</Button>
      </div>
    </DialogContent></Dialog>
  </>;
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground">
    <div className="border-b border-border"><div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-8">
      <Button variant="ghost" size="icon" asChild><Link to="/" aria-label="Назад в каталог"><ArrowLeft /></Link></Button>
      <Link to="/" className="flex flex-1 items-center gap-2 font-black"><Gamepad2 className="text-primary" />GAME<span className="text-primary">HAVEN</span></Link>
      <AuthButton />
    </div></div>
    {children}
  </main>;
}
