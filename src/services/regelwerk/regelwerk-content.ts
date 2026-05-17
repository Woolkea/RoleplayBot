import raw from "./regelwerk-data.json" with { type: "json" };

export type RegelwerkCategoryKey = "rp" | "discord" | "stvo";

export type RegelwerkCategory = {
  title: string;
  description: string;
  content: readonly string[];
};

export const REGELWERK_DATA = raw as Record<RegelwerkCategoryKey, RegelwerkCategory>;

export function isRegelwerkCategoryKey(value: string): value is RegelwerkCategoryKey {
  return value === "rp" || value === "discord" || value === "stvo";
}
