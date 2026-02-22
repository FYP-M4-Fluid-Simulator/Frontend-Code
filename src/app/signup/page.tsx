"use client";

import { SignupPage } from "../../components/SignupPage";
import { useRouter } from "next/navigation";

export default function SignupRoute() {
  const router = useRouter();

  const handleNavigate = (page: "landing" | "login" | "app") => {
    if (page === "app") {
      router.push("/airfoil_deck");
    } else if (page === "landing") {
      router.push("/");
    } else if (page === "login") {
      router.push("/login");
    }
  };

  return <SignupPage onNavigate={handleNavigate} />;
}
