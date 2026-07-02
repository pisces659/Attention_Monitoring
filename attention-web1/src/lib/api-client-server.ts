import { cookies } from "next/headers";

import { API_BASE_URL, AUTH_TOKEN_COOKIE, USE_API } from "./api-config";
import { AUTH_COOKIE } from "./auth";
import { ApiError } from "./api-client";

const DEV_TOKEN = "dev-token";

function resolveServerToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): string | undefined {
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (token) {
    return decodeURIComponent(token);
  }

  if (!USE_API) {
    return undefined;
  }

  // Local API mode: always attach dev token so server components can reach FastAPI
  if (process.env.NODE_ENV === "development") {
    return DEV_TOKEN;
  }

  if (cookieStore.get(AUTH_COOKIE)?.value === "true") {
    return DEV_TOKEN;
  }

  return undefined;
}

export async function serverApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = resolveServerToken(cookieStore);
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(body || response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
