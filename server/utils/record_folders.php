<?php

function resolveRecordFolderParent(PDO $db, string $type, int $id, string $service): array
{
    if ($type === 'root') {
        return ['scope' => 'root', 'parent_id' => null];
    }

    if ($type === 'service') {
        $services = ['Marriage', 'Funeral', 'Baptism', 'Mass Intention', 'Private Mass', 'Others'];
        if (!in_array($service, $services, true)) {
            errorResponse('Invalid service folder.', 422);
        }
        return ['scope' => 'service:' . $service, 'parent_id' => null];
    }

    if ($type === 'reservation') {
        $stmt = $db->prepare("SELECT id FROM reservations WHERE id = ? AND status IN ('Approved', 'Paid', 'Completed') LIMIT 1");
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            errorResponse('The official reservation folder was not found.', 404);
        }
        return ['scope' => 'reservation:' . $id, 'parent_id' => null];
    }

    if ($type === 'record') {
        $stmt = $db->prepare('SELECT id FROM parish_records WHERE id = ? AND user_id IS NULL LIMIT 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            errorResponse('The archived record folder was not found.', 404);
        }
        return ['scope' => 'record:' . $id, 'parent_id' => null];
    }

    if ($type === 'folder') {
        $stmt = $db->prepare('SELECT id FROM record_folders WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            errorResponse('The parent folder was not found.', 404);
        }
        return ['scope' => 'folder:' . $id, 'parent_id' => $id];
    }

    errorResponse('Invalid folder location.', 422);
}

function recordFolderRequestParent(PDO $db, array $source): array
{
    return resolveRecordFolderParent(
        $db,
        (string) ($source['parent_type'] ?? 'root'),
        (int) ($source['parent_id'] ?? 0),
        trim((string) ($source['service_type'] ?? ''))
    );
}