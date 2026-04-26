<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->enum('allowance_mode', ['default', 'percentage', 'manual'])->default('default')->after('kidma_expense');
            $table->decimal('allowance_rate', 5, 2)->nullable()->after('allowance_mode');
            $table->decimal('allowance_manual', 12, 2)->nullable()->after('allowance_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->dropColumn(['allowance_mode', 'allowance_rate', 'allowance_manual']);
        });
    }
};
