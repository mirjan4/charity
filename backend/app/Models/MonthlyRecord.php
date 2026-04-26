<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyRecord extends Model
{
    // Removed appends to prevent N+1 queries
    // Use custom queries with selectRaw() instead
    protected $fillable = [
        'executive_id',        'record_date',        'month',
        'charity_collection',
        'orphanage_collection',
        'kidma_collection',
        'charity_expense',
        'orphanage_expense',
        'kidma_expense',
        'pension_mode',
        'pension_manual',
        'pension_rate',
        'allowance_mode',
        'allowance_rate',
        'allowance_manual',
        'actual_salary',
        'pension',
        'pf',
        'paid_to_office',
        'charity_book_id',
        'orphanage_book_id',
        'kidma_book_id',
        'incentive_leaves',
        'incentive_rate',
        'incentive_amount',
        'box_count',
        'box_percentage',
        'notes',
        'salary_mode',
        'paid_salary',
        'savings',
    ];

    protected $casts = [
        'record_date'          => 'date',
        'charity_collection'   => 'float',
        'orphanage_collection' => 'float',
        'kidma_collection'     => 'float',
        'charity_expense'      => 'float',
        'orphanage_expense'    => 'float',
        'kidma_expense'        => 'float',
        'pension_manual'       => 'float',
        'pension_rate'         => 'float',
        'allowance_rate'       => 'float',
        'allowance_manual'     => 'float',
        'actual_salary'        => 'float',
        'pension'              => 'float',
        'pf'                   => 'float',
        'paid_to_office'       => 'float',
        'incentive_amount'     => 'float',
        'box_count'            => 'float',
        'box_percentage'       => 'float',
        'paid_salary'          => 'float',
        'savings'              => 'float',
    ];

    public function executive(): BelongsTo
    {
        return $this->belongsTo(Executive::class);
    }

    public function bookUsages()
    {
        return $this->hasMany(BookUsage::class);
    }

    /**
     * Scope to include accumulated pension and PF in a single efficient query
     * Uses window functions to avoid N+1 queries
     */
    public function scopeWithAccumulated($query)
    {
        return $query->select('monthly_records.*')->addSelect([
            'accumulated_pension' => \Illuminate\Support\Facades\DB::raw(
                'SUM(pension) OVER (PARTITION BY executive_id ORDER BY id) as accumulated_pension'
            ),
            'accumulated_pf' => \Illuminate\Support\Facades\DB::raw(
                'SUM(pf) OVER (PARTITION BY executive_id ORDER BY id) as accumulated_pf'
            ),
            'accumulated_savings' => \Illuminate\Support\Facades\DB::raw(
                'SUM(savings) OVER (PARTITION BY executive_id ORDER BY id) as accumulated_savings'
            )
        ]);
    }
}
