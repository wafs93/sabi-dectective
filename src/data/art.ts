import type { StaticImageData } from "next/image";
import { case1Art } from "@/data/case1-art";

// Presentation only: art and hotspot positions for each case, keyed by id.
// Nothing here says which suspect is guilty or which clues matter.

export type Hotspot = {
  clueId: string;
  // Centre of the hotspot as a percentage of the scene image's width and height.
  x: number;
  y: number;
  // Diameter as a percentage of the image width (never rendered below 44px).
  size: number;
  // What the player sees there before they know what it is.
  label: string;
};

export type CaseArt = {
  intro: string;
  scene: StaticImageData;
  sceneAlt: string;
  hotspots: Hotspot[];
  portraits: Record<string, StaticImageData>;
  clues: Record<string, StaticImageData>;
};

const artByCaseNumber: Record<number, CaseArt> = { 1: case1Art };

export function caseArt(caseNumber: number): CaseArt | null {
  return artByCaseNumber[caseNumber] ?? null;
}
