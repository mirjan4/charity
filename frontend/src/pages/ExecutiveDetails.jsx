import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { 
    ArrowLeft, Phone, Calendar, Trash2, Plus, Edit2, BookOpen, Printer, Receipt, 
    User, MapPin, Key, X, Menu, Wallet, Heart, TrendingUp, History 
} from "lucide-react";

import { toast } from "react-hot-toast";
import { format } from "date-fns";
import ReportForm from "../components/ReportForm";
import BookInventory from "../components/BookInventory";
import PrintableReport from "../components/PrintableReport";
import PaymentVoucher from "../components/PaymentVoucher";

/**
 * Normalizes record data for printing components
 */
const getPrintData = (record, type) => {
    // Handle both snake_case and camelCase relation names
    const usages = record.book_usages || record.bookUsages || [];
    
    if (type === 'bill') {
        return {
            ...record,
            book_details: usages.map(bu => ({
                book_number: bu.receipt_book?.book_number || bu.receiptBook?.book_number,
                receipt_start: bu.start_page,
                receipt_end: bu.end_page,
                start_page: bu.start_page,
                end_page: bu.end_page,
                amount: bu.amount,
                type: bu.category,
                book_source: bu.receipt_book?.type || bu.receiptBook?.type
            })) || [],
            savings: record.pf,
            prev_gratuity: 0,
            prev_savings: 0
        };
    }
    return {
        ...record,
        book_details: usages.map(bu => ({
            book_number: bu.receipt_book?.book_number || bu.receiptBook?.book_number,
            start_page: bu.start_page,
            end_page: bu.end_page,
            amount: bu.amount,
            type: bu.category,
        })) || [],
    };
};


