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
        // Adding indices to improve filter and join performance
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->index(['executive_id', 'record_date']); // Composite index for filtering
            $table->index('record_date');
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            $table->index(['executive_id', 'date']); // Composite index for balance calculation
            $table->index('date');
        });

        Schema::table('book_usages', function (Blueprint $table) {
            $table->index(['monthly_record_id', 'receipt_book_id']);
        });
        
        Schema::table('receipt_books', function (Blueprint $table) {
            $table->index(['executive_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->dropIndex(['executive_id']);
            if (Schema::hasColumn('monthly_records', 'record_date')) {
                $table->dropIndex(['record_date']);
            }
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            $table->dropIndex(['executive_id']);
            $table->dropIndex(['date']);
        });

        Schema::table('book_usages', function (Blueprint $table) {
            $table->dropIndex(['monthly_record_id']);
            $table->dropIndex(['receipt_book_id']);
        });
        
        Schema::table('receipt_books', function (Blueprint $table) {
            $table->dropIndex(['executive_id']);
            $table->dropIndex(['status']);
        });
    }
};
