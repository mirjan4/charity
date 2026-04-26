<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptBook extends Model
{
    protected $fillable = [
        'executive_id',
        'type',
        'book_number',
        'leaves',
        'status',
        'issued_date',
        'returned_date',
    ];

    public function executive()
    {
        return $this->belongsTo(Executive::class);
    }
}
