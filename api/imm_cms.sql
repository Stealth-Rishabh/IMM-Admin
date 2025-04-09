-- Database: `imm_cms`
--
-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `imm_cms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `imm_cms`;

-- Table structure for table `gallery`
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(255) DEFAULT 'Uncategorized',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `size` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

