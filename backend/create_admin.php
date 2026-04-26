<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

try {
    require __DIR__.'/vendor/autoload.php';
    $app = require_once __DIR__.'/bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

    echo "Checking for admin user...\n";
    $user = DB::table('users')->where('role', 'admin')->first();

    if (!$user) {
        DB::table('users')->insert([
            'name' => 'System Admin',
            'phone' => '0000000000',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'active' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "✅ Admin user created successfully via DB insert!\n";
    } else {
        echo "ℹ️ Admin user already exists.\n";
    }
} catch (\Exception $e) {
    echo "❌ Error creating admin: " . $e->getMessage() . "\n";
}

