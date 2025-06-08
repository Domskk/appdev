<?php
include_once "common.php";

class Get extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getEmployeesWithLatestDtr() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT e.employeeid, e.firstname, e.lastname, d.timein, d.timeout
                FROM employees e
                LEFT JOIN dtr d ON e.employeeid = d.employeeid
                AND d.id = (SELECT MAX(id) FROM dtr WHERE employeeid = e.employeeid)
            ");
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($records as &$record) {
                $record['timein'] = $record['timein'] ? (new DateTime($record['timein'], new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s') : null;
                $record['timeout'] = $record['timeout'] ? (new DateTime($record['timeout'], new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s') : null;
            }
            return json_encode([
                "payload" => $records,
                "status" => ["type" => "success", "message" => "Employees retrieved successfully", "code" => 200],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            return json_encode([
                "payload" => [],
                "status" => ["type" => "failed", "message" => "Error retrieving employees: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
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
            $stmt = $this->pdo->prepare("SELECT id, employeeid, timein, timeout FROM dtr");
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($records as &$record) {
                $record['timein'] = $record['timein'] ? (new DateTime($record['timein'], new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s') : null;
                $record['timeout'] = $record['timeout'] ? (new DateTime($record['timeout'], new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s') : null;
            }
            return json_encode([
                "payload" => $records,
                "status" => ["type" => "success", "message" => "DTR records retrieved successfully", "code" => 200],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            return json_encode([
                "payload" => [],
                "status" => ["type" => "failed", "message" => "Error retrieving DTR: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }
    }
}
?>