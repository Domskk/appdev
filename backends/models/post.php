<?php
include_once "common.php";


class Post extends Common{
    private $pdo;

    public function __construct(\PDO $pdo)
    {  
        $this->pdo = $pdo;
    }
public function registerUser($data)
{
    if (!isset($data->username) || !isset($data->password)) {
        return $this->generateResponse(
            null,
            'failed',
            'Username and password are required.',
            400
        );
    }

    try {
        $existingUser = $this->pdo->prepare('SELECT id FROM accounts WHERE username = ?');
        $existingUser->execute([$data->username]);

        if ($existingUser->fetch()) {
            return $this->generateResponse(
                null,
                'failed',
                'Username already exists.',
                409
            );
        }

        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);

        $insertUser = $this->pdo->prepare('INSERT INTO accounts (username, password) VALUES (?, ?)');
        $insertUser->execute([$data->username, $hashedPassword]);

        return $this->generateResponse(
            ['username' => $data->username],
            'success',
            'Registration successful.',
            201
        );
    } catch (\PDOException $e) {
        return $this->generateResponse(
            null,
            'failed',
            'Database error: ' . $e->getMessage(),
            500
        );
    }
}
public function loginUser($data)
{
    if (empty($data->username) || empty($data->password)) {
        return $this->generateResponse(
            null,
            'failed',
            'Username and password are required.',
            400
        );
    }

    try {
        $sql = "SELECT username, password FROM accounts WHERE username = :username";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['username' => $data->username]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->generateResponse(
                null,
                'failed',
                'Username not found.',
                401
            );
        }

        if (!password_verify($data->password, $user['password'])) {
            return $this->generateResponse(
                null,
                'failed',
                'Incorrect password.',
                401
            );
        }

        unset($user['password']);

        return $this->generateResponse(
            $user,
            'success',
            'Login successful.',
            200
        );
    } catch (\PDOException $e) {
        return $this->generateResponse(
            null,
            'failed',
            'Database error: ' . $e->getMessage(),
            500
        );
    }
}
public function addEmployee($body) {
    if (
        !isset($body->employeeid) ||
        !isset($body->firstname) ||
        !isset($body->lastname)
    ) {
        return $this->generateResponse(
            null,
            "failed",
            "Employee ID, Firstname, and Lastname are required",
            400
        );
    }

    try {
        $sql = "INSERT INTO employees(employeeid, firstname, lastname) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $body->employeeid,
            $body->firstname,
            $body->lastname
        ]);

        $id = $this->pdo->lastInsertId();
        $employee_data = [
            'id' => $id,
            'employeeid' => $body->employeeid,
            'firstname' => $body->firstname,
            'lastname' => $body->lastname
        ];

        return $this->generateResponse(
            $employee_data,
            "success",
            "Employee successfully created.",
            200
        );
    } catch (\PDOException $e) {
        return $this->generateResponse(
            null,
            "failed",
            $e->getMessage(),
            500
        );
    }
}
        public function addDtr($body) {
            if (!isset($body->employeeid) || !isset($body->timein) || !isset($body->timeout)) {
                return $this->generateResponse(
                    null,
                    "failed",
                    "Employee ID, timein and timeout are required ",
                    400
                );
            }
        
            try {
                $sql = "INSERT INTO dtr(employeeid, timein, timeout) VALUES (?,?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$body->employeeid, $body->timein, $body->timeout]);
        
                $id = $this->pdo->lastInsertId();
                $dtr_data = [
                    'id' => $id,
                    'employeeid' => $body->employeeid,
                    'timein' => $body->timein, 
                    'timeout' => $body->timeout
                ];
        
                return $this->generateResponse(
                    $dtr_data,
                    "success",
                    "Dtr successfully created.",
                    200
                );
            } catch (\PDOException $e) {
                return $this->generateResponse(
                    null,
                    "failed",
                    $e->getMessage(),
                    500
                );
            }
        }
    }

?>