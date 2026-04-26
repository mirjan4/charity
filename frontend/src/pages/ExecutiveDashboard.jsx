import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { format } from "date-fns";
import { 
    Wallet, 
    History, 
    Book, 
    ChevronRight, 
    ArrowUpRight, 
    ShieldCheck,
    Calendar,
    Award,
    Sparkles,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Eye,
    EyeOff
} from "lucide-react";

export default function ExecutiveDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pf_balance: 0,
        total_savings: 0,
        gratuity_balance: 0,
        fixed_salary: 0,
        records: [],
        books: []
    });
    const [loading, setLoading] = useState(true);
    const [showRecords, setShowRecords] = useState(false);

    const calculateSavings = (record) => {
        const bal = (Number(record.actual_salary || 0) + Number(record.incentive_amount || 0)) - Number(record.pension || 0);
        return bal - Number(record.paid_salary || 0);
    };

    useEffect(() => {
        async function fetchData() {
            if (!user?.executive_id) return;
            setLoading(true);
            try {
                const { data } = await api.get(`/executives/${user.executive_id}`);

                setStats({
                    pf_balance:       data.pf?.balance        ?? 0,
                    total_savings:    data.pf?.total_savings   ?? data.pf?.balance ?? 0,
                    gratuity_balance: data.pf?.gratuity_balance ?? 0,
                    fixed_salary:     data.executive?.fixed_salary ?? 0,
                    records:          (data.records || []).slice(0, 5),
                    books:            data.books || []
                });
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <div className="text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase animate-pulse">
                    Loading Personal Data...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-12 px-3 sm:px-4 md:px-0">
            {/* Hero Welcome - Responsive */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-6 sm:p-8 md:p-10 text-white shadow-2xl shadow-indigo-200/20">
                <div className="absolute top-0 right-0 p-6 sm:p-8 md:p-12 opacity-5 sm:opacity-10 pointer-events-none">
                    <Award className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
                    <div className="space-y-2 sm:space-y-3 w-full md:w-auto">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" />
                            Executive Account
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                            Welcome, {user?.name.split(' ')[0]}!
                        </h1>
                        <p className="text-slate-300 sm:text-slate-400 font-medium text-sm sm:text-base">
                            Your personal charity operations dashboard
                        </p>
                    </div>
                    
                    <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 w-full md:w-auto">
                        <div className="bg-white/5 backdrop-blur-md p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 text-center flex-1 xs:flex-none xs:min-w-[140px] hover:bg-white/10 transition-all group">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <TrendingUp className="w-3 h-3 text-slate-400 group-hover:text-slate-300 transition-colors" />
                                <div className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Gratuity</div>
                            </div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-black">₹{Math.round(stats.gratuity_balance).toLocaleString()}</div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-indigo-900/40 text-center flex-1 xs:flex-none xs:min-w-[140px] hover:from-indigo-500 hover:to-indigo-600 transition-all group">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Wallet className="w-3 h-3 text-indigo-200 group-hover:text-white transition-colors" />
                                <div className="text-[9px] sm:text-[10px] font-black text-indigo-200 uppercase tracking-widest">Balance</div>
                            </div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-black">₹{Math.round(stats.pf_balance).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Records History - Collapsible - Responsive */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between px-1 sm:px-2">
                        <button 
                            onClick={() => setShowRecords(!showRecords)}
                            className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors group"
                        >
                            <History className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                            <span>Recent Collections</span>
                            {showRecords ? (
                                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            ) : (
                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            )}
                        </button>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {stats.records.length > 0 && (
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {stats.records.length} Record{stats.records.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            <Link 
                                to="/history" 
                                className="text-[9px] sm:text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-indigo-100 transition-all flex items-center gap-1"
                            >
                                <Eye className="w-3 h-3" />
                                <span className="hidden sm:inline">View All</span>
                                <span className="sm:hidden">All</span>
                            </Link>
                        </div>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showRecords ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-lg shadow-slate-100/50 border-2 border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200">
                                        <tr>
                                        {['Month', 'Collection', 'Allowance', 'Gratuity', 'Savings'].map(h => (
                                            <th key={h} className="px-4 lg:px-6 py-4 lg:py-5 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stats.records.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                                                <td className="px-4 lg:px-6 py-4 lg:py-6">
                                                    <div className="flex items-center gap-2 lg:gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:scale-110 transition-transform shadow-sm">
                                                            {format(new Date(r.record_date), "MMM").toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900">{format(new Date(r.record_date), "MMMM")}</div>
                                                            <div className="text-[10px] font-bold text-slate-400">{format(new Date(r.record_date), "yyyy")}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 lg:py-6 font-black text-slate-800 text-sm">₹{(Number(r.charity_collection||0) + Number(r.orphanage_collection||0) + Number(r.kidma_collection||0)).toLocaleString()}</td>
                                                <td className="px-4 lg:px-6 py-4 lg:py-6">
                                                    <div className="font-bold text-slate-700 text-sm">₹{Math.round(r.actual_salary).toLocaleString()}</div>
                                                    {Number(r.incentive_amount) > 0 && (
                                                        <div className="text-[9px] font-black text-amber-500 mt-1 uppercase tracking-widest flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            <span>+ ₹{Math.round(r.incentive_amount).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 lg:py-6 font-black text-rose-600 text-sm">₹{Math.round(r.pension||0).toLocaleString()}</td>
                                                <td className="px-4 lg:px-6 py-4 lg:py-6">
                                                    {(() => {
                                                        const savings = calculateSavings(r);
                                                        return (
                                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${savings >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                                                                {savings >= 0 ? '+' : ''}{Math.round(savings).toLocaleString()}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))}
                                        {stats.records.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-50">
                                                        <Calendar className="h-12 w-12 text-slate-400 mb-3" />
                                                        <p className="text-slate-500 font-bold tracking-wide text-sm">No records found yet.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {stats.records.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                                    <Calendar className="h-12 w-12 text-slate-400 mb-3 mx-auto" />
                                    <p className="text-slate-500 font-bold tracking-wide text-sm">No records found yet.</p>
                                </div>
                            ) : (
                                stats.records.map(r => (
                                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-md border-2 border-slate-100 hover:border-indigo-200 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                                                    {format(new Date(r.record_date), "MMM").toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">{format(new Date(r.record_date), "MMM yyyy")}</div>
                                                    <div className="text-[10px] font-bold text-slate-400">Record Date</div>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${calculateSavings(r) >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                                                {calculateSavings(r) >= 0 ? '+' : ''}{Math.round(calculateSavings(r)).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection</div>
                                                <div className="text-sm font-black text-slate-900">₹{(Number(r.charity_collection||0) + Number(r.orphanage_collection||0) + Number(r.kidma_collection||0)).toLocaleString()}</div>
                                            </div>
                                            <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-200">
                                                <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Allowance</div>
                                                <div className="text-sm font-black text-indigo-700">₹{Math.round(r.actual_salary).toLocaleString()}</div>
                                            </div>
                                            <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-200">
                                                <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Gratuity</div>
                                                <div className="text-sm font-black text-rose-600">₹{Math.round(r.pension||0).toLocaleString()}</div>
                                            </div>
                                            {Number(r.incentive_amount) > 0 && (
                                                <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                                                    <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Sparkles className="w-2.5 h-2.5" />
                                                        Bonus
                                                    </div>
                                                    <div className="text-sm font-black text-amber-600">₹{Math.round(r.incentive_amount).toLocaleString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Collapsed State Placeholder */}
                    {!showRecords && stats.records.length > 0 && (
                        <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 text-center">
                            <div className="flex items-center justify-center gap-3 text-slate-500">
                                <EyeOff className="w-5 h-5" />
                                <p className="text-sm font-bold">
                                    Click above to view your recent collections
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assigned Books Sidebar - Responsive */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between px-1 sm:px-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 sm:gap-3 tracking-tight">
                            <Book className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
                            Current Books
                        </h3>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        {stats.books.filter(b => b.status === 'active').map(book => (
                            <div key={book.id} className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 group-hover:from-emerald-600 group-hover:to-emerald-700 group-hover:text-white transition-all shrink-0 shadow-sm">
                                        <Book className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">{book.book_number}</div>
                                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.type}</div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xs sm:text-sm font-black text-slate-700">Page {book.last_page_used || (parseInt(book.book_number.replace(/\D/g, '')) * book.leaves - book.leaves + 1)}</div>
                                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-widest uppercase">Progress</div>
                                </div>
                            </div>
                        ))}
                        {stats.books.filter(b => b.status === 'active').length === 0 && (
                            <div className="p-8 sm:p-10 text-center bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2.5rem] text-slate-400 text-xs sm:text-sm font-medium">
                                <Book className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2" />
                                No books currently assigned.
                            </div>
                        )}
                    </div>

                    {/* Quick Profile Link - Responsive */}
                    <div className="bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-100/70 border-2 border-indigo-200 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                        <div className="absolute right-0 bottom-0 opacity-5 sm:opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                            <ShieldCheck className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-indigo-900 font-black text-base sm:text-lg mb-2">Secured Account</h4>
                            <p className="text-indigo-700/70 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                                Keep your phone number and security key updated for safe access.
                            </p>
                            <a 
                                href="/profile" 
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Manage Profile 
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}