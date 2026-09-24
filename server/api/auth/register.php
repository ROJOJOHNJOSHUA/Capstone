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

if ((getenv('APP_DEBUG') ?: 'false') === 'true') {
    error_log('Registration request received for email: ' . strtolower(trim((string) ($data['email'] ?? ''))));
}

if (!empty($data['role']) && strtolower(trim($data['role'])) !== 'user') {
    errorResponse('Admin accounts cannot be created through registration.', 403);
}

$errors = validateRegistration($data);
if (!empty($errors)) {
    errorResponse('Validation failed.', 422, $errors);
}

try {
    $db = getDB();
    if ((getenv('APP_DEBUG') ?: 'false') === 'true') {
        error_log('Registration database: ' . (getenv('DB_HOST') ?: 'unknown') . '/' . (getenv('DB_NAME') ?: 'unknown'));
    }
} catch (Throwable $error) {
    error_log('Registration database connection failed: ' . $error->getMessage());
    errorResponse('Registration service is temporarily unavailable. Please try again later.', 503);
}
$fullname = trim((string) $data['fullname']);
$email = strtolower(trim($data['email']));
$phone = trim((string) $data['phone']);

// Serialize equivalent registrations so the duplicate checks and insert are atomic.
$lockNames = [
    'email:' . substr(hash('sha256', $email), 0, 58),
    'name:' . substr(hash('sha256', normalizeRegistrationName($fullname)), 0, 59),
    'phone:' . substr(hash('sha256', normalizeRegistrationPhone($phone)), 0, 58),
];
sort($lockNames, SORT_STRING);
$acquiredLocks = [];
foreach ($lockNames as $lockName) {
    $lock = $db->prepare('SELECT GET_LOCK(?, 10)');
    $lock->execute([$lockName]);
    if ((int) $lock->fetchColumn() !== 1) {
        foreach ($acquiredLocks as $acquiredLock) {
            $db->query('SELECT RELEASE_LOCK(' . $db->quote($acquiredLock) . ')');
        }
        errorResponse('Registration is busy. Please try again.', 409);
    }
    $acquiredLocks[] = $lockName;
}

try {
    $check = $db->query("SELECT fullname, phone, email FROM users WHERE role = 'user'");
} catch (Throwable $error) {
    error_log('Registration duplicate check failed: ' . $error->getMessage());
    errorResponse('Registration service is temporarily unavailable. Please try again later.', 503);
}
$duplicateErrors = [];
foreach ($check->fetchAll() as $existing) {
    if (normalizeRegistrationName($existing['fullname']) === normalizeRegistrationName($fullname)) {
        $duplicateErrors['fullname'] = 'Name is already used.';
    }
    if (normalizeRegistrationPhone($existing['phone']) === normalizeRegistrationPhone($phone)) {
        $duplicateErrors['phone'] = 'Phone number is already used.';
    }
    if (strtolower(trim((string) $existing['email'])) === $email) {
        $duplicateErrors['email'] = 'This email is already registered.';
    }
}
if (!empty($duplicateErrors)) {
    foreach ($acquiredLocks as $acquiredLock) {
        $db->query('SELECT RELEASE_LOCK(' . $db->quote($acquiredLock) . ')');
    }
    errorResponse('Registration details are already in use.', 409, $duplicateErrors);
}

$hash = password_hash($data['password'], PASSWORD_DEFAULT);

$stmt = $db->prepare(
    'INSERT INTO users (fullname, email, phone, address, password, role) VALUES (?, ?, ?, ?, ?, ?)'
);
try {
    $stmt->execute([
        $fullname,
        $email,
        $phone,
        trim($data['address'] ?? ''),
        $hash,
        'user',
    ]);
    if ((getenv('APP_DEBUG') ?: 'false') === 'true') {
        error_log('Registration insert succeeded with user id: ' . $db->lastInsertId());
    }
} catch (PDOException $error) {
    error_log('Registration insert failed: ' . $error->getMessage());
    errorResponse('The account could not be saved. Please verify the database schema and permissions.', 500);
}

$user = [
    'id' => (int) $db->lastInsertId(),
    'fullname' => $fullname,
    'email' => $email,
    'phone' => $phone,
    'address' => trim($data['address'] ?? ''),
    'role' => 'user',
];

foreach ($acquiredLocks as $acquiredLock) {
    $db->query('SELECT RELEASE_LOCK(' . $db->quote($acquiredLock) . ')');
}

logSystemAction($db, (int) $user['id'], 'Parishioner Registration', 'Registration', 'A new parishioner account was created.', 'User', (int) $user['id']);

// Registration only creates the account; the parishioner must log in separately.
successResponse(['user' => $user], 'Registration successful.', 201);
