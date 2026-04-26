<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rules', function (Blueprint $table) {
            $table->id();
            $table->enum('pension_mode', ['manual', 'rate'])->default('rate');
            $table->decimal('pension_rate', 5, 2)->default(3.00); // e.g. 3%
            $table->integer('pf_lock_months')->default(6);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rules');
    }
};
