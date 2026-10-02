<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/documents.php';
require_once __DIR__ . '/../../utils/upload.php';
require_once __DIR__ . '/../../utils/system_logs.php';
require_once __DIR__ . '/../../utils/record_folders.php';

$auth = requireAdmin();
$db = getDB();
$baseUploadDir = __DIR__ . '/../../uploads';

function getRecordFileForDownload(PDO $db, int $fileId, string $baseUploadDir): array
{
    $stmt = $db->prepare('SELECT id, original_filename, file_path, mime_type FROM record_files WHERE id = ? LIMIT 1');
    $stmt->execute([$fileId]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$file) {
        errorResponse('File not found.', 404);
    }
    $realBase = realpath($baseUploadDir . '/records');
    $absolutePath = getAbsoluteFilePath($file['file_path'], $baseUploadDir);
    if (!$realBase || !$absolutePath || strpos($absolutePath, $realBase . DIRECTORY_SEPARATOR) !== 0 || !is_file($absolutePath)) {
        errorResponse('File not found on the server.', 404);
    }
    return [$file, $absolutePath];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $fileId = (int) ($_GET['id'] ?? 0);
    if ($fileId > 0) {
        [$file, $absolutePath] = getRecordFileForDownload($db, $fileId, $baseUploadDir);
        while (ob_get_level() > 0) ob_end_clean();
        $filename = preg_replace('/[^\w.\- ]/u', '_', basename($file['original_filename']));
        $inlineMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        $disposition = ($_GET['disposition'] ?? 'attachment') === 'inline' && in_array($file['mime_type'], $inlineMimeTypes, true)
            ? 'inline'
            : 'attachment';
        header_remove('Content-Type');
        $mimeType = preg_match('#^[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+$#', $file['mime_type'])
            ? $file['mime_type']
            : 'application/octet-stream';
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: ' . $disposition . '; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($absolutePath));
        header('Cache-Control: private, no-cache, must-revalidate');
        header('X-Content-Type-Options: nosniff');
        readfile($absolutePath);
        exit;
    }

    $query = trim((string) ($_GET['q'] ?? ''));
    if ($query !== '') {
        $sql = 'SELECT id, folder_id, original_filename, mime_type, file_size, uploaded_at FROM record_files WHERE original_filename LIKE ?';
        $params = [addcslashes($query, '\\%_') . '%'];
    } else {
        $parent = recordFolderRequestParent($db, $_GET);
        $sql = 'SELECT id, folder_id, original_filename, mime_type, file_size, uploaded_at FROM record_files WHERE parent_scope = ?';
        $params = [$parent['scope']];
    }
    $sql .= ' ORDER BY uploaded_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    successResponse(['files' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $parent = recordFolderRequestParent($db, $_POST);
    if (!isset($_FILES['file'])) {
        errorResponse('Choose a file to upload.', 422);
    }
    $upload = $_FILES['file'];
    $validation = validateUploadedFile($upload, 10 * 1024 * 1024, true);
    if (!$validation['valid']) {
        errorResponse($validation['error'], 422);
    }
    $originalFilename = basename(str_replace('\\', '/', $upload['name']));
    $storedFilename = bin2hex(random_bytes(16)) . '.upload';
    $storageFolder = preg_replace('/[^A-Za-z0-9_-]+/', '_', $parent['scope']);
    $relativePath = 'records/' . $storageFolder . '/' . $storedFilename;
    $recordUploadDir = $baseUploadDir . '/records/' . $storageFolder;
    if (!is_dir($recordUploadDir) && !mkdir($recordUploadDir, 0750, true)) {
        errorResponse('Unable to prepare file storage.', 500);
    }
    $destination = $recordUploadDir . '/' . $storedFilename;
    $moveResult = moveUploadedFileSecurely($upload, $destination);
    if (!$moveResult['success']) {
        errorResponse($moveResult['error'], 500);
    }

    try {
        $stmt = $db->prepare('INSERT INTO record_files (folder_id, parent_scope, original_filename, stored_filename, file_path, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$parent['parent_id'], $parent['scope'], $originalFilename, $storedFilename, $relativePath, $validation['mime_type'], (int) $upload['size'], (int) $auth['user_id']]);
    } catch (Throwable $error) {
        @unlink($destination);
        errorResponse('Unable to save file information. Please try again.', 500);
    }

    $fileId = (int) $db->lastInsertId();
    $uploadedAtStmt = $db->prepare('SELECT uploaded_at FROM record_files WHERE id = ? LIMIT 1');
    $uploadedAtStmt->execute([$fileId]);
    $uploadedAt = $uploadedAtStmt->fetchColumn();
    logSystemAction($db, (int) $auth['user_id'], 'File Uploaded', 'Records', "Uploaded {$originalFilename} to {$parent['scope']}.", 'Record File', $fileId);
    successResponse([
        'id' => $fileId,
        'original_filename' => $originalFilename,
        'mime_type' => $validation['mime_type'],
        'file_size' => (int) $upload['size'],
        'uploaded_at' => $uploadedAt,
    ], 'File uploaded successfully.', 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $fileId = (int) ($_GET['id'] ?? 0);
    if ($fileId < 1) {
        errorResponse('A valid file ID is required.', 400);
    }
    [$file, $absolutePath] = getRecordFileForDownload($db, $fileId, $baseUploadDir);
    $db->prepare('DELETE FROM record_files WHERE id = ?')->execute([$fileId]);
    unlink($absolutePath);
    logSystemAction($db, (int) $auth['user_id'], 'File Deleted', 'Records', "Deleted {$file['original_filename']} from the file manager.", 'Record File', $fileId);
    successResponse(null, 'File deleted.');
}

errorResponse('Method not allowed.', 405);