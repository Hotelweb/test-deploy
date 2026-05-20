import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  per_page = 20;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
}

export interface PaginationLinks {
  first: string | null;
  prev: string | null;
  next: string | null;
  last: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  query: PaginationQueryDto,
  path: string,
  extraQuery: Record<string, string | number | undefined> = {},
): PaginatedResponse<T> {
  const currentPage = query.page;
  const perPage = query.per_page;
  const totalPages = Math.max(Math.ceil(totalCount / perPage), 1);

  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraQuery)) {
      if (value !== undefined) params.set(key, String(value));
    }
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    return `${path}?${params.toString()}`;
  };

  return {
    data,
    meta: {
      current_page: currentPage,
      per_page: perPage,
      total_pages: totalPages,
      total_count: totalCount,
    },
    links: {
      first: totalCount > 0 ? pageUrl(1) : null,
      prev: currentPage > 1 ? pageUrl(currentPage - 1) : null,
      next: currentPage < totalPages ? pageUrl(currentPage + 1) : null,
      last: totalCount > 0 ? pageUrl(totalPages) : null,
    },
  };
}
