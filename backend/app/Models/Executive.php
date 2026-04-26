<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Executive extends Model
{
    protected $fillable = [
        'code',
        'name',
        'phone',
        'join_date',
        'fixed_salary',
        'place',
        'active',
    ];

    protected $casts = [
        'fixed_salary' => 'float',
        'join_date'    => 'date',
        'active'       => 'boolean',
    ];

    public function monthlyRecords(): HasMany
    {
        return $this->hasMany(MonthlyRecord::class);
    }

    public function pfLedgers(): HasMany
    {
        return $this->hasMany(PfLedger::class);
    }

    public function receiptBooks(): HasMany
    {
        return $this->hasMany(ReceiptBook::class);
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }
}
