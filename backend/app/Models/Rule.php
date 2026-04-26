<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rule extends Model
{
    protected $fillable = [
        'pension_mode',
        'pension_rate',
        'pf_lock_months',
    ];

    protected $casts = [
        'pension_rate' => 'float',
    ];
}
