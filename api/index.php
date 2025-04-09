<?php
require_once 'includes/config.php';
require_once 'includes/gallery.php';

// Define log file path first
$logFile = dirname(__FILE__) . '/debug.log';

// Debug raw post data and input stream
$rawPostData = file_get_contents('php://input');
$requestHeaders = getallheaders();
$phpInput = [];
parse_str($rawPostData, $phpInput);

$debugInfo = [
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
    'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? 'not set',
    'CONTENT_LENGTH' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
    'REQUEST_HEADERS' => $requestHeaders,
    'PHP_INPUT_LENGTH' => strlen($rawPostData),
    'POST_VARS' => $_POST,
    'FILES_VARS' => $_FILES,
    'PHP_INPUT' => $phpInput
];

file_put_contents($logFile, date('Y-m-d H:i:s') . ' - DETAILED REQUEST INFO: ' . json_encode($debugInfo, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);

// Log requests for debugging
$requestInfo = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri' => $_SERVER['REQUEST_URI'],
    'files' => !empty($_FILES) ? array_keys($_FILES) : [],
    'post' => !empty($_POST) ? array_keys($_POST) : [],
    'get' => !empty($_GET) ? $_GET : [],
];
file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . json_encode($requestInfo) . PHP_EOL, FILE_APPEND);

// Check for options request (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return only the headers for OPTIONS requests
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("HTTP/1.1 200 OK");
    exit(0);
}

// Set headers for CORS (important for API)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// For all non-OPTIONS requests, set JSON response type
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    header("Content-Type: application/json; charset=UTF-8");
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Check for _method parameter for method overrides (commonly used for PUT/DELETE with forms)
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

// Determine the resource being requested
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Default resource is gallery
$resource = 'gallery';

// Check if a specific resource is requested in the URL
if (isset($uri[count($uri) - 2]) && $uri[count($uri) - 2] === 'api') {
    if (isset($uri[count($uri) - 1]) && !empty($uri[count($uri) - 1])) {
        $resource = $uri[count($uri) - 1];
    }
} elseif (isset($_GET['resource'])) {
    // Also support resource selection via query parameter
    $resource = $_GET['resource'];
}

// Log the method and resource being requested
file_put_contents($logFile, date('Y-m-d H:i:s') . ' - Method: ' . $method . ', Resource: ' . $resource . PHP_EOL, FILE_APPEND);

