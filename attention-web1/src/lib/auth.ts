export const AUTH_COOKIE = "neurolens-auth";

export const DEMO_CREDENTIALS = {
  email: "demo@neurolens.ai",
  password: "demo123",
};

export function isValidCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
