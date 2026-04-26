<?php

use App\Models\Executive;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$executives = Executive::all();
foreach ($executives as $ex) {
    if (!$ex->user && $ex->phone) {
        User::updateOrCreate(
            ['username' => $ex->phone],
            [
                'name' => $ex->name,
                'password' => Hash::make('1234'),
                'role' => 'executive',
                'executive_id' => $ex->id
            ]
        );
        echo "Created user for {$ex->name}\n";
    }
}
