<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/edutour.php';

$method = $_SERVER['REQUEST_METHOD'];
$edutour = new EduTour();

try {
    switch ($method) {
        case 'GET':
            $tours = $edutour->getTours();
            echo json_encode($tours);
            break;

        case 'POST':
            if (isset($_POST['id'])) {
                $id = $_POST['id'];
                $title = $_POST['title'] ?? '';
                $category = $_POST['category'] ?? 'Uncategorized';
                $subcategory = $_POST['subcategory'] ?? '';
                $description = $_POST['description'] ?? null;
                $file = $_FILES['file'] ?? null;
                $edutour->updateTour($id, $title, $category, $subcategory, $description, $file);
                http_response_code(200);
                echo json_encode(['message' => 'Tour updated successfully']);
            } else {
                $title = $_POST['title'] ?? '';
                $category = $_POST['category'] ?? 'Uncategorized';
                $subcategory = $_POST['subcategory'] ?? '';
                $description = $_POST['description'] ?? null;
                $file = $_FILES['file'] ?? null;
                if (!$file) throw new Exception('No file uploaded.');
                $id = $edutour->uploadTour($title, $category, $subcategory, $description, $file);
                http_response_code(201);
                echo json_encode(['id' => $id, 'message' => 'Tour uploaded successfully']);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('Missing tour ID.');
            $edutour->deleteTour($id);
            http_response_code(200);
            echo json_encode(['message' => 'Tour deleted successfully']);
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