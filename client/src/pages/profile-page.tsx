import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { ContentCard } from "@/components/ui/dashboard-card";

export default function ProfilePage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <Header toggleMobileMenu={toggleMobileMenu} />
      
      <div className="flex flex-1">
        <Sidebar 
          isMobile={isMobile} 
          showMobileMenu={showMobileMenu} 
          setShowMobileMenu={setShowMobileMenu} 
        />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
              Profile
            </h1>
            <p className="text-[#2C3E50]/70">
              View and manage your profile information
            </p>
          </div>

          <ContentCard title="Profile Information">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-[#1976D2] flex items-center justify-center text-white text-xl font-medium">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-[#2C3E50]">{user?.name}</h2>
                  <p className="text-[#2C3E50]/70 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </ContentCard>
        </main>
      </div>
    </div>
  );
} 