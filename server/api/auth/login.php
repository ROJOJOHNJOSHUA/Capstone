<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';
require_once __DIR__ . '/../../utils/system_logs.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

$data = getJsonInput();
$errors = validateRequired(['email', 'password'], $data);
if (!empty($errors)) {
    errorResponse('Validation failed.', 422, $errors);
}

if (!validateEmail($data['email'])) {
    errorResponse('Invalid email address.', 422);
}

$db = getDB();
$email = strtolower(trim($data['email']));

$stmt = $db->prepare('SELECT id, fullname, email, phone, address, password, role FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($data['password'], $user['password'])) {
    logSystemAction($db, $user ? (int) $user['id'] : null, 'Failed Login', 'Authentication', 'A login attempt failed due to invalid credentials.', null, null, 'Failed');
    errorResponse('Invalid email or password.', 401);
}

setUserSession($user);
logSystemAction($db, (int) $user['id'], 'Login', 'Authentication', 'User signed in successfully.');

successResponse([
    'user' => [
        'id' => (int) $user['id'],
        'fullname' => $user['fullname'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'address' => $user['address'],
        'role' => $user['role'],
    ],
], 'Login successful.');
