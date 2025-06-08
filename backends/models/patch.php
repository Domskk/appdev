<?php
include_once "common.php";

class Patch extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

  public function updateDtr($id, $employeeid, $timein, $timeout) {
        try {
            $checkStmt = $this->pdo->prepare("SELECT employeeid FROM dtr WHERE id = ?");
            $checkStmt->execute([$id]);
            $dtr = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$dtr) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "DTR record with ID $id not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }
            if ($employeeid !== null && $dtr['employeeid'] != $employeeid) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "You can only update your own DTR records", "code" => 403],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $query = "UPDATE dtr SET ";
            $params = [];
            $updates = [];

            if ($timein !== null) {
                $updates[] = "timein = ?";
                $params[] = $timein;
            }
            if ($timeout !== null) {
                $updates[] = "timeout = ?";
                $params[] = $timeout;
            }

            if (empty($updates)) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "No fields to update", "code" => 400],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $query .= implode(", ", $updates) . " WHERE id = ?";
            $params[] = $id;

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            return json_encode([
                "payload" => [],
                "status" => ["type" => "success", "message" => "DTR record updated successfully"],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            return json_encode([
                "payload" => [],
                "status" => ["type" => "error", "message" => "Error updating DTR: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }
    }


    private function validateVarcharDate($dateStr) {
        try {
            $date = new \DateTime($dateStr);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return false;
        }
    }
}   
?>