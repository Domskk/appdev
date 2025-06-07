<?php
include_once "common.php";

class Get extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getEmployeesWithLatestDtr() {
        try {
            $sql = "
                SELECT 
                    e.employeeid,
                    e.firstname,
                    e.lastname,
                    d.timein,
                    d.timeout
                FROM employees e
                LEFT JOIN (
                    SELECT employeeid, timein, timeout
                    FROM dtr
                    WHERE (employeeid, id) IN (
                        SELECT employeeid, MAX(id)
                        FROM dtr
                        GROUP BY employeeid
                    )
                ) d ON e.employeeid = d.employeeid
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            return $this->generateResponse(
                $data,
                "success",
                "Employees fetched",
                200
            );
        } catch (\PDOException $e) {
            return $this->generateResponse(
                [],
                "failed",
                $e->getMessage(),
                500
            );
        }
    }

    public function getAccounts() {
        try {
            $sql = "SELECT id, username, employeeid FROM accounts";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            return $this->generateResponse(
                $data,
                "success",
                "Accounts fetched",
                200
            );
        } catch (\PDOException $e) {
            return $this->generateResponse(
                [],
                "failed",
                $e->getMessage(),
                500
            );
        }
    }

    public function getDtr() {
        try {
            $sql = "SELECT id, employeeid, timein, timeout FROM dtr";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return $this->generateResponse($data, "success", "DTR records fetched", 200);
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }
}
?>
