import { Card, CardHeader, CardFooter } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function CourseCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardFooter className="pt-0">
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  )
}
