<?php
include_once "common.php";

class Post extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function registerUser($data) {
        if (!isset($data->username, $data->password, $data->firstname, $data->lastname, $data->employeeid)) {
            return $this->generateResponse([], "failed", "Missing required fields", 400);
        }

        try {
            $sql = "SELECT COUNT(*) FROM accounts WHERE username = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->username]);
            if ($stmt->fetchColumn() > 0) {
                return $this->generateResponse([], "failed", "Username already exists", 400);
            }

            $sql = "SELECT COUNT(*) FROM employees WHERE employeeid = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->employeeid]);
            if ($stmt->fetchColumn() > 0) {
                return $this->generateResponse([], "failed", "Employee ID already exists", 400);
            }

            $this->pdo->beginTransaction();

            $sql = "INSERT INTO employees (employeeid, firstname, lastname) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->employeeid, $data->firstname, $data->lastname]);

            $password = password_hash($data->password, PASSWORD_DEFAULT);
            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));

            $sql = "INSERT INTO accounts (username, password, employeeid, token, expires_at) VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->username, $password, $data->employeeid, $token, $expires_at]);

            $this->pdo->commit();

            return $this->generateResponse(
                ["token" => $token],
                "success",
                "User registered successfully",
                201
            );
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

    public function loginUser($data) {
        if (!isset($data->username, $data->password)) {
            return $this->generateResponse([], "failed", "Missing required fields", 400);
        }

        try {
            $sql = "SELECT a.*, e.firstname, e.lastname FROM accounts a JOIN employees e ON a.employeeid = e.employeeid WHERE a.username = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->username]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$user || !password_verify($data->password, $user['password'])) {
                return $this->generateResponse([], "failed", "Invalid credentials", 401);
            }

            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));

            $sql = "UPDATE accounts SET token = ?, expires_at = ? WHERE username = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$token, $expires_at, $data->username]);

            return $this->generateResponse(
                [
                    "data" => [
                        "employee" => [
                            "employeeid" => $user['employeeid'],
                            "firstname" => $user['firstname'],
                            "lastname" => $user['lastname']
                        ],
                        "token" => $token
                    ]
                ],
                "success",
                "Login successful",
                200
            );
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

    public function addEmployee($data) {
        if (!isset($data->firstname, $data->lastname)) {
            return $this->generateResponse([], "failed", "Missing required fields", 400);
        }

        try {
            $employeeid = $this->generateEmployeeId();
            $sql = "SELECT COUNT(*) FROM employees WHERE employeeid = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$employeeid]);
            while ($stmt->fetchColumn() > 0) {
                $employeeid = $this->generateEmployeeId();
                $stmt->execute([$employeeid]);
            }

            $sql = "INSERT INTO employees (employeeid, firstname, lastname) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$employeeid, $data->firstname, $data->lastname]);

            return $this->generateResponse(
                ["employeeid" => $employeeid],
                "success",
                "Employee added successfully",
                201
            );
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

    public function addDtr($data) {
        if (!isset($data->employeeid, $data->timein)) {
            return $this->generateResponse([], "failed", "Missing required fields", 400);
        }

        try {
            // Validate timein format
            $timein = $this->validateVarcharDate($data->timein);
            if (!$timein) {
                return $this->generateResponse([], "failed", "Invalid timein format", 400);
            }

            $timeout = isset($data->timeout) && $data->timeout ? $this->validateVarcharDate($data->timeout) : '';
            if (isset($data->timeout) && $data->timeout && !$timeout) {
                return $this->generateResponse([], "failed", "Invalid timeout format", 400);
            }

            $sql = "INSERT INTO dtr (employeeid, timein, timeout) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->employeeid, $timein, $timeout]);

            return $this->generateResponse(
                ["id" => $this->pdo->lastInsertId()],
                "success",
                "DTR record added successfully",
                201
            );
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

    public function editEmployee($data) {
        if (!isset($data->employeeid, $data->firstname, $data->lastname)) {
            return $this->generateResponse([], "failed", "Missing required fields", 400);
        }

        try {
            $sql = "UPDATE employees SET firstname = ?, lastname = ? WHERE employeeid = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->firstname, $data->lastname, $data->employeeid]);

            if ($stmt->rowCount() === 0) {
                return $this->generateResponse([], "failed", "Employee not found or no changes made", 404);
            }

            return $this->generateResponse(
                [],
                "success",
                "Employee updated successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->generateResponse([], "failed", $e->getMessage(), 500);
        }
    }

    private function generateEmployeeId() {
        return 'EMP' . str_pad(mt_rand(0, 99999), 5, '0', STR_PAD_LEFT);
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