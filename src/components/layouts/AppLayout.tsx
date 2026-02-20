import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
            <div className="print:hidden">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible print:h-auto">
                <div className="print:hidden">
                    <Navbar onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:h-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
