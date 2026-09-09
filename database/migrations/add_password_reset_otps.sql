-- Migration: Password Reset OTPs
-- Stores one active OTP per user for SMS-based password resets.
-- requestPasswordReset.php generates a 6-digit code (hashed), resets attempts
-- and resend throttle; resetPasswordWithOtp.php verifies and clears it.

USE holy_family_parish;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_sent_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reset_user (user_id),
  INDEX idx_reset_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