export default function ExecutiveDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [executive, setExecutive] = useState(null);
    const [records, setRecords] = useState([]);
    const [pfBalance, setPfBalance] = useState(0);
    const [totalSavings, setTotalSavings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showReportForm, setShowReportForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [activeTab, setActiveTab] = useState("records");
    const [bookRefreshKey, setBookRefreshKey] = useState(0);
    const [printingRecord, setPrintingRecord] = useState(null);
    const [printingVoucher, setPrintingVoucher] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const totalGratuity = records.reduce((sum, r) => sum + (Number(r.pension) || 0), 0);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get(`/executives/${id}`);
            setExecutive(data.executive);
            setPfBalance(data.pf.balance);
            setTotalSavings(data.pf.total_savings ?? data.pf.balance);
            setRecords(data.records || []);
        } catch (error) {
            console.error("Error fetching details:", error);
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    }

    const handleResetPassword = async () => {
        if (!confirm(`Are you sure you want to reset the password for ${executive.name} to '1234'?`)) return;
        try {
            await api.post(`/executives/${id}/reset-password`);
            toast.success("Password reset to '1234' successfully");
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("Failed to reset password");
        }
    };

    const handleDelete = async (recordId) => {
        if (!confirm("Are you sure you want to delete this record? This will revert PF and Gratuity updates.")) return;
        try {
            await api.delete(`/records/${recordId}`);
            toast.success("Record deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete record");
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setShowReportForm(true);
    };

    const handleAddNew = () => {
        setEditingRecord(null);
        setShowReportForm(true);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
    );

    if (!executive) return null;

    // Calculate values ascending to respect "Previous Savings" running sum
    let runningTotal = 0;
    const computedRecords = [...records].reverse().map((record) => {
        const actualSal = Number(record.actual_salary || 0) + Number(record.incentive_amount || 0);
        const balance = actualSal - Number(record.pension || 0);
        const paidSalary = Number(record.paid_salary || 0);
        const savings = balance - paidSalary;
        
        // Excel Logic: Bottom row total is its savings. Each row adds its savings to the running total.
        runningTotal += savings;

        const totalSavings = runningTotal;
        return { ...record, actualSal, balance, paidSalary, savings, totalSavings };
    }).reverse();

    const summarySavings = computedRecords.length > 0 ? computedRecords[0].totalSavings : 0;
    const grandTotal = pfBalance + totalGratuity; // Available Balance (after withdrawals) + Gratuity

    // ── Pagination ──
    const totalRecords  = computedRecords.length;
    const totalPages    = rowsPerPage === 0 ? 1 : Math.ceil(totalRecords / rowsPerPage);
    const startIdx      = rowsPerPage === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIdx        = rowsPerPage === 0 ? totalRecords : Math.min(startIdx + rowsPerPage, totalRecords);
    const pagedRecords  = rowsPerPage === 0 ? computedRecords : computedRecords.slice(startIdx, endIdx);
    const goToPage      = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-20 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Navigation */}
            <button
                onClick={() => navigate("/executives")}
                className="group flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm sm:text-base"
            >
                <div className="p-1 sm:p-1.5 rounded-full group-hover:bg-slate-100 mr-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline">Back to Executives</span>
                <span className="sm:hidden">Back</span>
            </button>

            {/* Profile Header Card - Responsive */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 border-b border-slate-100 p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {/* Top Row - Profile & Mobile Actions */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 sm:gap-4 md:gap-5 min-w-0 flex-1">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 border-2 border-white shadow-lg shrink-0">
                                    <User className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                                </div>
                                <div className="pt-0.5 sm:pt-1 min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                                        {executive.name}
                                    </h1>
                                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500">
                                        <div className="flex items-center bg-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                            <span className="font-bold text-slate-700 mr-1 sm:mr-1.5 text-[10px] sm:text-xs">CODE:</span> 
                                            <span className="text-[10px] sm:text-xs">{executive.code || 'N/A'}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center">
                                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-slate-400" />
                                            {executive.phone || 'N/A'}
                                        </div>
                                        <div className="hidden md:flex items-center bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                            <span className="font-bold text-slate-700 mr-1.5 text-xs">PLACE:</span> 
                                            <span className="text-xs">{executive.place || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Info - Show below name on small screens */}
                                    <div className="sm:hidden flex flex-col gap-1.5 mt-2 text-xs text-slate-500">
                                        <div className="flex items-center">
                                            <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                                            {executive.phone || 'N/A'}
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="w-3 h-3 mr-1.5 text-slate-400" />
                                            {executive.place || 'N/A'}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1.5 text-slate-400" />
                                            Joined: {executive.join_date ? format(new Date(executive.join_date), "dd MMM yy") : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex flex-wrap items-center gap-2 md:gap-3">
                                <button
                                    onClick={handleResetPassword}
                                    className="flex items-center px-3 md:px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs md:text-sm font-bold"
                                >
                                    <Key className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                                    <span className="hidden lg:inline">Reset Password</span>
                                    <span className="lg:hidden">Reset</span>
                                </button>
                                <button
                                    onClick={handleAddNew}
                                    className="flex items-center px-4 md:px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 text-xs md:text-sm font-bold"
                                >
                                    <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1.5" />
                                    Add Entry
                                </button>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                            >
                                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Join Date - Desktop Only */}
                        <div className="hidden sm:flex items-center text-xs sm:text-sm text-slate-500">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-slate-400" />
                            Joined: {executive.join_date ? format(new Date(executive.join_date), "dd MMM yyyy") : 'N/A'}
                        </div>

                        {/* Mobile Action Menu */}
                        {showMobileMenu && (
                            <div className="md:hidden flex flex-col gap-2 pt-2 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => {
                                        handleResetPassword();
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold justify-center"
                                >
                                    <Key className="w-4 h-4 mr-2" />
                                    Reset Password
                                </button>
                                <button
                                    onClick={() => {
                                        handleAddNew();
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 text-sm font-bold justify-center"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Monthly Record
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fund Balances Section - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 p-4 sm:p-6 md:p-8 bg-white">
                    {/* PF Card — big = Available Balance, sub = Total Savings */}
                    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/40 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5">
                        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-indigo-200 opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"></div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total Savings</span>
                            </div>

                            <div className="space-y-1">
                                {/* Big number = Available Balance */}
                                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 block">
                                    ₹{pfBalance.toLocaleString()}
                                </span>
                                {/* Sub-line: show gross total when withdrawals reduce it */}
                                {pfBalance !== (summarySavings || 0) && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-semibold">Gross:</span>
                                        <span className="text-xs sm:text-sm text-slate-500 font-black">
                                            ₹{(summarySavings || 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold">Available Balance</p>
                            </div>
                        </div>
                    </div>

                    
                    {/* Gratuity Card */}
                    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-rose-100 bg-gradient-to-br from-white via-rose-50/30 to-rose-100/40 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg hover:border-rose-200 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
                        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-rose-200 opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"></div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
                                    <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest">Gratuity</span>
                            </div>

                            <div className="space-y-0.5 sm:space-y-1">
                                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 block">
                                    ₹{totalGratuity.toLocaleString()}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold">Total Contribution</p>
                            </div>
                        </div>
                    </div>
                    {/* Total Funds Card (Savings + Gratuity) */}
                    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5">
                        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-200 opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"></div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 bg-white rounded-xl text-slate-500 shadow-sm border border-slate-100">
                                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Funds</span>
                            </div>

                            <div className="space-y-0.5 sm:space-y-1">
                                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 block">
                                    ₹{(grandTotal || 0).toLocaleString()}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold">Net Balance</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Tabs Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab("records")}
                        className={`flex items-center flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all ${
                            activeTab === "records"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Activity </span>Records
                    </button>
                    <button
                        onClick={() => setActiveTab("books")}
                        className={`flex items-center flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all ${
                            activeTab === "books"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Book </span>Inventory
                    </button>
                </div>

                {activeTab === "records" && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 text-xs sm:text-sm font-bold"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        Add New Entry
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === "records" ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-gradient-to-r from-slate-50 to-white">
                        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Salary History</h2>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                            {records.length} Month{records.length !== 1 ? 's' : ''} Recorded
                        </span>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b-2 border-slate-200">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest">Salary</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-rose-500 uppercase tracking-widest">Gratuity</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest">Paid</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Savings</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <Calendar className="h-12 w-12 text-slate-400 mb-3" />
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pagedRecords.map((record) => {
                                        const { actualSal, balance, paidSalary, savings, totalSavings } = record;
                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center font-black text-slate-700 text-xs">
                                                        {record.record_date ? format(new Date(record.record_date), "dd MMM yyyy") : '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-slate-600 font-bold text-sm">
                                                    ₹{(Number(record.charity_collection) + Number(record.orphanage_collection) + Number(record.kidma_collection)).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-indigo-700 font-black text-sm">
                                                    ₹{actualSal.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-rose-600 font-bold text-sm">
                                                    ₹{Number(record.pension).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-slate-900 font-black bg-slate-50/50 text-sm">
                                                    ₹{balance.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-emerald-700 font-bold text-sm">
                                                    ₹{paidSalary.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                    <span className={`font-bold ${savings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                        ₹{savings.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-black bg-indigo-50/50 text-sm">
                                                    <span className={totalSavings >= 0 ? "text-indigo-700" : "text-rose-600"}>
                                                        ₹{totalSavings.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => setPrintingRecord(getPrintData(record, 'bill'))}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Print Detailed Bill"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setPrintingVoucher(getPrintData(record, 'voucher'))}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Print A5 Voucher"
                                                        >
                                                            <Receipt className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(record)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination Footer */}
                    {records.length > 0 && (
                        <div className="hidden lg:flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
                            {/* Left: showing info */}
                            <span className="font-semibold">
                                Showing {totalRecords === 0 ? 0 : startIdx + 1} to {endIdx} of {totalRecords} results
                            </span>
                            {/* Center: rows per page */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Rows per page</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                                >
                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {/* Right: page navigation */}
                            <div className="flex items-center gap-1 font-semibold">
                                <span>Page {currentPage} of {totalPages}</span>
                                <div className="flex items-center gap-0.5 ml-2">
                                    <button onClick={() => goToPage(1)}           disabled={currentPage === 1}         className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First">   &#8676; </button>
                                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}    className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Prev">    &#8249; </button>
                                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next">    &#8250; </button>
                                    <button onClick={() => goToPage(totalPages)}  disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last">    &#8677; </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <div className="px-4 py-16 text-center">
                                <div className="flex flex-col items-center justify-center opacity-40">
                                    <Calendar className="h-12 w-12 text-slate-400 mb-3" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No records found</p>
                                </div>
                            </div>
                        ) : (
                            pagedRecords.map((record) => {
                                const { actualSal, balance, paidSalary, savings, totalSavings } = record;
                                return (
                                    <div key={record.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-black text-slate-900">
                                                    {record.record_date ? format(new Date(record.record_date), "dd MMM yyyy") : '—'}
                                                </div>
                                                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                                    Collection: ₹{(Number(record.charity_collection) + Number(record.orphanage_collection) + Number(record.kidma_collection)).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPrintingRecord(getPrintData(record, 'bill'))}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setPrintingVoucher(getPrintData(record, 'voucher'))}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                >
                                                    <Receipt className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(record)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
                                                <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Salary</div>
                                                <div className="text-sm font-black text-indigo-700">₹{actualSal.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                                                <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Gratuity</div>
                                                <div className="text-sm font-black text-rose-600">₹{Number(record.pension).toLocaleString()}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Balance</div>
                                                <div className="text-sm font-black text-slate-900">₹{balance.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                                                <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Paid</div>
                                                <div className="text-sm font-black text-emerald-700">₹{paidSalary.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 border border-slate-200">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Savings</div>
                                                <div className={`text-sm font-black ${savings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    ₹{savings.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-indigo-50 rounded-lg p-2 border-2 border-indigo-200">
                                                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Total</div>
                                                <div className={`text-sm font-black ${totalSavings >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
                                                    ₹{totalSavings.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Mobile Pagination Footer */}
                    {records.length > 0 && (
                        <div className="lg:hidden flex flex-col gap-2 px-4 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Showing {totalRecords === 0 ? 0 : startIdx + 1}–{endIdx} of {totalRecords}</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 bg-white focus:outline-none"
                                >
                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => goToPage(1)}               disabled={currentPage === 1}         className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold">&#8676;</button>
                                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}         className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold">&#8249;</button>
                                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold">&#8250;</button>
                                    <button onClick={() => goToPage(totalPages)}      disabled={currentPage >= totalPages} className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold">&#8677;</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 md:p-8">
                    <BookInventory executiveId={id} refreshKey={bookRefreshKey} />
                </div>
            )}

            {showReportForm && (
                <ReportForm
                    executiveId={executive.id}
                    executiveName={executive.name}
                    initialFixedSalary={executive.fixed_salary}
                    existingPfBalance={pfBalance}
                    initialData={editingRecord}
                    onClose={() => {
                        setShowReportForm(false);
                        setEditingRecord(null);
                    }}
                    onSuccess={() => {
                        fetchData();
                        setBookRefreshKey(k => k + 1);
                    }}
                />
            )}

            {printingRecord && (
                <PrintableReport 
                    data={printingRecord} 
                    onClose={() => setPrintingRecord(null)} 
                />
            )}

            {printingVoucher && (
                <PaymentVoucher 
                    data={printingVoucher} 
                    onClose={() => setPrintingVoucher(null)} 
                />
            )}
        </div>
    );
}