"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
// import { TopBar } from '@/components/TopBar';
import { AuthModal } from "./AuthModal";
import { SavedDesignsModal } from "./SavedDesignsModal";
import { ProfileModal } from "./ProfileModal";
import { useAppContext } from "../app/providers";

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, isSimulating } = useAppContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const getSelectedTab = (): "design" | "optimize" | "turbine" => {
    if (pathname?.includes("/optimize")) return "optimize";
    if (pathname?.includes("/turbine")) return "turbine";
    return "design";
  };

  const handleTabChange = (tab: "design" | "optimize" | "turbine") => {
    router.push(`/${tab}`);
  };

  const handleLogin = (email: string, name: string) => {
    setUser({ email, name });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen w-full">
      {/* <TopBar
        selectedTab={getSelectedTab()}
        onTabChange={handleTabChange}
        isSimulating={isSimulating}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSavedDesigns={() => setShowSavedDesigns(true)}
        onOpenProfile={() => setShowProfile(true)}
      /> */}

      <div className="w-full">{children}</div>

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      <SavedDesignsModal
        isOpen={showSavedDesigns}
        onClose={() => setShowSavedDesigns(false)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </div>
  );
}
