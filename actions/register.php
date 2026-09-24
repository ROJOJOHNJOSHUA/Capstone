<?php

require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(appUrl('auth/register.php'));
}

if (!verifyCsrf()) {
    setFlash('danger', 'Invalid request. Please try again.');
    redirect(appUrl('auth/register.php'));
}

$fullname = trim($_POST['fullname'] ?? '');
$email = strtolower(trim($_POST['email'] ?? ''));
$phone = trim($_POST['phone'] ?? '');
$address = trim($_POST['address'] ?? '');
$password = $_POST['password'] ?? '';
$confirm = $_POST['confirm_password'] ?? '';

if ($fullname === '' || $email === '' || $phone === '' || $password === '') {
    setFlash('danger', 'Please fill in all required fields.');
    redirect(appUrl('auth/register.php'));
}

if (!validateEmail($email) || !preg_match('/^[^@\s]+@gmail\.com$/i', $email)) {
    setFlash('danger', 'Please use a valid Gmail address ending in @gmail.com.');
    redirect(appUrl('auth/register.php'));
}

if (strlen($password) < 8) {
    setFlash('danger', 'Password must be at least 8 characters.');
    redirect(appUrl('auth/register.php'));
}

if ($password !== $confirm) {
    setFlash('danger', 'Passwords do not match.');
    redirect(appUrl('auth/register.php'));
}

$db = getDB();
$stmt = $db->query("SELECT fullname, phone, email FROM users WHERE role = 'user'");
$normalizedName = strtolower((string) preg_replace('/\s+/', ' ', $fullname));
$normalizedPhone = preg_replace('/[^0-9]/', '', $phone) ?? '';
if (str_starts_with($normalizedPhone, '639') && strlen($normalizedPhone) === 12) {
    $normalizedPhone = '0' . substr($normalizedPhone, 2);
}

$duplicateErrors = [];
foreach ($stmt->fetchAll() as $existing) {
    $existingName = strtolower((string) preg_replace('/\s+/', ' ', trim((string) $existing['fullname'])));
    $existingPhone = preg_replace('/[^0-9]/', '', (string) $existing['phone']) ?? '';
    if (str_starts_with($existingPhone, '639') && strlen($existingPhone) === 12) {
        $existingPhone = '0' . substr($existingPhone, 2);
    }

    if ($existingName === $normalizedName) {
        $duplicateErrors[] = 'Full name is already used.';
    }
    if ($existingPhone === $normalizedPhone) {
        $duplicateErrors[] = 'Phone number is already used.';
    }
    if (strtolower(trim((string) $existing['email'])) === $email) {
        $duplicateErrors[] = 'Gmail address is already used.';
    }
}

if (!empty($duplicateErrors)) {
    setFlash('danger', implode(' ', array_values(array_unique($duplicateErrors))));
    redirect(appUrl('auth/register.php'));
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare(
    'INSERT INTO users (fullname, email, phone, address, password, role) VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$fullname, $email, $phone, $address ?: null, $hash, 'user']);

setFlash('success', 'Registration successful. You may now log in.');
redirect(appUrl('auth/login.php'));
