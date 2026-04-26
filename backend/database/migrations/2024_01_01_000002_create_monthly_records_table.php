<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('monthly_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('executive_id')->constrained()->cascadeOnDelete();
            $table->date('record_date');
            $table->string('month'); // YYYY-MM
            $table->decimal('charity_collection', 10, 2)->default(0);
            $table->decimal('orphanage_collection', 10, 2)->default(0);
            $table->decimal('kidma_collection', 10, 2)->default(0);
            $table->decimal('charity_expense', 10, 2)->default(0);
            $table->decimal('orphanage_expense', 10, 2)->default(0);
            $table->decimal('kidma_expense', 10, 2)->default(0);
            $table->enum('pension_mode', ['manual', 'rate'])->default('rate');
            $table->decimal('pension_manual', 10, 2)->nullable();
            $table->decimal('pension_rate', 5, 2)->nullable();
            $table->decimal('actual_salary', 10, 2)->default(0);
            $table->decimal('pension', 10, 2)->default(0);
            $table->decimal('pf', 10, 2)->default(0);
            $table->decimal('cash_paid', 10, 2)->default(0);
            $table->unique(['executive_id', 'month']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_records');
    }
};
