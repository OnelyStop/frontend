"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/query/fetcher";
import type { Subject } from "@/data/navigation";
import type { DoubtCreate, DoubtPage, Sort } from "./types";

type Filters = { section: Subject | null; sort: Sort };

export const communityKeys = {
  all: ["community"] as const,
  doubts: (f: Filters) => [...communityKeys.all, "doubts", f] as const,
};

type Feed = InfiniteData<DoubtPage, string | null>;

export function useDoubts(filters: Filters) {
  return useInfiniteQuery({
    queryKey: communityKeys.doubts(filters),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ sort: filters.sort });
      if (filters.section) params.set("section", filters.section);
      if (pageParam) params.set("cursor", pageParam);
      return apiFetch<DoubtPage>(`/api/v1/community/doubts?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useToggleStuck(filters: Filters) {
  const qc = useQueryClient();
  const key = communityKeys.doubts(filters);

  return useMutation({
    mutationFn: ({ id, stuck }: { id: string; stuck: boolean }) =>
      apiFetch<{ stuckCount: number; stuckByMe: boolean }>(
        `/api/v1/community/doubts/${id}/stuck`,
        { method: stuck ? "PUT" : "DELETE" },
      ),

    onMutate: async ({ id, stuck }) => {
      // Without this an in-flight refetch can land after the optimistic write
      // and put the old count back.
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Feed>(key);

      qc.setQueryData<Feed>(
        key,
        (feed) =>
          feed && {
            ...feed,
            pages: feed.pages.map((page) => ({
              ...page,
              doubts: page.doubts.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      stuckByMe: stuck,
                      stuckCount: d.stuckCount + (stuck ? 1 : -1),
                    }
                  : d,
              ),
            })),
          },
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    // Not invalidated on success: the feed is ordered by stuck count, so a
    // refetch would reshuffle the list under the cursor the user just clicked.
  });
}

export function usePostDoubt(filters: Filters) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: DoubtCreate) =>
      apiFetch<{ doubtId: string }>("/api/v1/community/doubts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: communityKeys.doubts(filters) }),
  });
}
