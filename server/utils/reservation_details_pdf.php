<?php

require_once __DIR__ . '/upload.php';

function ensureReservationDetailsPdf(PDO $db, int $reservationId, string $baseUploadDir): void
{
    $deletedStmt = $db->prepare(
        "SELECT id
         FROM reservation_documents
         WHERE reservation_id = ? AND document_type = 'reservation_details_deleted'
         LIMIT 1"
    );
    $deletedStmt->execute([$reservationId]);
    if ($deletedStmt->fetchColumn()) {
        return;
    }

    $existingStmt = $db->prepare(
        "SELECT original_filename
         FROM reservation_documents
         WHERE reservation_id = ? AND document_type = 'reservation_details'
         LIMIT 1"
    );
    $existingStmt->execute([$reservationId]);
    $existingFilename = $existingStmt->fetchColumn();

    $stmt = $db->prepare(
        'SELECT r.*, u.fullname, u.email, u.phone, u.address
         FROM reservations r
         INNER JOIN users u ON u.id = r.user_id
         WHERE r.id = ?
         LIMIT 1'
    );
    $stmt->execute([$reservationId]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        throw new RuntimeException('Reservation details could not be loaded for PDF generation.');
    }

    $folder = createReservationFolder($reservationId, $baseUploadDir);
    if (!$folder['success']) {
        throw new RuntimeException($folder['error']);
    }

    $filename = is_string($existingFilename) && $existingFilename !== ''
        ? $existingFilename
        : 'Reservation Details.pdf';
    $storedFilename = 'reservation_details.pdf';
    $filePath = getDocumentFilePath($reservationId, $storedFilename);
    $absolutePath = $baseUploadDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $filePath);
    $pdf = buildReservationDetailsPdf($reservation);
    $temporaryPath = tempnam(dirname($absolutePath), 'reservation_pdf_');

    if ($temporaryPath === false) {
        throw new RuntimeException('Unable to prepare the reservation details PDF.');
    }

    try {
        if (file_put_contents($temporaryPath, $pdf, LOCK_EX) !== strlen($pdf)) {
            throw new RuntimeException('Unable to write the reservation details PDF.');
        }
        if (!copy($temporaryPath, $absolutePath)) {
            throw new RuntimeException('Unable to save the reservation details PDF.');
        }
        chmod($absolutePath, 0644);
    } finally {
        if (is_file($temporaryPath)) {
            unlink($temporaryPath);
        }
    }

    $documentStmt = $db->prepare(
        'INSERT INTO reservation_documents
            (reservation_id, document_name, document_type, original_filename, stored_filename, file_path, mime_type, file_size, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            document_name = VALUES(document_name),
            original_filename = VALUES(original_filename),
            stored_filename = VALUES(stored_filename),
            file_path = VALUES(file_path),
            mime_type = VALUES(mime_type),
            file_size = VALUES(file_size),
            status = VALUES(status),
            uploaded_at = CURRENT_TIMESTAMP'
    );
    $documentStmt->execute([
        $reservationId,
        'Reservation Details',
        'reservation_details',
        $filename,
        $storedFilename,
        $filePath,
        'application/pdf',
        strlen($pdf),
        'Verified',
    ]);
}

