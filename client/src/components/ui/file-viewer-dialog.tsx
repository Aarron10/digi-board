import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { Material } from "@shared/schema";

interface FileViewerDialogProps {
  material: Material | null;
  onClose: () => void;
}

export function FileViewerDialog({ material, onClose }: FileViewerDialogProps) {
  if (!material) return null;

  const handleDownload = () => {
    if (!material.fileUrl) return;
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = material.title + (material.fileUrl.split('.').pop() ? `.${material.fileUrl.split('.').pop()}` : '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilePreview = () => {
    if (!material.fileUrl) return null;

    const fileUrl = material.fileUrl;
    const fileType = fileUrl.split('.').pop()?.toLowerCase();

    // Function to get Google Docs Viewer URL
    const getGoogleDocsViewerUrl = (url: string) => {
      // Convert relative URL to absolute URL for Google Docs Viewer
      const absoluteUrl = new URL(url, window.location.origin).toString();
      return `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;
    };

    switch (fileType) {
      case 'pdf':
        return (
          <div className="flex flex-col h-[70vh]">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
            <iframe
              src={fileUrl}
              className="w-full flex-1 border-0"
              title={material.title}
            />
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <div className="flex flex-col h-[70vh]">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Image
              </Button>
            </div>
            <img
              src={fileUrl}
              alt={material.title}
              className="max-w-full flex-1 object-contain mx-auto"
            />
          </div>
        );
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
        return (
          <div className="flex flex-col h-[70vh]">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Document
              </Button>
            </div>
            <iframe
              src={getGoogleDocsViewerUrl(fileUrl)}
              className="w-full flex-1 border-0"
              title={material.title}
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <p className="text-lg text-gray-600 mb-4">
              Preview not available for this file type
            </p>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={!!material} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{material.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {getFilePreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 