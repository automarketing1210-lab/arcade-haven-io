import { createFileRoute } from "@tanstack/react-router";
import { GamePortal } from "@/components/game-portal";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "GameHaven — бесплатные браузерные игры" },
    { name: "description", content: "Играйте бесплатно в лучшие гонки, экшен, головоломки и .io-игры прямо в браузере." },
    { property: "og:title", content: "GameHaven — бесплатные браузерные игры" },
    { property: "og:description", content: "Новые и популярные HTML5-игры без скачивания." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: GamePortal,
});
