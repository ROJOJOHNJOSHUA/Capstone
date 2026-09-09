<?php

function ensureSystemLogsTable(PDO $db): void
{
    $db->exec(
        "CREATE TABLE IF NOT EXISTS system_logs (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            user_name VARCHAR(150) NULL,
            user_role VARCHAR(30) NULL,
            action VARCHAR(100) NOT NULL,
            module VARCHAR(50) NOT NULL,
            description VARCHAR(1000) NOT NULL,
            target_type VARCHAR(50) NULL,
            target_id INT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(500) NULL,
            status ENUM('Success', 'Failed') NOT NULL DEFAULT 'Success',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_system_logs_created (created_at),
            INDEX idx_system_logs_user (user_id),
            INDEX idx_system_logs_action (action),
            INDEX idx_system_logs_module (module),
            INDEX idx_system_logs_status (status),
            CONSTRAINT fk_system_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function logSystemAction(
    PDO $db,
    ?int $userId,
    string $action,
    string $module,
    string $description,
    ?string $targetType = null,
    ?int $targetId = null,
    string $status = 'Success'
): void {
    try {
        ensureSystemLogsTable($db);
        $userName = null;
        $userRole = null;
        if ($userId !== null && $userId > 0) {
            $userStmt = $db->prepare('SELECT fullname, role FROM users WHERE id = ? LIMIT 1');
            $userStmt->execute([$userId]);
            $actor = $userStmt->fetch(PDO::FETCH_ASSOC);
            $userName = $actor['fullname'] ?? null;
            $userRole = $actor['role'] ?? null;
        }

        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        if ($userAgent !== null) {
            $userAgent = substr($userAgent, 0, 500);
        }

        $stmt = $db->prepare(
            'INSERT INTO system_logs
             (user_id, user_name, user_role, action, module, description, target_type, target_id, ip_address, user_agent, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $userName,
            $userRole,
            substr($action, 0, 100),
            substr($module, 0, 50),
            substr($description, 0, 1000),
            $targetType !== null ? substr($targetType, 0, 50) : null,
            $targetId,
            $ipAddress,
            $userAgent,
            in_array($status, ['Success', 'Failed'], true) ? $status : 'Success',
        ]);
    } catch (Throwable $e) {
        error_log('System log insert failed: ' . $e->getMessage());
    }
}
