import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Assignment } from "@shared/schema";
import { format } from "date-fns";

interface AssignmentViewerDialogProps {
  assignment: Assignment | null;
  onClose: () => void;
}

export function AssignmentViewerDialog({ assignment, onClose }: AssignmentViewerDialogProps) {
  if (!assignment) return null;

  return (
    <Dialog open={!!assignment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{assignment.title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#2C3E50]/70">Description</h3>
            <p className="text-[#2C3E50] whitespace-pre-wrap">{assignment.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#2C3E50]/70">Due Date</h3>
              <p className="text-[#2C3E50]">
                {format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#2C3E50]/70">Status</h3>
              <p className="text-[#2C3E50] capitalize">{assignment.status}</p>
            </div>
          </div>
          
          {assignment.classId && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#2C3E50]/70">Class</h3>
              <p className="text-[#2C3E50]">{assignment.classId}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 