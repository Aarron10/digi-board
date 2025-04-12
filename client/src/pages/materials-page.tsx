import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ContentCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Material } from "@shared/schema";
import { format } from "date-fns";
import { 
  BookOpen, 
  Search, 
  FileIcon,
  Download,
  ExternalLink,
  Trash2
} from "lucide-react";
import { MaterialsSkeleton } from "@/components/ui/content-skeletons";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MaterialsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        await apiRequest("DELETE", `/api/materials/${id}`);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to delete material");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      deleteMaterialMutation.mutate(id);
    }
  };

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

  // Fetch materials
  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Extract unique categories for filtering
  const categories = materials
    ? ["all", ...new Set(materials.map(m => m.category).filter(Boolean) as string[])]
    : ["all"];

  // Filter and search materials
  const filteredMaterials = materials
    ? materials
        .filter(material => 
          categoryFilter === "all" || material.category === categoryFilter
        )
        .filter(material => 
          material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.category && material.category.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    : [];

  // Group materials by class
  const materialsByClass = filteredMaterials.reduce((acc, material) => {
    const classId = material.classId || "General";
    if (!acc[classId]) {
      acc[classId] = [];
    }
    acc[classId].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  const hasFilteredMaterials = Object.keys(materialsByClass).length > 0;

  // Mock file icon based on URL
  const getFileIcon = (fileUrl?: string) => {
    if (!fileUrl) return <FileIcon className="h-10 w-10 text-[#1976D2]" />;
    
    if (fileUrl.endsWith(".pdf")) {
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#F44336]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    } else if (fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx")) {
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1976D2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    } else if (fileUrl.endsWith(".ppt") || fileUrl.endsWith(".pptx")) {
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FF5722]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    }
    
    return <FileIcon className="h-10 w-10 text-[#1976D2]" />;
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
              Study Materials
            </h1>
            <p className="text-[#2C3E50]/70">
              {user?.role === "student" 
                ? "Access your study materials and resources"
                : "Manage and share educational resources"}
            </p>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/60 h-5 w-5" />
              <Input
                placeholder="Search materials..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={categoryFilter === category ? "default" : "outline"}
                  onClick={() => setCategoryFilter(category)}
                  className={categoryFilter === category ? "bg-[#1976D2]" : ""}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
            
            {(user?.role === "teacher" || user?.role === "admin") && (
              <Button 
                className="bg-[#1976D2] hover:bg-[#1976D2]/90"
                onClick={() => navigate("/create")}
              >
                Upload Material
              </Button>
            )}
          </div>

          {/* Materials List */}
          {isLoading ? (
            <MaterialsSkeleton />
          ) : !hasFilteredMaterials ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
              <BookOpen className="h-16 w-16 text-[#1976D2]/30 mb-4" />
              <h3 className="text-xl font-medium text-[#2C3E50] mb-2">No materials found</h3>
              <p className="text-[#2C3E50]/70 text-center max-w-md">
                {searchTerm
                  ? "No materials match your search criteria. Try a different search term."
                  : categoryFilter !== "all"
                  ? `No materials in category "${categoryFilter}" available. Try a different category.`
                  : "There are no study materials available at this time."}
              </p>
              {(user?.role === "teacher" || user?.role === "admin") && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/create")}
                >
                  Upload Material
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue={Object.keys(materialsByClass)[0]} className="w-full">
              <TabsList className="flex w-full overflow-x-auto">
                {Object.keys(materialsByClass).map((classId) => (
                  <TabsTrigger key={classId} value={classId} className="flex-shrink-0">
                    {classId}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(materialsByClass).map(([classId, materials]) => (
                <TabsContent key={classId} value={classId} className="mt-6">
                  <ContentCard title={`${classId} Materials`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materials.map((material) => (
                        <div key={material.id} className="card border border-gray-100 rounded-md p-4 hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex items-start mb-3">
                            <div className="mr-3">
                              {getFileIcon(material.fileUrl)}
                            </div>
                            <div>
                              <h4 className="font-medium text-[#2C3E50]">{material.title}</h4>
                              <p className="text-xs text-[#2C3E50]/60">
                                {format(new Date(material.uploadedAt), "MMM d, yyyy")}
                              </p>
                              {material.category && (
                                <span className="inline-block text-xs bg-[#1976D2]/10 text-[#1976D2] px-2 py-1 rounded-full mt-1">
                                  {material.category}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-[#2C3E50]/70 flex-grow mb-3">
                            {material.description}
                          </p>
                          
                          <div className="flex justify-between items-center mt-auto">
                            <span className="text-xs text-[#2C3E50]/60">
                              Added by Teacher
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-[#1976D2] hover:bg-[#1976D2]/90 flex items-center gap-1"
                                onClick={() => setViewingMaterial(material)}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                              {(user?.role === "teacher" || user?.role === "admin") && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                  onClick={() => handleDelete(material.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ContentCard>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>

      {/* File Viewer Dialog */}
      <FileViewerDialog 
        material={viewingMaterial} 
        onClose={() => setViewingMaterial(null)} 
      />
    </div>
  );
}
