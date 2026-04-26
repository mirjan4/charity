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
            $table->unsignedBigInteger('charity_book_id')->nullable();
            $table->unsignedBigInteger('orphanage_book_id')->nullable();
            $table->unsignedBigInteger('kidma_book_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_records', function (Blueprint $table) {
            //
        });
    }
};
