import { clearAuthToken, setAuthToken } from "@/lib/api-client";
import { USE_API } from "@/lib/api-config";
import { AUTH_COOKIE, DEMO_CREDENTIALS, isValidCredentials } from "@/lib/auth";

export async function login(email: string, password: string): Promise<boolean> {
  if (!USE_API) {
    if (!isValidCredentials(email, password)) {
      return false;
    }
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    return true;
  }

  if (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    setAuthToken("dev-token");
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    return true;
  }

  return false;
}

export function logout() {
  clearAuthToken();
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
