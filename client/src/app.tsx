import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './context/auth-provider.js';
import { ThemeProvider } from './context/theme-provider.js';
import { appRouter } from './routes/app-router.js';

/**
 * Renders the app interface.
 */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={appRouter} />
      </AuthProvider>
    </ThemeProvider>
  );
}
