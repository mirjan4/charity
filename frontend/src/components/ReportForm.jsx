import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { 
    X, 
    Wallet, 
    Calculator, 
    Check, 
    Minus, 
    ChevronDown, 
    BookOpen, 
    Plus, 
    Trash2,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Sparkles,
    Landmark,
    TrendingUp,
    Banknote,
    Menu
} from "lucide-react";
import api from "../lib/api";
 
const CATEGORIES = ['charity', 'orphanage', 'khidma'];
const CAT_LABEL  = { charity: "Charity", orphanage: "Orphanage", khidma: "Khidma" };
 
function computeAllowance(total) {
    const n = Number(total) || 0;
    if (n <= 0)    return 0;
    if (n < 15000) return n * 0.33;
    return Math.floor(n / 1500) * 540;
}
 
function computeGratuity(total, actualAllowance) {
    const n = Number(total) || 0;
    if (n <= 0) return 0;
    if (n < 15000) {
        return actualAllowance * 0.33;
    } else {
        const diff = actualAllowance * (40 / 540);
        return (2 / 3) * diff;
    }
}
 
export default function ReportForm({
    executiveId,
    executiveName,
    initialFixedSalary,
    existingPfBalance,
    initialData,
    onClose,
    onSuccess,
}) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [availableBooks, setAvailableBooks] = useState([]);
    
    // Global State
    const [recordDate, setRecordDate] = useState(initialData?.record_date || format(new Date(), "yyyy-MM-dd"));
    const [fixedSalary, setFixedSalary] = useState(initialData?.fixed_salary || initialData?.fixedSalary || initialFixedSalary || 0);
    const [isSalaryManual, setIsSalaryManual] = useState(initialData?.salary_mode === "manual" || initialData?.salaryMode === "manual");

    const [notes, setNotes] = useState(initialData?.notes || "");
    
    // Step 1: Book Entries State
    const [bookEntries, setBookEntries] = useState(() => {
        const usages = initialData?.book_usages || initialData?.bookUsages || [];
        return usages.length > 0 ? usages.map(u => ({
            id: Math.random(),
            book_id: u.receipt_book_id || u.receiptBookId,
            category: u.category,
            start_page: u.start_page,
            end_page: u.end_page,
            amount: u.amount
        })) : [{ id: Math.random(), book_id: "", category: "charity", start_page: "", end_page: "", amount: "" }];
    });

    // Step 2: Calculation State
    const [isGratuityManualSet, setIsGratuityManualSet] = useState(false);
    const [gratuityMode, setGratuityMode] = useState(initialData?.pension_mode || initialData?.pensionMode || "manual");
    const [gratuityValue, setGratuityValue] = useState(
        (initialData?.pension_mode === "rate" || initialData?.pensionMode === "rate")
            ? (initialData.pension_rate ?? initialData.pensionRate)
            : (initialData?.pension_manual ?? initialData?.pensionManual ?? "")
    );
    const [allowanceMode, setAllowanceMode] = useState(initialData?.allowance_mode || initialData?.allowanceMode || "default");
    const [allowanceRate, setAllowanceRate] = useState(initialData?.allowance_rate || initialData?.allowanceRate || "10");
    const [allowanceManual, setAllowanceManual] = useState(initialData?.allowance_manual || initialData?.allowanceManual || "0");

 
    // Box Incentive State
    const [boxAmount, setBoxAmount] = useState(initialData?.box_count || 0);
    const [boxRate, setBoxRate] = useState(initialData?.box_percentage || 0);
 
    // Dynamic Expense Toggles
    const [expenseToggles, setExpenseToggles] = useState({
        charity: true,
        orphanage: true,
        khidma: true
    });
 
    useEffect(() => {
        fetchBooks();
    }, [executiveId]);
 
    const fetchBooks = async () => {
        try {
            const { data } = await api.get(`/executives/${executiveId}/books`);
            setAvailableBooks(data);
        } catch (error) {
            toast.error("Failed to load books");
        }
    };
 
    // ── Book Entry Logic ──────────────────────────────────────────────────
    const addBookEntry = () => {
        setBookEntries([...bookEntries, { id: Math.random(), book_id: "", category: "charity", start_page: "", end_page: "", amount: "" }]);
    };
 
    const removeBookEntry = (id) => {
        if (bookEntries.length === 1) return;
        setBookEntries(bookEntries.filter(e => e.id !== id));
    };
 
    const updateEntry = (id, field, value) => {
        if (field === 'book_id' && value) {
            const book = availableBooks.find(b => b.id == value);
            if (book) {
                const lastPage = Number(book.last_page_used) || 0;
                const leaves = Number(book.leaves) || 100;
                const bookNum = parseInt(book.book_number.replace(/\D/g, '')) || 0;
                const bookMaxPage = bookNum * leaves;
                if (lastPage > 0 && lastPage >= bookMaxPage) {
                    toast.error(`Book ${book.book_number} is already fully used (Max: ${bookMaxPage})`);
                }
            }
        }
 
        setBookEntries(prev => prev.map(e => {
            if (e.id !== id) return e;
            const updated = { ...e, [field]: value };
            
            if (field === 'book_id' && value) {
                const book = availableBooks.find(b => b.id == value);
                if (book) {
                    const lastPage = Number(book.last_page_used) || 0;
                    const leaves = Number(book.leaves) || 100;
                    const bookNum = parseInt(book.book_number.replace(/\D/g, '')) || 0;
                    const bookMaxPage  = bookNum * leaves;
                    const bookStartPage = bookMaxPage - leaves + 1;
                    const start = lastPage > 0 ? lastPage + 1 : bookStartPage;
 
                    updated.start_page = start;
                    updated.end_page = bookMaxPage;
                    updated.category = book.type === 'jamia' ? 'charity' : book.type;
                }
            }
            return updated;
        }));
    };
 
    // Category Totals
    const categoryTotals = bookEntries.reduce((acc, e) => {
        const amt = Number(e.amount) || 0;
        acc[e.category] = (acc[e.category] || 0) + amt;
        return acc;
    }, { charity: 0, orphanage: 0, khidma: 0 });
 
    const totalCollection = categoryTotals.charity + categoryTotals.orphanage + categoryTotals.khidma;
    
    const activeCollection = CATEGORIES.reduce((acc, cat) => {
        return acc + (expenseToggles[cat] ? categoryTotals[cat] : 0);
    }, 0);
 
    // ── Calculation Logic ────────────────────────────────────────────────
    let autoAllowance = computeAllowance(activeCollection);
    
    useEffect(() => {
        if (allowanceMode === 'default') {
            setAllowanceManual(Math.round(autoAllowance).toString());
        }
    }, [activeCollection, allowanceMode]);
 
    let allowance = 0;
    if (allowanceMode === 'percentage') {
        allowance = activeCollection * (Number(allowanceRate) / 100);
    } else {
        allowance = Number(allowanceManual);
    }
 
    // Incentive Logic
    let totalCharityLeaves = 0;
    bookEntries.forEach(e => {
        if (e.category === 'charity') {
            const start = Number(e.start_page) || 0;
            const end = Number(e.end_page) || 0;
            if (end >= start && start > 0) {
                totalCharityLeaves += (end - start + 1);
            }
        }
    });
 
    let currentIncentiveRate = 0;
    if (totalCharityLeaves >= 1000) {
        currentIncentiveRate = 5.0;
        if (totalCharityLeaves > 1100) {
            const extraSlabs = Math.ceil((totalCharityLeaves - 1100) / 100);
            currentIncentiveRate += (extraSlabs * 0.2);
        }
    }
 
    const incentiveAmount = categoryTotals.charity * (Number(boxRate) / 100);
    allowance += incentiveAmount;
 
    useEffect(() => {
        if (!initialData) {
            setBoxRate(currentIncentiveRate);
        }
    }, [currentIncentiveRate, initialData]);
 
    const totalSalaryPayable = isSalaryManual ? Number(fixedSalary) : (Number(fixedSalary) + incentiveAmount);
    const calculatedPaidAmount = totalCollection - totalSalaryPayable;
 
    useEffect(() => {
        if (gratuityMode === 'manual' && !isGratuityManualSet && !initialData) {
            const calculated = computeGratuity(totalCollection, allowance);
            setGratuityValue(Math.round(calculated).toString());
        }
    }, [totalCollection, allowance, gratuityMode, isGratuityManualSet, initialData]);
 
    const gratuity = gratuityMode === "rate"
        ? allowance * (Number(gratuityValue) / 100)
        : (Number(gratuityValue) || 0);
 
    const pf = Number(allowance || 0) - Number(gratuity || 0) - totalSalaryPayable;
 
    const distributeProportional = (totalAllowance) => {
        const result = { charity: 0, orphanage: 0, khidma: 0 };
        const active = CATEGORIES.filter(c => categoryTotals[c] > 0 && expenseToggles[c]);
        
        if (!active.length || activeCollection <= 0 || totalAllowance <= 0) return result;
 
        let distributed = 0;
        active.forEach((c, i) => {
            const share = i === active.length - 1
                ? Math.round(totalAllowance) - distributed
                : Math.round((categoryTotals[c] / activeCollection) * totalAllowance);
            result[c] = share;
            distributed += share;
        });
        return result;
    };
 
    const finalExpenses = distributeProportional(allowance);
 
    // ── Validation & Submission ──────────────────────────────────────────
    const validateEntries = () => {
        for (const entry of bookEntries) {
            if (!entry.book_id || !entry.end_page || !entry.amount) {
                toast.error("Please fill all book entry fields");
                return false;
            }
            const book = availableBooks.find(b => b.id == entry.book_id);
            if (book) {
                const bookNum = parseInt(book.book_number.replace(/\D/g, '')) || 0;
                const leaves = Number(book.leaves) || 100;
                const bookMaxPage = bookNum * leaves;
                const bookStartPage = (bookNum * leaves) - leaves + 1;
 
                if (Number(entry.start_page) < bookStartPage) {
                    toast.error(`Start page for ${book.book_number} cannot be less than ${bookStartPage}`);
                    return false;
                }
                if (Number(entry.end_page) < Number(entry.start_page)) {
                    toast.error(`End page for ${book.book_number} must be >= Start page`);
                    return false;
                }
                if (Number(entry.end_page) > bookMaxPage) {
                    toast.error(`End page for ${book.book_number} exceeds limit (Max: ${bookMaxPage})`);
                    return false;
                }
            }
        }
        return true;
    };
 
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validateEntries()) return;
 
        setLoading(true);
        try {
            const payload = {
                executive_id: executiveId,
                record_date: recordDate,
                book_entries: bookEntries.map(e => ({
                    book_id: e.book_id,
                    start_page: e.start_page,
                    end_page: e.end_page,
                    amount: e.amount,
                    category: e.category
                })),
                expenses: {
                    charity:   finalExpenses.charity,
                    orphanage: finalExpenses.orphanage,
                    khidma:    finalExpenses.khidma,
                },
                gratuity_mode: "manual",
                gratuity_manual: Number(gratuityValue) || 0,
                gratuity_rate: 0,
                allowance_mode: allowanceMode,
                allowance_rate: allowanceMode === "percentage" ? Number(allowanceRate) : 0,
                allowance_manual: (allowanceMode === "manual" || allowanceMode === "default") ? Number(allowanceManual) : 0,
                allowance_toggles: expenseToggles,
                fixed_salary: Number(fixedSalary),
                salary_mode: isSalaryManual ? "manual" : "auto",
                box_count: totalCharityLeaves,
                box_percentage: Number(boxRate),
                paid_to_office: calculatedPaidAmount,
                notes
            };
 
            await api.post("/salary/compute", payload);
            toast.success("Entry Saved Successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };
 
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/80 via-indigo-950/70 to-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-start justify-center z-50 p-2 sm:p-4 md:p-6">
            <div className="relative w-full max-w-7xl bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-2 sm:my-4 md:my-auto" style={{ maxHeight: 'calc(100vh - 1rem)' }}>
                
                {/* Header - Responsive */}
                <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl sm:rounded-2xl md:rounded-[1.25rem] shadow-lg shadow-indigo-100 flex items-center justify-center text-white shrink-0">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">
                                {step === 1 ? "Receipt Book Entry" : "Salary & Summary"}
                            </h3>
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider md:tracking-widest mt-0.5 sm:mt-1 truncate">
                                <span className="hidden sm:inline">Executive: </span>{executiveName} · Step {step}/2
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 sm:p-2.5 md:p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl sm:rounded-2xl transition-all shrink-0"
                    >
                        <X className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </button>
                </div>
 
                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                    {step === 1 ? (
                        <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Date Row */}
                            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 sm:p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-tight">Period Selection</span>
                                </div>
                                <div className="w-full sm:w-56">
                                    <input 
                                        type="date" 
                                        required 
                                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all shadow-sm focus:ring-2 focus:ring-indigo-100" 
                                        value={recordDate ? (recordDate.includes('T') ? recordDate.split('T')[0] : recordDate) : ""} 
                                        onChange={e => setRecordDate(e.target.value)} 
                                    />
                                </div>
                            </div>
 
                            {/* Book Entries - Mobile Optimized */}
                            <div className="space-y-3">
                                {/* Desktop Headers - Hidden on Mobile */}
                                <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-3 px-4">
                                    {['Book No', 'Cat', 'Start', 'End', 'Pages', 'Amt (₹)', ''].map(h => (
                                        <span key={h} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</span>
                                    ))}
                                </div>
 
                                {/* Book Entry Cards */}
                                <div className="space-y-3">
                                    {bookEntries.map((entry, idx) => {
                                        const selectedBook = availableBooks.find(b => b.id == entry.book_id);
                                        const allowedCats = !selectedBook ? [] : 
                                            selectedBook.type === 'charity'   ? ['charity'] :
                                            selectedBook.type === 'orphanage' ? ['orphanage'] : 
                                            ['charity', 'khidma'];
 
                                        return (
                                            <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md p-3 sm:p-4">
                                                {/* Desktop Layout */}
                                                <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 items-center">
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold appearance-none cursor-pointer"
                                                            value={entry.book_id}
                                                            onChange={e => updateEntry(entry.id, 'book_id', e.target.value)}
                                                        >
                                                            <option value="">Select</option>
                                                            {availableBooks
                                                                .filter(b => b.status === 'active' || entry.book_id == b.id)
                                                                .filter(b => !bookEntries.some(be => be.id !== entry.id && be.book_id == b.id))
                                                                .map(b => {
                                                                    const maxPage = (parseInt(b.book_number.replace(/\D/g, '')) || 0) * (b.leaves || 100);
                                                                    return (
                                                                        <option key={b.id} value={b.id}>{b.book_number} {b.status !== 'active' ? '(Closed)' : `(Max ${maxPage})`}</option>
                                                                    );
                                                            })}
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
                                                    </div>
 
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold appearance-none cursor-pointer disabled:opacity-50"
                                                            value={entry.category}
                                                            disabled={allowedCats.length <= 1}
                                                            onChange={e => updateEntry(entry.id, 'category', e.target.value)}
                                                        >
                                                            {allowedCats.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                                                        </select>
                                                    </div>
 
                                                    <input type="number" readOnly className="w-full bg-slate-100 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-slate-400 text-center" value={entry.start_page} />
                                                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500" value={entry.end_page} onChange={e => updateEntry(entry.id, 'end_page', e.target.value)} />
                                                    
                                                    <div className="w-full bg-slate-100/50 rounded-xl py-2.5 px-3 text-sm font-black text-slate-500 text-center flex items-center justify-center">
                                                        {(Number(entry.end_page) >= Number(entry.start_page) && Number(entry.start_page) > 0) ? (Number(entry.end_page) - Number(entry.start_page) + 1) : '-'}
                                                    </div>
 
                                                    <input type="number" className="w-full bg-emerald-50 border-none rounded-xl py-2.5 px-3 text-sm font-black text-emerald-800 text-right" value={entry.amount} onChange={e => updateEntry(entry.id, 'amount', e.target.value)} />
                                                    <button onClick={() => removeBookEntry(entry.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
 
                                                {/* Mobile Layout */}
                                                <div className="lg:hidden space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-slate-400 uppercase">Entry #{idx + 1}</span>
                                                        <button onClick={() => removeBookEntry(entry.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Book Number</label>
                                                            <div className="relative">
                                                                <select 
                                                                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold appearance-none cursor-pointer"
                                                                    value={entry.book_id}
                                                                    onChange={e => updateEntry(entry.id, 'book_id', e.target.value)}
                                                                >
                                                                    <option value="">Select Book</option>
                                                                    {availableBooks
                                                                        .filter(b => b.status === 'active' || entry.book_id == b.id)
                                                                        .filter(b => !bookEntries.some(be => be.id !== entry.id && be.book_id == b.id))
                                                                        .map(b => {
                                                                            const maxPage = (parseInt(b.book_number.replace(/\D/g, '')) || 0) * (b.leaves || 100);
                                                                            return (
                                                                                <option key={b.id} value={b.id}>{b.book_number} {b.status !== 'active' ? '(Closed)' : `(Max ${maxPage})`}</option>
                                                                            );
                                                                    })}
                                                                </select>
                                                                <ChevronDown className="absolute right-2 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        </div>
 
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Category</label>
                                                                <select 
                                                                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold appearance-none cursor-pointer disabled:opacity-50"
                                                                    value={entry.category}
                                                                    disabled={allowedCats.length <= 1}
                                                                    onChange={e => updateEntry(entry.id, 'category', e.target.value)}
                                                                >
                                                                    {allowedCats.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Amount (₹)</label>
                                                                <input 
                                                                    type="number" 
                                                                    className="w-full bg-emerald-50 border-none rounded-xl py-2.5 px-3 text-sm font-black text-emerald-800 text-right" 
                                                                    value={entry.amount} 
                                                                    onChange={e => updateEntry(entry.id, 'amount', e.target.value)} 
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
 
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Start</label>
                                                                <input type="number" readOnly className="w-full bg-slate-100 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-slate-400 text-center" value={entry.start_page} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">End</label>
                                                                <input type="number" className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500" value={entry.end_page} onChange={e => updateEntry(entry.id, 'end_page', e.target.value)} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Pages</label>
                                                                <div className="w-full bg-indigo-50 border-none rounded-xl py-2.5 px-3 text-sm font-black text-indigo-700 text-center flex items-center justify-center">
                                                                    {(Number(entry.end_page) >= Number(entry.start_page) && Number(entry.start_page) > 0) ? (Number(entry.end_page) - Number(entry.start_page) + 1) : '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
 
                                <button 
                                    onClick={addBookEntry} 
                                    className="w-full py-3 sm:py-3.5 mt-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl sm:rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-black text-[9px] sm:text-[10px] uppercase tracking-widest"
                                >
                                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Book Entry
                                </button>
                            </div>
 
                            {/* Category Totals - Responsive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {CATEGORIES.map(c => (
                                    <div key={c} className="bg-white border-2 border-slate-100 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${c === 'charity' ? 'bg-gradient-to-b from-blue-500 to-blue-600' : c === 'orphanage' ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' : 'bg-gradient-to-b from-purple-500 to-purple-600'}`} />
                                        <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{CAT_LABEL[c]}</div>
                                        <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">₹{categoryTotals[c].toLocaleString()}</div>
                                        <div className="text-[8px] text-slate-400 font-bold mt-1">Collection</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                             {/* Configuration Cards - Responsive */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                 {/* Allowance */}
                                 <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl sm:rounded-3xl border-2 border-emerald-200/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                                     <h4 className="flex items-center gap-2 text-emerald-800 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                                         <Wallet className="w-4 h-4" /> Allowance
                                     </h4>
                                     <div className="space-y-3">
                                        <div className="flex p-0.5 bg-white/80 border border-emerald-200 rounded-xl gap-0.5 shadow-inner">
                                            {['default', 'percentage', 'manual'].map(m => (
                                                <button key={m} type="button" onClick={() => setAllowanceMode(m)}
                                                    className={`flex-1 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all ${allowanceMode === m ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-emerald-600"}`}
                                                >
                                                    {m === 'default' ? 'Auto' : m === 'percentage' ? '%' : 'Manual'}
                                                </button>
                                            ))}
                                        </div>
                                         <div className="space-y-1.5">
                                             <div className="text-[8px] sm:text-[9px] font-bold text-emerald-600 uppercase tracking-widest px-1">
                                                 {allowanceMode === 'percentage' ? 'Rate (%)' : 'Amount (₹)'}
                                             </div>
                                             <input 
                                                 type="number" 
                                                 step="0.1" 
                                                 className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 sm:py-2.5 px-3 font-black text-emerald-700 text-sm sm:text-base focus:ring-2 focus:ring-emerald-400 transition-all shadow-sm" 
                                                 value={allowanceMode === 'percentage' ? allowanceRate : allowanceManual} 
                                                 onChange={e => {
                                                     const val = e.target.value;
                                                     if (allowanceMode === 'percentage') {
                                                         setAllowanceRate(val);
                                                     } else {
                                                         setAllowanceManual(val);
                                                     }
                                                 }} 
                                             />
                                         </div>
                                     </div>
                                 </div>
 
                                 {/* Gratuity */}
                                 <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl sm:rounded-3xl border-2 border-indigo-200/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                                     <h4 className="flex items-center gap-2 text-indigo-800 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                                         <Calculator className="w-4 h-4" /> Gratuity
                                     </h4>
                                      <div className="space-y-2">
                                         <div className="text-[8px] sm:text-[9px] font-bold text-indigo-600 uppercase tracking-widest px-1">Amount (₹)</div>
                                         <input 
                                            type="number" 
                                            step="0.1" 
                                            className="w-full bg-white border-2 border-indigo-200 rounded-xl py-2 sm:py-2.5 px-3 font-black text-indigo-700 text-sm sm:text-base focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm" 
                                            value={gratuityValue} 
                                            onChange={e => { setGratuityValue(e.target.value); setIsGratuityManualSet(true); }} 
                                         />
                                     </div>
                                 </div>
 
                                 {/* Salary */}
                                 <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl sm:rounded-3xl border-2 border-slate-200/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                                     <h4 className="flex items-center gap-2 text-slate-800 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                                         <Check className="w-4 h-4" /> Salary
                                     </h4>
                                      <div className="space-y-2">
                                          <div className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1 transition-colors ${isSalaryManual ? 'text-indigo-600' : 'text-slate-500'}`}>
                                              {isSalaryManual ? 'Manual (Locked)' : 'Override FS'}
                                          </div>
                                          <input 
                                            type="number" 
                                            className={`w-full bg-white border-2 rounded-xl py-2 sm:py-2.5 px-3 font-black text-sm sm:text-base transition-all shadow-sm ${isSalaryManual ? 'border-indigo-400 text-indigo-700 ring-2 ring-indigo-100' : 'border-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-300'}`} 
                                            value={fixedSalary} 
                                            onChange={e => {
                                                setFixedSalary(e.target.value);
                                                setIsSalaryManual(true);
                                            }} 
                                          />
                                      </div>
                                 </div>
 
                                 {/* Incentive */}
                                 <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl sm:rounded-3xl border-2 border-amber-200/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                                     <h4 className="flex items-center gap-2 text-amber-800 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                                         <Sparkles className="w-4 h-4" /> Incentive
                                     </h4>
                                     <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                         <div className="space-y-1">
                                             <div className="text-[8px] sm:text-[9px] font-bold text-amber-600 uppercase tracking-widest px-1">Leaves</div>
                                             <div className="w-full bg-white border-2 border-amber-200 rounded-xl py-2 sm:py-2.5 px-3 font-black text-amber-900 text-sm sm:text-base shadow-inner">
                                                 {totalCharityLeaves}
                                             </div>
                                         </div>
                                         <div className="space-y-1">
                                             <div className="text-[8px] sm:text-[9px] font-bold text-amber-600 uppercase tracking-widest px-1">Rate %</div>
                                             <input 
                                                 type="number"
                                                 step="0.1"
                                                 className="w-full bg-white border-2 border-amber-200 rounded-xl py-2 sm:py-2.5 px-3 font-black text-amber-900 text-sm sm:text-base shadow-inner focus:ring-2 focus:ring-amber-400 transition-all"
                                                 value={boxRate}
                                                 onChange={e => setBoxRate(e.target.value)}
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
 
                             {/* Summary Cards - Responsive */}
                             <div className="space-y-3 sm:space-y-4">
                               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                                   <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white relative overflow-hidden group shadow-lg">
                                       <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</div>
                                       <div className="text-base sm:text-lg md:text-xl font-black text-white/90">₹{totalCollection.toLocaleString()}</div>
                                       <div className="text-[7px] sm:text-[8px] text-slate-500 font-bold mt-0.5 sm:mt-1">Collection</div>
                                   </div>
                                   <div className="bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all relative group">
                                       <div className="text-[8px] sm:text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Base</div>
                                       <div className="text-base sm:text-lg md:text-xl font-black text-indigo-700">₹{activeCollection.toLocaleString()}</div>
                                       <div className="text-[7px] sm:text-[8px] text-slate-400 font-bold mt-0.5 sm:mt-1">For Calc</div>
                                   </div>
                                   <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white ring-2 sm:ring-4 ring-emerald-500/20 shadow-lg col-span-2 sm:col-span-1">
                                       <div className="text-[8px] sm:text-[9px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Allowance</div>
                                       <div className="text-base sm:text-lg md:text-xl font-black tracking-tight">₹{Math.round(allowance).toLocaleString()}</div>
                                       <div className="text-[7px] sm:text-[8px] text-emerald-200 font-bold mt-0.5 sm:mt-1">Final</div>
                                   </div>
                                   <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white relative group shadow-lg">
                                       <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Office</div>
                                       <div className="text-base sm:text-lg md:text-xl font-black text-white">₹{Math.round(calculatedPaidAmount).toLocaleString()}</div>
                                       <Landmark className="absolute bottom-2 right-2 w-3 h-3 sm:w-4 sm:h-4 text-slate-700 group-hover:text-slate-600 transition-colors" />
                                   </div>
                                   <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white transition-all shadow-lg ${pf >= 0 ? 'bg-gradient-to-br from-indigo-600 to-indigo-700' : 'bg-gradient-to-br from-rose-600 to-rose-700'}`}>
                                       <div className="text-[8px] sm:text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Savings</div>
                                       <div className="text-base sm:text-lg md:text-xl font-black">₹{Math.round(pf).toLocaleString()}</div>
                                       <div className="text-[7px] sm:text-[8px] text-white/50 font-bold mt-0.5 sm:mt-1">Net</div>
                                   </div>
                               </div>
 
                               {/* Distribution Section */}
                               <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm">
                                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-2 sm:gap-3 px-1">
                                       <div className="flex items-center gap-2">
                                           <div className={`w-1.5 h-4 sm:h-5 rounded-full ${Object.values(finalExpenses).reduce((a,b) => a+b, 0) === Math.round(allowance) ? 'bg-indigo-500' : 'bg-rose-500 animate-pulse'}`} />
                                           <h4 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-600">Expense Distribution</h4>
                                       </div>
                                       <div className="flex flex-wrap items-center gap-2">
                                           {Object.values(finalExpenses).reduce((a,b) => a+b, 0) !== Math.round(allowance) && allowance > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-600 text-[8px] sm:text-[9px] font-black uppercase">
                                                    <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    Check
                                                </div>
                                           )}
                                           <div className="text-[8px] sm:text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 sm:px-3 py-1 rounded-full border border-indigo-200">
                                                ₹{Math.round(allowance).toLocaleString()}
                                           </div>
                                       </div>
                                   </div>
                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                       {CATEGORIES.map(cat => {
                                           const amount = categoryTotals[cat];
                                           const isActive = amount > 0;
                                           const isToggled = expenseToggles[cat];
                                           const isCalculationIncluded = isActive && isToggled;
                                           
                                           return (
                                               <div key={cat} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 transition-all duration-300 ${isCalculationIncluded ? 'bg-white border-slate-200 shadow-sm hover:shadow-md' : 'bg-slate-100/50 border-slate-100 opacity-50'}`}>
                                                   <div className="flex items-center justify-between mb-2 sm:mb-3">
                                                       <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest ${isCalculationIncluded ? 'text-slate-500' : 'text-slate-300'}`}>{CAT_LABEL[cat]}</span>
                                                            <span className={`text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-md font-bold ${isCalculationIncluded ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'}`}>EXP</span>
                                                       </div>
                                                       <button 
                                                           type="button"
                                                           onClick={() => setExpenseToggles(prev => ({ ...prev, [cat]: !prev[cat] }))}
                                                           disabled={!isActive}
                                                           className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full p-0.5 transition-all duration-300 relative ${isToggled && isActive ? 'bg-indigo-500 shadow-sm shadow-indigo-200' : 'bg-slate-300'}`}
                                                       >
                                                           <div className={`w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isToggled && isActive ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0'}`} />
                                                       </button>
                                                   </div>
                                                   <div className={`text-lg sm:text-xl md:text-2xl font-black transition-colors ${isCalculationIncluded ? 'text-slate-800' : 'text-slate-400'}`}>
                                                       ₹{(finalExpenses[cat] || 0).toLocaleString()}
                                                   </div>
                                                   <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2 overflow-hidden">
                                                        <div className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Amt:</div>
                                                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate">₹{amount.toLocaleString()}</div>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                               
                               {/* Notes */}
                               <textarea 
                                   className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-300 focus:bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm font-medium h-20 sm:h-24 resize-none transition-all placeholder:text-slate-400 shadow-sm focus:shadow-md" 
                                   value={notes} 
                                   onChange={e => setNotes(e.target.value)} 
                                   placeholder="Add notes or remarks..." 
                               />
                             </div>
                        </div>
                    )}
                </div>
 
                {/* Footer - Responsive */}
                <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-t-2 border-slate-100 bg-gradient-to-r from-slate-50/50 to-white shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                    {step === 1 ? (
                        <>
                            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm order-2 sm:order-1">
                                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="text-[9px] sm:text-[10px] font-bold">Ensure accurate mapping</span>
                            </div>
                            <button 
                                onClick={() => validateEntries() ? setStep(2) : null}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 order-1 sm:order-2"
                            >
                                Calculate Salary
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setStep(1)} 
                                className="text-slate-500 hover:text-slate-700 flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest px-3 sm:px-4 py-2 hover:bg-slate-50 rounded-xl transition-all order-2 sm:order-1"
                            >
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Edit Books
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-500 text-white py-3 sm:py-3.5 px-8 sm:px-10 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 font-black uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 order-1 sm:order-2"
                            >
                                {loading ? "Saving..." : "Confirm & Save"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}