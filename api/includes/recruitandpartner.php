<?php
// echo "test";

class RecruitAndPartner {
    private $conn;
    private $table_name = "recruit_and_partner";
    
    // Constructor with database connection
    public function __construct($db) {
        $this->conn = $db;
        $this->createTableIfNotExists();
    }
    
    // Create the table if it doesn't exist
    private function createTableIfNotExists() {
        $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
            id INT(11) NOT NULL AUTO_INCREMENT,
            fullName VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            title VARCHAR(255) DEFAULT NULL,
            company VARCHAR(255) DEFAULT NULL,
            connectionType VARCHAR(50) NOT NULL,
            comments TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }
    
    // Create new submission
    public function create($data) {
        try {
            // Prepare query
            $query = "INSERT INTO " . $this->table_name . " 
                    (fullName, email, title, company, connectionType, comments) 
                    VALUES (:fullName, :email, :title, :company, :connectionType, :comments)";
            
            // Sanitize and prepare data
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':fullName', htmlspecialchars(strip_tags($data['fullName'])));
            $stmt->bindParam(':email', htmlspecialchars(strip_tags($data['email'])));
            $stmt->bindParam(':title', htmlspecialchars(strip_tags($data['title'] ?? '')));
            $stmt->bindParam(':company', htmlspecialchars(strip_tags($data['company'] ?? '')));
            $stmt->bindParam(':connectionType', htmlspecialchars(strip_tags($data['connectionType'])));
            $stmt->bindParam(':comments', htmlspecialchars(strip_tags($data['comments'] ?? '')));
            
            // Execute query
            $stmt->execute();
            
            return [
                "status" => "success",
                "message" => "Submission created successfully."
            ];
            
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }
    
    // Read all submissions (for admin use)
    public function read() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => $submissions
            ];
            
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }
}
?> 