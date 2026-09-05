export type GenerateRun = {
  runId: string;
  day: string | null;
  planned: number;
  published: number;
  errors: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
};

export type AdminStatus = { runs: GenerateRun[] };