function buildReservationDetailsPdf(array $reservation): string
{
    $pageWidth = 595;
    $margin = 46;
    $contentWidth = $pageWidth - ($margin * 2);
    $navy = '243746';
    $gold = 'B18A45';
    $muted = '657482';
    $text = '263746';
    $border = 'E2E8ED';
    $pale = 'F6F8FA';
    $sections = [];
    $sections[] = ['Parishioner information', [
        ['Full name', (string) ($reservation['fullname'] ?? '—')],
        ['Email address', (string) ($reservation['email'] ?? '—')],
        ['Contact number', (string) ($reservation['phone'] ?? '—')],
        ['Address', (string) ($reservation['address'] ?? '—'), true],
    ]];

    $reservationFields = [
        ['Reservation ID', '#' . (string) ($reservation['id'] ?? '')],
        ['Status', (string) ($reservation['status'] ?? '—')],
        ['Date submitted', (string) ($reservation['created_at'] ?? '—')],
    ];
    foreach ([
        ['Intention name', $reservation['intention_name'] ?? null],
        ['Payment amount', $reservation['payment_amount'] ?? null],
        ['Payment method', $reservation['payment_method'] ?? null],
        ['Remarks', $reservation['remarks'] ?? null, true],
        ['Prayer intention', $reservation['prayer_intention'] ?? null, true],
    ] as $field) {
        if (isset($field[1]) && trim((string) $field[1]) !== '') {
            $reservationFields[] = [$field[0], (string) $field[1], $field[2] ?? false];
        }
    }
    $sections[] = ['Reservation information', $reservationFields];

    $serviceDetails = $reservation['service_details'] ?? null;
    if (is_string($serviceDetails) && $serviceDetails !== '') {
        $decodedDetails = json_decode($serviceDetails, true);
        if (is_array($decodedDetails)) {
            $serviceDetails = $decodedDetails;
        }
    }

    $submittedFields = [];
    $profileKeys = ['fullname', 'firstname', 'lastname', 'email', 'phone', 'contactnumber', 'address'];
    if (is_array($serviceDetails)) {
        foreach ($serviceDetails as $label => $value) {
            $normalizedLabel = strtolower((string) preg_replace('/[^a-z0-9]/i', '', (string) $label));
            if (in_array($normalizedLabel, $profileKeys, true) || $value === null || $value === '') {
                continue;
            }
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
            $submittedFields[] = [reservationPdfLabel((string) $label), (string) $value, reservationPdfIsLongField((string) $label)];
        }
    }

    $requirements = trim((string) ($reservation['requirements'] ?? ''));
    if ($requirements !== '') {
        foreach (preg_split('/\r\n|\r|\n/', $requirements) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $separator = strpos($line, ':');
            if ($separator > 0) {
                $label = trim(substr($line, 0, $separator));
                $value = trim(substr($line, $separator + 1));
                $normalizedLabel = strtolower((string) preg_replace('/[^a-z0-9]/i', '', $label));
                if ($value !== '' && !in_array($normalizedLabel, $profileKeys, true)) {
                    $submittedFields[] = [reservationPdfLabel($label), $value, reservationPdfIsLongField($label)];
                }
            } else {
                $submittedFields[] = ['Additional requirements', $line, true];
            }
        }
    }
    if ($submittedFields !== []) {
        $sections[] = ['Submitted details', $submittedFields];
    }

    $summaryFields = [
        ['SERVICE', (string) ($reservation['service_type'] ?? '—')],
        ['DATE', (string) ($reservation['reservation_date'] ?? '—')],
        ['TIME', substr((string) ($reservation['reservation_time'] ?? '—'), 0, 5)],
        ['STATUS', (string) ($reservation['status'] ?? '—')],
    ];
    $baseCommands = [];
    $parishName = 'HOLY FAMILY PARISH';
    $baseCommands[] = reservationPdfText(($pageWidth - (strlen($parishName) * 13 * 0.55)) / 2, 37, $parishName, 13, 'F2', $navy);
    $baseCommands[] = reservationPdfText(($pageWidth - (strlen('RESERVATION DETAILS') * 13 * 0.55)) / 2, 64, 'RESERVATION DETAILS', 13, 'F2', $text);
    $baseCommands[] = reservationPdfText($margin, 91, 'PARISHIONER RECORD', 7, 'F2', $muted);
    $recordNumber = '#' . (string) ($reservation['id'] ?? '');
    $baseCommands[] = reservationPdfText($pageWidth - $margin - (strlen($recordNumber) * 9 * 0.55), 91, $recordNumber, 9, 'F2', $navy);
    $baseCommands[] = reservationPdfLine($margin, 104, $pageWidth - $margin, 104, $gold);

    $summaryY = 120;
    $summaryHeight = 48;
    $summaryGap = 8;
    $summaryWidth = ($contentWidth - (count($summaryFields) - 1) * $summaryGap) / count($summaryFields);
    foreach ($summaryFields as $index => [$label, $value]) {
        $x = $margin + ($summaryWidth + $summaryGap) * $index;
        $baseCommands[] = reservationPdfRect($x, $summaryY, $summaryWidth, $summaryHeight, $pale);
        $baseCommands[] = reservationPdfRect($x, $summaryY, 2.5, $summaryHeight, $gold);
        $baseCommands[] = reservationPdfText($x + 10, $summaryY + 15, $label, 6.5, 'F2', $muted);
        $baseCommands[] = reservationPdfText($x + 10, $summaryY + 34, $value, 8.5, 'F2', $text);
    }

    $contentStartY = 190;
    $contentEndY = 792;
    $fieldGap = 12;
    $fieldWidth = ($contentWidth - $fieldGap) / 2;
    $commands = null;
    foreach ([1.0, 0.94, 0.88, 0.82, 0.76, 0.70, 0.64, 0.58] as $scale) {
        $candidateCommands = $baseCommands;
        $y = $contentStartY;
        $labelSize = max(5.8, 7.1 * $scale);
        $bodySize = max(7.0, 9.2 * $scale);
        $lineHeight = $bodySize * 1.2;
        $rowPadding = 7 * $scale;

        foreach ($sections as [$title, $fields]) {
            if ($fields === []) {
                continue;
            }
            $candidateCommands[] = reservationPdfRect($margin, $y + 1, 2.5, 15, $gold);
            $candidateCommands[] = reservationPdfText($margin + 10, $y + 12, strtoupper($title), 8.2 * $scale, 'F2', $navy);
            $y += 23 * $scale;

            for ($index = 0; $index < count($fields);) {
                $first = $fields[$index];
                $second = $fields[$index + 1] ?? null;
                if (!empty($first[2])) {
                    $rowFields = [[$first, $contentWidth]];
                    $index++;
                } elseif ($second !== null && empty($second[2])) {
                    $rowFields = [[$first, $fieldWidth], [$second, $fieldWidth]];
                    $index += 2;
                } else {
                    $rowFields = [[$first, $fieldWidth]];
                    $index++;
                }

                $preparedFields = [];
                $rowHeight = 25 * $scale;
                foreach ($rowFields as [$field, $width]) {
                    $lines = reservationPdfFitLines((string) $field[1], $width - 20, $bodySize, 3);
                    $preparedFields[] = [$field, $width, $lines];
                    $rowHeight = max($rowHeight, (10 * $scale) + $labelSize + 4 + count($lines) * $lineHeight + $rowPadding);
                }

                $x = $margin;
                foreach ($preparedFields as [$field, $width, $lines]) {
                    $candidateCommands[] = reservationPdfText($x, $y + $rowPadding + $labelSize, strtoupper((string) $field[0]), $labelSize, 'F2', $muted);
                    foreach ($lines as $lineIndex => $line) {
                        $candidateCommands[] = reservationPdfText($x, $y + $rowPadding + $labelSize + 14 + ($lineIndex * $lineHeight), $line, $bodySize, 'F1', $text);
                    }
                    $candidateCommands[] = reservationPdfLine($x, $y + $rowHeight, $x + $width, $y + $rowHeight, $border);
                    $x += $width + $fieldGap;
                }
                $y += $rowHeight + (4 * $scale);
            }
            $y += 5 * $scale;
        }

        if ($y <= $contentEndY) {
            $commands = $candidateCommands;
            break;
        }
    }

    if ($commands === null) {
        $commands = $baseCommands;
        $y = $contentStartY;
        $compactFont = 6.5;

        foreach ($sections as [$title, $fields]) {
            if ($fields === []) {
                continue;
            }
            $commands[] = reservationPdfRect($margin, $y + 1, 2, 12, $gold);
            $commands[] = reservationPdfText($margin + 9, $y + 10, strtoupper($title), 7, 'F2', $navy);
            $y += 15;

            for ($index = 0; $index < count($fields);) {
                $first = $fields[$index];
                $second = $fields[$index + 1] ?? null;
                $span = !empty($first[2]);
                if (!$span && $second !== null && empty($second[2])) {
                    $rowFields = [[$first, $fieldWidth], [$second, $fieldWidth]];
                    $index += 2;
                } else {
                    $rowFields = [[$first, $span ? $contentWidth : $fieldWidth]];
                    $index++;
                }

                $x = $margin;
                foreach ($rowFields as [$field, $width]) {
                    $labelValue = strtoupper((string) $field[0]) . ': ' . (string) $field[1];
                    $line = reservationPdfFitLines($labelValue, $width, $compactFont, 1)[0];
                    $commands[] = reservationPdfText($x, $y + 8, $line, $compactFont, 'F1', $text);
                    $commands[] = reservationPdfLine($x, $y + 12, $x + $width, $y + 12, $border);
                    $x += $width + $fieldGap;
                }
                $y += 14;
            }
            $y += 3;
        }
    }

    $commands[] = reservationPdfLine($margin, 804, $pageWidth - $margin, 804, $border);
    $footer = 'HOLY FAMILY PARISH  ·  CONFIDENTIAL PARISH RECORD';
    $commands[] = reservationPdfText(($pageWidth - (strlen($footer) * 5.5 * 0.55)) / 2, 822, $footer, 5.5, 'F1', $muted);
    $pages = [$commands];
    $objects = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        2 => '',
    ];
    $pageIds = [];
    $nextObjectId = 3;

    foreach ($pages as $pageIndex => $pageCommands) {
        $pageId = $nextObjectId++;
        $contentId = $nextObjectId++;
        $pageIds[] = $pageId;

        $content = implode("\n", $pageCommands);
        $content .= "\n" . reservationPdfText($margin, 20, 'HOLY FAMILY PARISH  ·  OFFICIAL RECORD', 7, 'F1', $muted);
        $content .= "\n" . reservationPdfText($pageWidth - $margin - 55, 20, 'PAGE ' . ($pageIndex + 1), 7, 'F2', $muted);

        $objects[$pageId] = sprintf(
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>',
            $nextObjectId,
            $nextObjectId + 1,
            $contentId
        );
        $objects[$contentId] = '<< /Length ' . strlen($content) . " >>\nstream\n" . $content . "endstream";
    }

    $fontId = $nextObjectId;
    $objects[$fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    $objects[$fontId + 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    $objects[2] = '<< /Type /Pages /Kids [' . implode(' ', array_map(static fn (int $id): string => $id . ' 0 R', $pageIds)) . '] /Count ' . count($pageIds) . ' >>';
    ksort($objects);

    $output = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $id => $object) {
        $offsets[$id] = strlen($output);
        $output .= $id . " 0 obj\n" . $object . "\nendobj\n";
    }

    $xrefOffset = strlen($output);
    $output .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    for ($id = 1; $id <= count($objects); $id++) {
        $output .= sprintf("%010d 00000 n \n", $offsets[$id]);
    }
    $output .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $output .= "startxref\n" . $xrefOffset . "\n%%EOF";

    return $output;
}

