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

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Please enter your registered email address.', 422, ['email' => 'A valid email is required.']);
}
if ($phone === '') {
    errorResponse('Please enter your registered phone number.', 422, ['phone' => 'Phone number is required.']);
}

$db = getDB();

$stmt = $db->prepare("SELECT id, fullname, phone FROM users WHERE email = ? AND role = 'user' LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$registeredPhone = $user ? normalizePhilippinePhone($user['phone']) : null;
$enteredPhone = normalizePhilippinePhone($phone);

// Same message whether the account or the phone does not match, to avoid
// leaking which emails/numbers are registered.
if (!$user || $registeredPhone === null || $enteredPhone === null || $registeredPhone !== $enteredPhone) {
    errorResponse('The email and phone number do not match any registered parishioner account.', 404);
}

// Resend throttle: at most one OTP per minute per account.
// Compare against MySQL NOW() (not PHP time()) so the check is correct even
// when PHP and MySQL run in different timezones.
$existing = $db->prepare('SELECT TIMESTAMPDIFF(SECOND, last_sent_at, NOW()) AS secs_ago FROM password_reset_otps WHERE user_id = ? LIMIT 1');
$existing->execute([(int) $user['id']]);
$secsAgo = $existing->fetchColumn();
if ($secsAgo !== false && (int) $secsAgo < 60) {
    errorResponse('An OTP was just sent. Please wait a minute before requesting another one.', 429);
}

$otp = (string) random_int(100000, 999999);
$otpHash = password_hash($otp, PASSWORD_DEFAULT);

$replace = $db->prepare(
    'INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, attempts, last_sent_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, NOW())
     ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), attempts = 0, last_sent_at = NOW()'
);
$replace->execute([(int) $user['id'], $otpHash]);

$message = "Holy Family Parish: Your password reset OTP is {$otp}. Valid for 10 minutes. Do not share this code with anyone.";
$smsResult = sendSMS($db, (int) $user['id'], $phone, $message);

if (empty($smsResult['success'])) {
    logSystemAction($db, (int) $user['id'], 'Password Reset Failed', 'Authentication', 'Password reset OTP delivery failed.', 'User', (int) $user['id'], 'Failed');
    errorResponse('Failed to send the OTP via SMS. Please try again later or contact the parish office.', 500);
}

logSystemAction($db, (int) $user['id'], 'Password Reset Requested', 'Authentication', 'A password reset OTP was requested.', 'User', (int) $user['id']);
successResponse(null, 'OTP sent to your registered mobile number. It is valid for 10 minutes.');
