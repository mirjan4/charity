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
            $table->decimal('box_count', 12, 2)->default(0)->after('cash_paid');
            $table->decimal('box_percentage', 5, 2)->default(0)->after('box_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            $table->dropColumn(['box_count', 'box_percentage']);
        });
    }
};
