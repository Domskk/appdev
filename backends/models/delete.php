<?php
class Delete {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }   

   public function deleteEmployee($id, $authenticatedEmployeeId = null) {
        if ($authenticatedEmployeeId !== null && $id != $authenticatedEmployeeId) {
            return json_encode([
                "status" => ["type" => "failed", "message" => "You can only delete your own employee record", "code" => 403],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }

        try {
            $checkStmt = $this->pdo->prepare("SELECT employeeid FROM employees WHERE employeeid = ?");
            $checkStmt->execute([$id]);
            if (!$checkStmt->fetch()) {
                return json_encode([
                    "status" => ["type" => "failed", "message" => "Employee with ID $id not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $this->pdo->beginTransaction();

            $dtrStmt = $this->pdo->prepare("DELETE FROM dtr WHERE employeeid = ?");
            $dtrStmt->execute([$id]);

            $accountStmt = $this->pdo->prepare("DELETE FROM accounts WHERE employeeid = ?");
            $accountStmt->execute([$id]);

            $employeeStmt = $this->pdo->prepare("DELETE FROM employees WHERE employeeid = ?");
            $employeeStmt->execute([$id]);

            $this->pdo->commit();

            return json_encode([
                "status" => ["type" => "success", "message" => "Employee with ID $id and related records deleted successfully"],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            return json_encode([
                "status" => ["type" => "error", "message" => "Error deleting employee: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }
    }

    public function deleteAccounts($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM accounts WHERE id = ?");
            $stmt->execute([$id]);
            return json_encode([
                "status" => ["type" => "success", "message" => "Account with ID $id deleted successfully"],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            return json_encode([
                "status" => ["type" => "error", "message" => "Error deleting account: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }
    }

    public function deleteDtr($id, $authenticatedEmployeeId = null) {
        try {
            $checkStmt = $this->pdo->prepare("SELECT employeeid FROM dtr WHERE id = ?");
            $checkStmt->execute([$id]);
            $dtr = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$dtr) {
                return json_encode([
                    "status" => ["type" => "failed", "message" => "DTR record with ID $id not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }
            if ($authenticatedEmployeeId !== null && $dtr['employeeid'] != $authenticatedEmployeeId) {
                return json_encode([
                    "status" => ["type" => "failed", "message" => "You can only delete your own DTR records", "code" => 403],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $stmt = $this->pdo->prepare("DELETE FROM dtr WHERE id = ?");
            $stmt->execute([$id]);
            return json_encode([
                "status" => ["type" => "success", "message" => "DTR record deleted successfully"],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            return json_encode([
                "status" => ["type" => "error", "message" => "Error deleting DTR: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }
    }
}

?>