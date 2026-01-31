"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the design page by default
    router.push("/design");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          CFD Airfoil Optimizer
        </h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
