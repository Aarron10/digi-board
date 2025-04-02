import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard, ContentCard } from "@/components/ui/dashboard-card";
import { DataTable, StatusBadge } from "@/components/ui/data-table";
import { Assignment, Announcement, Event } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { PlusIcon, CheckIcon, AlertCircleIcon, VideoIcon } from "lucide-react";
import { DashboardCardSkeleton, AssignmentSkeleton, AnnouncementSkeleton } from "@/components/ui/content-skeletons";

export function TeacherDashboard() {
  const { user } = useAuth();
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    onSuccess: (data) => {
      // Filter assignments that need grading
      const pending = data || [];
      setPendingAssignments(pending.slice(0, 5));
    },
  });

  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Determine due date status
  const getDueDateStatus = (dueDate: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (new Date(dueDate) < today) {
      return { status: "error", text: "Overdue" };
    } else if (new Date(dueDate) < tomorrow) {
      return { status: "warning", text: "Tomorrow" };
    } else if (new Date(dueDate) < nextWeek) {
      return { status: "success", text: "Next week" };
    } else {
      return { status: "info", text: format(new Date(dueDate), "MMM d") };
    }
  };

  // Assignment columns for the data table
  const assignmentColumns = [
    {
      key: "title",
      header: "Title",
      cell: (assignment: Assignment) => (
        <div>
          <div className="text-sm font-medium text-[#2C3E50]">{assignment.title}</div>
          <div className="text-xs text-[#2C3E50]/60">{assignment.description.substring(0, 30)}...</div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      cell: (assignment: Assignment) => (
        <span className="text-sm text-[#2C3E50]">{assignment.classId || "General"}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (assignment: Assignment) => {
        const { status, text } = getDueDateStatus(new Date(assignment.dueDate));
        return <StatusBadge status={status as any}>{text}</StatusBadge>;
      },
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (_assignment: Assignment) => {
        // Mock data for submissions - in a real app, this would come from the backend
        const total = Math.floor(Math.random() * 20) + 10;
        const submitted = Math.floor(Math.random() * total);
        return <span className="text-sm text-[#2C3E50]">{submitted}/{total}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (_assignment: Assignment) => (
        <button className="text-[#1976D2] hover:text-[#1976D2]/80 font-medium">
          Grade
        </button>
      ),
    },
  ];

  // Quick actions for teacher
  const quickActions = [
    {
      title: "Create Assignment",
      description: "Add new assignment for your students",
      variant: "primary" as const,
      action: {
        label: "Create New",
        onClick: () => window.location.href = "/create",
      },
    },
    {
      title: "Upload Study Material",
      description: "Share documents and resources",
      variant: "secondary" as const,
      action: {
        label: "Upload Files",
        onClick: () => window.location.href = "/create",
      },
    },
    {
      title: "Post Announcement",
      description: "Share important updates with students",
      variant: "accent" as const,
      action: {
        label: "New Announcement",
        onClick: () => window.location.href = "/create",
      },
    },
  ];

  // Sample data for recent activities
  const activities = [
    {
      type: "submission",
      user: "Emma Davis",
      action: "submitted assignment",
      target: "Mathematics Quiz 3",
      time: "Today, 11:42 AM",
      icon: <CheckIcon className="h-4 w-4 text-[#1976D2]" />,
      iconBg: "bg-[#1976D2]/20",
    },
    {
      type: "question",
      user: "Michael Wilson",
      action: "asked a question on",
      target: "Term Paper Draft",
      time: "Yesterday, 4:23 PM",
      icon: <AlertCircleIcon className="h-4 w-4 text-[#FF5722]" />,
      iconBg: "bg-[#FF5722]/20",
    },
    {
      type: "view",
      user: "James Brown",
      action: "viewed study material",
      target: "Research Methods",
      time: "Yesterday, 2:15 PM",
      icon: <VideoIcon className="h-4 w-4 text-[#4CAF50]" />,
      iconBg: "bg-[#4CAF50]/20",
    },
  ];

  // Format upcoming events from API data
  const upcomingEvents = events
    ? events
        .filter((event) => new Date(event.startDate) > new Date())
        .sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .slice(0, 3)
        .map((event) => ({
          ...event,
          month: format(new Date(event.startDate), "MMM"),
          day: format(new Date(event.startDate), "d"),
          time: `${format(new Date(event.startDate), "h:mm a")} - ${format(new Date(event.endDate), "h:mm a")}`,
          isImportant: event.important,
          tags: [
            { label: event.location || "TBD", type: "info" },
            { 
              label: event.important ? "Important" : "Optional", 
              type: event.important ? "warning" : "info" 
            }
          ]
        }))
    : [];

  return (
    <div id="teacher-dashboard" className="pb-16">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
          Teacher Dashboard
        </h1>
        <p className="text-[#2C3E50]/70">
          Welcome back, {user?.name}. You have{" "}
          <span className="text-[#FF5722] font-medium">
            {pendingAssignments.length} assignments
          </span>{" "}
          to grade.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {assignmentsLoading || announcementsLoading || eventsLoading ? (
          <>
            <DashboardCardSkeleton variant="primary" />
            <DashboardCardSkeleton variant="secondary" />
            <DashboardCardSkeleton variant="accent" />
          </>
        ) : (
          quickActions.map((action, i) => (
            <DashboardCard
              key={i}
              title={action.title}
              description={action.description}
              variant={action.variant}
              action={action.action}
            />
          ))
        )}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Assignments */}
        <div className="lg:col-span-2">
          <ContentCard
            title="Pending Assignments"
            action={{
              label: "View All",
              onClick: () => window.location.href = "/assignments",
            }}
          >
            <DataTable
              data={pendingAssignments || []}
              columns={assignmentColumns}
              emptyState={
                assignmentsLoading ? (
                  <AssignmentSkeleton />
                ) : (
                  <div className="flex flex-col items-center p-6">
                    <PlusIcon className="h-12 w-12 text-[#1976D2]/30 mb-2" />
                    <p className="text-[#2C3E50]/70">No pending assignments</p>
                    <Link href="/create">
                      <a className="mt-2 text-[#1976D2] hover:underline">Create one</a>
                    </Link>
                  </div>
                )
              }
            />
          </ContentCard>
        </div>

        {/* Upcoming Events */}
        <div>
          <ContentCard
            title="Upcoming Events"
            action={{
              label: "View Calendar",
              onClick: () => window.location.href = "/schedule",
            }}
          >
            {eventsLoading ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 animate-pulse">
                  <div className="bg-gray-200 rounded-md p-2 text-center min-w-[60px]">
                    <div className="h-4 w-8 bg-gray-300 mb-1 mx-auto rounded"></div>
                    <div className="h-6 w-6 bg-gray-300 mx-auto rounded"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-300 mb-2 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 mb-2 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-pulse">
                  <div className="bg-gray-200 rounded-md p-2 text-center min-w-[60px]">
                    <div className="h-4 w-8 bg-gray-300 mb-1 mx-auto rounded"></div>
                    <div className="h-6 w-6 bg-gray-300 mx-auto rounded"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-300 mb-2 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 mb-2 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center p-6">
                <CalendarIcon className="h-12 w-12 text-[#1976D2]/30 mb-2" />
                <p className="text-[#2C3E50]/70">No upcoming events</p>
                <Link href="/create">
                  <a className="mt-2 text-[#1976D2] hover:underline">Create one</a>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`${event.isImportant ? 'bg-[#FF5722]/10' : 'bg-[#1976D2]/10'} rounded-md p-2 text-center min-w-[60px]`}>
                      <span className={`block text-sm ${event.isImportant ? 'text-[#FF5722]' : 'text-[#1976D2]'} font-medium`}>{event.month}</span>
                      <span className={`block text-xl font-bold ${event.isImportant ? 'text-[#FF5722]' : 'text-[#1976D2]'}`}>{event.day}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2C3E50]">{event.title}</h4>
                      <p className="text-sm text-[#2C3E50]/70">{event.time}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex} 
                            className={`text-xs ${tag.type === 'warning' ? 'bg-[#FF5722]/10 text-[#FF5722]' : 'bg-gray-100 text-[#2C3E50]/80'} px-2 py-1 rounded-full`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      </div>

      {/* Recent Activity and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Student Activity */}
        <ContentCard title="Recent Student Activity">
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex items-start">
                <div className="min-w-[40px]">
                  <div className={`w-8 h-8 rounded-full ${activity.iconBg} flex items-center justify-center`}>
                    {activity.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#2C3E50]">
                    <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                    <span className={`text-${activity.type === 'submission' ? '[#1976D2]' : activity.type === 'question' ? '[#FF5722]' : '[#4CAF50]'}`}>
                      {activity.target}
                    </span>
                  </p>
                  <p className="text-xs text-[#2C3E50]/60">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 text-[#1976D2] hover:text-[#1976D2]/80 text-sm font-medium">
            View All Activity
          </button>
        </ContentCard>

        {/* Latest Announcements */}
        <ContentCard
          title="Latest Announcements"
          action={{
            label: "New",
            onClick: () => window.location.href = "/create",
          }}
        >
          {announcementsLoading ? (
            <div className="space-y-4">
              <AnnouncementSkeleton />
              <AnnouncementSkeleton />
              <AnnouncementSkeleton />
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-[#2C3E50]">{announcement.title}</h4>
                    <span className="text-xs text-[#2C3E50]/60">
                      {format(new Date(announcement.createdAt), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-[#2C3E50]/70 mt-1">
                    {announcement.content.length > 100
                      ? `${announcement.content.substring(0, 100)}...`
                      : announcement.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {announcement.important && (
                      <span className="text-xs bg-[#FF5722]/10 text-[#FF5722] px-2 py-1 rounded-full">
                        Important
                      </span>
                    )}
                    {announcement.category && (
                      <span className="text-xs bg-gray-100 text-[#2C3E50]/80 px-2 py-1 rounded-full">
                        {announcement.category}
                      </span>
                    )}
                    {announcement.audience && (
                      <span className="text-xs bg-[#1976D2]/10 text-[#1976D2] px-2 py-1 rounded-full">
                        {announcement.audience}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center p-6">
              <BellIcon className="h-12 w-12 text-[#1976D2]/30 mb-2" />
              <p className="text-[#2C3E50]/70">No announcements yet</p>
              <Link href="/create">
                <a className="mt-2 text-[#1976D2] hover:underline">Create one</a>
              </Link>
            </div>
          )}
        </ContentCard>
      </div>
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
