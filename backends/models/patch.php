<?php
include_once "common.php";

class Patch extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function updateDtr($id, $employeeid, $timein, $timeout) {
        try {
            // Check if the DTR record exists and belongs to the authenticated user
            $stmt = $this->pdo->prepare("SELECT employeeid FROM dtr WHERE id = ?");
            $stmt->execute([$id]);
            $dtr = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$dtr) {
                return $this->generateResponse([], "failed", "DTR record not found", 404);
            }
            if ($dtr['employeeid'] != $employeeid) {
                return $this->generateResponse([], "failed", "Unauthorized to update this DTR record", 403);
            }

            // Validate date formats if provided
            $timeinValue = $timein ? $this->validateVarcharDate($timein) : null;
            if ($timein && !$timeinValue) {
                return $this->generateResponse([], "failed", "Invalid timein format", 400);
            }

            $timeoutValue = $timeout ? $this->validateVarcharDate($timeout) : (isset($timeout) ? '' : null);
            if ($timeout && !$timeoutValue && $timeout !== '') {
                return $this->generateResponse([], "failed", "Invalid timeout format", 400);
            }

            // Build dynamic update query
            $fields = [];
            $values = [];
            if ($timeinValue) {
                $fields[] = "timein = ?";
                $values[] = $timeinValue;
            }
            if ($timeoutValue !== null) {
                $fields[] = "timeout = ?";
                $values[] = $timeoutValue;
            }

            if (empty($fields)) {
                return $this->generateResponse([], "failed", "No fields to update", 400);
            }

            $values[] = $id;
            $sql = "UPDATE dtr SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            return $this->generateResponse(
                [],
                "success",
                "DTR record updated successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
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
