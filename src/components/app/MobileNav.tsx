import { PanelLeft } from 'lucide-react'

import { PrimaryNavLinks, TrackNavList } from '@/components/app/ProgressSidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" type="button" variant="ghost">
          <PanelLeft className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Code Trainer</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate lessons, progress, and tracks.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="p-3">
          <PrimaryNavLinks />
          <div className="mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tracks
          </div>
          <TrackNavList className="mt-2" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
