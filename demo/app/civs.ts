// The 16 civilizations of Age of Empires + Rise of Rome, for the civ picker on the room seats.
// `style` = architecture set, used for the building icon (assets: building:<style>).
import type { Faction } from "../../components";

export type CivId =
  | "assyrian" | "babylonian" | "choson" | "egyptian" | "greek" | "hittite" | "minoan" | "persian"
  | "phoenician" | "shang" | "sumerian" | "yamato" | "carthaginian" | "macedonian" | "palmyran" | "roman";

export type CivChoice = CivId | "random";

export interface CivInfo {
  id: CivId;
  /** Standard AoE civilization name from the tier table. */
  name: string;
  label: string;
  style: Faction;
  score: number;
  advantages: readonly string[];
}

export const CIVS: CivInfo[] = [
  { id: "shang", name: "Shang", label: "Shang", style: "asian", score: 100, advantages: ["ép đời", "quân gỗ", "có cung", "chất riêng", "chủ lực"] },
  { id: "phoenician", name: "Phoenician", label: "Phoenicia", style: "greek", score: 95, advantages: ["ép đời", "quân gỗ", "có cung", "mạnh đời 3", "chủ lực"] },
  { id: "assyrian", name: "Assyrian", label: "Assyria", style: "babylonian", score: 90, advantages: ["ép đời", "quân gỗ", "có cung", "mạnh đời 3"] },
  { id: "yamato", name: "Yamato", label: "Yamato", style: "asian", score: 90, advantages: ["ép đời", "có cung", "mạnh đời 3", "chủ lực"] },
  { id: "egyptian", name: "Egyptian", label: "Ai Cập", style: "egyptian", score: 85, advantages: ["quân gỗ", "có cung", "mạnh đời 3", "chủ lực"] },
  { id: "hittite", name: "Hittite", label: "Hittite", style: "babylonian", score: 85, advantages: ["quân gỗ", "có cung", "mạnh đời 3", "chủ lực"] },
  { id: "palmyran", name: "Palmyran", label: "Palmyra", style: "roman", score: 85, advantages: ["ép đời", "quân gỗ", "mạnh đời 3", "chất riêng"] },
  { id: "persian", name: "Persian", label: "Ba Tư", style: "babylonian", score: 80, advantages: ["ép đời", "chất riêng"] },
  { id: "roman", name: "Roman", label: "La Mã", style: "roman", score: 80, advantages: ["ép đời", "quân gỗ", "chủ lực"] },
  { id: "babylonian", name: "Babylonian", label: "Babylon", style: "babylonian", score: 75, advantages: ["quân gỗ", "có cung"] },
  { id: "sumerian", name: "Sumerian", label: "Sumer", style: "egyptian", score: 75, advantages: ["quân gỗ", "có cung"] },
  { id: "minoan", name: "Minoan", label: "Minoa", style: "greek", score: 70, advantages: ["có cung", "chất riêng"] },
  { id: "macedonian", name: "Macedonian", label: "Macedon", style: "greek", score: 70, advantages: ["có cung", "chất riêng"] },
  { id: "choson", name: "Choson", label: "Choson", style: "asian", score: 65, advantages: [] },
  { id: "greek", name: "Greek", label: "Hy Lạp", style: "greek", score: 65, advantages: [] },
  { id: "carthaginian", name: "Carthaginian", label: "Carthage", style: "roman", score: 65, advantages: [] },
];

// "Random", not "Ngẫu nhiên": the word every Vietnamese player uses (user 13/11).
export const civLabel = (c: CivChoice) => (c === "random" ? "Random" : CIVS.find((x) => x.id === c)?.label ?? c);
export const civStyle = (c: CivChoice) => (c === "random" ? null : CIVS.find((x) => x.id === c)?.style ?? null);
