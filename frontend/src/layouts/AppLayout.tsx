import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/layouts/Navbar";
import { Sidebar } from "@/layouts/Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl animate-fade-in p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
