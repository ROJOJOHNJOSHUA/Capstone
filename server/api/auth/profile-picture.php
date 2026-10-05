<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth = requireAuth();
$userId = (int) $auth['user_id'];
$uploadDir = __DIR__ . '/../../uploads/profile-pictures';
$extensionsByMime = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
$existingFiles = array_map(
    static fn(string $extension): string => $uploadDir . '/profile-' . $userId . '.' . $extension,
    array_values($extensionsByMime)
);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    foreach ($existingFiles as $filePath) {
        if (!is_file($filePath)) {
            continue;
        }

        $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($filePath);
        if (!in_array($mimeType, array_keys($extensionsByMime), true)) {
            errorResponse('Stored profile picture has an unsupported format.', 500);
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        readfile($filePath);
        exit;
    }

    errorResponse('Profile picture not found.', 404);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

if (!isset($_FILES['profile_picture']) || !is_array($_FILES['profile_picture'])) {
    errorResponse('Please select a profile picture to upload.', 422);
}

$file = $_FILES['profile_picture'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    errorResponse('Profile picture upload failed. Please try again.', 422);
}
if ((int) ($file['size'] ?? 0) <= 0 || (int) $file['size'] > 5 * 1024 * 1024) {
    errorResponse('Profile pictures must be smaller than 5 MB.', 422);
}
if (!is_uploaded_file($file['tmp_name'] ?? '')) {
    errorResponse('Invalid profile picture upload.', 422);
}

$imageInfo = @getimagesize($file['tmp_name']);
$mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
if (!$imageInfo || !isset($extensionsByMime[$mimeType]) || $imageInfo['mime'] !== $mimeType) {
    errorResponse('Upload a valid JPG, PNG, or WebP image.', 422);
}

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    errorResponse('Profile picture storage is unavailable.', 500);
}

$destination = $uploadDir . '/profile-' . $userId . '.' . $extensionsByMime[$mimeType];
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    errorResponse('Could not save the profile picture. Please try again.', 500);
}
chmod($destination, 0644);

foreach ($existingFiles as $existingFile) {
    if ($existingFile !== $destination && is_file($existingFile) && !unlink($existingFile)) {
        errorResponse('Profile picture was uploaded, but the previous picture could not be removed.', 500);
    }
}

successResponse(null, 'Profile picture updated successfully.');
