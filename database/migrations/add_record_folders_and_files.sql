-- Upgrade the previous record_folders/record_files tables for scoped file-manager locations.
-- Select the parish database before running this migration.

ALTER TABLE record_folders
  ADD COLUMN parent_scope VARCHAR(160) NULL AFTER parent_id,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE record_folders
SET parent_scope = CASE
  WHEN parent_id IS NOT NULL THEN CONCAT('folder:', parent_id)
  WHEN name IN ('Marriage', 'Funeral', 'Baptism', 'Mass Intention', 'Private Mass', 'Others') THEN CONCAT('legacy:', id)
  ELSE 'root'
END
WHERE parent_scope IS NULL;

ALTER TABLE record_folders
  MODIFY parent_scope VARCHAR(160) NOT NULL,
  ADD UNIQUE KEY uk_record_folder_scope_name (parent_scope, name),
  ADD INDEX idx_record_folders_scope (parent_scope);

ALTER TABLE record_files
  ADD COLUMN parent_scope VARCHAR(160) NULL AFTER folder_id;

UPDATE record_files
SET parent_scope = CASE
  WHEN folder_id IS NOT NULL THEN CONCAT('folder:', folder_id)
  ELSE 'root'
END
WHERE parent_scope IS NULL;

ALTER TABLE record_files
  MODIFY parent_scope VARCHAR(160) NOT NULL,
  ADD INDEX idx_record_files_scope (parent_scope);