function reservationPdfLabel(string $label): string
{
    $label = preg_replace('/([a-z0-9])([A-Z])/', '$1 $2', $label);
    return ucwords(str_replace(['_', '-'], ' ', $label));
}

function reservationPdfIsLongField(string $label): bool
{
    return (bool) preg_match('/address|remark|intention|description|reason|comment|requirement|location/i', $label);
}

function reservationPdfWrapText(string $text, float $width, float $fontSize): array
{
    $text = trim(str_replace(["\0", "\r"], '', $text));
    if ($text === '') {
        return ['—'];
    }
    $charactersPerLine = max(12, (int) floor($width / ($fontSize * 0.52)));
    $lines = [];
    foreach (preg_split('/\r\n|\r|\n/', $text) as $paragraph) {
        $wrapped = wordwrap($paragraph, $charactersPerLine, "\n", true);
        $lines = array_merge($lines, explode("\n", $wrapped));
    }
    return $lines ?: ['—'];
}

function reservationPdfFitLines(string $text, float $width, float $fontSize, int $maximumLines): array
{
    $lines = reservationPdfWrapText($text, $width, $fontSize);
    if (count($lines) <= $maximumLines) {
        return $lines;
    }

    $visible = array_slice($lines, 0, $maximumLines);
    $lastIndex = $maximumLines - 1;
    $lastLine = rtrim($visible[$lastIndex], ". \t");
    $visible[$lastIndex] = $lastLine . '...';

    return $visible;
}

