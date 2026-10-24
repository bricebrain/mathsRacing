export const THEME_IDS = ["math", "capitals", "worldCapitals", "culture", "flags"] as const;
export type Theme = (typeof THEME_IDS)[number];
export const THEME_LABELS: Record<Theme, string> = {
  math: "Maths",
  capitals: "Capitales d’Europe",
  worldCapitals: "Capitales du monde",
  culture: "Culture générale",
  flags: "Drapeaux du monde",
};
export const themesLabel = (themes: readonly Theme[]) =>
  themes.map((theme) => THEME_LABELS[theme]).join(" · ");
