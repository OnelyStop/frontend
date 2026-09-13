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

/** `servable` counts what /mocks can actually reach; `total` is what is stored. The two differ by non-canonical papers. */
export type BankStats = {
  papersTotal: number;
  papersServable: number;
  questionsTotal: number;
  questionsServable: number;
  examKeysCollapsed: number;
};
