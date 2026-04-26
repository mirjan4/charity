<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            // Total cumulative charity/jamia leaves at point of this record
            $table->unsignedInteger('incentive_leaves')->default(0)->after('cash_paid');
            // Slab bonus rate applied (e.g. 5.2 means 5.2%)
            $table->decimal('incentive_rate', 5, 2)->default(0)->after('incentive_leaves');
            // Bonus amount added to actual_salary
            $table->decimal('incentive_amount', 12, 2)->default(0)->after('incentive_rate');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->dropColumn(['incentive_leaves', 'incentive_rate', 'incentive_amount']);
        });
    }
};
