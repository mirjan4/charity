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

    echo "Creating guaranteed admin user...\n";
    DB::table('users')->where('username', 'admin')->delete();

    DB::table('users')->insert([
        'name' => 'System Admin',
        'username' => 'admin',
        'phone' => '0000000000',
        'password' => Hash::make('1234'),
        'role' => 'admin',
        'active' => 1,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "✅ GUARANTEED Admin user created successfully!\n";

} catch (\Exception $e) {
    echo "❌ Error creating admin: " . $e->getMessage() . "\n";
}

