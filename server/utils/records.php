<?php

function createReservationRecordIfMissing(PDO $db, int $reservationId): void
{
    $stmt = $db->prepare(
        'SELECT user_id, service_type, requirements, service_details, status
         FROM reservations
         WHERE id = ?
         LIMIT 1'
    );
    $stmt->execute([$reservationId]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation || $reservation['status'] !== 'Completed') {
        return;
    }

    $details = trim((string) ($reservation['service_details'] ?: $reservation['requirements'] ?: ''));
    if ($details === '') {
        $details = $reservation['service_type'] . ' reservation';
    }

    $insert = $db->prepare(
        'INSERT IGNORE INTO parish_records (user_id, reservation_id, service_type, details)
         SELECT ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM parish_records WHERE reservation_id = ?)'
    );
    $insert->execute([
        (int) $reservation['user_id'],
        $reservationId,
        $reservation['service_type'],
        $details,
        $reservationId,
    ]);
}