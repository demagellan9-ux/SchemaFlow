// Typed fetch wrapper used by all service modules.
// Auth header injection is added in Phase 7 (Supabase session → JWT).

export type ApiError = {
  error: string;
  details?: Array<{ field: string; message: string }>;
};

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError
  ) {
    super(body.error);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiRequestError(res.status, body);
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}
