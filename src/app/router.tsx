import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/app/AppShell'
import { ConceptPage } from '@/pages/ConceptPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProblemPage } from '@/pages/ProblemPage'

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
        // The curriculum map moved onto the dashboard; keep old links working.
        path: 'progress',
        element: <Navigate replace to="/" />,
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
