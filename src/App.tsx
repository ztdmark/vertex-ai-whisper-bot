
import { ThemeProvider } from '@/components/theme-provider';
import { ProtectedRoute } from '@/components/protected-route';
import DashboardPage from '../app/dashboard/page';

function App() {
  return (
    <div className="h-screen bg-sidebar overflow-hidden">
      <ThemeProvider defaultTheme="dark" attribute="class">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </ThemeProvider>
    </div>
  );
}

export default App;
