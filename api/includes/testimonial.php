<?php
require_once 'database.php';

class Testimonial {
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

    public function getTestimonials() {
        $stmt = $this->db->query("SELECT id, name, position, testimonial, link, file_name, created_at FROM testimonials ORDER BY created_at DESC");
        $testimonials = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['url'] = $this->uploadUrl . $row['file_name'];
            $testimonials[] = $row;
        }
        return $testimonials;
    }

    public function uploadTestimonial($name, $position, $testimonial, $link, $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error: ' . $file['error']);
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

        $stmt = $this->db->prepare("INSERT INTO testimonials (name, position, testimonial, link, file_name) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $position, $testimonial, $link, $filename]);
        return $this->db->lastInsertId();
    }

    public function updateTestimonial($id, $name, $position, $testimonial, $link, $file = null) {
        $stmt = $this->db->prepare("SELECT file_name FROM testimonials WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) throw new Exception('Testimonial not found.');

        $filename = $current['file_name'];

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

            $stmt = $this->db->prepare("UPDATE testimonials SET name = ?, position = ?, testimonial = ?, link = ?, file_name = ? WHERE id = ?");
            $stmt->execute([$name, $position, $testimonial, $link, $filename, $id]);
        } else {
            $stmt = $this->db->prepare("UPDATE testimonials SET name = ?, position = ?, testimonial = ?, link = ? WHERE id = ?");
            $stmt->execute([$name, $position, $testimonial, $link, $id]);
        }
        return true;
    }

    public function deleteTestimonial($id) {
        $stmt = $this->db->prepare("SELECT file_name FROM testimonials WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) throw new Exception('Testimonial not found.');

        $filePath = $this->uploadDir . $current['file_name'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $stmt = $this->db->prepare("DELETE FROM testimonials WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
?> 