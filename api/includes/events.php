<?php
// Include the database connection
require_once 'database.php';

function getEvents($conn) {
    try {
        $stmt = $conn->query("
            SELECT e.*, 
                   GROUP_CONCAT(DISTINCT t.tag) AS tags,
                   GROUP_CONCAT(DISTINCT g.image_url) AS gallery
            FROM events e
            LEFT JOIN event_tags t ON e.id = t.event_id
            LEFT JOIN event_gallery g ON e.id = g.event_id
            GROUP BY e.id
        ");
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process arrays
        foreach ($events as &$event) {
            $event['tags'] = $event['tags'] ? explode(',', $event['tags']) : [];
            $event['gallery'] = $event['gallery'] ? explode(',', $event['gallery']) : [];
        }

        echo json_encode($events);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function getEvent($conn, $id) {
    try {
        $event = getEventById($conn, $id);
        
        if ($event) {
            echo json_encode($event);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function createEvent($conn) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (empty($data['title']) || empty($data['date']) || 
           empty($data['category']) || empty($data['description']) || 
           empty($data['image'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        // Process image
        $imagePath = saveBase64Image($data['image'], 'thumbnail');

        // Insert event
        $stmt = $conn->prepare("
            INSERT INTO events (title, date, category, description, image)
            VALUES (:title, :date, :category, :description, :image)
        ");
        $stmt->execute([
            ':title' => $data['title'],
            ':date' => $data['date'],
            ':category' => $data['category'],
            ':description' => $data['description'],
            ':image' => $imagePath
        ]);
        $eventId = $conn->lastInsertId();

        // Insert tags
        if (!empty($data['tags'])) {
            $stmt = $conn->prepare("INSERT INTO event_tags (event_id, tag) VALUES (:event_id, :tag)");
            foreach ($data['tags'] as $tag) {
                $stmt->execute([':event_id' => $eventId, ':tag' => $tag]);
            }
        }

        // Insert gallery
        if (!empty($data['gallery'])) {
            $stmt = $conn->prepare("INSERT INTO event_gallery (event_id, image_url) VALUES (:event_id, :image_url)");
            foreach ($data['gallery'] as $image) {
                $galleryPath = saveBase64Image($image, 'gallery');
                $stmt->execute([':event_id' => $eventId, ':image_url' => $galleryPath]);
            }
        }

        // Return created event
        http_response_code(201);
        echo json_encode(getEventById($conn, $eventId));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function updateEvent($conn, $id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if event exists
        $eventExists = $conn->prepare("SELECT id FROM events WHERE id = ?");
        $eventExists->execute([$id]);
        if (!$eventExists->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            return;
        }
        
        // Update event details
        $sql = "UPDATE events SET 
                title = :title, 
                date = :date, 
                category = :category, 
                description = :description";
        
        $params = [
            ':title' => $data['title'],
            ':date' => $data['date'],
            ':category' => $data['category'],
            ':description' => $data['description'],
            ':id' => $id
        ];
        
        // Handle image if it has changed (starts with data:image)
        if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
            $imagePath = saveBase64Image($data['image'], 'thumbnail');
            $sql .= ", image = :image";
            $params[':image'] = $imagePath;
        }
        
        $sql .= " WHERE id = :id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        // Update tags - first delete existing
        $deleteTags = $conn->prepare("DELETE FROM event_tags WHERE event_id = ?");
        $deleteTags->execute([$id]);
        
        // Then insert new tags
        if (!empty($data['tags'])) {
            $stmt = $conn->prepare("INSERT INTO event_tags (event_id, tag) VALUES (:event_id, :tag)");
            foreach ($data['tags'] as $tag) {
                $stmt->execute([':event_id' => $id, ':tag' => $tag]);
            }
        }
        
        // Handle gallery - update only if new images were provided
        if (!empty($data['gallery'])) {
            $newGallery = false;
            foreach ($data['gallery'] as $image) {
                if (strpos($image, 'data:image') === 0) {
                    $newGallery = true;
                    break;
                }
            }
            
            if ($newGallery) {
                // Delete existing gallery
                $deleteGallery = $conn->prepare("DELETE FROM event_gallery WHERE event_id = ?");
                $deleteGallery->execute([$id]);
                
                // Insert new gallery
                $stmt = $conn->prepare("INSERT INTO event_gallery (event_id, image_url) VALUES (:event_id, :image_url)");
                foreach ($data['gallery'] as $image) {
                    $galleryPath = strpos($image, 'data:image') === 0 
                        ? saveBase64Image($image, 'gallery') 
                        : $image;
                    $stmt->execute([':event_id' => $id, ':image_url' => $galleryPath]);
                }
            }
        }
        
        // Return updated event
        echo json_encode(getEventById($conn, $id));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function deleteEvent($conn, $id) {
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Delete tags
        $deleteTags = $conn->prepare("DELETE FROM event_tags WHERE event_id = ?");
        $deleteTags->execute([$id]);
        
        // Delete gallery
        $deleteGallery = $conn->prepare("DELETE FROM event_gallery WHERE event_id = ?");
        $deleteGallery->execute([$id]);
        
        // Delete event
        $deleteEvent = $conn->prepare("DELETE FROM events WHERE id = ?");
        $deleteEvent->execute([$id]);
        
        // Check if event was actually deleted
        if ($deleteEvent->rowCount() === 0) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            return;
        }
        
        // Commit transaction
        $conn->commit();
        
        // Return success
        echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function saveBase64Image($base64Data, $type) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    
    $parts = explode(',', $base64Data);
    $meta = explode(';', $parts[0])[0];
    $extension = str_replace('data:image/', '', $meta);
    $filename = $type . '_' . uniqid() . '.' . $extension;
    $filePath = $uploadDir . $filename;
    
    file_put_contents($filePath, base64_decode($parts[1]));
    
    // Return the relative path from the API root for client access
    return 'uploads/' . $filename;
}

function getEventById($conn, $id) {
    $stmt = $conn->prepare("
        SELECT e.*, 
               GROUP_CONCAT(DISTINCT t.tag) AS tags,
               GROUP_CONCAT(DISTINCT g.image_url) AS gallery
        FROM events e
        LEFT JOIN event_tags t ON e.id = t.event_id
        LEFT JOIN event_gallery g ON e.id = g.event_id
        WHERE e.id = ?
        GROUP BY e.id
    ");
    $stmt->execute([$id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($event) {
        $event['tags'] = $event['tags'] ? explode(',', $event['tags']) : [];
        $event['gallery'] = $event['gallery'] ? explode(',', $event['gallery']) : [];
    }
    
    return $event;
}
?>