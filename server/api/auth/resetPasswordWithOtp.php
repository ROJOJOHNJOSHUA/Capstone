<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';
require_once __DIR__ . '/../../utils/sms.php';
require_once __DIR__ . '/../../utils/system_logs.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

$data = getJsonInput();
$email = strtolower(trim((string) ($data['email'] ?? '')));
$phone = trim((string) ($data['phone'] ?? ''));
$otp = trim((string) ($data['otp'] ?? ''));
$newPassword = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirm_password'] ?? '');

$fieldErrors = [];
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fieldErrors['email'] = 'A valid email is required.';
}
if ($phone === '') {
    $fieldErrors['phone'] = 'Phone number is required.';
}
if (!preg_match('/^[0-9]{6}$/', $otp)) {
    $fieldErrors['otp'] = 'Enter the 6-digit OTP sent to your phone.';
}
if (strlen($newPassword) < 8) {
    $fieldErrors['password'] = 'Password must be at least 8 characters.';
}
if ($newPassword !== $confirmPassword) {
    $fieldErrors['confirm_password'] = 'Passwords do not match.';
}
if (!empty($fieldErrors)) {
    errorResponse('Validation failed.', 422, $fieldErrors);
}

$db = getDB();

$stmt = $db->prepare("SELECT id, phone FROM users WHERE email = ? AND role = 'user' LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$registeredPhone = $user ? normalizePhilippinePhone($user['phone']) : null;
$enteredPhone = normalizePhilippinePhone($phone);

if (!$user || $registeredPhone === null || $enteredPhone === null || $registeredPhone !== $enteredPhone) {
    errorResponse('The email and phone number do not match any registered parishioner account.', 404);
}

$userId = (int) $user['id'];
// Read expiry via MySQL NOW() so it is correct even when PHP and MySQL differ.
$otpStmt = $db->prepare('SELECT otp_hash, attempts, (expires_at > NOW()) AS is_valid FROM password_reset_otps WHERE user_id = ? LIMIT 1');
$otpStmt->execute([$userId]);
$otpRow = $otpStmt->fetch(PDO::FETCH_ASSOC);

if (!$otpRow) {
    errorResponse('No OTP was requested for this account. Please request a new OTP first.', 404);
}
if (!(int) $otpRow['is_valid']) {
    $db->prepare('DELETE FROM password_reset_otps WHERE user_id = ?')->execute([$userId]);
    errorResponse('The OTP has expired. Please request a new one.', 410);
}
if ((int) $otpRow['attempts'] >= 5) {
    $db->prepare('DELETE FROM password_reset_otps WHERE user_id = ?')->execute([$userId]);
    errorResponse('Too many incorrect attempts. Please request a new OTP.', 429);
}

if (!password_verify($otp, (string) $otpRow['otp_hash'])) {
    $db->prepare('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE user_id = ?')->execute([$userId]);
    errorResponse('Incorrect OTP. Please check the code sent via SMS and try again.', 422, ['otp' => 'Incorrect OTP.']);
}

// OTP verified — update the password and clear the reset record.
$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$db->prepare('UPDATE users SET password = ? WHERE id = ?')->execute([$newHash, $userId]);
$db->prepare('DELETE FROM password_reset_otps WHERE user_id = ?')->execute([$userId]);

logSystemAction($db, $userId, 'Password Reset Successful', 'Authentication', 'Parishioner successfully changed the account password after OTP verification.', 'User', $userId);

successResponse(null, 'Password updated successfully. You can now log in with your new password.');
