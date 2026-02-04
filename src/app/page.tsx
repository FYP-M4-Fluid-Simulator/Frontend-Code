"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";
import { SignupPage } from "@/components/SignupPage";

type Page = "landing" | "login" | "signup" | "app";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const router = useRouter();

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  // Redirect to design page when user is authenticated
  useEffect(() => {
    if (currentPage === "app") {
      router.push("/design");
    }
  }, [currentPage, router]);

  // Render the appropriate page based on current state
  if (currentPage === "landing") {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === "login") {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPage === "signup") {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  // If user reaches app state, they will be redirected to design page
  // This is just a fallback loading state
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Redirecting to Design...
        </h1>
        <p className="text-gray-600">Please wait</p>
      </div>
    </div>
  );
}
