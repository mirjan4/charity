<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookUsage extends Model
{
    protected $fillable = [
        'monthly_record_id',
        'receipt_book_id',
        'category',
        'start_page',
        'end_page',
        'amount',
    ];

    public function monthlyRecord()
    {
        return $this->belongsTo(MonthlyRecord::class);
    }

    public function receiptBook()
    {
        return $this->belongsTo(ReceiptBook::class);
    }
}
