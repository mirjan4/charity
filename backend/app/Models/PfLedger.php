<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PfLedger extends Model
{
    protected $fillable = [
        'executive_id',
        'date',
        'type',
        'amount',
        'reference_month',
        'note',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
    ];

    public function executive(): BelongsTo
    {
        return $this->belongsTo(Executive::class);
    }
}
