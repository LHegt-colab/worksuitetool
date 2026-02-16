import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';
import Actions from './pages/Actions';
import ActionDetail from './pages/ActionDetail';
import Journal from './pages/Journal';
import JournalExport from './pages/JournalExport';
import Knowledge from './pages/Knowledge';
import KnowledgeDetail from './pages/KnowledgeDetail';
import Settings from './pages/Settings';
import GlobalLabels from './pages/GlobalLabels';
import TimeManagement from './pages/TimeManagement';
import Calendar from './pages/Calendar';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return session ? (
    <AppLayout>
      {children}
    </AppLayout>
  ) : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/meetings"
              element={
                <PrivateRoute>
                  <Meetings />
                </PrivateRoute>
              }
            />
            <Route
              path="/meetings/:id"
              element={
                <PrivateRoute>
                  <MeetingDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/actions"
              element={
                <PrivateRoute>
                  <Actions />
                </PrivateRoute>
              }
            />
            <Route
              path="/actions/:id"
              element={
                <PrivateRoute>
                  <ActionDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <PrivateRoute>
                  <Journal />
                </PrivateRoute>
              }
            />
            <Route
              path="/journal/export"
              element={
                <PrivateRoute>
                  <JournalExport />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <PrivateRoute>
                  <Knowledge />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge/:id"
              element={
                <PrivateRoute>
                  <KnowledgeDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/labels"
              element={
                <PrivateRoute>
                  <GlobalLabels />
                </PrivateRoute>
              }
            />
            <Route
              path="/time"
              element={
                <PrivateRoute>
                  <TimeManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              }
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
