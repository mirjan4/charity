<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = User::where('role', 'admin')->first();

if (!$user) {
    User::create([
        'name' => 'System Admin',
        'phone' => '0000000000',
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'active' => true
    ]);
    echo "Admin user created successfully!\n";
} else {
    echo "Admin user already exists.\n";
}
