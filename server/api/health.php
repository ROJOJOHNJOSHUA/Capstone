<?php

require_once __DIR__ . '/../config/init.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', 405);
}

try {
    $db = getDB();
    $databaseName = (string) $db->query('SELECT DATABASE()')->fetchColumn();
    $usersTable = (int) $db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'")->fetchColumn() === 1;

    $data = [
        'environment' => getenv('APP_ENV') ?: 'production',
        'backend' => 'connected',
        'database' => 'connected',
        'database_name' => $databaseName,
        'users_table' => $usersTable,
    ];

    if ((getenv('APP_DEBUG') ?: 'false') !== 'true') {
        $data = ['backend' => 'connected', 'database' => 'connected'];
    }

    successResponse($data, 'Health check passed.');
} catch (Throwable $error) {
    error_log('Health check database failure: ' . $error->getMessage());
    errorResponse('Database connection failed.', 503);
}
