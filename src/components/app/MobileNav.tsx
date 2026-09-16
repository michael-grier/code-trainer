import { PanelLeft } from 'lucide-react'

import { SidebarNav } from '@/components/app/Sidebar'
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
            Navigate the dashboard, tracks, and lessons.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}
