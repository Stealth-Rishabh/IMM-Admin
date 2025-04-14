




<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'imm_cms');
define('DB_PASS', 'AUZCGDJCZDFI'); // Default XAMPP password is empty
define('DB_NAME', 'imm_cms');

// File upload configuration
define('UPLOAD_DIR', __DIR__ . '/../uploads/');  // Adjust path as needed
define('UPLOAD_URL', 'https://stealthlearn.in/imm-admin/api/uploads/');  // Your local URL

// Error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Create uploads directory if it doesn't exist
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}
?>