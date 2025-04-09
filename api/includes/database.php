<?php
require_once 'config.php';

class Database {
    private $host = DB_HOST;
    private $user = DB_USER;
    private $pass = DB_PASS;
    private $dbname = DB_NAME;
    
    private $conn;
    private $error;
    
    public function __construct() {
        $this->connect();
    }
    
    // Database connection
    private function connect() {
        $this->conn = null;
        
        try {
            $this->conn = new mysqli($this->host, $this->user, $this->pass, $this->dbname);
            
            if ($this->conn->connect_error) {
                throw new Exception('Database connection failed: ' . $this->conn->connect_error);
            }
            
            // Set charset to UTF8
            $this->conn->set_charset('utf8');
            
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            echo json_encode(['error' => $this->error]);
            exit();
        }
        
        return $this->conn;
    }
    
    // Get database connection
    public function getConnection() {
        return $this->conn;
    }
}
?> 