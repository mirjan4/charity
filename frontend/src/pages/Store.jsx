import { useState, useEffect } from "react";
import { 
    Package, 
    Plus, 
    BookOpen, 
    Trash2, 
    Filter,
    ChevronDown,
    X,
    LayoutGrid,
    Users
} from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";

export default function Store() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        fetchStoreBooks();
    }, []);

    async function fetchStoreBooks() {
        setLoading(true);
        try {
            const { data } = await api.get('/books?unassigned=1');
            setBooks(data);
        } catch (error) {
            toast.error("Failed to load store inventory");
        } finally {
            setLoading(false);
        }
    }

    async function deleteBook(id) {
        if (!confirm("Delete this book from store?")) return;
        try {
            await api.delete(`/books/${id}`);
            toast.success("Deleted from store");
            fetchStoreBooks();
        } catch (error) {
            toast.error("Failed to delete");
        }
    }

    const filteredBooks = books.filter(b => filterType === "all" || b.type === filterType);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Package size={28} />
                        </div>
                        Central Book Store
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage unassigned receipt books inventory.</p>
                </div>

                <div className="flex items-center gap-3">
                     <div className="relative">
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        >
                            <option value="all">All Categories</option>
                            <option value="charity">Charity</option>
                            <option value="orphanage">Orphanage</option>
                            <option value="jamia">Jamia</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary py-3 px-6 shadow-lg shadow-indigo-100 ring-1 ring-white/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Bulk Add to Store
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                     { label: 'Total in Store', val: books.length, color: 'text-slate-600', bg: 'bg-white' },
                     { label: 'Charity Books', val: books.filter(b=>b.type==='charity').length, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                     { label: 'Orphan Books', val: books.filter(b=>b.type==='orphanage').length, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                     { label: 'Jamia Books', val: books.filter(b=>b.type==='jamia').length, color: 'text-purple-600', bg: 'bg-purple-50/50' },
                 ].map((s,i) => (
                     <div key={i} className={`${s.bg} border border-slate-100 p-5 rounded-2xl shadow-sm`}>
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
                         <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                     </div>
                 ))}
            </div>

            {/* Inventory Grid */}
            <div className="card p-8 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                         <LayoutGrid size={48} className="mb-4 opacity-20" />
                         <p className="font-bold uppercase tracking-widest text-xs">Store is empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {filteredBooks.map(book => (
                            <div key={book.id} className="group relative bg-slate-50 border border-slate-100 rounded-xl p-3 hover:bg-white hover:shadow-md transition-all">
                                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                                    book.type === 'charity' ? 'bg-blue-400' : 
                                    book.type === 'orphanage' ? 'bg-emerald-400' : 'bg-purple-400'
                                }`} />
                                <div className="flex justify-between items-start pt-2">
                                    <span className="text-[8px] font-black uppercase text-slate-400">{book.type}</span>
                                    <button onClick={()=>deleteBook(book.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"><Trash2 size={10} /></button>
                                </div>
                                <div className="text-sm font-black text-slate-800 mt-1">{book.book_number}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{book.leaves} Leaves</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddStoreBooksModal 
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchStoreBooks();
                    }}
                />
            )}
        </div>
    );
}

function AddStoreBooksModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: "charity",
        serial_prefix: "",
        start_number: "",
        end_number: "",
        leaves: "100"
    });

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/books/bulk', form);
            toast.success("Successfully added to store");
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Store Entry</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add books to central inventory</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Book Category</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['charity', 'orphanage', 'jamia'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setForm({...form, type: t})}
                                        className={`py-3 text-[10px] font-black uppercase rounded-2xl border-2 transition-all ${
                                            form.type === t 
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                                            : 'border-slate-50 text-slate-400 hover:border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prefix</label>
                                <input type="text" placeholder="e.g. AB"
                                    className="input-field !bg-slate-50 !rounded-2xl border-transparent focus:border-indigo-500"
                                    value={form.serial_prefix}
                                    onChange={e => setForm({...form, serial_prefix: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Leaves</label>
                                <input type="number" required placeholder="100"
                                    className="input-field !bg-slate-50 !rounded-2xl border-transparent focus:border-indigo-500"
                                    value={form.leaves}
                                    onChange={e => setForm({...form, leaves: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Serial</label>
                                <input type="number" required
                                    className="input-field !bg-slate-50 !rounded-2xl border-transparent focus:border-indigo-500"
                                    value={form.start_number}
                                    onChange={e => setForm({...form, start_number: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Serial</label>
                                <input type="number" required
                                    className="input-field !bg-slate-50 !rounded-2xl border-transparent focus:border-indigo-500"
                                    value={form.end_number}
                                    onChange={e => setForm({...form, end_number: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1 py-4 !rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="btn-primary flex-1 py-4 !rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px]"
                        >
                            {loading ? "Processing..." : "Add to Store"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
