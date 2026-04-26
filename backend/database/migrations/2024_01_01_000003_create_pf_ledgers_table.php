<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pf_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('executive_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->enum('type', ['contribution', 'withdrawal'])->default('contribution');
            $table->decimal('amount', 10, 2);
            $table->string('reference_month')->nullable(); // YYYY-MM
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pf_ledgers');
    }
};
