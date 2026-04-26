import { useState, useEffect } from "react";
import {
    BookOpen, Trash2, X, ChevronDown, Send,
    History, Clock, TrendingUp, IndianRupee,
    FileText, Eye, CheckCircle
} from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

const TYPE_COLOR = {
    charity:   "bg-blue-400",
    orphanage: "bg-emerald-400",
    jamia:     "bg-purple-400",
};
const CAT_BADGE = {
    charity:   "bg-blue-100 text-blue-700",
    orphanage: "bg-emerald-100 text-emerald-700",
    khidma:    "bg-purple-100 text-purple-700",
};

export default function BookInventory({ executiveId, refreshKey }) {
    const { user } = useAuth();
    const isExecutiveAccount = user?.role === 'executive';

    const [books, setBooks]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [historyBook, setHistoryBook]       = useState(null);
    const [filter, setFilter]         = useState("all");
    const [showHistory, setShowHistory]       = useState(false);

    // Re-fetch whenever parent signals a change (e.g. after saving a record)
    useEffect(() => {
        fetchBooks();
    }, [executiveId, refreshKey]);

    async function fetchBooks() {
        setLoading(true);
        try {
            const { data } = await api.get(`/executives/${executiveId}/books`);
            setBooks(data);
        } catch {
            toast.error("Failed to load books");
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id, newStatus) {
        try {
            await api.put(`/books/${id}/status`, { status: newStatus });
            toast.success("Status updated");
            fetchBooks();
        } catch {
            toast.error("Failed to update status");
        }
    }

    async function deleteBook(id) {
        if (!confirm("Remove this book permanently?")) return;
        try {
            await api.delete(`/books/${id}`);
            toast.success("Book removed");
            fetchBooks();
        } catch {
            toast.error("Failed to delete");
        }
    }

    async function viewHistory(book) {
        try {
            const { data } = await api.get(`/books/${book.id}/history`);
            setHistoryBook(data);
        } catch {
            toast.error("Failed to load book history");
        }
    }

    const filtered      = books.filter(b => filter === "all" || b.type === filter);
    const activeBooks   = filtered.filter(b => b.status === "active");
    const historyBooks  = filtered.filter(b => b.status !== "active");

    const stats = {
        active:    books.filter(b => b.status === "active").length,
        used:      books.filter(b => b.status === "used").length,
        returned:  books.filter(b => b.status === "returned").length,
        lost:      books.filter(b => b.status === "lost").length,
    };

    return (
        <div className="space-y-8">

            {/* ── Header bar ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Stats pills */}
                <div className="flex flex-wrap items-center gap-3">
                    {[
                        { label: "Active",   count: stats.active,   cls: "bg-blue-50 text-blue-600 border-blue-100" },
                        { label: "Used",     count: stats.used,     cls: "bg-slate-100 text-slate-500 border-slate-200" },
                        { label: "Returned", count: stats.returned, cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                        { label: "Lost",     count: stats.lost,     cls: "bg-rose-50 text-rose-500 border-rose-100" },
                    ].map(s => (
                        <span key={s.label} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${s.cls}`}>
                            {s.label}: {s.count}
                        </span>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Types</option>
                            <option value="charity">Charity</option>
                            <option value="orphanage">Orphanage</option>
                            <option value="jamia">Jamia</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>
                    {!isExecutiveAccount && (
                        <button
                            onClick={() => setShowIssueModal(true)}
                            className="btn-primary py-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 text-xs"
                        >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Issue from Store
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            ) : (
                <div className="space-y-10">

                    {/* ── Active Assignments ─────────────────────── */}
                    <section>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                            Active Assignments · {activeBooks.length}
                        </h3>

                        {activeBooks.length === 0 ? (
                            <div className="bg-slate-50 rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-40" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active books</p>
                                {!isExecutiveAccount && (
                                    <button
                                        onClick={() => setShowIssueModal(true)}
                                        className="mt-3 text-indigo-500 font-black text-[10px] hover:underline uppercase tracking-widest"
                                    >
                                        Issue from Store
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {activeBooks.map(book => {
                                    const maxPage  = (parseInt(book.book_number.replace(/\D/g, "")) || 0) * (book.leaves || 100);
                                    const lastPage = book.last_page_used || 0;
                                    const pct      = maxPage > 0 ? Math.min(100, Math.round((lastPage / maxPage) * 100)) : 0;

                                    return (
                                        <div key={book.id} className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg transition-all shadow-sm overflow-hidden">
                                            <div className={`absolute top-0 left-0 right-0 h-1 ${TYPE_COLOR[book.type] || "bg-slate-300"}`} />

                                            <div className="flex justify-between items-start pt-1 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{book.type}</span>
                                                {!isExecutiveAccount && (
                                                    <button
                                                        onClick={() => deleteBook(book.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="text-xl font-black text-slate-800 mb-0.5">{book.book_number}</div>
                                            <div className="text-[9px] text-slate-400 font-bold mb-3">{book.leaves} Leaves · Cap {maxPage.toLocaleString()}</div>

                                            {/* Usage progress bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-[8px] font-black text-slate-400 mb-1">
                                                    <span>Pg {lastPage.toLocaleString()}</span>
                                                    <span>{pct}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-rose-400" : pct >= 60 ? "bg-amber-400" : "bg-indigo-400"}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <select
                                                value={book.status}
                                                onChange={e => updateStatus(book.id, e.target.value)}
                                                disabled={isExecutiveAccount}
                                                className={`w-full text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border border-slate-100 focus:ring-0 ${isExecutiveAccount ? 'bg-slate-50 text-slate-500 appearance-none text-center' : 'bg-blue-50 text-blue-600 cursor-pointer'}`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="used">Used</option>
                                                <option value="returned">Returned</option>
                                                <option value="lost">Lost</option>
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ── History Section (collapsible) ─────────── */}
                    {historyBooks.length > 0 && (
                        <section>
                            <button
                                onClick={() => setShowHistory(v => !v)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group mb-2"
                            >
                                <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <History size={12} className="text-slate-400" />
                                    Book History
                                    <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
                                        {historyBooks.length}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform duration-200 ${
                                        showHistory ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {showHistory && (

                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-slate-100 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {["Book No", "Type", "Leaves", "Last Page", "Status", ""].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {historyBooks.map(book => {
                                            const maxPage  = (parseInt(book.book_number.replace(/\D/g, "")) || 0) * (book.leaves || 100);
                                            const lastPage = book.last_page_used || 0;

                                            return (
                                                <tr key={book.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-5 py-3.5 font-black text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${TYPE_COLOR[book.type] || "bg-slate-300"}`} />
                                                            {book.book_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500 capitalize">{book.type}</td>
                                                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500">{book.leaves}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-xs font-black text-slate-700">{lastPage.toLocaleString()}</span>
                                                        <span className="text-[9px] text-slate-400 ml-1">/ {maxPage.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                            book.status === "used"     ? "bg-slate-100 text-slate-500" :
                                                            book.status === "returned" ? "bg-emerald-100 text-emerald-600" :
                                                                                         "bg-rose-100 text-rose-500"
                                                        }`}>
                                                            {book.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <button
                                                            onClick={() => viewHistory(book)}
                                                            className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            <Eye size={11} />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            )}
                        </section>
                    )}
                </div>
            )}

            {/* ── Modals ─────────────────────────────────────────── */}
            {showIssueModal && (
                <IssueBooksModal
                    executiveId={executiveId}
                    onClose={() => setShowIssueModal(false)}
                    onSuccess={() => { setShowIssueModal(false); fetchBooks(); }}
                />
            )}

            {historyBook && (
                <BookHistoryModal
                    data={historyBook}
                    onClose={() => setHistoryBook(null)}
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Issue Books Modal                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
function IssueBooksModal({ executiveId, onClose, onSuccess }) {
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [storeBooks, setStoreBooks] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [issueFilter, setIssueFilter] = useState("all");

    useEffect(() => { fetchStore(); }, []);

    async function fetchStore() {
        setLoading(true);
        try {
            // Only unassigned + active books from the central store
            const { data } = await api.get("/books?unassigned=1");
            setStoreBooks(data.filter(b => b.status === "active"));
        } catch {
            toast.error("Failed to load store");
        } finally {
            setLoading(false);
        }
    }

    const filtered   = storeBooks.filter(b => issueFilter === "all" || b.type === issueFilter);
    const toggleSelect = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    async function handleIssue() {
        if (!selectedIds.length) return toast.error("Select at least one book");
        setSubmitting(true);
        try {
            await api.post("/books/assign", { book_ids: selectedIds, executive_id: executiveId });
            toast.success(`Issued ${selectedIds.length} book(s)`);
            onSuccess();
        } catch {
            toast.error("Issue failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Issue from Store</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select books from central inventory</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X size={20} /></button>
                </div>

                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        {["all", "charity", "orphanage", "jamia"].map(t => (
                            <button
                                key={t}
                                onClick={() => setIssueFilter(t)}
                                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                    issueFilter === t ? "bg-white border-slate-200 text-primary-600 shadow-sm" : "text-slate-400 border-transparent hover:text-slate-600"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{selectedIds.length} Selected</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs">Store is empty</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {filtered.map(book => {
                                const isSelected = selectedIds.includes(book.id);
                                return (
                                    <button
                                        key={book.id}
                                        onClick={() => toggleSelect(book.id)}
                                        className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                                            isSelected ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100" : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                        }`}
                                    >
                                        <div className={`w-full h-1 absolute top-0 left-0 right-0 rounded-t-lg ${TYPE_COLOR[book.type] || "bg-slate-300"}`} />
                                        {isSelected && <CheckCircle size={10} className="absolute top-1 right-1 text-primary-600" />}
                                        <span className="text-sm font-black text-slate-800">{book.book_number}</span>
                                        <span className="text-[8px] font-bold text-slate-400">{book.leaves} L</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <button
                        onClick={handleIssue}
                        disabled={!selectedIds.length || submitting}
                        className="btn-primary flex-1 shadow-xl shadow-primary-100"
                    >
                        {submitting ? "Issuing..." : `Issue Selected (${selectedIds.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Book History Modal  (slide-in panel with full detail table)                */
/* ─────────────────────────────────────────────────────────────────────────── */
function BookHistoryModal({ data, onClose }) {
    const { book, usages } = data;
    const maxPage     = (parseInt(book.book_number.replace(/\D/g, "")) || 0) * (book.leaves || 100);
    const totalAmount = usages.reduce((s, u) => s + Number(u.amount), 0);
    const totalPages  = usages.reduce((s, u) => s + Number(u.pages_used), 0);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-end bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-start justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><FileText size={14} /></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Usage History</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900">{book.book_number}</h2>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                            {book.type} · {book.leaves} Leaves · Max Page {maxPage.toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all mt-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-0 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    {[
                        { label: "Sessions",     value: usages.length,              cls: "text-slate-800" },
                        { label: "Pages Used",   value: totalPages.toLocaleString(), cls: "text-indigo-600" },
                        { label: "Total Collected", value: `₹${totalAmount.toLocaleString()}`, cls: "text-emerald-600" },
                    ].map((s, i) => (
                        <div key={s.label} className={`text-center py-5 ${i > 0 ? "border-l border-slate-200" : ""}`}>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
                            <div className={`text-2xl font-black ${s.cls}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Detail Table */}
                <div className="flex-1 overflow-y-auto">
                    {usages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                            <Clock size={40} className="mb-3 opacity-40" />
                            <p className="font-black uppercase tracking-widest text-xs">No usage records found</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    {["#", "Date", "Category", "Start Page", "End Page", "Pages", "Amount"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {usages.map((u, idx) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                                            {u.record_date ? format(new Date(u.record_date), "dd MMM yyyy") : "—"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_BADGE[u.category] || "bg-slate-100 text-slate-500"}`}>
                                                {u.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 tabular-nums">{Number(u.start_page).toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 tabular-nums">{Number(u.end_page).toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-xs font-black text-indigo-600 tabular-nums">{Number(u.pages_used).toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-xs font-black text-emerald-600 tabular-nums">₹{Number(u.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals */}
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td colSpan={5} className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Totals</td>
                                    <td className="px-5 py-3 text-sm font-black text-indigo-700 tabular-nums">{totalPages.toLocaleString()}</td>
                                    <td className="px-5 py-3 text-sm font-black text-emerald-700 tabular-nums">₹{totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* Footer status bar */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <div className={`flex items-center gap-2 justify-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        book.status === "used"     ? "bg-slate-100 text-slate-500" :
                        book.status === "returned" ? "bg-emerald-50 text-emerald-600" :
                                                      "bg-rose-50 text-rose-500"
                    }`}>
                        <History size={12} />
                        Final Status: {book.status?.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
}
