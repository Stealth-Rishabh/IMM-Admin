<?php
require_once 'includes/config.php';
require_once 'includes/database.php';
require_once 'includes/recruitandpartner.php';

// Initialize the database connection
$database = new Database();
$db = $database->getConnection();
$recruitAndPartner = new RecruitAndPartner($db);

// Set response headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For GET requests - list submissions (for admin use)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $recruitAndPartner->read();
    echo json_encode($result);
}

// For POST requests - create new submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        // If no JSON data received, check for form POST data
        $data = $_POST;
    }
    
    // Validate required fields
    if (
        empty($data['fullName']) || 
        empty($data['email']) || 
        empty($data['connectionType'])
    ) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing required fields (fullName, email, connectionType)"
        ]);
        exit;
    }
    
    // Process submission
    $result = $recruitAndPartner->create($data);
    
    if ($result['status'] === 'success') {
        http_response_code(201);
    } else {
        http_response_code(500);
    }
    
    echo json_encode($result);
}
?> 