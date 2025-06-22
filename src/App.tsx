import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import DashboardPage from '../app/dashboard/page';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="h-screen bg-sidebar overflow-hidden">
      <ThemeProvider defaultTheme="dark" attribute="class">
        <AuthProvider>
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
