import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Announcement } from "@shared/schema";
import { format } from "date-fns";
import { Bell, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnnouncementSkeleton } from "@/components/ui/content-skeletons";
import { useLocation } from "wouter";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "important" | "recent">("all");

  // Check if we're on mobile
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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  // Filter and search announcements
  const filteredAnnouncements = announcements
    ? announcements
        .filter(announcement => {
          if (filter === "important") return announcement.important;
          if (filter === "recent") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(announcement.createdAt) >= oneWeekAgo;
          }
          return true;
        })
        .filter(announcement => 
          announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

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
              Announcements
            </h1>
            <p className="text-[#2C3E50]/70">
              View all school-wide and class-specific announcements
            </p>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/60 h-5 w-5" />
              <Input
                placeholder="Search announcements..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-[#1976D2]" : ""}
              >
                All
              </Button>
              <Button
                variant={filter === "important" ? "default" : "outline"}
                onClick={() => setFilter("important")}
                className={filter === "important" ? "bg-[#FF5722]" : ""}
              >
                Important
              </Button>
              <Button
                variant={filter === "recent" ? "default" : "outline"}
                onClick={() => setFilter("recent")}
                className={filter === "recent" ? "bg-[#4CAF50]" : ""}
              >
                Recent
              </Button>
            </div>
            {(user?.role === "teacher" || user?.role === "admin") && (
              <Button 
                className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                onClick={() => navigate("/create")}
              >
                Create Announcement
              </Button>
            )}
          </div>

          {/* Announcements List */}
          <div className="grid gap-6">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, index) => (
                  <AnnouncementSkeleton key={index} />
                ))}
              </>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
                <Bell className="h-16 w-16 text-[#1976D2]/30 mb-4" />
                <h3 className="text-xl font-medium text-[#2C3E50] mb-2">No announcements found</h3>
                <p className="text-[#2C3E50]/70 text-center max-w-md">
                  {searchTerm
                    ? "No announcements match your search criteria. Try a different search term."
                    : filter !== "all"
                    ? `No ${filter} announcements available. Try changing the filter.`
                    : "There are no announcements available at this time."}
                </p>
                {(user?.role === "teacher" || user?.role === "admin") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/create")}
                  >
                    Create Announcement
                  </Button>
                )}
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <ContentCard
                  key={announcement.id}
                  title={announcement.title}
                  className="border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-[#2C3E50]/70">
                      {format(new Date(announcement.createdAt), "MMMM d, yyyy")}
                    </span>
                    {announcement.important && (
                      <span className="text-xs bg-[#FF5722]/10 text-[#FF5722] px-2 py-1 rounded-full">
                        Important
                      </span>
                    )}
                    {announcement.category && (
                      <span className="text-xs bg-[#1976D2]/10 text-[#1976D2] px-2 py-1 rounded-full">
                        {announcement.category}
                      </span>
                    )}
                    {announcement.audience && (
                      <span className="text-xs bg-[#4CAF50]/10 text-[#4CAF50] px-2 py-1 rounded-full">
                        {announcement.audience}
                      </span>
                    )}
                  </div>
                  <p className="text-[#2C3E50] whitespace-pre-line">
                    {announcement.content}
                  </p>
                  {(user?.role === "teacher" || user?.role === "admin") && (
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="text-[#1976D2]">
                        Edit
                      </Button>
                    </div>
                  )}
                </ContentCard>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
