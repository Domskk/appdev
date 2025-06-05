<?php
include_once "common.php";
include_once "get.php";


class Patch extends Common{
    private $pdo;

    public function __construct($pdo)
    {   
        $this->pdo = $pdo;
    }


   public function updateEmployee($id, $employeeid = null, $fullname = null) {
    $setClauses = [];
    $params = [];

    if ($employeeid !== null) {
        $setClauses[] = "employeeid = :employeeid";
        $params[':employeeid'] = $employeeid;
    }
    if ($fullname !== null) {
        $setClauses[] = "fullname = :fullname";
        $params[':fullname'] = $fullname;
    }

    if (empty($setClauses)) {
        return $this->generateResponse([], "failed", "No valid fields to update.", 400);
    }

    $setClause = implode(", ", $setClauses);
    $sql = "UPDATE employees SET $setClause WHERE employeeid = :id";
    $params[':id'] = $id;

    try {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            return $this->generateResponse([], "success", "Employee updated successfully.", 200);
        } else {
            return $this->generateResponse([], "failed", "No changes were made or employee not found.", 404);
        }
    } catch (\PDOException $e) {
        return $this->generateResponse([], "failed", $e->getMessage(), 500);
    }
}

    public function updateDtr($id, $timein = null, $timeout = null) {
        $setClauses = [];
        $params = [];  

        if ($timein !== null) {
            $setClauses[] = "timein = :timein";
            $params[':timein'] = $timein;
        }
        if ($timeout !== null) {
            $setClauses[] = "timeout = :timeout";
            $params[':timeout'] = $timeout;
        }

        if (empty($setClauses)) {
            return $this->generateResponse([], "failed", "No valid fields to update.", 400);
        }

        $setClause = implode(", ", $setClauses);
        $sql = "UPDATE dtr SET $setClause WHERE id = :id";
        $params[':id'] = $id;

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() > 0) {
                return $this->generateResponse([], "success", "DTR updated successfully.", 200);
            } else {
                return $this->generateResponse([], "failed", "No changes were made or DTR not found.", 404);
            }
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

}
?>
