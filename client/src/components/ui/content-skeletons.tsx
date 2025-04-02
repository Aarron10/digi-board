import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard, DashboardCard } from "@/components/ui/dashboard-card";

export function AnnouncementSkeleton() {
  return (
    <ContentCard
      title=""
      className="border border-gray-100"
    >
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex justify-end mt-4">
        <Skeleton className="h-8 w-16" />
      </div>
    </ContentCard>
  );
}

export function AssignmentSkeleton() {
  return (
    <ContentCard title="">
      <div className="overflow-hidden">
        <div className="rounded-md -mx-4 border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="h-10 px-2 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-16" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 bg-white">
                    <td className="p-2 align-middle">
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-2 align-middle">
                      <Skeleton className="h-8 w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}

export function MaterialCardSkeleton() {
  return (
    <div className="card border border-gray-100 rounded-md p-4 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start mb-3">
        <Skeleton className="h-10 w-10 mr-3" />
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex justify-between items-center mt-auto">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function MaterialsSkeleton() {
  return (
    <ContentCard title="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <MaterialCardSkeleton key={index} />
        ))}
      </div>
    </ContentCard>
  );
}

export function DashboardCardSkeleton({ variant = "default" }: { variant?: "primary" | "secondary" | "accent" | "default" }) {
  const variantStyles = {
    primary: "bg-[#1976D2]/10 border-l-4 border-[#1976D2]",
    secondary: "bg-[#4CAF50]/10 border-l-4 border-[#4CAF50]",
    accent: "bg-[#FF5722]/10 border-l-4 border-[#FF5722]",
    default: "bg-white",
  };

  return (
    <div className={`card p-6 rounded-md shadow-sm ${variantStyles[variant]}`}>
      <Skeleton className="h-5 w-32 mb-1" />
      <Skeleton className="h-4 w-48 mb-4" />
      <Skeleton className="h-8 w-20 mt-4" />
    </div>
  );
}