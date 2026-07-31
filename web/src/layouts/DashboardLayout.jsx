import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Can } from '../components/Can';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Key,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users, permission: 'users.read' },
    { name: 'Roles', path: '/roles', icon: ShieldCheck, permission: 'roles.read' },
    { name: 'Permissions', path: '/permissions', icon: Key, permission: 'permissions.read' },
  ];

  const renderNavLinks = () => {
    return navItems.map((item) => {
      const link = (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand/10 text-brand'
                : 'text-secondary hover:bg-main'
            }`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          {item.name}
        </NavLink>
      );

      if (item.permission) {
        return (
          <Can key={item.name} permission={item.permission}>
            {link}
          </Can>
        );
      }
      return link;
    });
  };

  return (
    <div className="flex h-screen bg-main text-primary">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-xl font-bold text-brand">Rihala</span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {renderNavLinks()}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-1 justify-end items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-primary font-medium capitalize">
              {currentUser?.name}
            </div>
            <Button
              variant="ghostDanger"
              onClick={handleLogout}
              size="none"
              className="flex items-center text-sm font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
