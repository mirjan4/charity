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

    echo "Cleaning cache...\n";
    \Illuminate\Support\Facades\Artisan::call('cache:clear');

    echo "Checking columns for monthly_records...\n";
    $columns = DB::select('SHOW COLUMNS FROM monthly_records');
    $columnNames = array_map(function($c) { return $c->Field; }, $columns);

    if (!in_array('paid_salary', $columnNames)) {
        DB::statement('ALTER TABLE monthly_records ADD COLUMN paid_salary DECIMAL(10,2) DEFAULT 0 AFTER pension');
        echo "✅ Added missing column: paid_salary\n";
    }
    if (!in_array('savings', $columnNames)) {
        DB::statement('ALTER TABLE monthly_records ADD COLUMN savings DECIMAL(10,2) DEFAULT 0 AFTER paid_salary');
        echo "✅ Added missing column: savings\n";
    }


    echo "Checking user roles...\n";
    $userCols = DB::select('SHOW COLUMNS FROM users');
    $userColNames = array_map(function($c) { return $c->Field; }, $userCols);
    if (!in_array('role', $userColNames)) {
        DB::statement("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'executive' AFTER password");
        echo "✅ Added missing column: role\n";
    }

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
    
    // Safety check: force update any existing admin
    DB::table('users')->where('username', 'admin')->update(['role' => 'admin']);
    
    echo "✅ GUARANTEED Admin user created and role verified!\n";

    echo "✅ GUARANTEED Admin user created successfully!\n";

} catch (\Exception $e) {
    echo "❌ Error creating admin: " . $e->getMessage() . "\n";
}
