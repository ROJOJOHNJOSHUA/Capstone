<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/system_logs.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

$userId = !empty($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
if ($userId !== null) {
    logSystemAction(getDB(), $userId, 'Logout', 'Authentication', 'User signed out successfully.');
}
destroyUserSession();

successResponse(null, 'Logged out successfully.');
