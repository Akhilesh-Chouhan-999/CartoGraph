import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from '../layouts/public-layout.js';
import { AuthLayout } from '../layouts/auth-layout.js';
import { DashboardLayout } from '../layouts/dashboard-layout.js';
import { ProtectedRoute, PublicRoute } from './protected-route.js';
import { LoadingState } from '../components/common/async-states.js';
import { HomePage } from '../pages/home/home-page.js';
import { AuthPage } from '../pages/auth/auth-page.js';
import { OAuthCallbackPage } from '../pages/auth/oauth-callback-page.js';
import { DashboardPage } from '../pages/dashboard/dashboard-page.js';
import { ProjectsPage } from '../pages/projects/projects-page.js';
import { ProjectDetailsPage } from '../pages/projects/project-details-page.js';
import { AnalysesPage } from '../pages/analyses/analyses-page.js';
import { AnalysisPage } from '../pages/analyses/analysis-page.js';
import { AnalysisProgressPage } from '../pages/analyses/analysis-progress-page.js';
import { FilesPage } from '../pages/files/files-page.js';
import { FileDetailsPage } from '../pages/files/file-details-page.js';
import { DependencyPathPage } from '../pages/graph/dependency-path-page.js';
import { BlastRadiusPage } from '../pages/graph/blast-radius-page.js';
import { ChatPage } from '../pages/chat/chat-page.js';
import { SettingsPage } from '../pages/settings/settings-page.js';

const GraphPage = lazy(() => import('../pages/graph/graph-page.js'));

export const appRouter = createBrowserRouter([
  { path: '/auth/callback', element: <OAuthCallbackPage /> },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [{ path: '/', element: <HomePage /> }],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <AuthPage mode="login" /> },
          { path: '/register', element: <AuthPage mode="register" /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
          { path: '/analyses', element: <AnalysesPage /> },
          { path: '/analyses/:analysisId', element: <AnalysisPage /> },
          { path: '/analyses/:analysisId/progress', element: <AnalysisProgressPage /> },
          {
            path: '/analyses/:analysisId/graph',
            element: (
              <Suspense fallback={<LoadingState label="Loading dependency graph" />}>
                <GraphPage />
              </Suspense>
            ),
          },
          { path: '/analyses/:analysisId/files', element: <FilesPage /> },
          { path: '/analyses/:analysisId/files/:fileId', element: <FileDetailsPage /> },
          { path: '/analyses/:analysisId/path', element: <DependencyPathPage /> },
          {
            path: '/analyses/:analysisId/files/:fileId/blast-radius',
            element: <BlastRadiusPage />,
          },
          { path: '/analyses/:analysisId/chat', element: <ChatPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
