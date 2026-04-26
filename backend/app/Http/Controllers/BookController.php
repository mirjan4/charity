<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use App\Models\ReceiptBook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = ReceiptBook::query();

        if ($request->has('unassigned')) {
            $query->whereNull('executive_id');
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Cache unassigned books for 10 minutes since they don't change often
        if ($request->has('unassigned') && !$request->has('type')) {
            return response()->json(
                \Illuminate\Support\Facades\Cache::remember('unassigned_books', 600, function () use ($query) {
                    return $query->orderByRaw('LENGTH(book_number) asc, book_number asc')->get();
                })
            );
        }

        return response()->json($query->orderByRaw('LENGTH(book_number) asc, book_number asc')->get());
    }

    public function executiveBooks($executiveId)
    {
        return response()->json(
            ReceiptBook::where('executive_id', $executiveId)
                ->select('id', 'type', 'book_number', 'leaves', 'status', 'issued_date', 'returned_date', 'executive_id')
                ->addSelect([
                    'last_page_used' => \App\Models\BookUsage::selectRaw('MAX(end_page)')
                        ->whereColumn('receipt_book_id', 'receipt_books.id')
                ])
                ->orderByRaw('LENGTH(book_number) asc, book_number asc')
                ->get()
        );
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'type'         => 'required|in:charity,orphanage,jamia',
            'serial_prefix' => 'nullable|string',
            'start_number' => 'required|integer',
            'end_number'   => 'required|integer|gte:start_number',
            'leaves'       => 'required|integer|min:1',
            'executive_id' => 'nullable|exists:executives,id',
        ]);

        $prefix = $validated['serial_prefix'] ?? '';
        $start = (int)$validated['start_number'];
        $end = (int)$validated['end_number'];
        
        $count = $end - $start + 1;
        if ($count > 5000) {
            return response()->json(['error' => 'Limit exceeded (max 5000)'], 422);
        }

        $books = [];
        $now = now();
        
        DB::beginTransaction();
        try {
            for ($i = $start; $i <= $end; $i++) {
                $numStr = (string)$i;
                $startStr = (string)$request->start_number;
                if (strlen($startStr) > strlen($numStr)) {
                    $numStr = str_pad($numStr, strlen($startStr), '0', STR_PAD_LEFT);
                }

                $bookNumber = $prefix . $numStr;

                $books[] = [
                    'executive_id' => $validated['executive_id'] ?? null,
                    'type'         => $validated['type'],
                    'book_number'  => $bookNumber,
                    'leaves'       => $validated['leaves'],
                    'status'       => 'active',
                    'issued_date'  => ($validated['executive_id'] ?? null) ? $now->toDateString() : null,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];

                if (count($books) >= 500) {
                    ReceiptBook::insert($books);
                    $books = [];
                }
            }
            if (!empty($books)) ReceiptBook::insert($books);

            DB::commit();
            return response()->json(['message' => "Successfully added $count books to " . (($validated['executive_id'] ?? null) ? "executive" : "central store") . "."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'book_ids'     => 'required|array',
            'book_ids.*'   => 'exists:receipt_books,id',
            'executive_id' => 'required|exists:executives,id',
        ]);

        ReceiptBook::whereIn('id', $validated['book_ids'])
            ->update([
                'executive_id' => $validated['executive_id'],
                'issued_date'  => now()->toDateString(),
                'status'       => 'active'
            ]);

        return response()->json(['message' => 'Books assigned successfully.']);
    }

    public function updateStatus(Request $request, $id)
    {
        $book = ReceiptBook::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|in:active,used,returned,lost',
        ]);

        $book->update([
            'status' => $validated['status'],
            'returned_date' => $validated['status'] === 'returned' ? now()->toDateString() : $book->returned_date,
        ]);

        return response()->json($book);
    }

    public function history($id)
    {
        $book = ReceiptBook::findOrFail($id);
        $usages = \App\Models\BookUsage::where('receipt_book_id', $id)
            ->with('monthlyRecord:id,record_date,executive_id')
            ->orderBy('start_page', 'asc')
            ->get()
            ->map(fn($u) => [
                'id'           => $u->id,
                'record_date'  => $u->monthlyRecord?->record_date,
                'category'     => $u->category,
                'start_page'   => $u->start_page,
                'end_page'     => $u->end_page,
                'pages_used'   => $u->end_page - $u->start_page + 1,
                'amount'       => $u->amount,
            ]);

        return response()->json([
            'book'   => $book,
            'usages' => $usages,
        ]);
    }

    public function destroy($id)
    {
        ReceiptBook::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
