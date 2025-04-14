<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/placement.php';

$method = $_SERVER['REQUEST_METHOD'];
$placement = new Placement();

try {
    switch ($method) {
        case 'GET':
            $data = $placement->getPlacements();
            echo json_encode($data);
            break;

        case 'POST':
            if (isset($_POST['id'])) {
                $id = $_POST['id'];
                $title = $_POST['title'] ?? '';
                $category = $_POST['category'] ?? 'Uncategorized';
                $description = $_POST['description'] ?? null;
                $link = $_POST['link'] ?? null;
                $file = $_FILES['file'] ?? null;
                $logo_file = $_FILES['logo_file'] ?? null;
                
                $placement->updatePlacement($id, $title, $category, $description, $link, $file, $logo_file);
                http_response_code(200);
                echo json_encode(['message' => 'Placement data updated successfully']);
            } else {
                $title = $_POST['title'] ?? '';
                $category = $_POST['category'] ?? 'Uncategorized';
                $description = $_POST['description'] ?? null;
                $link = $_POST['link'] ?? null;
                $file = $_FILES['file'] ?? null;
                $logo_file = $_FILES['logo_file'] ?? null;
                
                if (!$file) throw new Exception('No file uploaded.');
                $id = $placement->uploadPlacement($title, $category, $description, $link, $file, $logo_file);
                http_response_code(201);
                echo json_encode(['id' => $id, 'message' => 'Placement data uploaded successfully']);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('Missing placement ID.');
            $placement->deletePlacement($id);
            http_response_code(200);
            echo json_encode(['message' => 'Placement data deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 