function reservationPdfRect(float $x, float $y, float $width, float $height, string $color): string
{
    [$red, $green, $blue] = reservationPdfRgb($color);
    $bottom = 842 - $y - $height;
    return sprintf("%.3f %.3f %.3f rg %.2f %.2f %.2f %.2f re f", $red, $green, $blue, $x, $bottom, $width, $height);
}

function reservationPdfLine(float $x1, float $y1, float $x2, float $y2, string $color): string
{
    [$red, $green, $blue] = reservationPdfRgb($color);
    return sprintf("%.3f %.3f %.3f RG 0.7 w %.2f %.2f m %.2f %.2f l S", $red, $green, $blue, $x1, 842 - $y1, $x2, 842 - $y2);
}

function reservationPdfText(float $x, float $top, string $text, float $size, string $font, string $color): string
{
    [$red, $green, $blue] = reservationPdfRgb($color);
    $baseline = 842 - $top;
    return sprintf(
        "%.3f %.3f %.3f rg BT /%s %.1f Tf %.2f %.2f Td (%s) Tj ET",
        $red,
        $green,
        $blue,
        $font,
        $size,
        $x,
        $baseline,
        reservationPdfEscape($text)
    );
}

function reservationPdfRgb(string $hex): array
{
    return [
        hexdec(substr($hex, 0, 2)) / 255,
        hexdec(substr($hex, 2, 2)) / 255,
        hexdec(substr($hex, 4, 2)) / 255,
    ];
}

function reservationPdfEscape(string $text): string
{
    $encoded = function_exists('iconv')
        ? @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text)
        : false;
    if ($encoded === false) {
        $encoded = preg_replace('/[^\x20-\x7E]/', '?', $text);
    }

    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], (string) $encoded);
}
