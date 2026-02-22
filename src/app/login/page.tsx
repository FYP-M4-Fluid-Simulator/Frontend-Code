"use client";

import { LoginPage } from "../../components/LoginPage";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const router = useRouter();

  const handleNavigate = (page: "landing" | "signup" | "app") => {
    if (page === "app") {
      router.push("/airfoil_deck");
    } else if (page === "landing") {
      router.push("/");
    } else if (page === "signup") {
      router.push("/signup");
    }
  };

  return <LoginPage onNavigate={handleNavigate} />;
}
