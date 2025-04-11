<?php
// Include the database connection
require_once 'database.php';

function getClubs($conn) {
    try {
        $stmt = $conn->query("
            SELECT c.*, 
                   GROUP_CONCAT(DISTINCT t.tag) AS tags,
                   GROUP_CONCAT(DISTINCT g.image_url) AS gallery
            FROM clubs c
            LEFT JOIN club_tags t ON c.id = t.club_id
            LEFT JOIN club_gallery g ON c.id = g.club_id
            GROUP BY c.id
        ");
        $clubs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process arrays
        foreach ($clubs as &$club) {
            $club['tags'] = $club['tags'] ? explode(',', $club['tags']) : [];
            $club['gallery'] = $club['gallery'] ? explode(',', $club['gallery']) : [];
        }

        echo json_encode($clubs);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function getClub($conn, $id) {
    try {
        $club = getClubById($conn, $id);
        
        if ($club) {
            echo json_encode($club);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Club not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function createClub($conn) {
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

        // Insert club
        $stmt = $conn->prepare("
            INSERT INTO clubs (title, date, category, description, image)
            VALUES (:title, :date, :category, :description, :image)
        ");
        $stmt->execute([
            ':title' => $data['title'],
            ':date' => $data['date'],
            ':category' => $data['category'],
            ':description' => $data['description'],
            ':image' => $imagePath
        ]);
        $clubId = $conn->lastInsertId();

        // Insert tags
        if (!empty($data['tags'])) {
            $stmt = $conn->prepare("INSERT INTO club_tags (club_id, tag) VALUES (:club_id, :tag)");
            foreach ($data['tags'] as $tag) {
                $stmt->execute([':club_id' => $clubId, ':tag' => $tag]);
            }
        }

        // Insert gallery
        if (!empty($data['gallery'])) {
            $stmt = $conn->prepare("INSERT INTO club_gallery (club_id, image_url) VALUES (:club_id, :image_url)");
            foreach ($data['gallery'] as $image) {
                $galleryPath = saveBase64Image($image, 'gallery');
                $stmt->execute([':club_id' => $clubId, ':image_url' => $galleryPath]);
            }
        }

        // Return created club
        http_response_code(201);
        echo json_encode(getClubById($conn, $clubId));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function updateClub($conn, $id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if club exists
        $clubExists = $conn->prepare("SELECT id FROM clubs WHERE id = ?");
        $clubExists->execute([$id]);
        if (!$clubExists->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Club not found']);
            return;
        }
        
        // Update club details
        $sql = "UPDATE clubs SET 
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
        $deleteTags = $conn->prepare("DELETE FROM club_tags WHERE club_id = ?");
        $deleteTags->execute([$id]);
        
        // Then insert new tags
        if (!empty($data['tags'])) {
            $stmt = $conn->prepare("INSERT INTO club_tags (club_id, tag) VALUES (:club_id, :tag)");
            foreach ($data['tags'] as $tag) {
                $stmt->execute([':club_id' => $id, ':tag' => $tag]);
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
                $deleteGallery = $conn->prepare("DELETE FROM club_gallery WHERE club_id = ?");
                $deleteGallery->execute([$id]);
                
                // Insert new gallery
                $stmt = $conn->prepare("INSERT INTO club_gallery (club_id, image_url) VALUES (:club_id, :image_url)");
                foreach ($data['gallery'] as $image) {
                    $galleryPath = strpos($image, 'data:image') === 0 
                        ? saveBase64Image($image, 'gallery') 
                        : $image;
                    $stmt->execute([':club_id' => $id, ':image_url' => $galleryPath]);
                }
            }
        }
        
        // Return updated club
        echo json_encode(getClubById($conn, $id));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function deleteClub($conn, $id) {
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Delete tags
        $deleteTags = $conn->prepare("DELETE FROM club_tags WHERE club_id = ?");
        $deleteTags->execute([$id]);
        
        // Delete gallery
        $deleteGallery = $conn->prepare("DELETE FROM club_gallery WHERE club_id = ?");
        $deleteGallery->execute([$id]);
        
        // Delete club
        $deleteClub = $conn->prepare("DELETE FROM clubs WHERE id = ?");
        $deleteClub->execute([$id]);
        
        // Check if club was actually deleted
        if ($deleteClub->rowCount() === 0) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Club not found']);
            return;
        }
        
        // Commit transaction
        $conn->commit();
        
        // Return success
        echo json_encode(['success' => true, 'message' => 'Club deleted successfully']);
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

function getClubById($conn, $id) {
    $stmt = $conn->prepare("
        SELECT c.*, 
               GROUP_CONCAT(DISTINCT t.tag) AS tags,
               GROUP_CONCAT(DISTINCT g.image_url) AS gallery
        FROM clubs c
        LEFT JOIN club_tags t ON c.id = t.club_id
        LEFT JOIN club_gallery g ON c.id = g.club_id
        WHERE c.id = ?
        GROUP BY c.id
    ");
    $stmt->execute([$id]);
    $club = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($club) {
        $club['tags'] = $club['tags'] ? explode(',', $club['tags']) : [];
        $club['gallery'] = $club['gallery'] ? explode(',', $club['gallery']) : [];
    }
    
    return $club;
}
?> 