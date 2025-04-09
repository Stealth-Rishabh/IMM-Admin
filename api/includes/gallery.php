<?php
require_once 'database.php';

class Gallery {
    private $conn;
    private $table = 'gallery';
    
    // Gallery properties based on the database schema from the image
    public $id;
    public $category;
    public $filename;
    public $filepath;
    public $size;
    public $title;
    public $created_at;
    public $updated_at;
    
    // Constructor with DB connection
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Read all images
    public function readAll() {
        $query = "SELECT * FROM {$this->table} ORDER BY created_at DESC";
        $result = $this->conn->query($query);
        
        if (!$result) {
            return ['error' => 'Database query failed: ' . $this->conn->error];
        }
        
        $images = [];
        while ($row = $result->fetch_assoc()) {
            $images[] = $row;
        }
        
        return $images;
    }
    
    // Read a single image by ID
    public function readSingle() {
        $query = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $this->id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            
            // Set properties
            $this->id = $row['id'];
            $this->category = $row['category'];
            $this->filename = $row['filename'];
            $this->filepath = $row['filepath'];
            $this->size = $row['size'];
            $this->title = $row['title'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            
            return true;
        }
        
        return false;
    }
    
    // Create a new image record
    public function create($file = null) {
        // Check if file is provided
        if ($file && isset($file['tmp_name']) && !empty($file['tmp_name'])) {
            $filename = basename($file['name']);
            $filesize = $file['size'];
            
            // Generate unique filename
            $new_filename = uniqid() . '_' . $filename;
            $upload_dir = '../uploads/';
            $filepath = $upload_dir . $new_filename;
            $target_path = dirname(__DIR__) . '/uploads/' . $new_filename;
            
            // Move the uploaded file
            if (!move_uploaded_file($file['tmp_name'], $target_path)) {
                return ['error' => 'Failed to upload file'];
            }
            
            $this->filename = $new_filename;
            $this->filepath = $filepath;
            $this->size = $filesize;
        }
        
        $now = date('Y-m-d H:i:s');
        $this->created_at = $now;
        $this->updated_at = $now;
        
        $query = "INSERT INTO {$this->table} (title, category, filename, filepath, size, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('ssssisd', 
            $this->title, 
            $this->category, 
            $this->filename, 
            $this->filepath, 
            $this->size, 
            $this->created_at, 
            $this->updated_at
        );
        
        if ($stmt->execute()) {
            $this->id = $this->conn->insert_id;
            return true;
        }
        
        return ['error' => 'Database error: ' . $stmt->error];
    }
    
    // Update an existing image record
    public function update($file = null) {
        $this->updated_at = date('Y-m-d H:i:s');
        $debug = [];
        
        // Validate ID first
        if (empty($this->id)) {
            return ['error' => 'Missing ID for update', 'id' => $this->id];
        }
        
        // Check if the image exists before updating
        $exists_query = "SELECT * FROM {$this->table} WHERE id = ?";
        $exists_stmt = $this->conn->prepare($exists_query);
        $exists_stmt->bind_param('i', $this->id);
        $exists_stmt->execute();
        $exists_result = $exists_stmt->get_result();
        
        if ($exists_result->num_rows === 0) {
            return ['error' => "Image with ID {$this->id} not found"];
        }
        
        // If a new file is uploaded, update file details
        if ($file && isset($file['tmp_name']) && !empty($file['tmp_name'])) {
            $debug['file_update'] = true;
            
            // If we have an existing file, delete it
            if ($this->readSingle() && !empty($this->filename)) {
                $old_file_path = dirname(__DIR__) . '/uploads/' . $this->filename;
                $debug['old_file'] = $old_file_path;
                $debug['old_file_exists'] = file_exists($old_file_path);
                
                if (file_exists($old_file_path)) {
                    $unlink_result = unlink($old_file_path);
                    $debug['old_file_deleted'] = $unlink_result;
                    if (!$unlink_result) {
                        $debug['unlink_error'] = error_get_last();
                    }
                }
            }
            
            // Upload new file
            $filename = basename($file['name']);
            $filesize = $file['size'];
            
            // Generate unique filename
            $new_filename = uniqid() . '_' . $filename;
            $upload_dir = '../uploads/';
            $filepath = $upload_dir . $new_filename;
            $target_path = dirname(__DIR__) . '/uploads/' . $new_filename;
            
            $debug['new_file'] = [
                'filename' => $new_filename,
                'target_path' => $target_path,
                'tmp_name' => $file['tmp_name']
            ];
            
            // Move the uploaded file
            $move_result = move_uploaded_file($file['tmp_name'], $target_path);
            $debug['move_result'] = $move_result;
            
            if (!$move_result) {
                $debug['move_error'] = error_get_last();
                return ['error' => 'Failed to upload file', 'debug' => $debug];
            }
            
            $this->filename = $new_filename;
            $this->filepath = $filepath;
            $this->size = $filesize;
            
            $query = "UPDATE {$this->table} 
                      SET title = ?, category = ?, filename = ?, filepath = ?, size = ?, updated_at = ? 
                      WHERE id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ssssssi', 
                $this->title, 
                $this->category, 
                $this->filename, 
                $this->filepath, 
                $this->size, 
                $this->updated_at, 
                $this->id
            );
        } else {
            $debug['metadata_update'] = true;
            
            // Only update metadata
            $query = "UPDATE {$this->table} 
                      SET title = ?, category = ?, updated_at = ? 
                      WHERE id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('sssi', 
                $this->title, 
                $this->category, 
                $this->updated_at, 
                $this->id
            );
        }
        
        $debug['query'] = $query;
        $debug['params'] = [
            'title' => $this->title,
            'category' => $this->category,
            'id' => $this->id
        ];
        
        if ($stmt->execute()) {
            $debug['execute_result'] = true;
            $debug['affected_rows'] = $stmt->affected_rows;
            
            if ($stmt->affected_rows > 0) {
                return true;
            } else {
                // If no rows were affected but no error occurred,
                // it could mean no changes were made
                return ['warning' => 'No changes were made to the record', 'debug' => $debug];
            }
        }
        
        $debug['execute_result'] = false;
        $debug['error'] = $stmt->error;
        return ['error' => 'Database error: ' . $stmt->error, 'debug' => $debug];
    }
    
    // Delete an image record
    public function delete() {
        // First, get the image details to delete the file
        if ($this->readSingle()) {
            // Delete the physical file if it exists
            if (!empty($this->filename)) {
                $file_path = dirname(__DIR__) . '/uploads/' . $this->filename;
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
            }
            
            // Delete the database record
            $query = "DELETE FROM {$this->table} WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('i', $this->id);
            
            if ($stmt->execute()) {
                return true;
            }
        }
        
        return ['error' => 'Failed to delete image or image not found'];
    }
}
?> 