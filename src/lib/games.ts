import racingImage from "@/assets/game-racing.jpg";
import actionImage from "@/assets/game-action.jpg";
import puzzleImage from "@/assets/game-puzzle.jpg";
import ioImage from "@/assets/game-io.jpg";

export type Category = "Гонки" | "Экшен" | "Стрелялки" | "Головоломки" | "Спорт" | ".io" | "Приключения" | "Казуальные";

export type Game = {
  slug: string;
  title: string;
  category: Category;
  tags: string[];
  description: string;
  controls: string[];
  image: string;
  rating: number;
  plays: number;
  year: number;
  badge?: "ХИТ" | "НОВОЕ" | "ТОП";
  accent: "lime" | "cyan" | "coral";
};

export const games: Game[] = [
  { slug: "neon-drift", title: "Neon Drift", category: "Гонки", tags: ["машины", "дрифт", "3D"], description: "Ночные заезды по неоновому мегаполису. Дрифтуйте в миллиметрах от соперников и собирайте нитро.", controls: ["WASD — движение", "Пробел — ручной тормоз", "Shift — нитро"], image: racingImage, rating: 4.9, plays: 12800000, year: 2026, badge: "ХИТ", accent: "lime" },
  { slug: "skyline-raider", title: "Skyline Raider", category: "Приключения", tags: ["паркур", "экшен", "герой"], description: "Покоряйте летающий город с крюком-кошкой и пробирайтесь через головокружительные уровни.", controls: ["WASD — движение", "Мышь — прицел", "E — крюк"], image: actionImage, rating: 4.8, plays: 7600000, year: 2026, badge: "НОВОЕ", accent: "coral" },
  { slug: "prism-shift", title: "Prism Shift", category: "Головоломки", tags: ["логика", "порталы", "блоки"], description: "Меняйте гравитацию, соединяйте кристаллы и открывайте порталы в футуристической лаборатории.", controls: ["Мышь — выбор", "R — перезапуск", "Z — отмена"], image: puzzleImage, rating: 4.7, plays: 4200000, year: 2025, badge: "ТОП", accent: "cyan" },
  { slug: "hover-arena", title: "Hover Arena", category: ".io", tags: ["мультиплеер", "арена", "гонки"], description: "Соревнуйтесь на воздушных аренах, сталкивайте соперников и останьтесь последним пилотом.", controls: ["WASD — движение", "Мышь — камера", "Пробел — ускорение"], image: ioImage, rating: 4.6, plays: 9100000, year: 2026, badge: "ХИТ", accent: "coral" },
  { slug: "strike-point", title: "Strike Point", category: "Стрелялки", tags: ["FPS", "тактика", "онлайн"], description: "Быстрые тактические матчи на компактных аренах с точной стрельбой и мгновенным стартом.", controls: ["WASD — движение", "Мышь — прицел", "R — перезарядка"], image: actionImage, rating: 4.5, plays: 6500000, year: 2025, accent: "cyan" },
  { slug: "turbo-league", title: "Turbo League", category: "Спорт", tags: ["футбол", "машины", "аркада"], description: "Футбол на реактивных машинах: забивайте с воздуха и защищайте ворота вместе с командой.", controls: ["Стрелки — движение", "X — прыжок", "C — ускорение"], image: racingImage, rating: 4.7, plays: 5900000, year: 2024, accent: "lime" },
  { slug: "block-bloom", title: "Block Bloom", category: "Казуальные", tags: ["блоки", "релакс", "комбо"], description: "Собирайте сияющие фигуры в линии и создавайте длинные цепочки комбо без таймера.", controls: ["Мышь — перемещение", "Клик — разместить", "Esc — пауза"], image: puzzleImage, rating: 4.4, plays: 3800000, year: 2026, badge: "НОВОЕ", accent: "lime" },
  { slug: "zero-zone", title: "Zero Zone", category: "Экшен", tags: ["выживание", "арена", "волны"], description: "Отбивайтесь от волн дронов, комбинируйте оружие и продержитесь до эвакуации.", controls: ["WASD — движение", "Мышь — атака", "1–3 — оружие"], image: ioImage, rating: 4.6, plays: 8100000, year: 2025, accent: "coral" },
  { slug: "circuit-sprint", title: "Circuit Sprint", category: "Гонки", tags: ["скорость", "тайм-атак", "аркада"], description: "Короткие техничные трассы, призрачные соперники и борьба за сотые доли секунды.", controls: ["WASD — движение", "Shift — нитро", "R — рестарт"], image: racingImage, rating: 4.3, plays: 2700000, year: 2024, accent: "cyan" },
  { slug: "portal-paws", title: "Portal Paws", category: "Приключения", tags: ["платформер", "головоломка", "кот"], description: "Помогите космическому коту вернуться домой, прыгая между измерениями и собирая звёзды.", controls: ["Стрелки — движение", "Пробел — прыжок", "E — портал"], image: puzzleImage, rating: 4.8, plays: 3400000, year: 2026, badge: "НОВОЕ", accent: "coral" },
  { slug: "goal-rush", title: "Goal Rush", category: "Спорт", tags: ["футбол", "пенальти", "быстрая"], description: "Серия пенальти с идеальной физикой удара. Читайте вратаря и попадайте в девятку.", controls: ["Мышь — направление", "Удержание — сила", "Пробел — удар"], image: ioImage, rating: 4.2, plays: 2100000, year: 2025, accent: "lime" },
  { slug: "pixel-frontier", title: "Pixel Frontier", category: "Казуальные", tags: ["крафт", "исследование", "пиксели"], description: "Исследуйте уютный бесконечный мир, собирайте ресурсы и стройте собственную базу.", controls: ["WASD — движение", "Мышь — действие", "I — инвентарь"], image: actionImage, rating: 4.5, plays: 4700000, year: 2024, accent: "cyan" },
];

export const categories: Category[] = ["Гонки", "Экшен", "Стрелялки", "Головоломки", "Спорт", ".io", "Приключения", "Казуальные"];
export const formatPlays = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} млн` : `${Math.round(value / 1000)} тыс.`;
