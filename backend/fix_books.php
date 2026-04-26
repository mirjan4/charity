<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ReceiptBook;
use App\Models\BookUsage;

// Show all books for a quick status overview
echo "=== ALL EXECUTIVE BOOKS ===\n";
$books = ReceiptBook::whereNotNull('executive_id')->get();
foreach ($books as $b) {
    preg_match('/(\d+)$/', $b->book_number, $matches);
    $numericNo = isset($matches[1]) ? (int)$matches[1] : 0;
    $maxPage   = $numericNo * (int)$b->leaves;
    $lastUsage = BookUsage::where('receipt_book_id', $b->id)->max('end_page');
    
    $pct = $maxPage > 0 ? round(($lastUsage / $maxPage) * 100, 1) : 0;
    $shouldBe = ($maxPage > 0 && (int)$lastUsage >= $maxPage) ? 'USED' : 'active';
    $flag = $shouldBe === 'USED' && $b->status !== 'used' ? ' ⚠️ WRONG STATUS!' : '';
    
    echo "{$b->book_number} | Status: {$b->status} | MaxPage: {$maxPage} | LastUsed: {$lastUsage} | {$pct}% | Should: {$shouldBe}{$flag}\n";
}

// Auto-fix any books that are fully used but still active
echo "\n=== AUTO-FIXING INCORRECT STATUSES ===\n";
foreach ($books as $b) {
    preg_match('/(\d+)$/', $b->book_number, $matches);
    $numericNo = isset($matches[1]) ? (int)$matches[1] : 0;
    $maxPage   = $numericNo * (int)$b->leaves;
    $lastUsage = (int)BookUsage::where('receipt_book_id', $b->id)->max('end_page');
    
    if ($maxPage > 0 && $lastUsage >= $maxPage && $b->status === 'active') {
        $b->update(['status' => 'used']);
        echo "Fixed {$b->book_number}: active → used (endPage={$lastUsage}, maxPage={$maxPage})\n";
    }
}
echo "Done.\n";
