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
            $table->index(['executive_id', 'record_date'], 'mx_exec_date_idx');
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            $table->index(['executive_id', 'date'], 'px_exec_date_idx');
        });

        Schema::table('book_usages', function (Blueprint $table) {
            $table->index(['monthly_record_id', 'receipt_book_id'], 'bx_usage_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->dropIndex('mx_exec_date_idx');
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            $table->dropIndex('px_exec_date_idx');
        });

        Schema::table('book_usages', function (Blueprint $table) {
            $table->dropIndex('bx_usage_idx');
        });
    }
};
