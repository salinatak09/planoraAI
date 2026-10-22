export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Extracts and sanitizes pagination parameters from URL search parameters or plain object.
 * Enforces safe boundaries (minimum 1, max limit 100).
 */
export function parsePaginationParams(
  input: URLSearchParams | { page?: string | number | null; limit?: string | number | null }
): PaginationParams {
  let pageRaw: string | number | null | undefined;
  let limitRaw: string | number | null | undefined;

  if (input instanceof URLSearchParams) {
    pageRaw = input.get("page");
    limitRaw = input.get("limit");
  } else {
    pageRaw = input.page;
    limitRaw = input.limit;
  }

  const parsedPage = typeof pageRaw === "number" ? pageRaw : parseInt(String(pageRaw || 1), 10);
  const parsedLimit = typeof limitRaw === "number" ? limitRaw : parseInt(String(limitRaw || 20), 10);

  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const rawLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : parsedLimit;
  const limit = Math.min(rawLimit, 100); // hard cap at 100 items per page
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Wraps list data into a standard paginated response envelope.
 */
export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit) || 1;
  return {
    items,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
}
