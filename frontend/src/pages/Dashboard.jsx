import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../lib/api";
import {
    Users,
    Banknote,
    TrendingUp,
    CreditCard,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Sparkles,
    ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
 
export default function Dashboard() {
    const [stats, setStats] = useState({
        totalExecutives: 0,
        activeExecutives: 0,
        monthCollection: 0,
        prevMonthCollection: 0,
        monthExpense: 0,
        monthAttendance: 0,
        collectionDifference: 0,
        monthBreakdown: { charity: 0, orphanage: 0, khidma: 0 },
        todayBreakdown: { charity: 0, orphanage: 0, khidma: 0, total: 0, charityExp: 0, orphanageExp: 0, khidmaExp: 0, totalExp: 0 }
    });
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const { data } = await api.get('/dashboard');
                setStats(prev => ({
                    ...prev,
                    ...data
                }));
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        }
 
        fetchStats();
    }, []);
 
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent absolute top-0"></div>
                </div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard...</p>
            </div>
        );
    }
 
    const monthCollection = Number(stats.monthCollection ?? 0);
    const monthExpense = Number(stats.monthExpense ?? 0);
    const monthAttendance = Number(stats.monthAttendance ?? 0);
    const activeExecutives = Number(stats.activeExecutives ?? 0);
    const collectionDifference = Number(stats.collectionDifference ?? 0);
    const prevMonthCollection = Number(stats.prevMonthCollection ?? 0);
    const monthBreakdown = {
        charity: Number(stats.monthBreakdown?.charity ?? 0),
        orphanage: Number(stats.monthBreakdown?.orphanage ?? 0),
        khidma: Number(stats.monthBreakdown?.khidma ?? 0),
    };
    const isPositiveTrend = collectionDifference >= 0;
 
    const cards = [
        {
            title: "Month Collection",
            value: `₹${monthCollection.toLocaleString()}`,
            icon: Banknote,
            color: "text-emerald-600",
            bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
            iconBg: "bg-emerald-500",
            desc: "Total incoming this month",
            trend: "up",
            borderColor: "border-emerald-200"
        },
        {
            title: "Month Expenses",
            value: `₹${monthExpense.toLocaleString()}`,
            icon: CreditCard,
            color: "text-rose-600",
            bg: "bg-gradient-to-br from-rose-50 to-rose-100/50",
            iconBg: "bg-rose-500",
            desc: "Total paid out this month",
            trend: "down",
            borderColor: "border-rose-200"
        },
        {
            title: "Executive Attendance",
            value: monthAttendance,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
            iconBg: "bg-blue-500",
            desc: `/ ${activeExecutives} active staff`,
            trend: "neutral",
            borderColor: "border-blue-200"
        },
        {
            title: "Vs Last Month",
            value: `${isPositiveTrend ? '+' : ''}₹${Math.abs(collectionDifference).toLocaleString()}`,
            icon: isPositiveTrend ? TrendingUp : Activity,
            color: isPositiveTrend ? "text-emerald-600" : "text-rose-600",
            bg: isPositiveTrend ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50" : "bg-gradient-to-br from-rose-50 to-rose-100/50",
            iconBg: isPositiveTrend ? "bg-emerald-500" : "bg-rose-500",
            desc: `Last Month: ₹${prevMonthCollection.toLocaleString()}`,
            trend: isPositiveTrend ? "up" : "down",
            borderColor: isPositiveTrend ? "border-emerald-200" : "border-rose-200"
        }
    ];
 
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl shadow-blue-500/20">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Dashboard</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Financial Overview</h1>
                        <p className="text-blue-100 text-sm md:text-base font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Real-time insights for <span className="font-bold text-white">{format(new Date(), "MMMM yyyy")}</span>
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 min-w-[180px]">
                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest block mb-1">Today's Date</span>
                        <div className="text-2xl font-bold text-white">{format(new Date(), "dd MMM yyyy")}</div>
                    </div>
                </div>
            </div>
 
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div 
                        key={index} 
                        className={`relative overflow-hidden rounded-2xl ${card.bg} border-2 ${card.borderColor} p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{card.title}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">
                                        {card.value}
                                    </h3>
                                </div>
                                <div className={`${card.iconBg} p-3 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                    <card.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-medium">{card.desc}</span>
                                <div className="flex items-center gap-1">
                                    {card.trend === 'up' && (
                                        <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-full">
                                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700">Up</span>
                                        </div>
                                    )}
                                    {card.trend === 'down' && (
                                        <div className="flex items-center gap-1 bg-rose-100 px-2 py-1 rounded-full">
                                            <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                            <span className="text-xs font-bold text-rose-700">Down</span>
                                        </div>
                                    )}
                                    {card.trend === 'neutral' && (
                                        <div className="bg-slate-100 p-1.5 rounded-full">
                                            <Activity className="w-3 h-3 text-slate-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Month Category Breakdown */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                                <PieChart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Monthly Category Split</h3>
                                <p className="text-sm text-slate-500">Distribution breakdown</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">Incoming</span>
                    </div>
 
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <div className="absolute right-0 top-0 w-20 h-20 bg-orange-200/40 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-2">Orphanage</p>
                                <p className="text-2xl font-bold text-slate-900">₹{monthBreakdown.orphanage.toLocaleString()}</p>
                                <p className="text-xs text-orange-600 font-medium mt-2">
                                    {((monthBreakdown.orphanage / (monthCollection || 1) * 100) || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <div className="absolute right-0 top-0 w-20 h-20 bg-purple-200/40 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2">Charity</p>
                                <p className="text-2xl font-bold text-slate-900">₹{monthBreakdown.charity.toLocaleString()}</p>
                                <p className="text-xs text-purple-600 font-medium mt-2">
                                    {((monthBreakdown.charity / (monthCollection || 1) * 100) || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-2 border-cyan-200 overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <div className="absolute right-0 top-0 w-20 h-20 bg-cyan-200/40 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-cyan-700 uppercase tracking-widest mb-2">Khidma</p>
                                <p className="text-2xl font-bold text-slate-900">₹{monthBreakdown.khidma.toLocaleString()}</p>
                                <p className="text-xs text-cyan-600 font-medium mt-2">
                                    {((monthBreakdown.khidma / (monthCollection || 1) * 100) || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
 
                    {/* Progress Visual */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-700">Distribution</span>
                            <span className="text-xs font-medium text-slate-500">100%</span>
                        </div>
                        <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                            <div 
                                style={{ width: `${(stats.monthBreakdown.orphanage / stats.monthCollection * 100) || 0}%` }} 
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 hover:from-orange-500 hover:to-orange-600" 
                                title={`Orphanage: ${((stats.monthBreakdown.orphanage / stats.monthCollection * 100) || 0).toFixed(1)}%`}
                            ></div>
                            <div 
                                style={{ width: `${(stats.monthBreakdown.charity / stats.monthCollection * 100) || 0}%` }} 
                                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-500 hover:from-purple-500 hover:to-purple-600" 
                                title={`Charity: ${((stats.monthBreakdown.charity / stats.monthCollection * 100) || 0).toFixed(1)}%`}
                            ></div>
                            <div 
                                style={{ width: `${(stats.monthBreakdown.khidma / stats.monthCollection * 100) || 0}%` }} 
                                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500 hover:from-cyan-500 hover:to-cyan-600" 
                                title={`Khidma: ${((stats.monthBreakdown.khidma / stats.monthCollection * 100) || 0).toFixed(1)}%`}
                            ></div>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500"></div>
                                <span className="text-xs font-medium text-slate-600">Orphanage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                                <span className="text-xs font-medium text-slate-600">Charity</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500"></div>
                                <span className="text-xs font-medium text-slate-600">Khidma</span>
                            </div>
                        </div>
                    </div>
                </div>
 
                {/* Today's Breakdown */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 border border-slate-700">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Today's Activity</h3>
                                    <p className="text-slate-400 text-xs font-medium">{format(new Date(), "EEEE, dd MMM yyyy")}</p>
                                </div>
                            </div>
                        </div>
 
                        <div className="p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/30 backdrop-blur-sm">
                                    <span className="block text-xs text-emerald-300 font-bold uppercase tracking-wider mb-1">Collection</span>
                                    <span className="text-2xl font-bold text-white">₹{stats.todayBreakdown.total.toLocaleString()}</span>
                                </div>
                                <div className="bg-gradient-to-br from-rose-500/20 to-red-600/20 rounded-xl p-4 border border-rose-500/30 backdrop-blur-sm">
                                    <span className="block text-xs text-rose-300 font-bold uppercase tracking-wider mb-1">Expense</span>
                                    <span className="text-2xl font-bold text-white">₹{stats.todayBreakdown.totalExp.toLocaleString()}</span>
                                </div>
                            </div>
 
                            {/* Category Breakdown */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                        <span className="text-sm text-slate-300 font-medium">Orphanage</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white">₹{stats.todayBreakdown.orphanage.toLocaleString()}</span>
                                        {stats.todayBreakdown.orphanageExp > 0 && (
                                            <span className="text-xs text-rose-400 font-medium">-₹{stats.todayBreakdown.orphanageExp.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                        <span className="text-sm text-slate-300 font-medium">Charity</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white">₹{stats.todayBreakdown.charity.toLocaleString()}</span>
                                        {stats.todayBreakdown.charityExp > 0 && (
                                            <span className="text-xs text-rose-400 font-medium">-₹{stats.todayBreakdown.charityExp.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                                        <span className="text-sm text-slate-300 font-medium">Khidma</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white">₹{stats.todayBreakdown.khidma.toLocaleString()}</span>
                                        {stats.todayBreakdown.khidmaExp > 0 && (
                                            <span className="text-xs text-rose-400 font-medium">-₹{stats.todayBreakdown.khidmaExp.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
 
                        <div className="p-4 bg-slate-950/50 backdrop-blur-sm border-t border-slate-800">
                            <Link 
                                to="/reports" 
                                className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors group"
                            >
                                View Full Report 
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Quick Actions Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link 
                    to="/reports" 
                    className="group relative overflow-hidden p-6 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-solid"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
                            <Banknote className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Record New Entry</span>
                        <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                
                <Link 
                    to="/executives" 
                    className="group relative overflow-hidden p-6 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-solid"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Manage Executives</span>
                        <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    );
}