<?php
include_once "common.php";

class Post extends Common {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }
  public function registerUser($data) {
        try {
            if (empty($data->username) || empty($data->password) || empty($data->firstname) || empty($data->lastname) || empty($data->employeeid)) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "All fields are required", "code" => 400],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            if (strlen($data->password) < 6) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Password must be at least 6 characters", "code" => 400],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $stmt = $this->pdo->prepare("SELECT employeeid FROM employees WHERE employeeid = ?");
            $stmt->execute([$data->employeeid]);
            if ($stmt->fetch()) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Employee ID already exists. Please use a different ID.", "code" => 409],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $stmt = $this->pdo->prepare("SELECT username FROM accounts WHERE username = ?");
            $stmt->execute([$data->username]);
            if ($stmt->fetch()) {
                return json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Username already exists. Please choose a different username.", "code" => 409],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
            }

            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("INSERT INTO employees (employeeid, firstname, lastname) VALUES (?, ?, ?)");
            $stmt->execute([$data->employeeid, $data->firstname, $data->lastname]);

            $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
            $token = bin2hex(random_bytes(32));
            $stmt = $this->pdo->prepare("INSERT INTO accounts (employeeid, username, password, token) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data->employeeid, $data->username, $hashedPassword, $token]);

            $this->pdo->commit();

            return json_encode([
                "payload" => ["token" => $token, "data" => ["employee" => [
                    "employeeid" => $data->employeeid,
                    "firstname" => $data->firstname,
                    "lastname" => $data->lastname
                ]]],
                "status" => ["type" => "success", "message" => "User registered successfully"],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            return json_encode([
                "payload" => [],
                "status" => ["type" => "error", "message" => "Registration failed: " . $e->getMessage(), "code" => 500],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
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
    try {
        $employeeid = $data->employeeid ?? null;
        $timein = $data->timein ?? null;
        $timeout = $data->timeout ?? null;

        if (!$employeeid) {
            return json_encode([
                "payload" => [],
                "status" => ["type" => "failed", "message" => "Employee ID is required", "code" => 400],
                "prepared_by" => "Jaztine",
                "date_generated" => date("Y-m-d H:i:s")
            ]);
        }

        // Always use current time unless a valid timein is provided
        $currentTime = date("Y-m-d H:i:s"); // Current Manila time
        error_log("addDtr: Current time - $currentTime, Provided timein - $timein"); // Debug log
        if ($timein) {
            try {
                $timein = (new DateTime($timein, new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s');
            } catch (Exception $e) {
                $timein = $currentTime; // Fall back to current time if invalid
                error_log("addDtr: Invalid timein format, using current time: $timein");
            }
        } else {
            $timein = $currentTime;
        }

        // Validate timeout if provided
        if ($timeout) {
            try {
                $timeout = (new DateTime($timeout, new DateTimeZone('Asia/Manila')))->format('Y-m-d H:i:s');
            } catch (Exception $e) {
                $timeout = null; // Treat invalid timeout as null
            }
        }

        $stmt = $this->pdo->prepare("INSERT INTO dtr (employeeid, timein, timeout) VALUES (:employeeid, :timein, :timeout)");
        $stmt->execute([
            'employeeid' => $employeeid,
            'timein' => $timein,
            'timeout' => $timeout
        ]);

        return json_encode([
            "payload" => [],
            "status" => ["type" => "success", "message" => "DTR record added successfully", "code" => 200],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ]);
    } catch (PDOException $e) {
        return json_encode([
            "payload" => [],
            "status" => ["type" => "failed", "message" => "Error adding DTR: " . $e->getMessage(), "code" => 500],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ]);
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