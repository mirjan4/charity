<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExecutiveController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\PFController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\MonthlyRecordController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\RuleController;

use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update']);

    // Routes accessible by both admin and executives (for their own data)
    Route::get('/executives/{executive}', [ExecutiveController::class, 'show']);
    Route::get('/executives/{executiveId}/records', [MonthlyRecordController::class, 'index']);
    Route::get('/executives/{executiveId}/books', [BookController::class, 'executiveBooks']);
    Route::get('/books/{id}/history', [BookController::class, 'history']);
    Route::get('/pf/{id}', [PFController::class, 'getBalance']);

    // Admin Only Routes
    Route::middleware('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        
        Route::apiResource('executives', ExecutiveController::class)->except(['show']);
        Route::post('/executives/{executive}/reset-password', [ExecutiveController::class, 'resetPassword']);
        
        Route::post('/salary/compute', [SalaryController::class, 'compute']);
        
        Route::post('/pf/withdraw', [PFController::class, 'withdraw']);
        Route::get('/pf/ledger/{id}', [PFController::class, 'ledger']);
        
        Route::get('/reports/financial', [ReportController::class, 'financial']);
        Route::get('/reports/monthly/{month}', [ReportController::class, 'getMonthlyRecords']);
        
        Route::delete('/records/{id}', [MonthlyRecordController::class, 'destroy']);
        
        Route::get('/books', [BookController::class, 'index']);
        Route::post('/books/bulk', [BookController::class, 'bulkStore']);
        Route::post('/books/assign', [BookController::class, 'assign']);
        Route::put('/books/{id}/status', [BookController::class, 'updateStatus']);
        Route::delete('/books/{id}', [BookController::class, 'destroy']);
        
        Route::get('/rules', [RuleController::class, 'index']);
        Route::post('/rules', [RuleController::class, 'update']);
    });
});
