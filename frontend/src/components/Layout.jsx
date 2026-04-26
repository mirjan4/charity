import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    Menu,
    X,
    LogOut,
    Wallet,
    Package,
    ChevronRight,
    Zap,
    History
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
 
export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, user } = useAuth();
 
    const adminNav = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Executives', href: '/executives', icon: Users },
        { name: 'Central Store', href: '/store', icon: Package },
        { name: 'Fund Management', href: '/pf', icon: Wallet },
        { name: 'Reports', href: '/reports', icon: FileText },
    ];
 
    const executiveNav = [
        { name: 'My Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Collections History', href: '/history', icon: History },
        { name: 'Reports', href: '/reports', icon: FileText },
    ];
 
    const baseNav = user?.role === 'admin' ? adminNav : executiveNav;
    const navigation = [
        ...baseNav,
        { name: 'My Profile', href: '/profile', icon: Settings }
    ];
 
    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    };
 
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
 
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl shadow-slate-900/10 lg:static lg:translate-x-0
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full relative">
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                    
                    {/* Logo Area */}
                    <div className="relative flex items-center justify-between h-20 px-6 border-b border-slate-200/80 bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            {/* Logo Icon */}
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur opacity-30"></div>
                            </div>
                            <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Markaz FR
                                </span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finance Portal</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>
 
                    {/* Navigation */}
                    <nav className="relative flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item, index) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className={`
                                        group flex items-center justify-between px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200
                                        ${active
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 hover:scale-[1.01]'
                                        }
                                    `}
                                >
                                    <div className="flex items-center">
                                        <div className={`
                                            p-2 rounded-lg transition-all duration-200
                                            ${active 
                                                ? 'bg-white/20' 
                                                : 'bg-slate-100 group-hover:bg-slate-200'
                                            }
                                        `}>
                                            <item.icon
                                                className={`h-5 w-5 transition-colors ${
                                                    active 
                                                        ? 'text-white' 
                                                        : 'text-slate-600 group-hover:text-slate-700'
                                                }`}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                        <span className="ml-3">{item.name}</span>
                                    </div>
                                    {active && (
                                        <ChevronRight className="w-4 h-4 text-white" strokeWidth={3} />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
 
                    {/* User Profile / Logout */}
                    <div className="relative p-4 border-t border-slate-200/80 bg-white/50 backdrop-blur-sm">
                        {/* User Card */}
                        <div className="relative overflow-hidden p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl mb-3 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10 flex items-center">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-blue-500/30 text-lg">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="ml-4 overflow-hidden flex-1">
                                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`
                                            px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider
                                            ${user?.role === 'admin' 
                                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                            }
                                        `}>
                                            {user?.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
 
                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="w-full group flex items-center justify-center px-4 py-3 text-sm font-bold text-rose-600 hover:text-white bg-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-600 rounded-xl transition-all duration-300 border-2 border-rose-200 hover:border-rose-600 shadow-sm hover:shadow-lg hover:shadow-rose-500/30"
                        >
                            <LogOut className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
 
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 h-16 shadow-lg shadow-slate-900/5 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-slate-600 hover:bg-slate-100 p-2.5 rounded-xl transition-colors hover:scale-105 active:scale-95"
                        >
                            <Menu size={22} strokeWidth={2.5} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Markaz FR
                            </span>
                        </div>
                    </div>
                    
                    {/* Mobile User Avatar */}
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold uppercase shadow-md text-sm">
                        {user?.name?.charAt(0)}
                    </div>
                </header>
 
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
 
                {/* Footer */}
                <footer className="hidden lg:block bg-white/80 backdrop-blur-sm border-t border-slate-200/80 py-4 px-8">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <p className="font-medium">
                            &copy; {new Date().getFullYear()} FR MARKAZ. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <button className="hover:text-slate-700 transition-colors font-medium">Privacy Policy</button>
                            <button className="hover:text-slate-700 transition-colors font-medium">Terms of Service</button>
                            <button className="hover:text-slate-700 transition-colors font-medium">Help & Support</button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}