export function scoreTier(score: number): "red" | "orange" | "green" {
  if (score < 45) return "red";
  if (score < 70) return "orange";
  return "green";
}

export const TIER_BAR: Record<string, string> = {
  red: "bg-signal-red",
  orange: "bg-signal-orange",
  green: "bg-signal-green",
};

export const TIER_TEXT: Record<string, string> = {
  red: "text-signal-redText",
  orange: "text-signal-orangeText",
  green: "text-signal-greenText",
};
