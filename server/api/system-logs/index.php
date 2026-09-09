<?php

require_once __DIR__ . '/../../config/init.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/system_logs.php';

requireAdmin();
$db = getDB();
ensureSystemLogsTable($db);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed.', 405);
}

$id = (int) ($_GET['id'] ?? 0);
if ($id > 0) {
    $stmt = $db->prepare('SELECT id, user_id, user_name, user_role, action, module, description, target_type, target_id, ip_address, user_agent, status, created_at FROM system_logs WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $log = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$log) errorResponse('System log not found.', 404);
    successResponse(['log' => $log]);
}

$page = max(1, (int) ($_GET['page'] ?? 1));
$limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;
$search = trim((string) ($_GET['search'] ?? ''));
$module = trim((string) ($_GET['module'] ?? ''));
$role = trim((string) ($_GET['role'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));
$date = trim((string) ($_GET['date'] ?? ''));
$sort = strtolower((string) ($_GET['sort'] ?? 'newest')) === 'oldest' ? 'ASC' : 'DESC';

$where = ['1=1'];
$params = [];
if ($search !== '') {
    $where[] = '(user_name LIKE ? OR action LIKE ? OR description LIKE ? OR target_id = ?)';
    $like = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = ctype_digit($search) ? (int) $search : -1;
}
if ($module !== '') { $where[] = 'module = ?'; $params[] = $module; }
if ($role !== '') { $where[] = 'user_role = ?'; $params[] = $role; }
if ($status !== '') { $where[] = 'status = ?'; $params[] = $status; }
if ($date !== '') { $where[] = 'DATE(created_at) = ?'; $params[] = $date; }
$whereSql = implode(' AND ', $where);

$count = $db->prepare("SELECT COUNT(*) FROM system_logs WHERE {$whereSql}");
$count->execute($params);
$total = (int) $count->fetchColumn();

$stmt = $db->prepare("SELECT id, user_id, user_name, user_role, action, module, description, target_type, target_id, ip_address, user_agent, status, created_at FROM system_logs WHERE {$whereSql} ORDER BY created_at {$sort}, id {$sort} LIMIT {$limit} OFFSET {$offset}");
$stmt->execute($params);

successResponse([
    'logs' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'pages' => $total > 0 ? (int) ceil($total / $limit) : 0,
    ],
]);
