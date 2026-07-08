import { BookOpen } from 'lucide-react'

import { Mdx } from '@/components/mdx/Mdx'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Lesson } from '@/curriculum/types'

type ConceptReferenceSheetProps = {
  lesson: Lesson
}

export function ConceptReferenceSheet({ lesson }: ConceptReferenceSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <BookOpen className="size-4" />
          Reference
        </Button>
      </SheetTrigger>
      <SheetContent className="left-auto right-0 w-[min(44rem,92vw)] max-w-[92vw] border-l border-r-0">
        <SheetHeader>
          <SheetTitle>{lesson.title}</SheetTitle>
          <SheetDescription>Concept reference</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <Mdx component={lesson.concept} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
