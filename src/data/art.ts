import type { StaticImageData } from "next/image";
import { case1Art } from "@/data/case1-art";
import { case2Art } from "@/data/case2-art";
import { case3Art } from "@/data/case3/art";

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
  // Centre of the flickering light over the scene, as a percentage of its width and height.
  glow: { x: number; y: number };
  hotspots: Hotspot[];
  portraits: Record<string, StaticImageData>;
  clues: Record<string, StaticImageData>;
};

const artByCaseNumber: Record<number, CaseArt> = { 1: case1Art, 2: case2Art };

// TEMPORARY GATE: Case 3 art ships only in builds with NEXT_PUBLIC_ENABLE_CASE3=1. With the flag
// off this line is dead code and the build drops case3/art.ts and its images.
// REMOVE THIS GATE (register 3: case3Art above) WHEN CASE 3 LAUNCHES.
if (process.env.NEXT_PUBLIC_ENABLE_CASE3 === "1") artByCaseNumber[3] = case3Art;

export function caseArt(caseNumber: number): CaseArt | null {
  return artByCaseNumber[caseNumber] ?? null;
}
