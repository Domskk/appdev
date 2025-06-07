<?php

class Delete {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }   

    public function deleteEmployee($id) {
        $sql = "DELETE FROM employees WHERE employeeid = ?";
        $stmt = $this->pdo->prepare($sql);
        
        if ($stmt->execute([$id])) {
            return json_encode([
                "status" => "success",
                "message" => "Employee with ID $id has been deleted successfully."
            ]);
        } else {
            return json_encode([
                "status" => "failed",
                "message" => "Failed to delete employee with ID $id."
            ]);
        }
    }

    public function deleteAccounts($id) {
        $sql = "DELETE FROM accounts WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        if ($stmt->execute([$id])) {
            return json_encode([
                "status" => "success",
                "message" => "Employee with ID $id has been deleted successfully."
            ]);
        } else {
            return json_encode([
                "status" => "failed",
                "message" => "Failed to delete employee with ID $id."
            ]);
        }
    }
    public function deleteDtr($id) {
    try {
        $stmt = $this->pdo->prepare("DELETE FROM dtr WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return json_encode([
            "status" => "success",
            "message" => "DTR record deleted successfully"
        ]);
    } catch (PDOException $e) {
        return json_encode([
            "status" => "error",
            "message" => "Error deleting DTR: " . $e->getMessage()
        ]);
    }
}


}


?>