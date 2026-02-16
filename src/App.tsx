import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/layouts/AppLayout';
import Actions from './pages/Actions';
import Meetings from './pages/Meetings';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Journal } from './pages/Journal';
import { Knowledge } from './pages/Knowledge';
import { Time } from './pages/Time';
import { CalendarView } from './features/calendar/CalendarView';
import SettingsPage from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return session ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="worksuite-theme">
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={
                            <PrivateRoute>
                                <AppLayout />
                            </PrivateRoute>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="calendar" element={<CalendarView />} />
                            <Route path="actions" element={<Actions />} />
                            <Route path="meetings" element={<Meetings />} />
                            <Route path="journal" element={<Journal />} />
                            <Route path="knowledge" element={<Knowledge />} />
                            <Route path="time" element={<Time />} />
                            <Route path="settings" element={<SettingsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}
