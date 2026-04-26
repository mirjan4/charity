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
        Schema::create('book_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monthly_record_id')->constrained()->onDelete('cascade');
            $table->foreignId('receipt_book_id')->constrained()->onDelete('cascade');
            $table->enum('category', ['charity', 'orphanage', 'khidma']);
            $table->integer('start_page');
            $table->integer('end_page');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_usages');
    }
};
