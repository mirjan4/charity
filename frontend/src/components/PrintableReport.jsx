import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';

/**
 * PrintableReport Component
 * Replicates the physical report layout with 3 distinct categories: Charity, Orphanage, and Kidma.
 * Jamia books are merged into Charity or Kidma based on usage.
 */
export default function PrintableReport({ data, onClose }) {
    if (!data) return null;

    const {
        executive = {},
        record_date = "",
        charity_collection = 0,
        orphanage_collection = 0,
        kidma_collection = 0,
        charity_expense = 0,
        orphanage_expense = 0,
        kidma_expense = 0,
        actual_salary = 0,
        gratuity = (data.gratuity ?? data.pension ?? 0),
        paid_to_office = (data.paid_to_office ?? data.cash_paid ?? 0),
        incentive_amount = 0,
        book_details = [],
        receipt_no = "---",
        checked_by = "Admin",
        savings = 0,
        prev_gratuity = 0,
        prev_savings = 0,
        box_count = 0,
        box_percentage = 0
    } = data;

    const totalCollection = Number(charity_collection) + Number(orphanage_collection) + Number(kidma_collection);
    
    // Grouping Rules for 3 Separate sections
    const charityBooks = book_details.filter(b => b.type === 'charity' || (b.book_source === 'jamia' && b.type === 'charity'));
    const orphanageBooks = book_details.filter(b => b.type === 'orphanage');
    const kidmaBooks = book_details.filter(b => b.type === 'khidma' || b.type === 'kidma' || (b.book_source === 'jamia' && (b.type === 'khidma' || b.type === 'kidma')));

    const handlePrint = () => {
        window.print();
    };

    // Calculation Constants - Use actual saved expenses from database
    const markazAllowance = Number(charity_expense || 0); 
    const orphanageAllowance = Number(orphanage_expense || 0);
    const kidmaAllowance = Number(kidma_expense || 0);
    
    return createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-start overflow-y-auto p-4 md:p-10 print:p-0 print:bg-white print:static print:block static">
            
            {/* Control Header */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 bg-white/10 p-4 rounded-2xl border border-white/20 print:hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <Printer size={20} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-none">A4 Report Layout</h2>
                        <p className="text-indigo-200 text-xs mt-1">3 Categories: Charity, Orphanage, Kidma</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        Print Report
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-rose-500/20 hover:text-rose-200 transition-all border border-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* A4 Paper Container */}
            <div className="print-area bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] text-black font-sans print:shadow-none print:w-[210mm] print:p-[15mm] print:m-0 print:block">
                
                {/* Name & ID line */}
                <div className="mb-6 font-bold text-[14px] flex items-center relative">
                    <div>Name: <span className="uppercase">{executive?.name}</span></div>
                    <div className="absolute left-1/2 -translate-x-1/2">ID NO: {executive?.code}</div>
                </div>

                {/* CHARITY (MARKAZ) TABLE */}
                {charityBooks.length > 0 && (
                    <div className="mb-4">
                        <table className="w-1/2 border-collapse border border-black text-center text-[12px]">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-white">
                                    <th colSpan="3" className="py-1.5 border border-black uppercase text-[12px] tracking-[0.2em] font-black">Markaz (Charity)</th>
                                </tr>
                                <tr className="bg-slate-50 italic">
                                    <th className="border border-black py-1 w-1/4">Book No</th>
                                    <th className="border border-black py-1 w-1/2">Receipt No</th>
                                    <th className="border border-black py-1 w-1/4">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {charityBooks.map((b, i) => (
                                    <tr key={i} className="leading-tight">
                                        <td className="border border-black py-1.5">
                                            {b.book_number}
                                            {b.book_source === 'jamia' && (
                                                <span className="block text-[8px] font-black italic text-slate-900 border border-slate-300 rounded px-1 bg-slate-100 w-fit mx-auto mt-0.5 uppercase leading-none">Jamia</span>
                                            )}
                                        </td>
                                        <td className="border border-black py-0">
                                            <div className="flex h-full">
                                                <span className="flex-1 border-r border-black py-1.5">{b.receipt_start}</span>
                                                <span className="flex-1 py-1.5">{b.receipt_end}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black py-1.5">{Number(b.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold print:font-black">
                                    <td colSpan="2" className="border border-black py-1.5 text-left px-4 italic bg-slate-50 uppercase text-[10px]">Total Charity</td>
                                    <td className="border border-black py-1.5 text-[14px]">₹{Number(charity_collection).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ORPHANAGE TABLE */}
                {orphanageBooks.length > 0 && (
                    <div className="mb-4">
                        <table className="w-1/2 border-collapse border border-black text-center text-[12px]">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-white">
                                    <th colSpan="3" className="py-1.5 border border-black uppercase text-[12px] tracking-[0.2em] font-black">Orphanage</th>
                                </tr>
                                <tr className="bg-slate-50 italic">
                                    <th className="border border-black py-1 w-1/4">Book No</th>
                                    <th className="border border-black py-1 w-1/2">Receipt No</th>
                                    <th className="border border-black py-1 w-1/4">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orphanageBooks.map((b, i) => (
                                    <tr key={i} className="leading-tight">
                                        <td className="border border-black py-1.5">{b.book_number || '---'}</td>
                                        <td className="border border-black py-0">
                                            <div className="flex h-full">
                                                <span className="flex-1 border-r border-black py-1.5">{b.receipt_start}</span>
                                                <span className="flex-1 py-1.5">{b.receipt_end}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black py-1.5">{Number(b.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold print:font-black">
                                    <td colSpan="2" className="border border-black py-1.5 text-left px-4 italic bg-slate-50 uppercase text-[10px]">Total Orphanage</td>
                                    <td className="border border-black py-1.5 text-[14px]">₹{Number(orphanage_collection).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* KIDMA TABLE */}
                {kidmaBooks.length > 0 && (
                    <div className="mb-6">
                        <table className="w-1/2 border-collapse border border-black text-center text-[12px]">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-white">
                                    <th colSpan="3" className="py-1.5 border border-black uppercase text-[12px] tracking-[0.2em] font-black">Kidma</th>
                                </tr>
                                <tr className="bg-slate-50 italic">
                                    <th className="border border-black py-1 w-1/4">Book No</th>
                                    <th className="border border-black py-1 w-1/2">Receipt No</th>
                                    <th className="border border-black py-1 w-1/4">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kidmaBooks.map((b, i) => (
                                    <tr key={i} className="leading-tight">
                                        <td className="border border-black py-1.5">
                                            {b.book_number || '---'}
                                            {b.book_source === 'jamia' && (
                                                <span className="block text-[8px] font-black italic text-slate-900 border border-slate-300 rounded px-1 bg-slate-100 w-fit mx-auto mt-0.5 uppercase leading-none">Jamia</span>
                                            )}
                                        </td>
                                        <td className="border border-black py-0">
                                            <div className="flex h-full">
                                                <span className="flex-1 border-r border-black py-1.5">{b.receipt_start}</span>
                                                <span className="flex-1 py-1.5">{b.receipt_end}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black py-1.5">{Number(b.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold print:font-black">
                                    <td colSpan="2" className="border border-black py-1.5 text-left px-4 italic bg-slate-50 uppercase text-[10px]">Total Kidma</td>
                                    <td className="border border-black py-1.5 text-[14px]">₹{Number(kidma_collection).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CALCULATION SECTION */}
                <div className="flex gap-6">
                    {/* Left Summary Table */}
                    <table className="flex-1 border-collapse border border-black text-[11px] print:text-[12px]">
                        <thead>
                            <tr className="italic font-bold bg-slate-50">
                                <td className="border border-black px-2 py-1">Type</td>
                                <td className="border border-black px-2 py-1 w-20 text-center">Collection</td>
                                <td className="border border-black px-2 py-1 w-20 text-center">Allow.</td>
                                <td className="border border-black px-2 py-1 w-20 text-center">Bal.</td>
                            </tr>
                        </thead>
                        <tbody className="font-bold print:font-black">
                            <tr>
                                <td className="border border-black px-2 py-1 font-normal">Charity (Markaz)</td>
                                <td className="border border-black px-2 py-1 text-right">{Number(charity_collection).toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{markazAllowance.toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{(charity_collection - markazAllowance).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 font-normal">Orphanage</td>
                                <td className="border border-black px-2 py-1 text-right">{Number(orphanage_collection).toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{orphanageAllowance.toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{(Number(orphanage_collection) - orphanageAllowance).toLocaleString()}</td>
                            </tr>
                            {Number(kidma_collection) > 0 && (
                                <tr>
                                    <td className="border border-black px-2 py-1 font-normal">Kidma</td>
                                    <td className="border border-black px-2 py-1 text-right">{Number(kidma_collection).toLocaleString()}</td>
                                    <td className="border border-black px-2 py-1 text-right">{kidmaAllowance.toLocaleString()}</td>
                                    <td className="border border-black px-2 py-1 text-right">{(Number(kidma_collection) - kidmaAllowance).toLocaleString()}</td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-black bg-slate-50/50">
                                <td className="border border-black px-2 py-1">Total</td>
                                <td className="border border-black px-2 py-1 text-right">{totalCollection.toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{(markazAllowance + orphanageAllowance + kidmaAllowance).toLocaleString()}</td>
                                <td className="border border-black px-2 py-1 text-right">{(totalCollection - (markazAllowance + orphanageAllowance + kidmaAllowance)).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 bg-slate-50/20 italic">Total Allowance</td>
                                <td className="border border-black px-2 py-1 text-right font-black">₹{Number(actual_salary).toLocaleString()}</td>
                                <td className="border border-black border-l-0" colSpan="2"></td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1">Box Count / %</td>
                                <td className="border border-black px-2 py-1 text-right">{box_count} / {box_percentage}%</td>
                                <td className="border border-black px-2 py-1 text-right">0</td>
                                <td className="border border-black border-l-0"></td>
                            </tr>
                            <tr className="bg-rose-50/50 border-t-2 border-black">
                                <td className="border border-black px-2 py-1 text-rose-800">Gratuity</td>
                                <td className="border border-black px-2 py-1 text-right text-rose-900 border-r-0"> ₹{Number(gratuity).toLocaleString()}</td>
                                <td className="border border-black border-l-0" colSpan="2"></td>
                            </tr>
                            <tr className="bg-emerald-50/50">
                                <td className="border border-black px-2 py-1 text-emerald-800">Salary Payable</td>
                                <td className="border border-black px-2 py-1 text-right text-[14px] text-emerald-950 font-black italic border-r-0">₹{(Number(actual_salary) - Number(gratuity)).toLocaleString()}</td>
                                <td className="border border-black border-l-0" colSpan="2"></td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1">Savings / PF</td>
                                <td className="border border-black px-2 py-1 text-right">{Number(savings || 0).toLocaleString()}</td>
                                <td className="border border-black border-l-0" colSpan="2"></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Right Side Info */}
                    <div className="w-[180px] flex flex-col gap-6">
                        {/* Paid Amount Box */}
                        <div className="border-2 border-black h-[100px] flex flex-col items-center justify-center p-2 bg-slate-50 shadow-inner">
                            <span className="text-[10px] uppercase font-black mb-2 border-b border-black/20 pb-1">Paid to Office</span>
                            <span className="text-3xl font-black italic tracking-tighter">₹{Number(paid_to_office).toLocaleString()}</span>
                        </div>

                        {/* Salary Summary Table */}
                        <div className="border border-black overflow-hidden ring-1 ring-black">
                             <div className="bg-[#f0f0f0] text-center py-0.5 font-black uppercase text-[8px] border-b border-black">
                                Salary Summary
                            </div>
                            <table className="w-full border-collapse text-[10px] font-bold">
                                <tbody>
                                    <tr>
                                        <td className="px-1 py-1 border-b border-black text-slate-500 italic">Salary Payable</td>
                                        <td className="px-1 py-1 border-b border-black text-right">₹{Number(actual_salary).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-1 py-1 border-b border-black text-slate-500 italic">Incentive</td>
                                        <td className="px-1 py-1 border-b border-black text-right text-amber-700">₹{Number(incentive_amount).toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="px-1 py-1 font-black uppercase text-[8px]">Total Salary</td>
                                        <td className="px-1 py-1 text-right font-black text-indigo-700">₹{(Number(actual_salary) + Number(incentive_amount)).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Fund Balance Table */}
                        <div className="border border-black overflow-hidden ring-1 ring-black">
                             <div className="bg-[#f0f0f0] text-center py-0.5 font-black uppercase text-[8px] border-b border-black">
                                Fund History
                            </div>
                            <table className="w-full border-collapse text-[10px] font-bold">
                                <thead>
                                    <tr className="italic bg-slate-50">
                                        <td className="border-r border-black px-1 py-1"></td>
                                        <td className="border-r border-black px-0.5 py-1 text-center">Gratuity</td>
                                        <td className="px-0.5 py-1 text-center">Savings</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-black">
                                        <td className="border-r border-black px-1 py-1 bg-slate-50 italic">Prev.</td>
                                        <td className="border-r border-black px-1 py-1 text-right font-medium">
                                            ₹{(Number(data.accumulated_pension || 0) - (Number(data.gratuity) || Number(data.pension) || 0)).toLocaleString()}
                                        </td>
                                        <td className="px-1 py-1 text-right font-medium">
                                            ₹{(Number(data.accumulated_pf || 0) - (Number(data.pf) || 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr className="border-t border-black bg-slate-100">
                                        <td className="border-r border-black px-1 py-1 font-black">Final</td>
                                        <td className="border-r border-black px-1 py-1 text-right text-blue-900 font-black">
                                            ₹{Number(data.accumulated_pension || 0).toLocaleString()}
                                        </td>
                                        <td className="px-1 py-1 text-right text-emerald-900 font-black">
                                            ₹{Number(data.accumulated_pf || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Organizer & Office Box */}
                <div className="mt-8 space-y-6">
                    <div className="font-bold print:font-black text-[13px] flex items-center gap-4">
                        Organizer Name & Signature : <div className="flex-1 border-b-2 border-black border-dotted h-8"></div>
                    </div>
                    
                    <div className="border-[1.5px] border-black overflow-hidden">
                        <div className="bg-[#1a1a1a] text-white text-center py-1 font-black uppercase text-[10px] tracking-[0.3em] border-b border-black">
                            For Office Use Only
                        </div>
                        <div className="grid grid-cols-2 text-[11px] font-bold print:font-black">
                            <div className="border-r border-black p-2.5 flex items-center">
                                Date : <span className="ml-3 font-normal italic underline decoration-slate-300">
                                     {(() => {
                                         try {
                                             return record_date ? format(new Date(record_date), 'dd - MM - yyyy') : '---';
                                         } catch (e) {
                                             return record_date || '---';
                                         }
                                     })()}
                                 </span>
                            </div>
                            <div className="p-2.5 flex items-center">
                                Receipt No. : <span className="ml-3 font-black text-[13px]">{receipt_no || '--/---'}</span>
                            </div>
                            <div className="border-t border-r border-black p-2.5 flex items-center">
                                Checked By : <span className="ml-3 font-black uppercase">{checked_by}</span>
                            </div>
                            <div className="border-t border-black p-2.5 flex items-center justify-between">
                                Signature : <div className="h-4 w-32 border-b-2 border-black/10"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Print Styling */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    /* Hide the main app root entirely */
                    #root {
                        display: none !important;
                    }
                    /* Ensure body is visible and background is white */
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Position the detached portal content */
                    .static.fixed {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        background: white !important;
                        display: block !important;
                        z-index: 999999 !important;
                        visibility: visible !important;
                    }
                    .print-area {
                        padding: 15mm !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />
        </div>,
        document.body
    );
}
