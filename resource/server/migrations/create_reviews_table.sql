-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceId INT NOT NULL,
  userId INT NULL,
  userName VARCHAR(255) NOT NULL,
  userEmail VARCHAR(255) NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_serviceId (serviceId),
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Add rating and reviewCount columns to services table if they don't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reviewCount INT DEFAULT 0;






















































