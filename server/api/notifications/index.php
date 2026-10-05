<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth = requireAuth();
$db = getDB();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 100)));
    $filter = isset($_GET['unread_only']) && $_GET['unread_only'] === '1'
        ? 'unread'
        : (string) ($_GET['filter'] ?? 'all');
    if (!in_array($filter, ['all', 'unread', 'read'], true)) {
        errorResponse('Invalid notification filter.', 422);
    }
    $offset = ($page - 1) * $limit;

    $sql = 'SELECT id, type, title, message, link, reference_type, reference_id, is_read, created_at
            FROM notifications WHERE user_id = ?';
    if ($filter === 'unread') {
        $sql .= ' AND is_read = 0';
    } elseif ($filter === 'read') {
        $sql .= ' AND is_read = 1';
    }
    $sql .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $stmt = $db->prepare($sql);
    $stmt->bindValue(1, $userId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll();

    $countStmt = $db->prepare(
        'SELECT COUNT(*) AS total_count,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
                SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS read_count
         FROM notifications WHERE user_id = ?'
    );
    $countStmt->execute([$userId]);
    $counts = $countStmt->fetch();
    $totalCount = match ($filter) {
        'unread' => (int) $counts['unread_count'],
        'read' => (int) $counts['read_count'],
        default => (int) $counts['total_count'],
    };

    successResponse([
        'notifications' => $notifications,
        'unread_count' => (int) $counts['unread_count'],
        'read_count' => (int) $counts['read_count'],
        'total_count' => (int) $counts['total_count'],
        'filtered_count' => $totalCount,
        'page' => $page,
        'limit' => $limit,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = getJsonInput();
    $markAll = !empty($data['mark_all_read']);
    $id = (int) ($data['id'] ?? 0);
    $isRead = $data['is_read'] ?? true;

    if (!is_bool($isRead) && !in_array($isRead, [0, 1, '0', '1'], true)) {
        errorResponse('Invalid notification read status.', 422);
    }

    if ($markAll) {
        $stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
        $stmt->execute([$userId]);
        successResponse(null, 'All notifications marked as read.');
    }

    if ($id <= 0) {
        errorResponse('Notification id is required.', 422);
    }

    $stmt = $db->prepare('UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?');
    $stmt->execute([(int) $isRead, $id, $userId]);
    if ($stmt->rowCount() === 0) {
        $exists = $db->prepare('SELECT 1 FROM notifications WHERE id = ? AND user_id = ?');
        $exists->execute([$id, $userId]);
        if (!$exists->fetchColumn()) {
            errorResponse('Notification not found.', 404);
        }
    }

    successResponse(null, $isRead ? 'Notification marked as read.' : 'Notification marked as unread.');
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id > 0) {
        $stmt = $db->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if ($stmt->rowCount() === 0) {
            errorResponse('Notification not found.', 404);
        }
        successResponse(null, 'Notification deleted.');
    }

    $filter = (string) ($_GET['filter'] ?? '');
    if (!in_array($filter, ['all', 'unread', 'read'], true)) {
        errorResponse('A valid notification filter is required.', 422);
    }

    $sql = 'DELETE FROM notifications WHERE user_id = ?';
    if ($filter === 'unread') {
        $sql .= ' AND is_read = 0';
    } elseif ($filter === 'read') {
        $sql .= ' AND is_read = 1';
    }
    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);

    successResponse(['deleted_count' => $stmt->rowCount()], 'Notifications deleted.');
}

errorResponse('Method not allowed.', 405);
