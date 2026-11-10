import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './layouts/RequireAuth';
import { TabLayout } from './layouts/TabLayout';
import { CalendarPage } from './pages/CalendarPage/CalendarPage';
import { CapturePage } from './pages/CapturePage/CapturePage';
import { CoursesPage } from './pages/CoursesPage/CoursesPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { NoticeCapturePage } from './pages/NoticesPage/NoticeCapturePage';
import { NoticeDetailPage } from './pages/NoticeDetailPage/NoticeDetailPage';
import { NoticesPage } from './pages/NoticesPage/NoticesPage';
import { LoungeTab } from './pages/SpacesPage/LoungeTab';
import { RoomsTab } from './pages/SpacesPage/RoomsTab';
import { SpacesPage } from './pages/SpacesPage/SpacesPage';
import { TimetablePage } from './pages/TimetablePage/TimetablePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage mode="login" /> },
  { path: '/signup', element: <LoginPage mode="signup" /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <TabLayout />,
        children: [
          { path: '/', element: <CalendarPage /> },
          { path: '/timetable', element: <TimetablePage /> },
          {
            path: '/spaces',
            element: <SpacesPage />,
            children: [
              { index: true, element: <Navigate to="lounge" replace /> },
              { path: 'lounge', element: <LoungeTab /> },
              { path: 'rooms', element: <RoomsTab /> },
            ],
          },
          { path: '/notices', element: <NoticesPage /> },
        ],
      },
      { path: '/capture', element: <CapturePage /> },
      { path: '/courses', element: <CoursesPage /> },
      { path: '/notices/capture', element: <NoticeCapturePage /> },
      { path: '/notices/:id', element: <NoticeDetailPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
