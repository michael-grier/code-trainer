import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/app/AppShell'
import { ConceptPage } from '@/pages/ConceptPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProblemPage } from '@/pages/ProblemPage'
import { ProgressPage } from '@/pages/ProgressPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: 'lesson/:slug',
        element: <ConceptPage />,
      },
      {
        path: 'lesson/:slug/problem/:problemId',
        element: <ProblemPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

