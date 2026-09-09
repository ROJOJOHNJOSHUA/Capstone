USE holy_family_parish;

CREATE TABLE IF NOT EXISTS system_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
