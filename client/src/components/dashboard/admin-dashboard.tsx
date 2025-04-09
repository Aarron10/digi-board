import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard, ContentCard } from "@/components/ui/dashboard-card";
import { DataTable } from "@/components/ui/data-table";
import { User, Announcement } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { PlusIcon, UserPlus, Settings, Bell, Users, FileText, BookOpen } from "lucide-react";

// Define type for user without password
type UserWithoutPassword = Omit<User, "password">;

export function AdminDashboard() {
  const { user } = useAuth();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  // Admin quick actions
  const quickActions = [
    {
      title: "Manage Users",
      description: "Add, edit or remove system users",
      variant: "primary" as const,
      icon: <UserPlus className="h-10 w-10 text-[#1976D2] mb-2" />,
      action: {
        label: "Manage Users",
        onClick: () => window.location.href = "/users",
      },
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      variant: "secondary" as const,
      icon: <Settings className="h-10 w-10 text-[#4CAF50] mb-2" />,
      action: {
        label: "Settings",
        onClick: () => window.location.href = "/settings",
      },
    },
    {
      title: "Announcements",
      description: "Create school-wide announcements",
      variant: "accent" as const,
      icon: <FileText className="h-10 w-10 text-[#FF5722] mb-2" />,
      action: {
        label: "New Announcement",
        onClick: () => window.location.href = "/create",
      },
    },
  ];

  // User stats
  const userStats = [
    {
      title: "Total Users",
      count: users?.length || 0,
      icon: <Users className="h-5 w-5 text-[#1976D2]" />,
      color: "text-[#1976D2]",
    },
    {
      title: "Teachers",
      count: users?.filter(user => user.role === "teacher").length || 0,
      icon: <FileText className="h-5 w-5 text-[#FF5722]" />,
      color: "text-[#FF5722]",
    },
    {
      title: "Students",
      count: users?.filter(user => user.role === "student").length || 0,
      icon: <BookOpen className="h-5 w-5 text-[#4CAF50]" />,
      color: "text-[#4CAF50]",
    },
  ];

  // User columns for the data table
  const userColumns = [
    {
      key: "name",
      header: "Name",
      cell: (user: UserWithoutPassword) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#1976D2]/20 flex items-center justify-center text-[#1976D2] mr-2">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-[#2C3E50]">{user.name}</div>
            <div className="text-xs text-[#2C3E50]/60">{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (user: UserWithoutPassword) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          user.role === "admin" 
            ? "bg-[#1976D2]/10 text-[#1976D2]" 
            : user.role === "teacher" 
            ? "bg-[#FF5722]/10 text-[#FF5722]" 
            : "bg-[#4CAF50]/10 text-[#4CAF50]"
        }`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (_user: UserWithoutPassword) => (
        <div className="flex space-x-2">
          <button className="text-[#1976D2] hover:text-[#1976D2]/80 text-sm">
            Edit
          </button>
          <button className="text-[#F44336] hover:text-[#F44336]/80 text-sm">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div id="admin-dashboard" className="pb-16">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
          Admin Dashboard
        </h1>
        <p className="text-[#2C3E50]/70">
          Welcome back, {user?.name}. System overview and management.
        </p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {userStats.map((stat, i) => (
          <div key={i} className="card p-6 bg-white rounded-md shadow-sm">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-${stat.color.split('-')[1]}/10`}>
                {stat.icon}
              </div>
              <div>
                <h3 className="text-sm text-[#2C3E50]/70">{stat.title}</h3>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, i) => (
          <DashboardCard
            key={i}
            title={action.title}
            description={action.description}
            variant={action.variant}
            className="text-center"
          >
            <div className="flex justify-center my-4">
              {action.icon}
            </div>
            <button
              onClick={action.action.onClick}
              className={`w-full ${
                action.variant === "primary"
                  ? "bg-[#1976D2] hover:bg-[#1976D2]/90"
                  : action.variant === "secondary"
                  ? "bg-[#4CAF50] hover:bg-[#4CAF50]/90"
                  : "bg-[#FF5722] hover:bg-[#FF5722]/90"
              } text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
            >
              {action.action.label}
            </button>
          </DashboardCard>
        ))}
      </div>

      {/* Users Table */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <ContentCard
          title="System Users"
          action={{
            label: "Add User",
            onClick: () => window.location.href = "/users",
          }}
        >
          <DataTable<UserWithoutPassword>
            data={users || []}
            columns={userColumns}
            emptyState={
              usersLoading ? (
                <div className="flex justify-center p-4">Loading users...</div>
              ) : (
                <div className="flex flex-col items-center p-6">
                  <PlusIcon className="h-12 w-12 text-[#1976D2]/30 mb-2" />
                  <p className="text-[#2C3E50]/70">No users found</p>
                  <Link href="/users">
                    <a className="mt-2 text-[#1976D2] hover:underline">Add users</a>
                  </Link>
                </div>
              )
            }
          />
        </ContentCard>
      </div>

      {/* Recent Announcements */}
      <div className="grid grid-cols-1 gap-6">
        <ContentCard
          title="Recent Announcements"
          action={{
            label: "New Announcement",
            onClick: () => window.location.href = "/create",
          }}
        >
          {announcementsLoading ? (
            <div className="flex justify-center p-4">Loading announcements...</div>
          ) : announcements && announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.slice(0, 4).map((announcement, i) => (
                <div key={i} className="card bg-white border border-gray-100 rounded-md p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-[#2C3E50]">{announcement.title}</h4>
                    <span className="text-xs text-[#2C3E50]/60">
                      {format(new Date(announcement.createdAt), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-[#2C3E50]/70 mt-1 h-12 overflow-hidden">
                    {announcement.content.substring(0, 80)}...
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
              <Bell className="h-12 w-12 text-[#1976D2]/30 mb-2" />
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
