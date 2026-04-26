<?php

use App\Models\User;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Promote the initial user with no executive_id back to Admin, and give them a username
$users = User::all();
foreach ($users as $user) {
    if (!$user->executive_id && $user->email) {
        $user->role = 'admin';
        // Assign username if it's null
        if (!$user->username) {
            $user->username = explode('@', $user->email)[0] . '_' . rand(100, 999);
        }
        $user->save();
        echo "Promoted {$user->email} back to admin.\n";
    }
}
