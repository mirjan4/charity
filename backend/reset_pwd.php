<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@antigravity.com')->first();
if ($user) {
    $user->password = Hash::make('admin123');
    $user->save();
    echo "Password Reset Successfully to: admin123\n";
} else {
    echo "User not found\n";
}
