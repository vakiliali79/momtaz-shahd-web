import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-6 sm:py-10">
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-64 max-w-full rounded-full" />
        </div>
      </div>
    </Container>
  );
}
