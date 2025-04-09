import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AnnouncementsPage from "@/pages/announcements-page";
import AssignmentsPage from "@/pages/assignments-page";
import MaterialsPage from "@/pages/materials-page";
import SchedulePage from "@/pages/schedule-page";
import UserManagementPage from "@/pages/user-management-page";
import CreateContentPage from "@/pages/create-content-page";
import ProfilePage from "@/pages/profile-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/announcements" component={AnnouncementsPage} />
      <ProtectedRoute path="/assignments" component={AssignmentsPage} />
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/users" component={UserManagementPage} />
      <ProtectedRoute path="/create" component={CreateContentPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-[#F5F7FA] text-[#2C3E50] antialiased flex flex-col">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
