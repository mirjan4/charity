<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Starting Database Optimization...\n";

try {
    // Add indices manually to bypass migration tracking issues
    $tables = [
        'monthly_records' => ['executive_id', 'record_date'],
        'pf_ledgers'      => ['executive_id', 'date'],
        'book_usages'     => ['monthly_record_id', 'book_id'],
        'receipt_books'   => ['executive_id', 'status']
    ];

    foreach ($tables as $table => $columns) {
        if (!Schema::hasTable($table)) {
            echo "Skipping $table (not found)\n";
            continue;
        }

        Schema::table($table, function (Blueprint $tableObj) use ($table, $columns) {
            foreach ($columns as $column) {
                try {
                    $tableObj->index($column);
                    echo "Added index to $table.$column\n";
                } catch (\Exception $e) {
                    echo "Index already exists or failed for $table.$column\n";
                }
            }
        });
    }

    echo "Optimization Complete!\n";
} catch (\Exception $e) {
    echo "Error during optimization: " . $e->getMessage() . "\n";
}
