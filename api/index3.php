<?php
require_once 'includes/config.php';
require_once 'includes/database.php';
require_once 'includes/clubs.php';

// CORS headers are already set in config.php, no need to duplicate them here

$db = new Database();
$conn = $db->getConnection();

$requestMethod = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Handle API routing
if ($resource === 'clubs') {
    switch ($requestMethod) {
        case 'GET':
            if ($id) getClub($conn, $id);
            else getClubs($conn);
            break;
        case 'POST':
            createClub($conn);
            break;
        case 'PUT':
            if ($id) updateClub($conn, $id);
            break;
        case 'DELETE':
            if ($id) deleteClub($conn, $id);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Resource Not Found']);
}
?> 