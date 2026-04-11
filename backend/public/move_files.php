<?php

header('Content-Type: text/plain');

function rename_recursive($src, $dst) {
    if (!file_exists($src)) {
        echo "Source does not exist: $src\n";
        return false;
    }
    if (!is_dir(dirname($dst))) mkdir(dirname($dst), 0755, true);
    return rename($src, $dst);
}

$base = dirname(dirname(dirname(__FILE__)));
echo "Base path: $base\n";

// List app content to debug
echo "Contents of $base/app:\n";
print_r(scandir("$base/app"));

$moves = [
    "$base/app/admin" => "$base/app/dashboard/admin",
];

if (!is_dir("$base/app/dashboard/users")) {
    mkdir("$base/app/dashboard/users", 0755, true);
    echo "Created app/dashboard/users\n";
}

$dashboardItems = glob("$base/app/dashboard/*");
foreach ($dashboardItems as $item) {
    $name = basename($item);
    if ($name === 'users' || $name === 'admin') continue;
    
    $target = "$base/app/dashboard/users/$name";
    if (rename($item, $target)) {
        echo "Moved $name to app/dashboard/users/$name\n";
    } else {
        echo "Failed to move $name\n";
    }
}

foreach ($moves as $src => $dst) {
    if (rename_recursive($src, $dst)) {
        echo "Moved $src to $dst\n";
    } else {
        echo "Failed to move $src to $dst\n";
    }
}
