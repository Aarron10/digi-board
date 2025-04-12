import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Assignment } from "@shared/schema";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  ExternalLink
} from "lucide-react";
import { AssignmentSkeleton } from "@/components/ui/content-skeletons";
import { Input } from "@/components/ui/input";
import { DataTable, StatusBadge } from "@/components/ui/data-table";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { AssignmentViewerDialog } from "@/components/ui/assignment-viewer-dialog";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "overdue" | "upcoming">("all");
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const queryClient = useQueryClient();

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

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete assignment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete assignment");
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  // Determine due date status
  const getDueDateStatus = (dueDate: Date) => {
    const today = new Date();
    const nextWeek = addDays(today, 7);

    if (isPast(new Date(dueDate)) && !isToday(new Date(dueDate))) {
      return { status: "error", text: "Overdue", icon: <AlertTriangle className="h-4 w-4" /> };
    } else if (isToday(new Date(dueDate))) {
      return { status: "warning", text: "Today", icon: <Clock className="h-4 w-4" /> };
    } else if (isTomorrow(new Date(dueDate))) {
      return { status: "warning", text: "Tomorrow", icon: <Clock className="h-4 w-4" /> };
    } else if (new Date(dueDate) < nextWeek) {
      return { status: "success", text: "This week", icon: <Calendar className="h-4 w-4" /> };
    } else {
      return { 
        status: "info", 
        text: format(new Date(dueDate), "MMM d"), 
        icon: <Calendar className="h-4 w-4" /> 
      };
    }
  };

  // Filter and search assignments
  const filteredAssignments = assignments
    ? assignments
        .filter(assignment => {
          const dueDate = new Date(assignment.dueDate);
          if (filter === "pending") return !isPast(dueDate) || isToday(dueDate);
          if (filter === "overdue") return isPast(dueDate) && !isToday(dueDate);
          if (filter === "upcoming") {
            const nextWeek = addDays(new Date(), 7);
            return dueDate <= nextWeek && !isPast(dueDate);
          }
          return true;
        })
        .filter(assignment => 
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assignment.classId && assignment.classId.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : [];

  // Group assignments by class
  const assignmentsByClass = filteredAssignments.reduce((acc, assignment) => {
    const classId = assignment.classId || "General";
    if (!acc[classId]) {
      acc[classId] = [];
    }
    acc[classId].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  const hasFilteredAssignments = Object.keys(assignmentsByClass).length > 0;

  // Student view columns
  const studentColumns = [
    {
      key: "title",
      header: "Assignment",
      cell: (assignment: Assignment) => (
        <div>
          <div className="text-sm font-medium text-[#2C3E50]">{assignment.title}</div>
          <div className="text-xs text-[#2C3E50]/60">
            {assignment.classId && <span>{assignment.classId}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (assignment: Assignment) => {
        const { status, text, icon } = getDueDateStatus(new Date(assignment.dueDate));
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={status as any}>{text}</StatusBadge>
            <span className="text-xs text-[#2C3E50]/70">
              {format(new Date(assignment.dueDate), "MMM d, h:mm a")}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (assignment: Assignment) => {
        // Mock submission status - in a real app would come from backend
        const isSubmitted = Math.random() > 0.5;
        return (
          <span className={`flex items-center gap-1 text-sm ${isSubmitted ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
            {isSubmitted ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Submitted
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Pending
              </>
            )}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (_assignment: Assignment) => (
        <Button size="sm" className="bg-[#1976D2] hover:bg-[#1976D2]/90">
          View
        </Button>
      ),
    },
  ];

  // Teacher view columns
  const teacherColumns = [
    {
      key: "title",
      header: "Assignment",
      cell: (assignment: Assignment) => (
        <div>
          <div className="text-sm font-medium text-[#2C3E50]">{assignment.title}</div>
          <div className="text-xs text-[#2C3E50]/60">
            {assignment.classId && <span>{assignment.classId}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (assignment: Assignment) => {
        const { status, text } = getDueDateStatus(new Date(assignment.dueDate));
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={status as any}>{text}</StatusBadge>
            <span className="text-xs text-[#2C3E50]/70">
              {format(new Date(assignment.dueDate), "MMM d, h:mm a")}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (assignment: Assignment) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="bg-[#1976D2] hover:bg-[#1976D2]/90"
            onClick={() => setViewingAssignment(assignment)}
          >
            View
          </Button>
          {(user?.role === "teacher" || user?.role === "admin") && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

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
              Assignments
            </h1>
            <p className="text-[#2C3E50]/70">
              {user?.role === "student" 
                ? "View and submit your assignments"
                : "Manage and grade assignments"}
            </p>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/60 h-5 w-5" />
              <Input
                placeholder="Search assignments..."
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
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
                className={filter === "pending" ? "bg-[#4CAF50]" : ""}
              >
                Pending
              </Button>
              <Button
                variant={filter === "overdue" ? "default" : "outline"}
                onClick={() => setFilter("overdue")}
                className={filter === "overdue" ? "bg-[#F44336]" : ""}
              >
                Overdue
              </Button>
              <Button
                variant={filter === "upcoming" ? "default" : "outline"}
                onClick={() => setFilter("upcoming")}
                className={filter === "upcoming" ? "bg-[#FF5722]" : ""}
              >
                Upcoming
              </Button>
            </div>
            {(user?.role === "teacher" || user?.role === "admin") && (
              <Button 
                className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                onClick={() => navigate("/create")}
              >
                Create Assignment
              </Button>
            )}
          </div>

          {/* Assignments List */}
          {isLoading ? (
            <AssignmentSkeleton />
          ) : !hasFilteredAssignments ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
              <FileText className="h-16 w-16 text-[#1976D2]/30 mb-4" />
              <h3 className="text-xl font-medium text-[#2C3E50] mb-2">No assignments found</h3>
              <p className="text-[#2C3E50]/70 text-center max-w-md">
                {searchTerm
                  ? "No assignments match your search criteria. Try a different search term."
                  : filter !== "all"
                  ? `No ${filter} assignments available. Try changing the filter.`
                  : "There are no assignments available at this time."}
              </p>
              {(user?.role === "teacher" || user?.role === "admin") && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/create")}
                >
                  Create Assignment
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue={Object.keys(assignmentsByClass)[0]} className="w-full">
              {Object.entries(assignmentsByClass).map(([classId, assignments]) => (
                <TabsContent key={classId} value={classId} className="mt-6">
                  <ContentCard title={`${classId} Assignments`}>
                    <DataTable
                      columns={user?.role === "student" ? studentColumns : teacherColumns}
                      data={assignments}
                    />
                  </ContentCard>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>

      {/* Assignment Viewer Dialog */}
      <AssignmentViewerDialog 
        assignment={viewingAssignment} 
        onClose={() => setViewingAssignment(null)} 
      />
    </div>
  );
}
