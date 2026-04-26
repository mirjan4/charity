import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import {
    Plus, Search, User, Phone, MapPin, Edit2, Trash2, X,
    Calendar, ChevronRight, ChevronLeft, Users, UserCheck, UserX,
    ArrowUpDown, Settings2, Eye, EyeOff, GripVertical, Check,
    LayoutGrid, List
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

// ── Column definitions ───────────────────────────────────────────────────
const DEFAULT_COLS = [
    { id: "name",         label: "Executive",    field: "name",         visible: true,  width: "2fr",   sortable: true  },
    { id: "code",         label: "ID / Code",    field: "code",         visible: true,  width: "0.8fr", sortable: true  },
    { id: "phone",        label: "Phone",         field: "phone",        visible: true,  width: "1.1fr", sortable: false },
    { id: "place",        label: "Place",         field: "place",        visible: true,  width: "1fr",   sortable: false },
    { id: "join_date",    label: "Joined",        field: "join_date",    visible: true,  width: "1fr",   sortable: false },
    { id: "fixed_salary", label: "Fixed Salary", field: "fixed_salary", visible: true,  width: "0.9fr", sortable: true  },
    { id: "active",       label: "Status",        field: "active",       visible: true,  width: "0.8fr", sortable: true  },
];


// ── Column Panel Component ───────────────────────────────────────────────
function ColumnPanel({ cols, setCols, onClose }) {
    const [dragging, setDragging] = useState(null);
    const [over,     setOver]     = useState(null);

    function toggleVisible(id) {
        setCols(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    }

    function moveUp(idx) {
        if (idx === 0) return;
        setCols(prev => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; });
    }

    function moveDown(idx) {
        setCols(prev => { if (idx >= prev.length - 1) return prev; const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n; });
    }

    function handleDragStart(id)  { setDragging(id); }
    function handleDragOver(e, id){ e.preventDefault(); setOver(id); }
    function handleDrop(targetId) {
        if (!dragging || dragging === targetId) return;
        setCols(prev => {
            const arr  = [...prev];
            const from = arr.findIndex(c => c.id === dragging);
            const to   = arr.findIndex(c => c.id === targetId);
            const [item] = arr.splice(from, 1);
            arr.splice(to, 0, item);
            return arr;
        });
        setDragging(null); setOver(null);
    }

    return (
        <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div>
                    <p className="text-sm font-black text-slate-800">Column Settings</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Drag to reorder · Toggle to hide</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                {cols.map((col, idx) => (
                    <div
                        key={col.id}
                        draggable
                        onDragStart={() => handleDragStart(col.id)}
                        onDragOver={e  => handleDragOver(e, col.id)}
                        onDrop={()     => handleDrop(col.id)}
                        onDragEnd={()  => { setDragging(null); setOver(null); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                            over === col.id ? "bg-primary-50 border border-primary-200" :
                            dragging === col.id ? "opacity-40 bg-slate-50" : "hover:bg-slate-50"
                        }`}
                    >
                        {/* Drag handle */}
                        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

                        {/* Visibility toggle */}
                        <button
                            onClick={() => toggleVisible(col.id)}
                            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                col.visible
                                    ? "bg-primary-100 text-primary-600 hover:bg-rose-50 hover:text-rose-500"
                                    : "bg-slate-100 text-slate-400 hover:bg-primary-50 hover:text-primary-500"
                            }`}
                        >
                            {col.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Label */}
                        <span className={`flex-1 text-sm font-bold truncate ${col.visible ? "text-slate-800" : "text-slate-400 line-through"}`}>
                            {col.label}
                        </span>

                        {/* Up/Down */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button onClick={() => moveUp(idx)}   className="text-slate-300 hover:text-slate-600 transition-colors leading-none text-xs">▲</button>
                            <button onClick={() => moveDown(idx)} className="text-slate-300 hover:text-slate-600 transition-colors leading-none text-xs">▼</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                    onClick={() => setCols(DEFAULT_COLS)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors"
                >
                    Reset to default
                </button>
                <span className="text-[10px] text-slate-400">{cols.filter(c => c.visible).length} visible</span>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function Executives() {
    const [executives,  setExecutives]  = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [searchTerm,  setSearchTerm]  = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId,   setEditingId]   = useState(null);
    const [sortField,   setSortField]   = useState("name");
    const [sortDir,     setSortDir]     = useState("asc");
    const [cols,        setCols]        = useState(() => {
        try {
            const saved = localStorage.getItem("exec_cols");
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with DEFAULT_COLS in case new columns were added
                return DEFAULT_COLS.map(def => {
                    const found = parsed.find(p => p.id === def.id);
                    return found ? { ...def, visible: found.visible } : def;
                }).sort((a, b) => {
                    const ai = parsed.findIndex(p => p.id === a.id);
                    const bi = parsed.findIndex(p => p.id === b.id);
                    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                });
            }
        } catch {}
        return DEFAULT_COLS;
    });
    const [showPanel,   setShowPanel]   = useState(false);
    const [viewMode,    setViewMode]    = useState(() => {
        return localStorage.getItem("exec_view") || "table";
    });
    const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 768);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages,  setTotalPages]  = useState(1);
    const [totalResults,setTotalResults] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        return Number(localStorage.getItem("exec_rows_per_page")) || 10;
    });
    const panelRef = useRef(null);

    const [formData, setFormData] = useState({
        code: "", name: "", phone: "", place: "",
        join_date: "", fixed_salary: "", active: true,
    });

    // Close panel on outside click
    useEffect(() => {
        function handler(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Track screen size — force grid on mobile
    useEffect(() => {
        function onResize() { setIsMobile(window.innerWidth < 768); }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Persist column settings to localStorage
    useEffect(() => {
        localStorage.setItem("exec_cols", JSON.stringify(
            cols.map(c => ({ id: c.id, visible: c.visible }))
        ));
    }, [cols]);

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem("exec_view", viewMode);
    }, [viewMode]);

    // Persist rows per page
    useEffect(() => {
        localStorage.setItem("exec_rows_per_page", rowsPerPage.toString());
    }, [rowsPerPage]);

    // Effective view: always grid on mobile regardless of toggle
    const effectiveView = isMobile ? "grid" : viewMode;

    // View data directly from API state
    const displayData = executives;

    async function fetchExecutives(page = 1) {
        setLoading(true);
        try {
            const { data } = await api.get(`/executives?page=${page}&search=${searchTerm}`);
            setExecutives(data.data || []);
            setTotalPages(data.last_page);
            setTotalResults(data.total);
            setCurrentPage(data.current_page);
        } catch {
            toast.error("Failed to load executives");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { 
        const delayDebounceFn = setTimeout(() => { fetchExecutives(1); }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => { fetchExecutives(currentPage); }, [currentPage]);

    function handleAddNew() {
        setEditingId(null);
        setFormData({ code: "", name: "", phone: "", place: "", join_date: "", fixed_salary: "", active: true });
        setIsModalOpen(true);
    }

    function handleEdit(e, exec) {
        e.preventDefault();
        setEditingId(exec.id);
        setFormData({
            code: exec.code || "", name: exec.name || "",
            phone: exec.phone || "", place: exec.place || "",
            join_date: exec.join_date ? exec.join_date.split("T")[0] : "",
            fixed_salary: exec.fixed_salary || "", active: exec.active,
        });
        setIsModalOpen(true);
    }

    async function handleDelete(e, id) {
        e.preventDefault();
        if (!window.confirm("Delete this executive? This cannot be undone.")) return;
        try {
            await api.delete(`/executives/${id}`);
            toast.success("Executive deleted");
            fetchExecutives(currentPage);
        } catch {
            toast.error("Failed to delete executive");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = { 
                ...formData, 
                fixed_salary: formData.fixed_salary === "" ? 0 : Number(formData.fixed_salary),
                join_date: formData.join_date || null
            };
            if (editingId) {
                await api.put(`/executives/${editingId}`, payload);
                toast.success("Executive updated");
            } else {
                await api.post("/executives", payload);
                toast.success("Executive added");
            }
            setIsModalOpen(false);
            fetchExecutives(currentPage);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error saving executive");
        }
    }

    function toggleSort(field) {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    }

    const visibleCols = cols.filter(c => c.visible);

    const totalActive   = executives.filter(e => e.active).length;
    const totalInactive = (totalResults || executives.length) - totalActive;


    // Grid template from visible columns + actions
    const gridTemplate = [...visibleCols.map(c => c.width), "auto"].join(" ");

    // Render a cell value
    function renderCell(col, exec) {
        switch (col.id) {
            case "name":
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            {exec.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm truncate">{exec.name}</span>
                    </div>
                );
            case "code":
                return <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">{exec.code || "—"}</span>;
            case "phone":
                return (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{exec.phone || "—"}</span>
                    </div>
                );
            case "place":
                return (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{exec.place || "—"}</span>
                    </div>
                );
            case "join_date":
                return (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span>{exec.join_date ? new Date(exec.join_date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"2-digit" }) : "—"}</span>
                    </div>
                );
            case "fixed_salary":
                return <span className="text-sm font-bold text-slate-700">₹{Number(exec.fixed_salary || 0).toLocaleString()}</span>;
            case "active":
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${exec.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {exec.active && <Check className="w-3 h-3" />}
                        {exec.active ? "Active" : "Inactive"}
                    </span>
                );
            default:
                return <span className="text-sm text-slate-500">{exec[col.field] || "—"}</span>;
        }
    }

    // ── Pagination Footer Component ───────────────────────────────────────
    function PaginationFooter() {
        if (executives.length === 0) return null;

        const startIdx = (currentPage - 1) * rowsPerPage + 1;
        const endIdx   = Math.min(currentPage * rowsPerPage, totalResults);

        return (
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100`}>
                {/* Result Count */}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest order-2 sm:order-1">
                    Showing <span className="text-slate-900">{startIdx}</span> to <span className="text-slate-900">{endIdx}</span> of <span className="text-slate-900">{totalResults}</span> results
                </div>

                {/* Rows Per Page + Navigation */}
                <div className="flex items-center gap-6 order-1 sm:order-2">
                    {/* Rows Per Page */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xs:block">Rows:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1 cursor-pointer outline-none transition-all"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center px-4 h-9 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <span className="text-xs font-black text-slate-900">
                                {currentPage} <span className="text-slate-400 mx-1">/</span> {totalPages || 1}
                            </span>
                        </div>

                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executives</h1>
                    <p className="text-slate-400 text-sm mt-0.5 font-medium">Manage your field staff and profiles</p>
                </div>
                <button onClick={handleAddNew} className="btn-primary gap-2">
                    <Plus className="w-4 h-4" />
                    Add Executive
                </button>
            </div>

            {/* ── Stats Strip ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Users,     label: "Total",    value: executives.length, bg: "bg-slate-900 text-white",       sub: "text-slate-400" },
                    { icon: UserCheck, label: "Active",   value: totalActive,       bg: "bg-emerald-500 text-white",     sub: "text-emerald-100" },
                    { icon: UserX,     label: "Inactive", value: totalInactive,     bg: "bg-slate-100 text-slate-700",   sub: "text-slate-400" },
                ].map(({ icon: Icon, label, value, bg, sub }) => (
                    <div key={label} className={`${bg} rounded-2xl px-6 py-5 flex items-center justify-between shadow-soft`}>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>{label}</p>
                            <p className="text-3xl font-black mt-1">{value}</p>
                        </div>
                        <Icon className="w-8 h-8 opacity-20" />
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text" placeholder="Search name, code, place…"
                        className="input-field pl-11"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Column Settings — only in table mode */}
                {viewMode === "table" && (
                    <div className="relative" ref={panelRef}>
                        <button
                            onClick={() => setShowPanel(p => !p)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                showPanel
                                    ? "border-primary-400 bg-primary-50 text-primary-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                            <Settings2 className="w-4 h-4" />
                            Columns
                            <span className="text-[10px] font-black bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                                {visibleCols.length}/{cols.length}
                            </span>
                        </button>
                        {showPanel && (
                            <ColumnPanel cols={cols} setCols={setCols} onClose={() => setShowPanel(false)} />
                        )}
                    </div>
                )}

                {/* View Mode Toggle — hidden on mobile (always grid on small screens) */}
                <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 gap-1 ml-auto">
                    <button
                        onClick={() => setViewMode("table")}
                        title="Table view"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            effectiveView === "table"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <List className="w-4 h-4" />
                        Table
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        title="Grid view"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            effectiveView === "grid"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Grid
                    </button>
                </div>
            </div>

            {/* ── Data View ── */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            ) : effectiveView === "grid" ? (

                /* ══ GRID VIEW ══ */
                executives.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No executives found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {executives.map(exec => (
                                <div key={exec.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                                >
                                {/* Card top — gradient banner */}
                                <div className={`h-2 w-full ${exec.active ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-slate-200 to-slate-300"}`} />

                                <div className="p-5">
                                    {/* Avatar + name + status */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-lg flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                            {exec.name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-slate-900 text-sm leading-tight truncate">{exec.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {exec.code || "—"}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    exec.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                                }`}>
                                                    {exec.active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info rows */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                            <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            <span className="truncate">{exec.phone || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            <span className="truncate">{exec.place || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            <span>{exec.join_date ? new Date(exec.join_date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"2-digit" }) : "—"}</span>
                                        </div>
                                    </div>

                                    {/* Salary chip */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="bg-slate-900 text-white rounded-xl px-3 py-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Salary</span>
                                            <span className="text-sm font-black">₹{Number(exec.fixed_salary || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={e => handleEdit(e, exec)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={e => handleDelete(e, exec.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link to={`/executives/${exec.id}`}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="View">
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                            <PaginationFooter />
                        </div>
                    </div>
                )

            ) : (

                /* ══ TABLE VIEW ══ */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">

                    {/* Column Headers */}
                    <div
                        className="grid gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 items-center"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        {visibleCols.map(col => (
                            <div key={col.id}>
                                {col.sortable ? (
                                    <button
                                        onClick={() => toggleSort(col.field)}
                                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest hover:text-primary-600 transition-colors text-left ${
                                            sortField === col.field ? "text-primary-600" : "text-slate-400"
                                        }`}
                                    >
                                        {col.label}
                                        <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${
                                            sortField === col.field ? "text-primary-400" : "text-slate-200"
                                        }`} />
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {col.label}
                                    </span>
                                )}
                            </div>
                        ))}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</span>
                    </div>

                    {/* Rows */}
                    {executives.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No executives found</p>
                        </div>
                    ) : (
                        executives.map((exec, i) => (
                            <div
                                key={exec.id}
                                className={`grid gap-4 px-6 py-4 items-center border-b border-slate-50 hover:bg-primary-50/30 transition-colors group ${i % 2 === 0 ? "bg-white" : "bg-slate-50/20"}`}
                                style={{ gridTemplateColumns: gridTemplate }}
                            >
                                {visibleCols.map(col => (
                                    <div key={col.id} className="min-w-0">
                                        {renderCell(col, exec)}
                                    </div>
                                ))}

                                {/* Actions */}
                                <div className="flex items-center gap-1 justify-end">
                                    <button onClick={e => handleEdit(e, exec)}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={e => handleDelete(e, exec.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <Link to={`/executives/${exec.id}`}
                                        onClick={e => e.stopPropagation()}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="View Profile">
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Footer */}
                    <PaginationFooter />
                </div>
            )}

            {/* ── Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{editingId ? "Edit Executive" : "Add Executive"}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {editingId ? "Update profile details" : "Create a new profile"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Id No*</label>
                                    <input required className="input-field uppercase !bg-slate-50" value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Date</label>
                                    <input type="date" className="input-field !bg-slate-50" value={formData.join_date}
                                        onChange={e => setFormData({ ...formData, join_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name *</label>
                                <input required className="input-field uppercase !bg-slate-50" value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone *</label>
                                    <input required className="input-field !bg-slate-50" value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Place</label>
                                    <input 
                                        className="input-field uppercase !bg-slate-50 font-bold" 
                                        value={formData.place}
                                        placeholder="E.g. CALICUT..."
                                        onChange={e => setFormData({ ...formData, place: e.target.value.toUpperCase() })} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fixed Salary (₹)</label>
                                <input type="number" className="input-field !bg-slate-50" value={formData.fixed_salary}
                                    onChange={e => setFormData({ ...formData, fixed_salary: e.target.value })} />
                            </div>

                            {/* Active toggle */}
                            <div onClick={() => setFormData(f => ({ ...f, active: !f.active }))}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.active ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                                <div>
                                    <p className={`text-sm font-black ${formData.active ? "text-emerald-800" : "text-slate-600"}`}>
                                        {formData.active ? "Active" : "Inactive"}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Click to toggle status</p>
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${formData.active ? "right-0.5" : "left-0.5"}`} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors px-4">Cancel</button>
                                <button type="submit" className="btn-primary min-w-[160px] py-3.5 text-sm tracking-widest uppercase">
                                    {editingId ? "Update" : "Save Executive"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
