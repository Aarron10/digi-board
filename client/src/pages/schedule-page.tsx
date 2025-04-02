import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { 
  Loader2, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Tag,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";

export default function SchedulePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Fetch events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Calendar helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "MMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Find events for selected date
  const selectedDateEvents = events?.filter(event => 
    isSameDay(new Date(event.startDate), selectedDate)
  ).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  ) || [];

  // Navigate between months
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Calendar cell styles based on day
  const getCellStyles = (day: Date) => {
    const baseStyles = "h-10 w-10 rounded-full flex items-center justify-center cursor-pointer";
    
    // Check if day has events
    const hasEvents = events?.some(event => 
      isSameDay(new Date(event.startDate), day)
    );
    
    if (isSameDay(day, selectedDate)) {
      return `${baseStyles} bg-[#1976D2] text-white`;
    } else if (isToday(day)) {
      return `${baseStyles} bg-[#1976D2]/20 text-[#1976D2] font-bold`;
    } else if (isSameMonth(day, currentDate)) {
      if (hasEvents) {
        return `${baseStyles} hover:bg-gray-100 font-medium text-[#2C3E50] border-b-2 border-[#FF5722]`;
      }
      return `${baseStyles} hover:bg-gray-100 text-[#2C3E50]`;
    } else {
      return `${baseStyles} text-[#2C3E50]/30`;
    }
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
          <div className="mb-6 flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
                Schedule
              </h1>
              <p className="text-[#2C3E50]/70">
                View upcoming events and important dates
              </p>
            </div>
            
            {(user?.role === "teacher" || user?.role === "admin") && (
              <Button 
                className="bg-[#1976D2] hover:bg-[#1976D2]/90 mt-2 md:mt-0"
                onClick={() => navigate("/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Calendar View */}
            <div className="md:col-span-8">
              <ContentCard title="Calendar">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1976D2]" />
                  </div>
                ) : (
                  <>
                    {/* Calendar header */}
                    <div className="flex justify-between items-center mb-6">
                      <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="text-xl font-semibold text-[#2C3E50]">
                        {format(currentDate, dateFormat)}
                      </h2>
                      <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* Calendar days header */}
                    <div className="grid grid-cols-7 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <div 
                          key={i} 
                          className="text-center text-sm font-medium text-[#2C3E50]/70"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-y-2">
                      {days.map((day, i) => (
                        <div 
                          key={i} 
                          className="flex justify-center items-center"
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={getCellStyles(day)}>
                            {format(day, "d")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ContentCard>
            </div>
            
            {/* Events for selected date */}
            <div className="md:col-span-4">
              <ContentCard 
                title={`Events for ${format(selectedDate, "MMMM d, yyyy")}`}
                className="h-full"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1976D2]" />
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <CalendarIcon className="h-16 w-16 text-[#1976D2]/30 mb-4" />
                    <p className="text-[#2C3E50]/70 text-center">
                      No events scheduled for this date
                    </p>
                    {(user?.role === "teacher" || user?.role === "admin") && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/create")}
                      >
                        Add Event
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className={`p-4 rounded-lg border-l-4 ${
                          event.important 
                            ? "border-[#FF5722] bg-[#FF5722]/5" 
                            : "border-[#1976D2] bg-[#1976D2]/5"
                        }`}
                      >
                        <h3 className="font-medium text-[#2C3E50] mb-2">{event.title}</h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-[#2C3E50]/70">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                            </span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center text-[#2C3E50]/70">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.category && (
                            <div className="flex items-center text-[#2C3E50]/70">
                              <Tag className="h-4 w-4 mr-2" />
                              <span>{event.category}</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="mt-3 text-sm text-[#2C3E50]">
                          {event.description}
                        </p>
                        
                        {event.important && (
                          <div className="mt-2">
                            <span className="text-xs bg-[#FF5722]/10 text-[#FF5722] px-2 py-1 rounded-full">
                              Important
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ContentCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
