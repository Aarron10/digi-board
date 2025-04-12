import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Redirect, useLocation } from "wouter";
import { 
  Bell, 
  FileText, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Upload, 
  Clock
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  insertAnnouncementSchema,
  insertAssignmentSchema,
  insertMaterialSchema,
  insertEventSchema,
  materials,
  events
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type MaterialFormData = {
  title: string;
  description: string;
  fileUpload?: File;
  classId?: string;
  category?: string;
};

export default function CreateContentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not teacher or admin, redirect to home
  if (user?.role !== "teacher" && user?.role !== "admin") {
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

  // Announcement form schema
  const announcementFormSchema = insertAnnouncementSchema.extend({
    authorId: z.number().optional(), // Will be set from the user context
  });

  // Assignment form schema
  const assignmentFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    dueDate: z.date({
      required_error: "Due date is required",
      invalid_type_error: "Invalid date format",
    }),
    dueTime: z.string().min(1, "Due time is required"),
    classId: z.string().optional(),
    status: z.string().optional(),
  });

  // Material form schema
  const materialFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    fileUpload: z.instanceof(File, { message: "File is required" }),
    classId: z.string().optional(),
    category: z.string().optional(),
  });

  // Event form schema types
  interface EventFormValues {
    title: string;
    description: string;
    startDate: Date | null;
    startTime: string;
    endDate: Date | null;
    endTime: string;
    location: string;
    createdBy?: number;
    important: boolean;
    category: string;
  }

  // Event form schema
  const eventFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    startDate: z.date({
      required_error: "Start date is required",
      invalid_type_error: "Invalid start date",
    }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    endDate: z.date({
      required_error: "End date is required",
      invalid_type_error: "Invalid end date",
    }),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    location: z.string().optional(),
    createdBy: z.number().optional(),
    important: z.boolean().default(false),
    category: z.string().optional(),
  });

  // Forms
  const announcementForm = useForm<z.infer<typeof announcementFormSchema>>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      important: false,
      category: "",
      audience: "",
    },
  });

  const assignmentForm = useForm<z.infer<typeof assignmentFormSchema>>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      status: "active",
      dueTime: "23:59",
      dueDate: new Date(), // Set default to current date
    },
  });

  const materialForm = useForm<z.infer<typeof materialFormSchema>>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      fileUpload: undefined,
      classId: "",
      category: "",
    },
  });

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: null,
      startTime: "09:00",
      endDate: null,
      endTime: "10:00",
      location: "",
      important: false,
      category: "",
    },
  });

  // Class options for dropdown
  const classOptions = [
    "Math 101",
    "Science 110",
    "English 202",
    "History 105",
    "Computer Science 301",
    "Physics 201",
    "All Classes",
  ];

  // Form submission handlers
  async function onAnnouncementSubmit(data: z.infer<typeof announcementFormSchema>) {
    try {
      setIsSubmitting(true);
      // Add authorId from user context
      const announcementData = {
        ...data,
        authorId: user?.id as number,
      };
      
      // Make real API call
      await apiRequest("POST", "/api/announcements", announcementData);
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      
      toast({
        title: "Success",
        description: "Announcement has been created",
      });
      
      announcementForm.reset();
      navigate("/announcements");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create announcement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const onAssignmentSubmit = async (values: z.infer<typeof assignmentFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Format the due date and time
      const dueDateTime = new Date(values.dueDate);
      const [hours, minutes] = values.dueTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      // Prepare the assignment data
      const { dueTime, ...assignmentData } = {
        ...values,
        dueDate: dueDateTime.toISOString(),
        teacherId: user?.id,
        status: values.status || "active",
      };
      
      // Make the API request
      await apiRequest("POST", "/api/assignments", assignmentData);
      
      // Show success message
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      
      // Reset the form
      assignmentForm.reset();
      
      // Invalidate the assignments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMaterialSubmit = async (data: z.infer<typeof materialFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (!data.fileUpload) {
        throw new Error("Please select a file to upload");
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("file", data.fileUpload);
      if (data.classId) {
        formData.append("classId", data.classId);
      }
      if (data.category) {
        formData.append("category", data.category);
      }

      console.log("Submitting material data:", {
        title: data.title,
        description: data.description,
        file: {
          name: data.fileUpload.name,
          type: data.fileUpload.type,
          size: data.fileUpload.size
        },
        classId: data.classId,
        category: data.category
      });

      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      let responseData;
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        console.error("Server error response:", responseData);
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        if (responseData.message) {
          throw new Error(responseData.message);
        }
        if (responseData.details) {
          throw new Error(responseData.details);
        }
        throw new Error("Failed to create material");
      }

      toast({
        title: "Success",
        description: "Material created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      materialForm.reset();
    } catch (error) {
      console.error("Error creating material:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create material",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onEventSubmit(data: EventFormValues) {
    try {
      setIsSubmitting(true);
      
      if (!data.startDate || !data.endDate) {
        throw new Error("Start date and end date are required");
      }
      
      // Combine date and time for start
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
      
      // Combine date and time for end
      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date or time format");
      }
      
      if (endDateTime < startDateTime) {
        throw new Error("End date/time must be after start date/time");
      }
      
      // Add createdBy from user context and ensure dates are in ISO format
      const eventData = {
        title: data.title,
        description: data.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: data.location || null,
        createdBy: user?.id as number,
        important: data.important || false,
        category: data.category || null,
      };
      
      console.log('Sending event data:', eventData);
      
      // Make real API call
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      console.log('Response status:', response.status);
      
      let responseData;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create event';
        if (responseData?.message) {
          errorMessage = responseData.message;
        }
        if (responseData?.errors) {
          console.error('Validation errors:', responseData.errors);
          errorMessage += ': ' + JSON.stringify(responseData.errors);
        }
        if (responseData?.details) {
          console.error('Error details:', responseData.details);
        }
        throw new Error(errorMessage);
      }
      
      // Invalidate the events query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      eventForm.reset();
      navigate("/schedule");
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Form field components
  const DateInput = ({ 
    value, 
    onChange, 
    onBlur, 
    name, 
    ref 
  }: { 
    value: Date | null; 
    onChange: (value: Date) => void; 
    onBlur: () => void; 
    name: string; 
    ref: React.Ref<any>; 
  }) => {
    const dateValue = value instanceof Date 
      ? value.toISOString().split('T')[0]
      : '';
    
    return (
      <Input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(new Date(e.target.value))}
        onBlur={onBlur}
        name={name}
        ref={ref}
      />
    );
  };

  const TimeInput = ({ 
    value, 
    onChange, 
    onBlur, 
    name, 
    ref 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    onBlur: () => void; 
    name: string; 
    ref: React.Ref<any>; 
  }) => (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      name={name}
      ref={ref}
    />
  );

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
              Create Content
            </h1>
            <p className="text-[#2C3E50]/70">
              Create and publish new content for your students
            </p>
          </div>

          <Tabs defaultValue="announcement" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="announcement" className="flex items-center gap-2">
                <span>Announcement</span>
              </TabsTrigger>
              <TabsTrigger value="assignment" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Assignment</span>
              </TabsTrigger>
              <TabsTrigger value="material" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Study Material</span>
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Event</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Announcement Form */}
            <TabsContent value="announcement">
              <ContentCard title="Create New Announcement">
                <Form {...announcementForm}>
                  <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-6">
                    <FormField
                      control={announcementForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Announcement Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={announcementForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter announcement content" 
                              className="min-h-[150px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={announcementForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Academic, Event, Notice" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormDescription>
                              Categorize your announcement for better organization
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={announcementForm.control}
                        name="audience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Audience</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="All Students">All Students</SelectItem>
                                <SelectItem value="Faculty">Faculty</SelectItem>
                                <SelectItem value="Parents">Parents</SelectItem>
                                <SelectItem value="All">Everyone</SelectItem>
                                {classOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Who should see this announcement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={announcementForm.control}
                      name="important"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Mark as important</FormLabel>
                            <FormDescription>
                              Important announcements are highlighted and shown at the top
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => announcementForm.reset()}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Publishing..." : "Publish Announcement"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </ContentCard>
            </TabsContent>
            
            {/* Assignment Form */}
            <TabsContent value="assignment">
              <ContentCard title="Create New Assignment">
                <Form {...assignmentForm}>
                  <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-6">
                    <FormField
                      control={assignmentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={assignmentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter assignment description and instructions" 
                              className="min-h-[150px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={assignmentForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Which class is this assignment for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={assignmentForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Draft assignments are not visible to students
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={assignmentForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={assignmentForm.control}
                        name="dueTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Time</FormLabel>
                            <FormControl>
                              <TimeInput 
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormDescription>
                              The time when the assignment is due
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => assignmentForm.reset()}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Assignment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </ContentCard>
            </TabsContent>
            
            {/* Study Material Form */}
            <TabsContent value="material">
              <ContentCard title="Upload Study Material">
                <Form {...materialForm}>
                  <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="space-y-6">
                    <FormField
                      control={materialForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={materialForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter material description" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={materialForm.control}
                      name="fileUpload"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File</FormLabel>
                          <FormControl>
                            <div 
                              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#1976D2] transition-colors"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) {
                                  field.onChange(file);
                                  toast({
                                    title: "File ready for upload",
                                    description: `${file.name} has been selected for upload`,
                                    variant: "default",
                                  });
                                }
                              }}
                              onDragOver={(e) => e.preventDefault()}
                            >
                              <Upload className="h-8 w-8 mx-auto text-[#1976D2]/50 mb-2" />
                              <p className="text-[#2C3E50]">Drag and drop files here, or click to browse</p>
                              <p className="text-[#2C3E50]/60 text-sm mt-1">Supports PDF, DOC, PPT, and other document formats</p>
                              {field.value && (
                                <div className="mt-4 p-2 bg-[#1976D2]/10 rounded-md">
                                  <p className="text-[#1976D2] font-medium">Selected file: {field.value.name}</p>
                                  <p className="text-[#2C3E50]/60 text-sm">{(field.value.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              )}
                              <Input 
                                type="file" 
                                className="hidden" 
                                id="file-upload" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    field.onChange(file);
                                    toast({
                                      title: "File ready for upload",
                                      description: `${file.name} has been selected for upload`,
                                      variant: "default",
                                    });
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={materialForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Which class is this material for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={materialForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                                <SelectItem value="Reference Material">Reference Material</SelectItem>
                                <SelectItem value="Practice Exercises">Practice Exercises</SelectItem>
                                <SelectItem value="Reading Material">Reading Material</SelectItem>
                                <SelectItem value="Supplementary">Supplementary</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Categorize your material
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => materialForm.reset()}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Uploading..." : "Upload Material"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </ContentCard>
            </TabsContent>
            
            {/* Event Form */}
            <TabsContent value="event">
              <ContentCard title="Create New Event">
                <Form {...eventForm}>
                  <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-6">
                    <FormField
                      control={eventForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter event description" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event location" {...field} />
                          </FormControl>
                          <FormDescription>
                            Where will the event take place
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Start Date & Time</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={eventForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <DateInput 
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={eventForm.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                  <TimeInput 
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">End Date & Time</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={eventForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <DateInput 
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={eventForm.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                  <TimeInput 
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={eventForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="Extracurricular">Extracurricular</SelectItem>
                                <SelectItem value="Meeting">Meeting</SelectItem>
                                <SelectItem value="Exam">Exam</SelectItem>
                                <SelectItem value="Holiday">Holiday</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Categorize your event
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={eventForm.control}
                        name="important"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark as important</FormLabel>
                              <FormDescription>
                                Important events are highlighted in the calendar
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => eventForm.reset()}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </ContentCard>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
