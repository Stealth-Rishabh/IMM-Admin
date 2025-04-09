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
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->user, $this->pass, $options);
            
        } catch (PDOException $e) {
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