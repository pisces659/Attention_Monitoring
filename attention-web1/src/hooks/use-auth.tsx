"use client";

import { createContext, useContext } from "react";

import { currentClinician } from "@/mock";
import type { AuthUser } from "@/types";

const AuthContext = createContext<AuthUser>({
  email: currentClinician.email,
  name: currentClinician.name,
  role: "Clinician",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        email: currentClinician.email,
        name: currentClinician.name,
        role: "Clinician",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
