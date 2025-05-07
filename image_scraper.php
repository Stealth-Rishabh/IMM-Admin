<?php
// Error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
set_time_limit(0); // Remove execution time limit
ini_set('memory_limit', '512M'); // Increase memory if needed

// Start HTML output
header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html>
<html>
<head>
    <title>Image Scraper Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; margin: 5px 0; }
        .failure { color: red; margin: 5px 0; }
        .summary { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .progress-bar { width: 100%; background-color: #f3f3f3; border-radius: 5px; margin: 20px 0; }
        .progress-bar-inner { height: 24px; background-color: #4CAF50; border-radius: 5px; text-align: center; color: white; }
        h2 { margin-top: 30px; }
        .analytics { background-color: #e9f7fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .analytics h3 { margin-top: 0; }
    </style>
</head>
<body>
    <h1>Image Scraper Progress</h1>
    <div id="progress">';

flush();

// Configuration
$batchSize = 5; // Adjust based on server timeout limits
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$currentBatch = floor($offset / $batchSize) + 1;

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'temp_imm');
define('DB_NAME', 'temp_imm');
define('DB_PASS', 'No16.Fd04;62');

// Base URL Configuration
define('BASE_URL', 'https://www.immindia.edu.in/');
define('IMAGE_PATHS', ['images/', 'images_webp/']);

// Output Configuration
define('OUTPUT_DIR', __DIR__ . '/downloaded_webinar_events/');
define('MAX_IMAGE_SIZE', 5242880); // 5MB

// Statistics counters
$totalEvents = 0;
$totalImages = 0;
$successCount = 0;
$failureCount = 0;
$processedEvents = [];
$foldersCreated = 0;
$foldersFailed = 0;
$totalBatches = 0;

try {
    // Connect to database
    echo "<p>Connecting to database...</p>";
    flush();
    
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    echo "<p class='success'>Database connection successful.</p>";
    flush();
    
    // Create output directory
    if (!file_exists(OUTPUT_DIR)) {
        if (!mkdir(OUTPUT_DIR, 0755, true)) {
            throw new Exception("Failed to create output directory: " . OUTPUT_DIR);
        }
        echo "<p class='success'>Created output directory: " . htmlspecialchars(OUTPUT_DIR) . "</p>";
    } else {
        echo "<p class='success'>Output directory already exists: " . htmlspecialchars(OUTPUT_DIR) . "</p>";
    }
    flush();
    
    // Get total count for batch calculation
    $totalResult = $conn->query("SELECT COUNT(*) as total FROM events_achivements WHERE is_upcoming = 2");
    $totalRow = $totalResult->fetch_assoc();
    $totalItems = $totalRow['total'];
    $totalBatches = ceil($totalItems / $batchSize);
    
    echo "<div class='analytics'>
            <h3>Batch Analysis</h3>
            <p><strong>Current Batch:</strong> {$currentBatch} of {$totalBatches}</p>
            <p><strong>Items per Batch:</strong> {$batchSize}</p>
            <p><strong>Total Items:</strong> {$totalItems}</p>
          </div>";
    flush();
    
    // Get all events that match the condition is_upcoming = 2
    echo "<p>Fetching events where is_upcoming = 2 (Batch: $offset to " . ($offset + $batchSize) . ")...</p>";
    flush();
    
    $events = $conn->query("
        SELECT e.id, e.title, p.image 
        FROM events_achivements e
        LEFT JOIN events_photo p ON e.id = p.event_id
        WHERE e.is_upcoming = 2
        LIMIT $offset, $batchSize
    ");
    
    if (!$events) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $eventCount = $events->num_rows;
    echo "<p class='success'>Found {$eventCount} events to process in this batch.</p>";
    flush();
    
    if ($eventCount == 0) {
        echo "<p>No events match the criteria in this batch.</p>";
        flush();
    } else {
        echo "<h2>Processing Events</h2>";
        flush();
        
        // Process events
        $currentEvent = 0;
        while ($event = $events->fetch_assoc()) {
            $currentEvent++;
            $eventId = $event['id'];
            $eventTitle = $event['title'];
            
            // Skip events without images
            if (empty($event['image'])) {
                echo "<p>Event #{$eventId} '{$eventTitle}' has no images - skipping.</p>";
                flush();
                continue;
            }
            
            // Track processed events
            if (!isset($processedEvents[$eventId])) {
                $processedEvents[$eventId] = [
                    'title' => $eventTitle,
                    'images' => 0,
                    'success' => 0,
                    'failures' => 0
                ];
                $totalEvents++;
            }
            
            // Sanitize event title for folder name
            $folderName = preg_replace('/[^a-zA-Z0-9_-]/', '', $eventTitle);
            if (empty($folderName)) {
                $folderName = 'event_' . $eventId;
            }
            $eventDir = OUTPUT_DIR . $folderName . '/';
            
            echo "<p>Processing event #{$eventId}: '" . htmlspecialchars($eventTitle) . "' ({$currentEvent}/{$eventCount})</p>";
            flush();
            
            // Create event directory
            if (!file_exists($eventDir)) {
                if (!mkdir($eventDir, 0755)) {
                    echo "<p class='failure'>Failed to create directory: " . htmlspecialchars($eventDir) . "</p>";
                    $foldersFailed++;
                    flush();
                    continue;
                }
                echo "<p class='success'>Created directory: " . htmlspecialchars($eventDir) . "</p>";
                $foldersCreated++;
            } else {
                echo "<p class='success'>Directory already exists: " . htmlspecialchars($eventDir) . "</p>";
                // Don't increment folders created if it already existed
            }
            flush();
            
            // Process image versions
            foreach (IMAGE_PATHS as $imagePath) {
                $imageUrl = BASE_URL . $imagePath . basename($event['image']);
                $localPath = $eventDir . basename($event['image']);
                
                if ($imagePath === 'images_webp/') {
                    // Create a unique filename for the webp version
                    $localPath = $eventDir . 'webp_' . basename($event['image']);
                }
                
                $totalImages++;
                $processedEvents[$eventId]['images']++;
                
                // Check if file already exists
                if (file_exists($localPath)) {
                    $successCount++;
                    $processedEvents[$eventId]['success']++;
                    echo "<div class='success'>File already exists: " . htmlspecialchars(basename($localPath)) . "</div>";
                    continue;
                }
                
                // Download image
                if (downloadImage($imageUrl, $localPath)) {
                    $successCount++;
                    $processedEvents[$eventId]['success']++;
                    echo "<div class='success'>Downloaded: " . htmlspecialchars($imageUrl) . "</div>";
                } else {
                    $failureCount++;
                    $processedEvents[$eventId]['failures']++;
                    echo "<div class='failure'>Failed: " . htmlspecialchars($imageUrl) . "</div>";
                }
                flush();
            }
            
            // Show progress
            $percentComplete = round(($currentEvent / $eventCount) * 100);
            echo "<div class='progress-bar'>
                    <div class='progress-bar-inner' style='width:{$percentComplete}%'>{$percentComplete}%</div>
                  </div>";
            flush();
        }
    }
    
    // Automatic batch continuation
    if ($eventCount == $batchSize) {
        $nextOffset = $offset + $batchSize;
        echo "<meta http-equiv='refresh' content='2;url=?offset=$nextOffset'>";
        echo "<p>Continuing to next batch automatically...</p>";
    } else {
        echo "<p class='success'>All batches processed successfully!</p>";
    }
    
    $conn->close();
    echo "<p class='success'>Database connection closed.</p>";
    
} catch (Exception $e) {
    echo "<div class='failure'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</div>";
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
        echo "<p>Database connection closed.</p>";
    }
}

// Summary
echo "</div>
    <div class='summary'>
        <h2>Migration Summary</h2>
        <div class='analytics'>
            <h3>Batch Analysis</h3>
            <p><strong>Total Batches:</strong> {$totalBatches}</p>
            <p><strong>Current Batch:</strong> {$currentBatch} of {$totalBatches}</p>
        </div>
        
        <div class='analytics'>
            <h3>Folder Analysis</h3>
            <p><strong>Folders Created:</strong> {$foldersCreated}</p>
            <p><strong>Folders Failed:</strong> {$foldersFailed}</p>
        </div>
        
        <div class='analytics'>
            <h3>Content Analysis</h3>
            <p><strong>Total events processed:</strong> {$totalEvents}</p>
            <p><strong>Total images processed:</strong> {$totalImages}</p>
            <p><strong>Successfully downloaded:</strong> {$successCount}</p>
            <p><strong>Failed downloads:</strong> {$failureCount}</p>
        </div>";

if ($totalEvents > 0) {
    echo "<h3>Events Detail</h3>
          <table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%;'>
          <tr>
            <th>Event Title</th>
            <th>Images</th>
            <th>Successful</th>
            <th>Failed</th>
          </tr>";
    
    foreach ($processedEvents as $eventData) {
        echo "<tr>
                <td>" . htmlspecialchars($eventData['title']) . "</td>
                <td>" . $eventData['images'] . "</td>
                <td>" . $eventData['success'] . "</td>
                <td>" . $eventData['failures'] . "</td>
              </tr>";
    }
    
    echo "</table>";
}

echo "<p>Check the 'downloaded_webinar_events' directory for downloaded files.</p>
    </div>
</body>
</html>";

/**
 * Downloads an image from a URL and saves it to the specified path
 * 
 * @param string $url URL of the image to download
 * @param string $savePath Local path to save the image
 * @return bool True if download was successful, false otherwise
 */
function downloadImage($url, $savePath) {
    // Skip if already exists
    if (file_exists($savePath)) return true;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXFILESIZE, MAX_IMAGE_SIZE);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For HTTPS connections
    
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($httpCode !== 200 || !$imageData) {
        return false;
    }
    
    // Verify image content (skip if GD library not available)
    if (function_exists('imagecreatefromstring')) {
        $img = @imagecreatefromstring($imageData);
        if (!$img) {
            return false;
        }
        imagedestroy($img);
    }
    
    return file_put_contents($savePath, $imageData) !== false;
} 