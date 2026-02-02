import type { Metadata } from "next";

import { AuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "Sign In - Ignite"
};

export default function AuthPage() {
  return <AuthForm />;
}