// Process request based on the resource
switch ($resource) {
    case 'gallery':
    default:
        // Create a new Gallery instance
        $gallery = new Gallery();
        
        // Process request based on method
        switch ($method) {
            case 'GET':
                // Check if an ID is provided (for reading a single image)
                if (isset($_GET['id'])) {
                    $gallery->id = $_GET['id'];
                    
                    if ($gallery->readSingle()) {
                        $image = [
                            'id' => $gallery->id,
                            'title' => $gallery->title,
                            'category' => $gallery->category,
                            'filename' => $gallery->filename,
                            'filepath' => $gallery->filepath,
                            'size' => $gallery->size,
                            'created_at' => $gallery->created_at,
                            'updated_at' => $gallery->updated_at,
                            'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
                        ];
                        
                        echo json_encode($image);
                    } else {
                        http_response_code(404);
                        echo json_encode(['message' => 'Image not found']);
                    }
                } else {
                    // Get all images
                    $result = $gallery->readAll();
                    
                    if (isset($result['error'])) {
                        http_response_code(500);
                        echo json_encode($result);
                        exit;
                    }
                    
                    // Add full URL to each image
                    foreach ($result as &$image) {
                        $image['url'] = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $image['filename'];
                    }
                    
                    echo json_encode($result);
                }
                break;
                
            case 'POST':
                // Check if we're uploading a file
                if (isset($_FILES['file'])) {
                    // Set properties from the form data
                    $gallery->title = isset($_POST['title']) ? $_POST['title'] : '';
                    $gallery->category = isset($_POST['category']) ? $_POST['category'] : 'Uncategorized';
                    
                    // Create the image record
                    $result = $gallery->create($_FILES['file']);
                    
                    if ($result === true) {
                        http_response_code(201);
                        echo json_encode([
                            'message' => 'Image created successfully',
                            'id' => $gallery->id,
                            'title' => $gallery->title,
                            'category' => $gallery->category,
                            'filename' => $gallery->filename,
                            'filepath' => $gallery->filepath,
                            'size' => $gallery->size,
                            'created_at' => $gallery->created_at,
                            'updated_at' => $gallery->updated_at,
                            'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode($result);
                    }
                } else {
                    // Handle JSON data for batch uploads or operations without files
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (isset($data['images']) && is_array($data['images'])) {
                        $responses = [];
                        
                        foreach ($data['images'] as $image) {
                            $gallery->title = $image['title'] ?? '';
                            $gallery->category = $image['category'] ?? 'Uncategorized';
                            
                            if ($gallery->create()) {
                                $responses[] = [
                                    'success' => true,
                                    'id' => $gallery->id,
                                    'title' => $gallery->title,
                                    'category' => $gallery->category
                                ];
                            } else {
                                $responses[] = [
                                    'success' => false,
                                    'message' => 'Failed to create image record'
                                ];
                            }
                        }
                        
                        echo json_encode($responses);
                    } else {
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid data format or missing files']);
                    }
                }
                break;
                
            case 'PUT':
                // First, get the ID from the URL query parameter if available
                $id = isset($_GET['id']) ? $_GET['id'] : null;
                
                // Set the ID in the gallery object
                if ($id) {
                    $gallery->id = $id;
                }
                
                // Check if we're updating with a file
                if (isset($_FILES['file']) && $_FILES['file']['size'] > 0) {
                    // Set title and category from POST data, explicitly check each key
                    $gallery->title = !empty($_POST['title']) ? $_POST['title'] : '';
                    $gallery->category = !empty($_POST['category']) ? $_POST['category'] : 'Uncategorized';
                    
                    // Check if ID was not found in URL but is in POST data
                    if (empty($gallery->id) && isset($_POST['id'])) {
                        $gallery->id = $_POST['id'];
                    }
                    
                    if (empty($gallery->id)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'ID is required for update']);
                        exit;
                    }
                    
                    // Update the image record
                    $result = $gallery->update($_FILES['file']);
                    
                    if ($result === true) {
                        // Read the updated image to get all of its properties
                        $gallery->readSingle();
                        
                        echo json_encode([
                            'message' => 'Image updated successfully',
                            'id' => $gallery->id,
                            'title' => $gallery->title,
                            'category' => $gallery->category,
                            'filename' => $gallery->filename,
                            'filepath' => $gallery->filepath,
                            'size' => $gallery->size,
                            'updated_at' => $gallery->updated_at,
                            'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode($result);
                    }
                } else {
                    // For metadata updates (no file)
                    
                    // Try to get data from various sources
                    $title = '';
                    $category = 'Uncategorized';
                    $id = $gallery->id ?: null;
                    
                    // First check POST data for direct form submissions
                    if (isset($_POST['title'])) {
                        $title = $_POST['title'];
                    }
                    
                    if (isset($_POST['category'])) {
                        $category = $_POST['category'];
                    }
                    
                    if (empty($id) && isset($_POST['id'])) {
                        $id = $_POST['id'];
                    }
                    
                    // If not in POST, check the raw input for PUT requests
                    if (empty($title) || $category === 'Uncategorized' || empty($id)) {
                        $input = file_get_contents('php://input');
                        $input_data = json_decode($input, true);
                        
                        if (json_last_error() === JSON_ERROR_NONE && is_array($input_data)) {
                            if (empty($title) && isset($input_data['title'])) {
                                $title = $input_data['title'];
                            }
                            
                            if ($category === 'Uncategorized' && isset($input_data['category'])) {
                                $category = $input_data['category'];
                            }
                            
                            if (empty($id) && isset($input_data['id'])) {
                                $id = $input_data['id'];
                            }
                        }
                    }
                    
                    if (empty($id)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'ID is required for update']);
                        exit;
                    }
                    
                    // Set the properties
                    $gallery->id = $id;
                    $gallery->title = $title;
                    $gallery->category = $category;
                    
                    // Update metadata only
                    $result = $gallery->update();
                    
                    if ($result === true || (is_array($result) && isset($result['warning']))) {
                        // Read the updated image to get all of its properties
                        $gallery->readSingle();
                        
                        echo json_encode([
                            'message' => 'Image updated successfully',
                            'id' => $gallery->id,
                            'title' => $gallery->title,
                            'category' => $gallery->category,
                            'filename' => $gallery->filename,
                            'filepath' => $gallery->filepath,
                            'size' => $gallery->size,
                            'updated_at' => $gallery->updated_at,
                            'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode($result);
                    }
                }
                break;
                
            case 'DELETE':
                // Get ID from URL
                $id = isset($_GET['id']) ? $_GET['id'] : null;
                
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['message' => 'ID is required for deletion']);
                    exit;
                }
                
                $gallery->id = $id;
                
                // Delete the image
                $result = $gallery->delete();
                
                if ($result === true) {
                    echo json_encode(['message' => 'Image deleted successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode($result);
                }
                break;
                
            default:
                http_response_code(405);
                echo json_encode(['message' => 'Method not allowed']);
                break;
        }
        break;
}
?> 