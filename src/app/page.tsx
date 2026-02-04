"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";
import { SignupPage } from "@/components/SignupPage";

type Page = "landing" | "login" | "signup" | "app";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

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

  // Main app placeholder - you can add your simulation controls here later
  return (
    <div className="size-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to AeroSim CFD
        </h1>
        <p className="text-gray-600 mb-6">You're now logged in!</p>
        <button
          onClick={() => handleNavigate("landing")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Back to Landing
        </button>
      </div>
    </div>
  );
}
