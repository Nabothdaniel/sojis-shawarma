<?php

$db = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Read and execute schema
$schema = file_get_contents(__DIR__ . '/database.sql');
$db->exec($schema);

// Create default admin if not exists
$username = 'admin';
$password = 'Admin@12345!'; // Change this immediately
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare("INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)");
$stmt->execute([$username, $hashedPassword]);

echo "✅ Database initialized and admin user created.\n";
