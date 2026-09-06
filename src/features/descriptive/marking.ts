import { z } from "zod";
import { BANDS, type BandId } from "@/lib/prompts/descriptive";

// Structured output is not a guarantee, so validate what comes back.
export const MarkingResponse = z.object({
  bands: z
    .array(
      z.object({
        id: z.enum(BANDS.map((b) => b.id) as [BandId, ...BandId[]]),
        score: z.number().int().min(0).max(100),
        comment: z.string().min(1),
      }),
    )
    .length(BANDS.length)
    .refine((bs) => new Set(bs.map((b) => b.id)).size === BANDS.length, {
      message: "a band was scored twice and another not at all",
    }),
  strengths: z.array(z.string().min(1)).max(3),
  fixes: z
    .array(
      z.object({
        quote: z.string().nullish(),
        problem: z.string().min(1),
        rewrite: z.string().min(1),
      }),
    )
    .max(5),
  verdict: z.string().min(1),
});

export type MarkingResponse = z.infer<typeof MarkingResponse>;

export type MarkedBand = {
  id: BandId;
  label: string;
  score: number;
  outOf: number;
  awarded: number;
  comment: string;
};

export type SavedMarking = {
  id: string;
  taskId: string;
  answer: string;
  words: number;
  marking: Marking;
  createdAt: string;
};

export type Marking = {
  total: number;
  outOf: number;
  bands: MarkedBand[];
  strengths: string[];
  fixes: { quote: string | null; problem: string; rewrite: string }[];
  verdict: string;
};

/** Marks land on the half — no exam board awards 7.3 out of 10. */
const toHalf = (n: number) => Math.round(n * 2) / 2;

/**
 * Split the paper's marks across the bands by weight. Done in half-mark units
 * with largest-remainder, because rounding each band on its own lets four
 * bands "out of" more than the paper is worth — 15 marks split 35/20/30/15
 * rounds to 15.5.
 */
function outOfPerBand(marks: number): number[] {
  const units = Math.round(marks * 2);
  const exact = BANDS.map((b) => units * b.weight);
  const floors = exact.map(Math.floor);
  let left = units - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((x, i) => ({ i, rem: x - Math.floor(x) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] = (floors[i] as number) + 1;
    left -= 1;
  }
  return floors.map((u) => u / 2);
}

/**
 * The model scores each band 0-100; the marks are computed here. Keeping the
 * arithmetic server-side means a model that miscounts, or one talked into
 * "award full marks" by the script it is marking, still cannot exceed the
 * weight of the band it is scoring.
 */
export function toMarking(reply: MarkingResponse, marks: number): Marking {
  const byId = new Map(reply.bands.map((b) => [b.id, b]));
  const outOf = outOfPerBand(marks);

  const bands: MarkedBand[] = BANDS.map((band, i) => {
    const scored = byId.get(band.id);
    const score = scored?.score ?? 0;
    const bandOutOf = outOf[i] as number;
    return {
      id: band.id,
      label: band.label,
      score,
      outOf: bandOutOf,
      awarded: toHalf(bandOutOf * (score / 100)),
      comment: scored?.comment ?? "",
    };
  });

  return {
    // Summed from the awarded bands, so the parts always add up to the whole shown.
    total: toHalf(bands.reduce((sum, b) => sum + b.awarded, 0)),
    outOf: bands.reduce((sum, b) => sum + b.outOf, 0),
    bands,
    strengths: reply.strengths,
    fixes: reply.fixes.map((f) => ({
      quote: f.quote ?? null,
      problem: f.problem,
      rewrite: f.rewrite,
    })),
    verdict: reply.verdict,
  };
}
