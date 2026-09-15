CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  occasion VARCHAR(120) DEFAULT NULL,
  location VARCHAR(255) NOT NULL,
  budget DECIMAL(12,2) DEFAULT NULL,
  preferred_date DATE DEFAULT NULL,
  requester_name VARCHAR(150) DEFAULT NULL,
  requester_email VARCHAR(190) DEFAULT NULL,
  requester_whatsapp VARCHAR(60) DEFAULT NULL,
  requester_phone VARCHAR(60) DEFAULT NULL,
  request_type ENUM('service', 'gift') NOT NULL DEFAULT 'service',
  service_type VARCHAR(120) DEFAULT NULL,
  gift_recipients JSON DEFAULT NULL,
  status ENUM('pending', 'open', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_requests_user_id (user_id),
  INDEX idx_service_requests_status (status),
  CONSTRAINT fk_service_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS request_proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  provider_id INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  message TEXT DEFAULT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request_proposals_request_id (request_id),
  INDEX idx_request_proposals_provider_id (provider_id),
  INDEX idx_request_proposals_status (status),
  UNIQUE KEY uniq_request_provider (request_id, provider_id),
  CONSTRAINT fk_request_proposals_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_request_proposals_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
