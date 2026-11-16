import { z } from "zod";

/** Shared parsing of admin list URLs: ?q=&page=&size=&sort=&dir=&<filters>. */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZES = [10, 20, 50, 100] as const;

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

export type ListParams<TSort extends string> = {
  q: string;
  page: number;
  pageSize: number;
  sort: TSort;
  desc: boolean;
};

export function parseListParams<TSort extends string>(
  raw: RawSearchParams,
  sortable: readonly [TSort, ...TSort[]],
  defaults: { sort: TSort; desc: boolean; pageSize?: number },
): ListParams<TSort> {
  return {
    q: z.preprocess(first, z.string().trim().max(100).catch("")).parse(raw.q ?? ""),
    page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).parse(raw.page ?? 1),
    pageSize: z
      .preprocess(first, z.coerce.number().refine((n) => PAGE_SIZES.some((size) => size === n)).catch(defaults.pageSize ?? 20))
      .parse(raw.size ?? defaults.pageSize ?? 20),
    sort: z.preprocess(first, z.enum(sortable).catch(defaults.sort)).parse(raw.sort ?? defaults.sort),
    desc: raw.dir === undefined ? defaults.desc : first(raw.dir) === "desc",
  };
}

/** A single-choice filter from the URL, limited to the allowed values. */
export function parseFilter<T extends string>(raw: RawSearchParams, key: string, allowed: readonly T[]): T | undefined {
  const value = first(raw[key]);
  return allowed.find((entry) => entry === value);
}

export function skipTake(params: { page: number; pageSize: number }) {
  return { skip: (params.page - 1) * params.pageSize, take: params.pageSize };
}
