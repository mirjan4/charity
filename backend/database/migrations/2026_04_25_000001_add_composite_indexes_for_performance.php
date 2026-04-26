<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Add composite indexes for most common query patterns
     */
    public function up(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            // Composite index for the most common query: executive_id + record_date ordering
            // The database already has this index, so skip creation
            // $table->index(['executive_id', 'record_date']);
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            // Composite index for balance calculations by type
            if (! Schema::hasIndex('pf_ledgers', 'pf_ledgers_executive_id_type_index')) {
                $table->index(['executive_id', 'type']);
            }
            // Support reference_month queries
            if (Schema::hasColumn('pf_ledgers', 'reference_month') && ! Schema::hasIndex('pf_ledgers', 'pf_ledgers_reference_month_index')) {
                $table->index('reference_month');
            }
        });

        Schema::table('book_usages', function (Blueprint $table) {
            // Better support for book history queries
            if (! Schema::hasIndex('book_usages', 'book_usages_receipt_book_id_created_at_index')) {
                $table->index(['receipt_book_id', 'created_at']);
            }
        });

        Schema::table('receipt_books', function (Blueprint $table) {
            // Support finding unassigned books
            if (! Schema::hasIndex('receipt_books', 'receipt_books_executive_id_status_index')) {
                $table->index(['executive_id', 'status']);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            // Support auth queries
            if (! Schema::hasIndex('users', 'users_username_index')) {
                $table->index('username');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            // Index was commented out in up(), so nothing to drop
        });

        Schema::table('pf_ledgers', function (Blueprint $table) {
            if (Schema::hasIndex('pf_ledgers', 'pf_ledgers_executive_id_type_index')) {
                $table->dropIndex('pf_ledgers_executive_id_type_index');
            }
            if (Schema::hasColumn('pf_ledgers', 'reference_month') && Schema::hasIndex('pf_ledgers', 'pf_ledgers_reference_month_index')) {
                $table->dropIndex('pf_ledgers_reference_month_index');
            }
        });

        Schema::table('book_usages', function (Blueprint $table) {
            if (Schema::hasIndex('book_usages', 'book_usages_receipt_book_id_created_at_index')) {
                $table->dropIndex('book_usages_receipt_book_id_created_at_index');
            }
        });

        Schema::table('receipt_books', function (Blueprint $table) {
            if (Schema::hasIndex('receipt_books', 'receipt_books_executive_id_status_index')) {
                $table->dropIndex('receipt_books_executive_id_status_index');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasIndex('users', 'users_username_index')) {
                $table->dropIndex('users_username_index');
            }
        });
    }
};
