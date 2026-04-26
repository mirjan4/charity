import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

/**
 * Helper to convert ISO date to DD-MM-YYYY
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return dateStr;
    }
};

/**
 * Helper to convert number to Indian format words
 */
const numberToWords = (num) => {
    if (num === 0) return "Zero Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{1})(\d{2})(\d{2})$/);
        if (!nArray) return ''; 
        let str = '';
        str += (Number(nArray[1]) !== 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
        str += (Number(nArray[2]) !== 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
        str += (Number(nArray[3]) !== 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Hundred ' : '';
        str += (Number(nArray[4]) !== 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Thousand ' : '';
        str += (Number(nArray[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) + 'Only ' : 'Only';
        return str.trim();
    };
    return inWords(Math.floor(num));
};

export default function PaymentVoucher({ data, onClose }) {
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
        book_details = [],
        receipt_no = "---",
    } = data;

    const formattedDate = formatDate(record_date);

    const categories = [
        { 
            id: 'charity', 
            label: 'CHARITY', 
            dept: 'Charity Markaz P.R', 
            account: 'CHARITY COLLECTION EXPENSE',
            collection: Number(charity_collection),
            expense: Number(charity_expense),
            books: book_details.filter(b => b.type === 'charity' || b.type === 'Charity') 
        },
        { 
            id: 'orphanage', 
            label: 'ORPHANAGE', 
            dept: 'Orphanage Markaz', 
            account: 'ORPHANAGE COLLECTION EXPENSE',
            collection: Number(orphanage_collection),
            expense: Number(orphanage_expense),
            books: book_details.filter(b => b.type === 'orphanage' || b.type === 'Orphanage') 
        },
        { 
            id: 'kidma', 
            label: 'KIDMA', 
            dept: 'Kidma Markaz', 
            account: 'KIDMA COLLECTION EXPENSE',
            collection: Number(kidma_collection),
            expense: Number(kidma_expense),
            books: book_details.filter(b => b.type === 'khidma' || b.type === 'kidma' || b.type === 'Kidma' || b.type === 'Khidma') 
        }
    ].filter(cat => cat.books.length > 0 || cat.collection > 0);

    const handlePrint = () => { window.print(); };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[99999] flex flex-col items-center overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:static print:block">
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 bg-white/10 p-5 rounded-3xl border border-white/20 print:hidden shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Printer size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-xl leading-none italic uppercase tracking-widest">Physical Voucher Core</h2>
                        <p className="text-emerald-300 text-[11px] mt-1 font-bold uppercase tracking-widest italic">Typography Fine-tuned ✅</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest text-sm">Print Voucher</button>
                    <button onClick={onClose} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-white/10"><X size={24} /></button>
                </div>
            </div>

            <div className="voucher-scroll-area flex flex-col gap-10 print:gap-0">
                {categories.map((cat, catIdx) => {
                    const balance = cat.collection - cat.expense;
                    return (
                        <React.Fragment key={cat.id}>
                            <div className="a5-page physical-voucher-front bg-white shadow-2xl relative print:shadow-none print:m-0 print:page-break-after-always overflow-hidden font-sans text-[#1a1a1a]">
                                <div className="landscape-content-wrapper-physical">
                                    <div className="flex items-center mb-2 px-2">
                                        <div className="w-24 flex flex-col items-center">
                                            <div className="w-16 h-12 border-b-2 border-slate-300 relative">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-30 text-[9px] font-black uppercase">markaz</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center pr-12">
                                            <h1 className="text-2xl font-black tracking-widest leading-none mb-1">JAMIA MARKAZU SAQUAFATHI SUNNIYYA</h1>
                                            <p className="text-lg italic font-medium text-gray-700">Karanthoor, Kozhikode, 673571</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-400 mx-1 mb-3"></div>
                                    <div className="flex justify-between items-center mb-4 px-2 text-[12px] font-medium">
                                        <div className="flex items-center gap-4">
                                            <span>Voucher</span>
                                            <div className="border border-gray-500 min-w-[35px] h-[22px] flex items-center justify-center px-2 font-bold">{String(catIdx + 1).padStart(2, '0')}</div>
                                            <div className="border border-gray-500 w-[120px] h-[22px]"></div>
                                        </div>
                                        <div className="font-black text-sm tracking-[5px] uppercase">PAYMENT VOUCHER</div>
                                        <div className="flex items-center gap-4">
                                            <div className="border border-gray-500 min-w-[160px] h-[22px] flex items-center justify-between px-3 italic">
                                                <span className="text-[10px] opacity-60">Date:</span>
                                                <span className="font-bold">{formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 text-[12px] px-2">
                                        <div className="flex justify-between items-center h-6">
                                            <div className="flex items-center">
                                                <span className="w-36 italic opacity-70">Head of Account:</span>
                                                <span className="font-black uppercase">{cat.account}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="italic opacity-60 mr-4">Ref ID:</span>
                                                <span className="font-black uppercase">I.R.B #{receipt_no}/{data.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center h-6">
                                            <div className="flex items-center flex-1">
                                                <span className="w-36 italic opacity-70">Name and Address:</span>
                                                <span className="min-w-[40px] px-2 font-black">{executive.code}</span>
                                                <span className="font-black uppercase tracking-tight ml-4">{executive.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="italic opacity-60 mr-4">Department:</span>
                                                <span className="font-black uppercase">{cat.dept}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center h-7">
                                            <span className="w-36 italic opacity-70 text-xs">Received a sum of Rs:</span>
                                            <div className="border border-gray-500 w-[180px] h-full flex items-center justify-center font-black text-base px-2 shadow-inner">{cat.expense.toLocaleString()}</div>
                                            <span className="mx-4 italic opacity-70 text-xs">Rupees:</span>
                                            <div className="flex-1 italic font-black text-[11px] uppercase tracking-tighter opacity-80 border-b border-gray-200">{numberToWords(cat.expense)}</div>
                                        </div>
                                        <div className="flex items-center h-6">
                                            <span className="w-36 italic opacity-70">Towards:</span>
                                            <span className="font-black uppercase flex-1">Food and Ta</span>
                                            <div className="flex items-center gap-4 text-[11px] font-bold">
                                                <span>Collection: <span className="font-black text-[12px]">{cat.collection.toLocaleString()}</span></span>
                                                <span>Expense: <span className="font-black text-[12px]">{cat.expense.toLocaleString()}</span></span>
                                                <span>Balance: <span className="font-black text-[12px]">{balance.toLocaleString()}</span></span>
                                                <span className="italic opacity-50 px-2 tracking-tighter">Persentata</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center h-6 mb-6">
                                            <div className="flex items-center flex-1">
                                                <span className="w-36 italic opacity-70">Voucher Prepared by</span>
                                                <span className="font-black italic uppercase text-slate-300">irshad saquafi</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="italic opacity-60 mr-4">Attachments</span>
                                                <span className="font-black text-gray-200">...................</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-between items-end px-2 text-[10px] font-black italic text-gray-800">
                                        <div className="w-48 text-left border-t border-gray-300 pt-1">Head Of Dept</div>
                                        <div className="w-48 text-center border-t border-gray-300 pt-1">Accountant</div>
                                        <div className="w-48 text-right border-t border-gray-300 pt-1">Cashier</div>
                                        <div className="w-[180px] text-right border-t border-gray-300 pt-1">Name & Signature Of Receiver</div>
                                    </div>
                                    <div className="flex items-center h-7 mt-4">
                                        <span className="w-36 italic opacity-70 text-xs">Passed a sum of Rs:</span>
                                        <div className="border border-gray-500 w-[180px] h-full flex items-center justify-center font-black text-base px-2 bg-slate-50">{cat.expense.toLocaleString()}</div>
                                        <span className="mx-4 italic opacity-70 text-xs" >Rupees: </span>
                                        <div className="flex-1 italic font-black text-[11px] uppercase tracking-tighter opacity-80 border-b border-gray-200">{numberToWords(cat.expense)}</div>
                                    </div>
                                    <div className="text-right mt-6 pr-4 text-[11px] italic font-black text-gray-400 uppercase tracking-widest">Secretary / Manager</div>
                                </div>
                            </div>

                            <div className="a5-page physical-voucher-back bg-white shadow-2xl relative print:shadow-none print:m-0 print:page-break-after-always overflow-hidden border border-slate-100">
                                <div className="landscape-content-wrapper-physical">
                                    <div className="text-center font-black uppercase text-sm border-b-2 border-slate-900 pb-2 mb-4 tracking-widest italic">{cat.label} Collection Detail Audit Table</div>
                                    <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                        <thead>
                                            <tr className="bg-slate-50 font-black uppercase italic border-b-2 border-slate-900">
                                                <th className="border-r-2 border-slate-900 py-1.5 px-2 w-12 text-center">S.No</th>
                                                <th className="border-r-2 border-slate-900 text-left px-4 italic">Receipt Book Details</th>
                                                <th className="border-r-2 border-slate-900 text-center px-4">Leaves Range</th>
                                                <th className="border-r-2 border-slate-900 text-center px-2 w-20">Leaves</th>
                                                <th className="text-right px-4">Net Collected</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cat.books.map((b, i) => (
                                                <tr key={i} className="border-b border-slate-300 font-bold h-7 italic">
                                                    <td className="border-r-2 border-slate-900 text-center">{i+1}</td>
                                                    <td className="border-r-2 border-slate-900 px-4 uppercase font-black">{b.book_number}</td>
                                                    <td className="border-r-2 border-slate-900 text-center text-slate-400 font-medium">{b.start_page} to {b.end_page}</td>
                                                    <td className="border-r-2 border-slate-900 text-center font-black">{Number(b.end_page)-Number(b.start_page)+1}</td>
                                                    <td className="text-right px-4 font-black">₹{Number(b.amount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {Array.from({ length: Math.max(0, 10 - cat.books.length) }).map((_, i) => (
                                                <tr key={i} className="border-b border-slate-100 h-7 text-slate-100 italic"><td className="border-r-2 border-slate-900">.</td><td className="border-r-2 border-slate-900">.</td><td className="border-r-2 border-slate-900">.</td><td className="border-r-2 border-slate-900">.</td><td>.</td></tr>
                                            ))}
                                            <tr className="bg-slate-900 text-white font-black h-10 italic">
                                                <td className="px-4 text-xs font-black uppercase tracking-[5px]" colSpan="4">Grand Total Collection</td>
                                                <td className="text-right px-4 text-emerald-400 text-base">₹{cat.collection.toLocaleString()} /-</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div className="mt-10 flex justify-between items-center px-10">
                                        <div className="text-center font-black text-[9px] uppercase italic text-slate-300">
                                            <div className="border-b border-slate-300 w-52 h-8 mb-1"></div>
                                            Collection Officer Signature
                                        </div>
                                        <div className="text-center font-black text-[9px] uppercase italic text-slate-300">
                                            <div className="border-b border-slate-300 w-52 h-8 mb-1"></div>
                                            Executive Audit Signature
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A5 portrait; margin: 0; }
                    #root { display: none !important; }
                    body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    .a5-page { width: 148mm !important; height: 210mm !important; page-break-after: always !important; border: none !important; }
                    .landscape-content-wrapper-physical {
                        position: absolute !important;
                        width: 210mm !important;
                        height: 148mm !important;
                        top: 0 !important;
                        left: 0 !important;
                        padding: 10mm 12mm !important;
                        transform: rotate(90deg) translate(0, -148mm) !important;
                        transform-origin: top left !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                .a5-page { width: 148mm; height: 210mm; flex-shrink: 0; }
                .landscape-content-wrapper-physical { padding: 10mm 15mm; width: 210mm; height: 148mm; position: relative; }
                @media screen { .a5-page { height: 148mm; width: 210mm; } }
            `}} />
        </div>,
        document.body
    );
}
