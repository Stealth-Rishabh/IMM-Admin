<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/testimonial.php';

$method = $_SERVER['REQUEST_METHOD'];
$testimonial = new Testimonial();

try {
    switch ($method) {
        case 'GET':
            $testimonials = $testimonial->getTestimonials();
            echo json_encode($testimonials);
            break;

        case 'POST':
            if (isset($_POST['id'])) {
                $id = $_POST['id'];
                $name = $_POST['name'] ?? '';
                $position = $_POST['position'] ?? '';
                $testimonial_text = $_POST['testimonial'] ?? '';
                $link = $_POST['link'] ?? '';
                $file = $_FILES['file'] ?? null;
                $testimonial->updateTestimonial($id, $name, $position, $testimonial_text, $link, $file);
                http_response_code(200);
                echo json_encode(['message' => 'Testimonial updated successfully']);
            } else {
                $name = $_POST['name'] ?? '';
                $position = $_POST['position'] ?? '';
                $testimonial_text = $_POST['testimonial'] ?? '';
                $link = $_POST['link'] ?? '';
                $file = $_FILES['file'] ?? null;
                if (!$file) throw new Exception('No file uploaded.');
                $id = $testimonial->uploadTestimonial($name, $position, $testimonial_text, $link, $file);
                http_response_code(201);
                echo json_encode(['id' => $id, 'message' => 'Testimonial uploaded successfully']);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('Missing testimonial ID.');
            $testimonial->deleteTestimonial($id);
            http_response_code(200);
            echo json_encode(['message' => 'Testimonial deleted successfully']);
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