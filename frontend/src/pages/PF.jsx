import { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
    Wallet, History, User, PiggyBank, X, ArrowDownLeft,
    TrendingUp, Calendar, ShieldCheck, ArrowUpRight,
    BadgeCheck, AlertCircle, Banknote, ChevronDown
} from "lucide-react";

export default function PF() {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedExec, setSelectedExec] = useState(null);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);

    useEffect(() => { loadExecutives(); }, []);

    async function loadExecutives() {
        setLoading(true);
        try {
            const { data } = await api.get('/executives');
            setExecutives(data?.data || data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load executives");
        } finally {
            setLoading(false);
        }
    }

    const openWithdraw = (exec) => { setSelectedExec(exec); setShowWithdrawModal(true); };
    const openLedger  = (exec) => { setSelectedExec(exec); setShowLedgerModal(true); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* ── Header ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/60">
                            <PiggyBank className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Provident Fund</h1>
                        </div>
                    </div>
                    <p className="text-slate-500 ml-[56px] text-sm">
                        Single source of truth — Total Savings drives every balance calculation
                    </p>
                </div>

                {/* ── Formula Banner ── */}
                <div className="mb-8 flex flex-wrap items-center gap-3 bg-white border-2 border-indigo-100 rounded-2xl px-5 py-3.5 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest">
                        <Wallet className="w-4 h-4" />
                        Total Savings
                    </div>
                    <span className="text-slate-400 font-bold">−</span>
                    <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
                        <ArrowDownLeft className="w-4 h-4" />
                        Withdrawals
                    </div>
                    <span className="text-slate-400 font-bold">=</span>
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest">
                        <BadgeCheck className="w-4 h-4" />
                        Available Balance
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
                        Consistent across all 3 views
                    </span>
                </div>

                {/* ── Executive Cards ── */}
                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {executives.map(exec => {
                            const totalSavings    = Number(exec.total_savings || 0);
                            const availableBalance = Number(exec.pf_balance   || 0); // already = savings - withdrawals
                            const gratuity        = Number(exec.gratuity_balance || 0);
                            const withdrawn       = totalSavings - availableBalance;

                            return (
                                <div
                                    key={exec.id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-blue-200 overflow-hidden group"
                                >
                                    <div className="p-6">
                                        {/* Executive Header */}
                                        <div className="flex items-center gap-3.5 mb-6">
                                            <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200/50 shrink-0">
                                                <User size={26} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{exec.name}</h3>
                                                <div className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                                                    {exec.code || 'ID: --'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Balance Cards ── */}
                                        <div className="space-y-2.5 mb-5">

                                            {/* 1. Available Balance — primary hero number */}
                                            <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/60">
                                                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-200/20 rounded-full blur-2xl -mr-14 -mt-14" />
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span className="text-[10px] uppercase tracking-widest text-indigo-700 font-black">
                                                                Available Balance
                                                            </span>
                                                        </div>
                                                        {/* Show Withdrawn pill when applicable */}
                                                        {withdrawn > 0 && (
                                                            <span className="text-[9px] bg-rose-100 text-rose-600 font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <ArrowDownLeft className="w-2.5 h-2.5" />
                                                                −₹{withdrawn.toLocaleString()} withdrawn
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-semibold text-indigo-500">₹</span>
                                                        <span className="text-3xl font-black text-indigo-900 tracking-tight">
                                                            {availableBalance.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Gratuity */}
                                            <div className="relative overflow-hidden p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60">
                                                <div className="relative flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                                                        <span className="text-[10px] uppercase tracking-widest text-amber-700 font-black">
                                                            Gratuity
                                                        </span>
                                                    </div>
                                                    <span className="text-xl font-black text-amber-900">
                                                        ₹{gratuity.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => openWithdraw(exec)}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:shadow-md hover:shadow-rose-100 active:scale-95"
                                            >
                                                <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} />
                                                Withdraw
                                            </button>
                                            <button
                                                onClick={() => openLedger(exec)}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 active:scale-95"
                                            >
                                                <History className="w-4 h-4" strokeWidth={2.5} />
                                                History
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Modals ── */}
                {showWithdrawModal && selectedExec && (
                    <WithdrawModal
                        exec={selectedExec}
                        onClose={() => setShowWithdrawModal(false)}
                        onSuccess={() => { setShowWithdrawModal(false); loadExecutives(); }}
                    />
                )}
                {showLedgerModal && selectedExec && (
                    <LedgerModal
                        exec={selectedExec}
                        onClose={() => setShowLedgerModal(false)}
                    />
                )}
            </div>
        </div>
    );
}


/* ════════════════════════════════════════════
   WITHDRAW MODAL
   Available Balance = Total Savings - Withdrawals
   (single API call for consistency)
════════════════════════════════════════════ */
function WithdrawModal({ exec, onClose, onSuccess }) {
    const [amount, setAmount] = useState("");
    const [note, setNote]     = useState("");
    const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [totalSavings, setTotalSavings]         = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        setFetching(true);
        api.get(`/pf/${exec.id}`).then(({ data }) => {
            setTotalSavings(data.total_savings ?? 0);
            setAvailableBalance(data.balance ?? 0);
        }).finally(() => setFetching(false));
    }, [exec.id]);

    const withdrawAmount  = Number(amount) || 0;
    const balanceAfter    = availableBalance - withdrawAmount;
    const isOverdrawn     = withdrawAmount > availableBalance;
    const isInvalid       = withdrawAmount <= 0 || isOverdrawn;

    async function handleSubmit(e) {
        e.preventDefault();
        if (isInvalid) return;
        setLoading(true);
        try {
            await api.post('/pf/withdraw', {
                executive_id: exec.id,
                amount: withdrawAmount,
                date,
                note: note || "PF Withdrawal"
            });
            toast.success("Withdrawal processed successfully");
            onSuccess();
        } catch (error) {
            const msg = error.response?.data?.error || "Withdrawal failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-rose-50/30">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Withdraw Funds</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Process PF withdrawal for {exec.name}</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
                        </div>
                    ) : (
                        <>
                            {/* Balance Summary Row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Total Savings */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-center">
                                    <div className="text-[9px] uppercase tracking-widest font-black text-indigo-600 mb-1 flex items-center justify-center gap-1">
                                        <Wallet className="w-3 h-3" /> Total Savings
                                    </div>
                                    <div className="text-xl font-black text-indigo-900">
                                        ₹{totalSavings.toLocaleString()}
                                    </div>
                                </div>
                                {/* Available Balance */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                                    <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600 mb-1 flex items-center justify-center gap-1">
                                        <BadgeCheck className="w-3 h-3" /> Available
                                    </div>
                                    <div className="text-xl font-black text-emerald-900">
                                        ₹{availableBalance.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Withdrawal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-lg">₹</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={availableBalance}
                                        className={`w-full pl-10 pr-4 py-3.5 text-lg font-semibold rounded-xl border-2 outline-none transition-all bg-white ${
                                            isOverdrawn
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                        }`}
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                {/* Live balance after */}
                                {withdrawAmount > 0 && (
                                    <div className={`mt-2 text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg ${
                                        isOverdrawn
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        {isOverdrawn
                                            ? <><AlertCircle className="w-3.5 h-3.5" /> Exceeds available balance</>
                                            : <><BadgeCheck className="w-3.5 h-3.5" /> Balance after: ₹{balanceAfter.toLocaleString()}</>
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Date Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white font-semibold text-slate-700"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>

                            {/* Note Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason / Note</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none bg-white"
                                    rows="2"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Add a note about this withdrawal..."
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || isInvalid}
                                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white py-3.5 rounded-xl text-base font-bold shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : "Confirm & Withdraw"}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}


/* ════════════════════════════════════════════
   LEDGER / HISTORY MODAL
   Withdrawal history with running balance
════════════════════════════════════════════ */
function LedgerModal({ exec, onClose }) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLedger() {
            try {
                const { data: res } = await api.get(`/pf/ledger/${exec.id}`);
                setData(res);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load history");
            } finally {
                setLoading(false);
            }
        }
        fetchLedger();
    }, [exec.id]);

    const totalSavings     = data?.total_savings    ?? 0;
    const availableBalance = data?.available_balance ?? 0;
    const withdrawals      = data?.withdrawals       ?? [];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-blue-50/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
                            <History className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{exec.name}</h3>
                            <p className="text-sm text-slate-500 font-medium">Withdrawal History</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-xl flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Strip */}
                {!loading && data && (
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 shrink-0">
                        <div className="px-6 py-4 text-center">
                            <div className="text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-1 flex items-center justify-center gap-1">
                                <Wallet className="w-3 h-3" /> Total Savings
                            </div>
                            <div className="text-2xl font-black text-indigo-900">₹{totalSavings.toLocaleString()}</div>
                        </div>
                        <div className="px-6 py-4 text-center">
                            <div className="text-[10px] uppercase tracking-widest font-black text-rose-600 mb-1 flex items-center justify-center gap-1">
                                <ArrowDownLeft className="w-3 h-3" /> Total Withdrawn
                            </div>
                            <div className="text-2xl font-black text-rose-700">
                                ₹{(totalSavings - availableBalance).toLocaleString()}
                            </div>
                        </div>
                        <div className="px-6 py-4 text-center">
                            <div className="text-[10px] uppercase tracking-widest font-black text-emerald-600 mb-1 flex items-center justify-center gap-1">
                                <BadgeCheck className="w-3 h-3" /> Available Balance
                            </div>
                            <div className="text-2xl font-black text-emerald-800">₹{availableBalance.toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 py-24">
                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Banknote className="w-10 h-10 opacity-30" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-500">No withdrawals yet</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Full balance of ₹{totalSavings.toLocaleString()} is available
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50/80 sticky top-0 z-10 border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">#</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Note</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-rose-600 uppercase tracking-widest">Withdrawn</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-emerald-600 uppercase tracking-widest">Balance After</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {/* Opening balance row */}
                                    <tr className="bg-indigo-50/50">
                                        <td className="px-6 py-3 text-xs font-black text-indigo-400 uppercase tracking-wider" colSpan={3}>
                                            Opening (Total Savings)
                                        </td>
                                        <td className="px-6 py-3 text-right"></td>
                                        <td className="px-6 py-3 text-right text-base font-black text-indigo-700">
                                            ₹{totalSavings.toLocaleString()}
                                        </td>
                                    </tr>
                                    {withdrawals.map((entry, idx) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-400">{withdrawals.length - idx}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-rose-50 group-hover:bg-rose-100 transition-colors flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {format(new Date(entry.date), "dd MMM yyyy")}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium max-w-[200px] truncate">
                                                {entry.note || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-base font-black text-rose-600">
                                                    − ₹{entry.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-base font-black ${entry.balance_after >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    ₹{entry.balance_after.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}