import { Skeleton } from 'invoyr';

export const TextLines = () => (
  <div className="flex flex-col gap-2 w-64">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="h-4 w-3/5" />
  </div>
);

export const InvoiceCard = () => (
  <div className="flex flex-col gap-3 w-64 p-4 border rounded-lg">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-3 w-44" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
);
