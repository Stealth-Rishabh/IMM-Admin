-- Create placement table with logo_file field
CREATE TABLE IF NOT EXISTS `placement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Uncategorized',
  `description` text DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `logo_file` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 