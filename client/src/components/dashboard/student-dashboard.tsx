import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard, ContentCard } from "@/components/ui/dashboard-card";
import { Assignment, Announcement, Material, Event } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Clock, 
  FileText, 
  AlertCircle,
  BookOpen,
  Calendar,
  PlusIcon
} from "lucide-react";

export function StudentDashboard() {
  const { user } = useAuth();

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  // Fetch materials
  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Filter assignments to get upcoming ones
  const upcomingAssignments = assignments
    ? assignments
        .filter((assignment) => new Date(assignment.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3)
    : [];

  // Get important announcements
  const importantAnnouncements = announcements
    ? announcements
        .filter((announcement) => announcement.important)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
    : [];

  // Get upcoming events
  const upcomingEvents = events
    ? events
        .filter((event) => new Date(event.startDate) > new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3)
    : [];

  // Quick access cards
  const quickAccessCards = [
    {
      title: "Assignments",
      icon: <FileText className="h-8 w-8 text-[#1976D2] mb-2" />,
      count: assignments?.length || 0,
      link: "/assignments",
      color: "bg-[#1976D2]/10",
      textColor: "text-[#1976D2]",
    },
    {
      title: "Materials",
      icon: <BookOpen className="h-8 w-8 text-[#4CAF50] mb-2" />,
      count: materials?.length || 0,
      link: "/materials",
      color: "bg-[#4CAF50]/10",
      textColor: "text-[#4CAF50]",
    },
    {
      title: "Events",
      icon: <Calendar className="h-8 w-8 text-[#FF5722] mb-2" />,
      count: events?.length || 0,
      link: "/schedule",
      color: "bg-[#FF5722]/10",
      textColor: "text-[#FF5722]",
    },
  ];

  return (
    <div id="student-dashboard" className="pb-16">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
          Student Dashboard
        </h1>
        <p className="text-[#2C3E50]/70">
          Welcome back, {user?.name}. You have{" "}
          <span className="text-[#FF5722] font-medium">
            {upcomingAssignments.length} upcoming
          </span>{" "}
          assignments.
        </p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickAccessCards.map((card, i) => (
          <Link key={i} href={card.link}>
            <a className="block">
              <div className={`card p-6 ${card.color} rounded-md shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md`}>
                <div className="flex flex-col items-center text-center">
                  {card.icon}
                  <h3 className={`font-medium ${card.textColor} mb-1 font-['Inter']`}>
                    {card.title}
                  </h3>
                  <p className="text-2xl font-bold mt-2">{card.count}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <ContentCard
          title="Upcoming Assignments"
          action={{
            label: "View All",
            onClick: () => window.location.href = "/assignments",
          }}
        >
          {assignmentsLoading ? (
            <div className="flex justify-center p-4">Loading assignments...</div>
          ) : upcomingAssignments.length === 0 ? (
            <div className="flex flex-col items-center p-6">
              <FileText className="h-12 w-12 text-[#1976D2]/30 mb-2" />
              <p className="text-[#2C3E50]/70">No upcoming assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAssignments.map((assignment, i) => (
                <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="bg-[#1976D2]/10 rounded-md p-2 text-center min-w-[60px]">
                    <Clock className="h-5 w-5 text-[#1976D2] mx-auto" />
                    <span className="block text-sm text-[#1976D2] font-medium mt-1">
                      {format(new Date(assignment.dueDate), "MMM d")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#2C3E50]">{assignment.title}</h4>
                    <p className="text-sm text-[#2C3E50]/70">
                      {assignment.description.length > 60
                        ? `${assignment.description.substring(0, 60)}...`
                        : assignment.description}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      {assignment.classId && (
                        <span className="text-xs bg-gray-100 text-[#2C3E50]/80 px-2 py-1 rounded-full">
                          {assignment.classId}
                        </span>
                      )}
                      <span className="text-xs bg-[#1976D2]/10 text-[#1976D2] px-2 py-1 rounded-full">
                        Due {format(new Date(assignment.dueDate), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>

        {/* Important Announcements */}
        <ContentCard
          title="Important Announcements"
          action={{
            label: "All Announcements",
            onClick: () => window.location.href = "/announcements",
          }}
        >
          {announcementsLoading ? (
            <div className="flex justify-center p-4">Loading announcements...</div>
          ) : importantAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center p-6">
              <AlertCircle className="h-12 w-12 text-[#FF5722]/30 mb-2" />
              <p className="text-[#2C3E50]/70">No important announcements</p>
            </div>
          ) : (
            <div className="space-y-4">
              {importantAnnouncements.map((announcement, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-[#2C3E50]">{announcement.title}</h4>
                    <span className="text-xs text-[#2C3E50]/60">
                      {format(new Date(announcement.createdAt), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-[#2C3E50]/70 mt-1">
                    {announcement.content.length > 120
                      ? `${announcement.content.substring(0, 120)}...`
                      : announcement.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs bg-[#FF5722]/10 text-[#FF5722] px-2 py-1 rounded-full">
                      Important
                    </span>
                    {announcement.category && (
                      <span className="text-xs bg-gray-100 text-[#2C3E50]/80 px-2 py-1 rounded-full">
                        {announcement.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>
      </div>

      {/* More Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Upcoming Events */}
        <ContentCard
          title="Upcoming Events"
          action={{
            label: "View Calendar",
            onClick: () => window.location.href = "/schedule",
          }}
        >
          {eventsLoading ? (
            <div className="flex justify-center p-4">Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center p-6">
              <Calendar className="h-12 w-12 text-[#4CAF50]/30 mb-2" />
              <p className="text-[#2C3E50]/70">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className={`${event.important ? 'bg-[#FF5722]/10' : 'bg-[#4CAF50]/10'} rounded-md p-2 text-center min-w-[60px]`}>
                    <span className={`block text-sm ${event.important ? 'text-[#FF5722]' : 'text-[#4CAF50]'} font-medium`}>
                      {format(new Date(event.startDate), "MMM")}
                    </span>
                    <span className={`block text-xl font-bold ${event.important ? 'text-[#FF5722]' : 'text-[#4CAF50]'}`}>
                      {format(new Date(event.startDate), "d")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#2C3E50]">{event.title}</h4>
                    <p className="text-sm text-[#2C3E50]/70">
                      {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.location && (
                        <span className="text-xs bg-gray-100 text-[#2C3E50]/80 px-2 py-1 rounded-full">
                          {event.location}
                        </span>
                      )}
                      {event.important && (
                        <span className="text-xs bg-[#FF5722]/10 text-[#FF5722] px-2 py-1 rounded-full">
                          Important
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>

        {/* Recent Materials */}
        <div className="lg:col-span-2">
          <ContentCard
            title="Recent Study Materials"
            action={{
              label: "Browse All",
              onClick: () => window.location.href = "/materials",
            }}
          >
            {materialsLoading ? (
              <div className="flex justify-center p-4">Loading materials...</div>
            ) : !materials || materials.length === 0 ? (
              <div className="flex flex-col items-center p-6">
                <BookOpen className="h-12 w-12 text-[#1976D2]/30 mb-2" />
                <p className="text-[#2C3E50]/70">No study materials available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.slice(0, 4).map((material, i) => (
                  <div key={i} className="card bg-white border border-gray-100 rounded-md p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-[#2C3E50] truncate">{material.title}</h4>
                    <p className="text-sm text-[#2C3E50]/70 h-10 overflow-hidden">
                      {material.description.substring(0, 60)}...
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-[#2C3E50]/60">
                        {format(new Date(material.uploadedAt), "MMM d, yyyy")}
                      </span>
                      <button className="text-[#1976D2] hover:text-[#1976D2]/80 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      </div>
    </div>
  );
}
