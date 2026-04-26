import { useState, useEffect } from "react";
import api from "../lib/api";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Printer, Calendar, Filter, User, BarChart3, BookOpen, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import BookInventory from "../components/BookInventory";
 
export default function Reports() {
    const { user } = useAuth();
    const isExecutiveAccount = user?.role === 'executive';
 
    const [activeTab, setActiveTab] = useState("executive");
    const [loading, setLoading] = useState(false);
    const [executives, setExecutives] = useState([]);
    const [selectedExecId, setSelectedExecId] = useState("");
    const [rangeType, setRangeType] = useState("monthly");
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
 
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        totalCollection: 0,
        totalActualSalary: 0,
        totalGratuity: 0,
        totalFixedSalary: 0,
        byCategory: { orphanage: 0, charity: 0, khidma: 0 },
        byCategoryExpense: { orphanage: 0, charity: 0, khidma: 0 }
    });
 
    useEffect(() => {
        const loadExecs = async () => {
            const { data } = await api.get('/executives?all=1');
            setExecutives(data);
        };
        if (!isExecutiveAccount) {
            loadExecs();
        } else if (user?.executive_id) {
            setSelectedExecId(user.executive_id);
        }
    }, [isExecutiveAccount, user]);
 
    useEffect(() => {
        if (activeTab === 'executive' && !selectedExecId) {
            setRecords([]);
            return;
        }
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedExecId, rangeType, selectedMonth, customStart, customEnd]);
 
    async function fetchReportData() {
        setLoading(true);
        try {
            let start = customStart;
            let end = customEnd;
 
            if (rangeType === 'monthly') {
                const date = parseISO(`${selectedMonth}-01`);
                start = format(startOfMonth(date), "yyyy-MM-dd");
                end = format(endOfMonth(date), "yyyy-MM-dd");
            }
 
            const params = {
                start_date: start,
                end_date: end,
                executive_id: activeTab === 'executive' ? selectedExecId : undefined
            };
 
            const { data } = await api.get('/reports/financial', { params });
            setRecords(data.records);
            setSummary(data.summary);
        } catch (error) {
            toast.error("Failed to generate report");
        } finally {
            setLoading(false);
        }
    }
 
    const pfAdded = summary.totalActualSalary - summary.totalFixedSalary - summary.totalGratuity;
    const netSurplus = summary.totalCollection - summary.totalActualSalary;
 
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden pt-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
                        <p className="text-slate-600 mt-2 text-sm">Generate comprehensive executive logs and financial statements</p>
                    </div>
                    <button 
                        onClick={() => window.print()} 
                        className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Export to PDF
                    </button>
                </div>
 
                {/* Tab Switcher */}
                {!isExecutiveAccount && (
                    <div className="flex p-1.5 bg-white rounded-xl border border-slate-200 w-full md:w-max print:hidden shadow-sm">
                        <button
                            onClick={() => setActiveTab('executive')}
                            className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeTab === 'executive' 
                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <User className="w-4 h-4 mr-2" /> Executive Report
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeTab === 'financial' 
                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" /> Financial Statement
                        </button>
                    </div>
                )}
 
                {/* Controls Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:hidden">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <Filter className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-base font-semibold text-slate-900">Report Filters</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {activeTab === 'executive' && !isExecutiveAccount && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                                    Select Executive
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                                    value={selectedExecId}
                                    onChange={(e) => setSelectedExecId(e.target.value)}
                                >
                                    <option value="">-- Choose Profile --</option>
                                    {executives.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
 
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                                Period Type
                            </label>
                            <select
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                                value={rangeType}
                                onChange={(e) => setRangeType(e.target.value)}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
 
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                                Select Dates
                            </label>
                            {rangeType === 'monthly' ? (
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                                />
                            ) : (
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                                    />
                                    <span className="text-slate-400 font-medium">→</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
 
                {/* Content Display */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent absolute top-0"></div>
                            </div>
                            <p className="text-slate-600 mt-6 font-medium">Generating report...</p>
                        </div>
                    ) : activeTab === 'executive' && !selectedExecId ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Select an Executive</h3>
                            <p className="text-slate-500 text-sm">Choose an executive profile to view detailed report</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-emerald-700 font-semibold text-sm">Total Collection</span>
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-900">₹{summary.totalCollection.toLocaleString()}</p>
                                    <p className="text-emerald-600 text-xs mt-2 font-medium">Revenue generated</p>
                                </div>
 
                                <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-rose-700 font-semibold text-sm">Total Expenses (AS)</span>
                                        <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                                            <TrendingDown className="w-5 h-5 text-rose-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-rose-900">₹{summary.totalActualSalary.toLocaleString()}</p>
                                    <p className="text-rose-600 text-xs mt-2 font-medium">Actual salary paid</p>
                                </div>
 
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-blue-700 font-semibold text-sm">Net Surplus</span>
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className={`text-3xl font-bold ${netSurplus >= 0 ? 'text-blue-900' : 'text-rose-900'}`}>
                                        ₹{netSurplus.toLocaleString()}
                                    </p>
                                    <p className="text-blue-600 text-xs mt-2 font-medium">
                                        {netSurplus >= 0 ? 'Profit' : 'Loss'} for period
                                    </p>
                                </div>
                            </div>
 
                            {/* Data Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                {activeTab === 'financial' && (
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                        Executive
                                                    </th>
                                                )}
                                                <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                    Charity
                                                </th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                    Orphanage
                                                </th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                    Khidma
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/50">
                                                    Total In
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-50/50">
                                                    Total Out
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50/50">
                                                    PF Added
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {records.map((r, idx) => (
                                                <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm whitespace-nowrap">
                                                        {r.record_date ? format(new Date(r.record_date), "dd MMM yyyy") : '—'}
                                                    </td>
                                                    {activeTab === 'financial' && (
                                                        <td className="px-6 py-4 text-slate-700 font-medium text-sm">
                                                            {r.executive.name}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-right text-slate-700 text-sm font-medium">
                                                        {r.charity_collection.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-slate-700 text-sm font-medium">
                                                        {r.orphanage_collection.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-slate-700 text-sm font-medium">
                                                        {r.kidma_collection.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-700 bg-emerald-50/40 text-sm">
                                                        ₹{(r.charity_collection + r.orphanage_collection + r.kidma_collection).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-rose-700 bg-rose-50/40 text-sm">
                                                        ₹{r.actual_salary.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-indigo-700 bg-indigo-50/40 text-sm">
                                                        ₹{r.pf.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300">
                                                <td 
                                                    colSpan={activeTab === 'financial' ? 2 : 1} 
                                                    className="px-6 py-4 text-slate-900 text-sm font-bold uppercase tracking-wide"
                                                >
                                                    Summary Totals
                                                </td>
                                                <td className="px-4 py-4 text-right text-slate-900 font-bold text-sm">
                                                    {summary.byCategory.charity.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-right text-slate-900 font-bold text-sm">
                                                    {summary.byCategory.orphanage.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-right text-slate-900 font-bold text-sm">
                                                    {summary.byCategory.khidma.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-emerald-800 font-bold bg-emerald-100/60 text-sm">
                                                    ₹{summary.totalCollection.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-rose-800 font-bold bg-rose-100/60 text-sm">
                                                    ₹{summary.totalActualSalary.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-indigo-800 font-bold bg-indigo-100/60 text-sm">
                                                    ₹{pfAdded.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
 
                            {/* PF Contribution Summary */}
                            {activeTab === 'executive' && (
                                <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-8 rounded-xl border border-indigo-200/50 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-indigo-100">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">PF Contribution Summary</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                            <span className="text-xs text-slate-600 uppercase font-bold tracking-wider block mb-2">
                                                Paid to Office
                                            </span>
                                            <p className="text-2xl font-bold text-slate-900">
                                                ₹{(summary?.totalPaidToOffice ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                            <span className="text-xs text-slate-600 uppercase font-bold tracking-wider block mb-2">
                                                Gratuity Deduction
                                            </span>
                                            <p className="text-2xl font-bold text-slate-900">
                                                ₹{(summary?.totalGratuity ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg shadow-lg">
                                            <span className="block text-sm text-indigo-100 font-bold uppercase tracking-wider mb-2">
                                                Net PF Added for Period
                                            </span>
                                            <span className="text-4xl font-bold text-white">
                                                ₹{(pfAdded ?? 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
 
                            {/* Executive Book Details */}
                            {activeTab === 'executive' && selectedExecId && (
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Used Book Details & Inventory</h3>
                                    </div>
                                    <BookInventory executiveId={selectedExecId} refreshKey={records.length} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
 