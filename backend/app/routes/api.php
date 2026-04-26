<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExecutiveController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\PFController;
use App\Http\Controllers\RuleController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('executives', ExecutiveController::class);
    Route::get('/executives/{executive}/records', [\App\Http\Controllers\MonthlyRecordController::class, 'index']);
    Route::delete('/records/{record}', [\App\Http\Controllers\MonthlyRecordController::class, 'destroy']);
    
    // Salary Computation
    Route::post('/salary/compute', [SalaryController::class, 'compute']);

    // PF Management
    Route::get('/pf/{execId}', [PFController::class, 'getBalance']);
    Route::get('/pf/ledger/{execId}', [PFController::class, 'ledger']);
    Route::post('/pf/withdraw', [PFController::class, 'withdraw']);

    // Reports
    Route::get('/reports/monthly/{month}', [ReportController::class, 'getMonthlyRecords']);
    Route::get('/reports/export/{month}', [ReportController::class, 'exportExcel']);
    Route::post('/reports/import', [ReportController::class, 'importExcel']);

    Route::get('/rules', [RuleController::class, 'index']);
    Route::put('/rules', [RuleController::class, 'update']);
});
