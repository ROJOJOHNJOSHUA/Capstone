ALTER TABLE reservations
  MODIFY COLUMN status ENUM('Pending', 'Under Review', 'Approved', 'Paid', 'Rejected', 'Completed', 'Cancelled')
  NOT NULL DEFAULT 'Pending';
