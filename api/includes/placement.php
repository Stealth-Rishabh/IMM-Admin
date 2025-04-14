<?php
require_once 'database.php';
class Placement {
    private $db;
    private $uploadDir;
    private $uploadUrl;

    public function __construct() {
        $this->connectDB();
        $this->uploadDir = UPLOAD_DIR;
        $this->uploadUrl = UPLOAD_URL;
    }

    private function connectDB() {
        try {
            $this->db = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME,
                DB_USER,
                DB_PASS
            );
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public function getPlacements() {
        $stmt = $this->db->query("SELECT id, title, year, category, description, link, logo_file, file_name, created_at FROM placement ORDER BY created_at DESC");
        $placements = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['url'] = $this->uploadUrl . $row['file_name'];
            if ($row['logo_file']) {
                $row['logo_url'] = $this->uploadUrl . $row['logo_file'];
            }
            $placements[] = $row;
        }
        return $placements;
    }

    public function uploadPlacement($title, $year, $category, $description, $link, $file, $logo_file = null) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error: ' . $file['error']);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type.');
        }

        // Process main image
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $extension;
        $destination = $this->uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception('Failed to move uploaded file.');
        }

        // Process logo file if provided
        $logo_filename = null;
        if ($logo_file && $logo_file['error'] === UPLOAD_ERR_OK) {
            if (!in_array($logo_file['type'], $allowedTypes)) {
                throw new Exception('Invalid logo file type.');
            }

            $logo_extension = pathinfo($logo_file['name'], PATHINFO_EXTENSION);
            $logo_filename = uniqid() . '_logo.' . $logo_extension;
            $logo_destination = $this->uploadDir . $logo_filename;

            if (!move_uploaded_file($logo_file['tmp_name'], $logo_destination)) {
                throw new Exception('Failed to move uploaded logo file.');
            }
        }

        $stmt = $this->db->prepare("INSERT INTO placement (title, year, category, description, link, logo_file, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $year, $category, $description, $link, $logo_filename, $filename]);
        return $this->db->lastInsertId();
    }

    public function updatePlacement($id, $title, $year, $category, $description, $link, $file = null, $logo_file = null) {
        $stmt = $this->db->prepare("SELECT file_name, logo_file FROM placement WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) throw new Exception('Placement data not found.');

        $filename = $current['file_name'];
        $logo_filename = $current['logo_file'];

        // Handle main image update
        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            if (file_exists($this->uploadDir . $filename)) {
                unlink($this->uploadDir . $filename);
            }

            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception('Invalid file type.');
            }

            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $extension;
            $destination = $this->uploadDir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new Exception('Failed to move uploaded file.');
            }
        }

        // Handle logo file update
        if ($logo_file && $logo_file['error'] === UPLOAD_ERR_OK) {
            if ($logo_filename && file_exists($this->uploadDir . $logo_filename)) {
                unlink($this->uploadDir . $logo_filename);
            }

            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($logo_file['type'], $allowedTypes)) {
                throw new Exception('Invalid logo file type.');
            }

            $logo_extension = pathinfo($logo_file['name'], PATHINFO_EXTENSION);
            $logo_filename = uniqid() . '_logo.' . $logo_extension;
            $logo_destination = $this->uploadDir . $logo_filename;

            if (!move_uploaded_file($logo_file['tmp_name'], $logo_destination)) {
                throw new Exception('Failed to move uploaded logo file.');
            }
        }

        $stmt = $this->db->prepare("UPDATE placement SET title = ?, year = ?, category = ?, description = ?, link = ?, logo_file = ?, file_name = ? WHERE id = ?");
        $stmt->execute([$title, $year, $category, $description, $link, $logo_filename, $filename, $id]);
        return true;
    }

    public function deletePlacement($id) {
        $stmt = $this->db->prepare("SELECT file_name, logo_file FROM placement WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) throw new Exception('Placement data not found.');

        // Delete main image
        $filePath = $this->uploadDir . $current['file_name'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Delete logo if exists
        if ($current['logo_file']) {
            $logoPath = $this->uploadDir . $current['logo_file'];
            if (file_exists($logoPath)) {
                unlink($logoPath);
            }
        }

        $stmt = $this->db->prepare("DELETE FROM placement WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
?> 