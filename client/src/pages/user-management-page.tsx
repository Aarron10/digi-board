import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2, UserPlus, Search, Filter, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";

// Form schema for user creation/editing
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher", "admin"], {
    required_error: "Please select a role",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "teacher" | "admin">("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // If not admin, redirect to home
  if (user?.role !== "admin") {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

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

  // Form for adding users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "student",
    },
  });

  // Set up React Query client
  const queryClient = useQueryClient();
  
  // Define a type for the user without the password
  type UserWithoutPassword = Omit<User, "password">;
  
  // Fetch users
  const { data: users, isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User has been created successfully",
      });
      form.reset();
      setIsAddUserOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Filter and search users
  const filteredUsers = users
    ? users
        .filter(user => 
          roleFilter === "all" || user.role === roleFilter
        )
        .filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];

  // Handle creating a new user
  function onSubmit(data: UserFormValues) {
    createUser.mutate(data);
  }

  // User columns for the data table
  const userColumns = [
    {
      key: "name",
      header: "User",
      cell: (user: UserWithoutPassword) => (
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm mr-3 ${
            user.role === "admin" 
              ? "bg-[#1976D2]" 
              : user.role === "teacher" 
              ? "bg-[#FF5722]" 
              : "bg-[#4CAF50]"
          }`}>
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
        <span className={`inline-block text-xs px-2 py-1 rounded-full ${
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
      cell: (user: UserWithoutPassword) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => handleEditUser(user)}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1 text-[#F44336] hover:text-[#F44336] hover:bg-[#F44336]/10"
            onClick={() => handleDeleteUser(user)}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // State for delete confirmation
  const [userToDelete, setUserToDelete] = useState<UserWithoutPassword | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for editing users
  const [userToEdit, setUserToEdit] = useState<UserWithoutPassword | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Edit form
  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "student",
    }
  });
  
  // Reset edit form when userToEdit changes
  useEffect(() => {
    if (userToEdit) {
      editForm.reset({
        name: userToEdit.name,
        username: userToEdit.username,
        password: "", // Don't show the actual password
        role: userToEdit.role,
      });
    }
  }, [userToEdit, editForm]);
  
  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User has been updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Handle edit user 
  const handleEditUser = (user: UserWithoutPassword) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: UserWithoutPassword) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle submit for edit form
  const onEditSubmit = (data: UserFormValues) => {
    if (!userToEdit) return;
    
    // Only include password if it was changed
    const userData: Partial<UserFormValues> = {
      name: data.name,
      username: data.username,
      role: data.role
    };
    
    // Only include password if it was provided
    if (data.password.trim() !== "") {
      userData.password = data.password;
    }
    
    updateUser.mutate({ id: userToEdit.id, userData });
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
        
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Leave blank to keep current password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#1976D2]">
                    {updateUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete User Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-[#F44336]">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                {userToDelete && (
                  <div>
                    <p>Are you sure you want to delete the user:</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{userToDelete.name}</p>
                      <p className="text-sm text-gray-500">@{userToDelete.username}</p>
                      <p className="text-sm text-gray-500 capitalize">Role: {userToDelete.role}</p>
                    </div>
                    <p className="mt-2">This action cannot be undone. The user will be permanently removed from the system.</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#F44336] hover:bg-[#F44336]/90"
                onClick={() => userToDelete && deleteUser.mutate(userToDelete.id)}
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] font-['Inter']">
              User Management
            </h1>
            <p className="text-[#2C3E50]/70">
              Manage system users and permissions
            </p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-[#2C3E50]/70">Total Users</div>
                <div className="text-2xl font-bold text-[#2C3E50]">{users?.length || 0}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#1976D2]/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-[#1976D2]" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-[#2C3E50]/70">Students</div>
                <div className="text-2xl font-bold text-[#4CAF50]">
                  {users?.filter(u => u.role === "student").length || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-[#2C3E50]/70">Teachers</div>
                <div className="text-2xl font-bold text-[#FF5722]">
                  {users?.filter(u => u.role === "teacher").length || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF5722]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-[#2C3E50]/70">Administrators</div>
                <div className="text-2xl font-bold text-[#1976D2]">
                  {users?.filter(u => u.role === "admin").length || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#1976D2]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1976D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/60 h-5 w-5" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                onClick={() => setRoleFilter("all")}
                className={roleFilter === "all" ? "bg-[#1976D2]" : ""}
              >
                All
              </Button>
              <Button
                variant={roleFilter === "student" ? "default" : "outline"}
                onClick={() => setRoleFilter("student")}
                className={roleFilter === "student" ? "bg-[#4CAF50]" : ""}
              >
                Students
              </Button>
              <Button
                variant={roleFilter === "teacher" ? "default" : "outline"}
                onClick={() => setRoleFilter("teacher")}
                className={roleFilter === "teacher" ? "bg-[#FF5722]" : ""}
              >
                Teachers
              </Button>
              <Button
                variant={roleFilter === "admin" ? "default" : "outline"}
                onClick={() => setRoleFilter("admin")}
                className={roleFilter === "admin" ? "bg-[#1976D2]" : ""}
              >
                Admins
              </Button>
            </div>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1976D2] hover:bg-[#1976D2]/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with specific role and permissions.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter user's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddUserOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1976D2]">
                        Create User
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <ContentCard title="System Users">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#1976D2]" />
              </div>
            ) : (
              <DataTable
                data={filteredUsers}
                columns={userColumns}
                emptyState={
                  <div className="flex flex-col items-center justify-center h-64">
                    <UserPlus className="h-16 w-16 text-[#1976D2]/30 mb-4" />
                    <h3 className="text-xl font-medium text-[#2C3E50] mb-2">No users found</h3>
                    <p className="text-[#2C3E50]/70 text-center max-w-md">
                      {searchTerm
                        ? "No users match your search criteria. Try a different search term."
                        : roleFilter !== "all"
                        ? `No ${roleFilter}s found. Try a different filter.`
                        : "There are no users in the system yet."}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsAddUserOpen(true)}
                    >
                      Add User
                    </Button>
                  </div>
                }
              />
            )}
          </ContentCard>
        </main>
      </div>
    </div>
  );
}
