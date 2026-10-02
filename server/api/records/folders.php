<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/upload.php';
require_once __DIR__ . '/../../utils/system_logs.php';
require_once __DIR__ . '/../../utils/record_folders.php';

$auth = requireAdmin();
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $parent = recordFolderRequestParent($db, $_GET);
    $query = trim((string) ($_GET['q'] ?? ''));
    $sql = 'SELECT id, parent_id, name, created_at, updated_at FROM record_folders WHERE parent_scope = ?';
    $params = [$parent['scope']];
    if ($query !== '') {
        $sql .= ' AND name LIKE ?';
        $params[] = '%' . $query . '%';
    }
    $sql .= ' ORDER BY name';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    successResponse(['folders' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    $parent = recordFolderRequestParent($db, $data);
    $name = trim((string) ($data['name'] ?? ''));
    $length = function_exists('mb_strlen') ? mb_strlen($name, 'UTF-8') : strlen($name);
    if ($name === '' || $length > 100 || preg_match('/[.]{2}|[\\\/<>:"|?*\x00-\x1F]/u', $name)) {
        errorResponse('Enter a valid folder name of up to 100 characters.', 422);
    }

    try {
        $stmt = $db->prepare('INSERT INTO record_folders (parent_id, parent_scope, name, created_by) VALUES (?, ?, ?, ?)');
        $stmt->execute([$parent['parent_id'], $parent['scope'], $name, (int) $auth['user_id']]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            errorResponse('A folder with this name already exists.', 409);
        }
        errorResponse('Unable to create folder. Please try again.', 500);
    }

    $folderId = (int) $db->lastInsertId();
    logSystemAction($db, (int) $auth['user_id'], 'Folder Created', 'Records', "Created {$name} in {$parent['scope']}.", 'Record Folder', $folderId);
    successResponse(['id' => $folderId, 'parent_id' => $parent['parent_id'], 'name' => $name], 'Folder created successfully.', 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $folderId = (int) ($_GET['id'] ?? 0);
    if ($folderId < 1) {
        errorResponse('A valid folder ID is required.', 400);
    }

    $folderStmt = $db->prepare('SELECT id, name, parent_scope FROM record_folders WHERE id = ? LIMIT 1');
    $folderStmt->execute([$folderId]);
    $folder = $folderStmt->fetch(PDO::FETCH_ASSOC);
    if (!$folder) {
        errorResponse('Folder not found.', 404);
    }
    if (str_starts_with((string) $folder['parent_scope'], 'legacy:')) {
        errorResponse('System folders cannot be deleted.', 403);
    }

    $folderIds = [$folderId];
    for ($index = 0; $index < count($folderIds); $index++) {
        $childrenStmt = $db->prepare('SELECT id FROM record_folders WHERE parent_id = ?');
        $childrenStmt->execute([$folderIds[$index]]);
        foreach ($childrenStmt->fetchAll(PDO::FETCH_COLUMN) as $childId) {
            $folderIds[] = (int) $childId;
        }
    }

    $filePaths = [];
    $filesStmt = $db->prepare('SELECT file_path FROM record_files WHERE folder_id = ? OR parent_scope = ?');
    foreach ($folderIds as $id) {
        $filesStmt->execute([$id, 'folder:' . $id]);
        $filePaths = array_merge($filePaths, $filesStmt->fetchAll(PDO::FETCH_COLUMN));
    }
    $filePaths = array_values(array_unique($filePaths));

    try {
        $db->beginTransaction();
        $deleteFilesStmt = $db->prepare('DELETE FROM record_files WHERE folder_id = ? OR parent_scope = ?');
        foreach ($folderIds as $id) {
            $deleteFilesStmt->execute([$id, 'folder:' . $id]);
        }
        $deleteFolderStmt = $db->prepare('DELETE FROM record_folders WHERE id = ?');
        $deleteFolderStmt->execute([$folderId]);
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        errorResponse('Unable to delete folder. Please try again.', 500);
    }

    $baseUploadDir = __DIR__ . '/../../uploads';
    $cleanupFailures = 0;
    foreach ($filePaths as $filePath) {
        $result = deleteUploadedFile((string) $filePath, $baseUploadDir);
        if (!$result['success']) $cleanupFailures++;
    }

    logSystemAction($db, (int) $auth['user_id'], 'Folder Deleted', 'Records', "Deleted {$folder['name']} and its nested contents.", 'Record Folder', $folderId);
    $message = $cleanupFailures > 0
        ? 'Folder deleted, but some stored files could not be removed.'
        : 'Folder deleted.';
    successResponse(['id' => $folderId, 'deleted_files' => count($filePaths), 'cleanup_failures' => $cleanupFailures], $message);
}

errorResponse('Method not allowed.', 405);