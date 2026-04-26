import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { format } from "date-fns";
import { 
    History, 
    Calendar, 
    Printer, 
    Receipt,
    ChevronLeft,
    Search,
    Filter,
    Download,
    TrendingUp,
    Wallet,
    ArrowUpDown
} from "lucide-react";
import { Link } from "react-router-dom";
import PrintableReport from "../components/PrintableReport";

export default function CollectionHistory() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [pfSummary, setPfSummary] = useState({ balance: 0, total_savings: 0, gratuity_balance: 0 });
    const [loading, setLoading] = useState(true);
    const [printingRecord, setPrintingRecord] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState("all");

    useEffect(() => {
        async function fetchHistory() {
            if (!user?.executive_id) return;
            setLoading(true);
            try {
                const { data } = await api.get(`/executives/${user.executive_id}`);
                setRecords(data.records || []);
                setPfSummary(data.pf || { balance: 0, total_savings: 0, gratuity_balance: 0 });
            } catch (err) {
                console.error("History fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [user]);

    // Computed records with running total logic
    const computedRecords = [...records].reverse().reduce((acc, current, index) => {
        const prevTotal = index === 0 ? 0 : acc[index - 1].totalSavings;
        const actualSal = Number(current.actual_salary || 0) + Number(current.incentive_amount || 0);
        const pension = Number(current.pension || 0);
        const paidSalary = Number(current.paid_salary || 0);
        const balance = actualSal - pension;
        const savings = balance - paidSalary;
        const totalSavings = prevTotal + savings;

        acc.push({
            ...current,
            actualSal,
            balance,
            savings,
            totalSavings,
            paidSalary
        });
        return acc;
    }, []).reverse();

    // Filtered and Paginated records
    const filteredRecords = computedRecords.filter(r => {
        const dateObj = new Date(r.record_date);
        const year = dateObj.getFullYear().toString();
        const matchesSearch = 
            format(dateObj, "MMMM yyyy").toLowerCase().includes(searchTerm.toLowerCase()) ||
            format(dateObj, "dd MMM yyyy").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesYear = selectedYear === "all" || year === selectedYear;
        
        return matchesSearch && matchesYear;
    });

    const years = [...new Set(records.map(r => new Date(r.record_date).getFullYear().toString()))].sort((a,b) => b-a);

    const totalRecords = filteredRecords.length;
    const totalPages = rowsPerPage === 0 ? 1 : Math.ceil(totalRecords / rowsPerPage);
    const startIdx = rowsPerPage === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIdx = rowsPerPage === 0 ? totalRecords : Math.min(startIdx + rowsPerPage, totalRecords);
    const pagedRecords = rowsPerPage === 0 ? filteredRecords : filteredRecords.slice(startIdx, endIdx);

    const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <div className="text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase animate-pulse">
                    Loading History...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12 px-3 sm:px-4 md:px-0">
            {/* Header - Responsive */}
            <div className="flex flex-col gap-4">
                <div className="space-y-2 sm:space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Link to="/" className="hover:text-indigo-600 transition-colors p-1 hover:bg-indigo-50 rounded-lg">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Executive Portal</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
                        <History className="text-indigo-600 w-6 h-6 sm:w-7 sm:h-7" />
                        Collections History
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Detailed summary of all your monthly collections and salary settlements.
                    </p>
                </div>

                {/* Search and Filter - Responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input 
                            type="text"
                            placeholder="Search by month..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={selectedYear}
                            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 min-w-[120px] cursor-pointer transition-all"
                        >
                            <option value="all">All Years</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button className="p-2.5 sm:p-3 bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-600 rounded-xl text-white transition-all shadow-sm hover:shadow-md">
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                    { 
                        label: 'Available Balance', 
                        value: pfSummary.balance, 
                        color: 'indigo',
                        icon: Wallet,
                        sub: (
                            <div className="flex flex-col gap-0.5 text-[9px] sm:text-[10px]">
                                <div className="text-indigo-500">Gross: ₹{Math.round(pfSummary.total_savings).toLocaleString()}</div>
                                <div className="text-rose-500">Withdrawn: ₹{Math.round(pfSummary.total_savings - pfSummary.balance).toLocaleString()}</div>
                            </div>
                        )
                    },
                    { 
                        label: 'Total Gratuity', 
                        value: pfSummary.gratuity_balance, 
                        color: 'rose',
                        icon: TrendingUp
                    },
                    { 
                        label: 'Avg Monthly Collection', 
                        value: records.length ? (records.reduce((sum, r) => sum + (Number(r.charity_collection||0) + Number(r.orphanage_collection||0) + Number(r.kidma_collection||0)), 0) / records.length) : 0, 
                        color: 'amber',
                        icon: Calendar
                    }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        indigo: 'from-indigo-50 to-indigo-100/50 border-indigo-200 text-indigo-700',
                        rose: 'from-rose-50 to-rose-100/50 border-rose-200 text-rose-700',
                        amber: 'from-amber-50 to-amber-100/50 border-amber-200 text-amber-700'
                    };
                    const iconColors = {
                        indigo: 'text-indigo-600 bg-indigo-100',
                        rose: 'text-rose-600 bg-rose-100',
                        amber: 'text-amber-600 bg-amber-100'
                    };
                    
                    return (
                        <div key={i} className={`bg-gradient-to-br ${colorClasses[stat.color]} p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border-2 shadow-sm hover:shadow-md transition-all`}>
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                                <div className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</div>
                                {Icon && (
                                    <div className={`p-1.5 sm:p-2 rounded-xl ${iconColors[stat.color]} shadow-sm`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                )}
                            </div>
                            <div className={`text-xl sm:text-2xl font-black ${stat.color === 'indigo' ? 'text-indigo-700' : stat.color === 'rose' ? 'text-rose-700' : 'text-amber-700'}`}>
                                ₹{Math.round(stat.value).toLocaleString()}
                            </div>
                            {stat.sub && (
                                <div className="mt-2 font-bold">
                                    {stat.sub}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-100/50 border-2 border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest">Allowance</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-rose-500 uppercase tracking-widest">Gratuity</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Payable</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest">Paid</th>
                                <th className="px-3 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly</th>
                                <th className="px-4 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Sav.</th>
                                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Print</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedRecords.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-black text-slate-900">{format(new Date(r.record_date), "dd MMM yyyy")}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(r.record_date), "MMMM")}</div>
                                    </td>
                                    <td className="px-3 py-4 text-right font-bold text-slate-700 text-sm">₹{(Number(r.charity_collection||0) + Number(r.orphanage_collection||0) + Number(r.kidma_collection||0)).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-right font-black text-indigo-700 text-sm">₹{Math.round(r.actualSal).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-right font-bold text-rose-600 text-sm">₹{Math.round(r.pension||0).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-right font-black text-slate-900 bg-slate-50/50 text-sm">₹{Math.round(r.balance).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-right font-bold text-emerald-700 text-sm">₹{Math.round(r.paidSalary).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-right">
                                        <span className={`text-sm font-black ${r.savings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            ₹{Math.round(r.savings).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right font-black bg-indigo-50/30 text-sm">
                                        <span className={r.totalSavings >= 0 ? "text-indigo-700" : "text-rose-600"}>
                                            ₹{Math.round(r.totalSavings).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => {
                                                const formattedData = {
                                                    ...r,
                                                    book_details: r.book_usages?.map(bu => ({
                                                        book_number: bu.receipt_book?.book_number,
                                                        receipt_start: bu.start_page,
                                                        receipt_end: bu.end_page,
                                                        start_page: bu.start_page,
                                                        end_page: bu.end_page,
                                                        amount: bu.amount,
                                                        type: bu.category,
                                                        book_source: bu.receipt_book?.type
                                                    })) || [],
                                                    savings: r.pf,
                                                    prev_gratuity: 0,
                                                    prev_savings: 0
                                                };
                                                setPrintingRecord(formattedData);
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all inline-flex items-center justify-center"
                                            title="Print Settlement Bill"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pagedRecords.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Calendar className="h-16 w-16 text-slate-400 mb-4" />
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Desktop Pagination */}
                {filteredRecords.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white gap-4">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Showing {startIdx + 1}-{endIdx} of {totalRecords}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows:</span>
                                <select 
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-indigo-400"
                                >
                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => goToPage(1)} 
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-20 transition-all font-black"
                                >
                                    &laquo;
                                </button>
                                <button 
                                    onClick={() => goToPage(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-20 transition-all font-black"
                                >
                                    &lsaquo;
                                </button>
                                <div className="px-4 py-1.5 bg-white rounded-lg border-2 border-indigo-100 text-xs font-black text-indigo-600">
                                    {currentPage} / {totalPages}
                                </div>
                                <button 
                                    onClick={() => goToPage(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-20 transition-all font-black"
                                >
                                    &rsaquo;
                                </button>
                                <button 
                                    onClick={() => goToPage(totalPages)} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-20 transition-all font-black"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {pagedRecords.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                        <Calendar className="h-12 w-12 text-slate-400 mb-3 mx-auto" />
                        <p className="text-slate-500 font-bold tracking-wide text-sm">No records found</p>
                    </div>
                ) : (
                    pagedRecords.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-md border-2 border-slate-100 hover:border-indigo-200 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-sm font-black text-slate-900">{format(new Date(r.record_date), "dd MMM yyyy")}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(r.record_date), "MMMM yyyy")}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const formattedData = {
                                            ...r,
                                            book_details: r.book_usages?.map(bu => ({
                                                book_number: bu.receipt_book?.book_number,
                                                receipt_start: bu.start_page,
                                                receipt_end: bu.end_page,
                                                start_page: bu.start_page,
                                                end_page: bu.end_page,
                                                amount: bu.amount,
                                                type: bu.category,
                                                book_source: bu.receipt_book?.type
                                            })) || [],
                                            savings: r.pf,
                                            prev_gratuity: 0,
                                            prev_savings: 0
                                        };
                                        setPrintingRecord(formattedData);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection</div>
                                    <div className="text-sm font-black text-slate-900">₹{(Number(r.charity_collection||0) + Number(r.orphanage_collection||0) + Number(r.kidma_collection||0)).toLocaleString()}</div>
                                </div>
                                <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-200">
                                    <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Allowance</div>
                                    <div className="text-sm font-black text-indigo-700">₹{Math.round(r.actualSal).toLocaleString()}</div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-200">
                                    <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Gratuity</div>
                                    <div className="text-sm font-black text-rose-600">₹{Math.round(r.pension||0).toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payable</div>
                                    <div className="text-sm font-black text-slate-900">₹{Math.round(r.balance).toLocaleString()}</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
                                    <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Paid</div>
                                    <div className="text-sm font-black text-emerald-700">₹{Math.round(r.paidSalary).toLocaleString()}</div>
                                </div>
                                <div className={`rounded-xl p-2.5 border-2 ${r.savings >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${r.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Monthly</div>
                                    <div className={`text-sm font-black ${r.savings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{Math.round(r.savings).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-2.5 border-2 border-indigo-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Total Savings</div>
                                    <div className={`text-base font-black ${r.totalSavings >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                                        ₹{Math.round(r.totalSavings).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Mobile Pagination */}
                {filteredRecords.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {startIdx + 1}-{endIdx} of {totalRecords}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Rows:</span>
                                    <select 
                                        value={rowsPerPage}
                                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-indigo-400"
                                    >
                                        {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1">
                                <button 
                                    onClick={() => goToPage(1)} 
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-all font-black flex-1"
                                >
                                    &laquo;
                                </button>
                                <button 
                                    onClick={() => goToPage(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-all font-black flex-1"
                                >
                                    &lsaquo;
                                </button>
                                <div className="px-4 py-2 bg-indigo-50 rounded-lg border-2 border-indigo-200 text-xs font-black text-indigo-600 flex-1 text-center">
                                    {currentPage} / {totalPages}
                                </div>
                                <button 
                                    onClick={() => goToPage(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-all font-black flex-1"
                                >
                                    &rsaquo;
                                </button>
                                <button 
                                    onClick={() => goToPage(totalPages)} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-all font-black flex-1"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Print Modal */}
            {printingRecord && (
                <PrintableReport
                    data={printingRecord}
                    onClose={() => setPrintingRecord(null)}
                />
            )}
        </div>
    );
}