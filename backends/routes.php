<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once ("./configs/database.php");
include_once ("./models/get.php");
include_once ("./models/post.php");
include_once ("./models/patch.php");
include_once ("./models/delete.php");

function verifyAuthToken($pdo) {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode([
            "payload" => [],
            "status" => ["type" => "failed", "message" => "Authorization token required", "code" => 401],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ]);
        exit;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $stmt = $pdo->prepare("SELECT employeeid FROM accounts WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            "payload" => [],
            "status" => ["type" => "failed", "message" => "Invalid or expired token", "code" => 401],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ]);
        exit;
    }

    return $user['employeeid'];
}

$db = new Connection();
$pdo = $db->connect();
if (!$pdo) {
    echo json_encode([
        "payload" => [],
        "status" => ["type" => "failed", "message" => "Database connection failed", "code" => 500],
        "prepared_by" => "Jaztine",
        "date_generated" => date("Y-m-d H:i:s")
    ]);
    exit;
}

$get = new Get($pdo);
$post = new Post($pdo);
$patch = new Patch($pdo);
$delete = new Delete($pdo);

$request = explode('/', $_REQUEST['request']);
$request_method = $_SERVER['REQUEST_METHOD'];

$protectedEndpoints = ['addDtr', 'updateDtr', 'deleteDtr', 'editemployee', 'deleteemployee', 'dtr'];
$employeeid = null;
if (in_array($request[0], $protectedEndpoints)) {
    $employeeid = verifyAuthToken($pdo);
}

switch($request_method) {
    case 'GET':
        switch ($request[0]) {
            case 'employee':
                echo $get->getEmployeesWithLatestDtr();
                break;
            case 'accounts':
                echo $get->getAccounts();
                break; 
            case 'dtr':
                echo $get->getDtr();
                break; 
            default:
                echo json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Endpoint not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
                break;
        }
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {
            case 'register':
                echo $post->registerUser($data);
                break;
            case 'login':
                echo $post->loginUser($data);
                break;
            case 'addemployee':
                echo $post->addEmployee($data);
                break; 
            case 'addDtr':
                $data->employeeid = $employeeid;
                echo $post->addDtr($data);
                break;
            case 'editemployee':
                $data->employeeid = $employeeid;
                echo $post->editEmployee($data);
                break;
            default:
                echo json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Endpoint not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
                break;
        }
        break;
    case 'PATCH':
        $data = json_decode(file_get_contents("php://input"), true);
        switch ($request[0]) {
            case 'updateDtr':
                $id = $data['id'] ?? null;
                $timein = $data['timein'] ?? null;
                $timeout = $data['timeout'] ?? null;
                if (!$id) {
                    echo json_encode([
                        "payload" => [],
                        "status" => ["type" => "failed", "message" => "DTR ID is required", "code" => 400],
                        "prepared_by" => "Jaztine",
                        "date_generated" => date("Y-m-d H:i:s")
                    ]);
                    exit;
                }
                echo $patch->updateDtr($id, $employeeid, $timein, $timeout);
                break;
            default:
                echo json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Endpoint not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
                break;
        }
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        switch ($request[0]) {
            case "deleteuser":
                if (isset($data['id'])) {
                    $id = $data['id'];
                    echo $delete->deleteAccounts($id);
                } else {
                    echo json_encode([
                        "payload" => [],
                        "status" => ["type" => "failed", "message" => "User ID is required", "code" => 400],
                        "prepared_by" => "Jaztine",
                        "date_generated" => date("Y-m-d H:i:s")
                    ]);
                }
                break;
            case 'deleteemployee':
                if (isset($data['id'])) {
                    $id = $data['id'];
                    echo $delete->deleteEmployee($id, $employeeid);
                } else {
                    echo json_encode([
                        "payload" => [],
                        "status" => ["type" => "failed", "message" => "Employee ID is required", "code" => 400],
                        "prepared_by" => "Jaztine",
                        "date_generated" => date("Y-m-d H:i:s")
                    ]);
                }
                break;
            case 'deletedtr':
                if (isset($data['id'])) {
                    $id = $data['id'];
                    echo $delete->deleteDtr($id, $employeeid);
                } else {
                    echo json_encode([
                        "payload" => [],
                        "status" => ["type" => "failed", "message" => "DTR ID is required", "code" => 400],
                        "prepared_by" => "Jaztine",
                        "date_generated" => date("Y-m-d H:i:s")
                    ]);
                }
                break;
            default:
                echo json_encode([
                    "payload" => [],
                    "status" => ["type" => "failed", "message" => "Delete endpoint not found", "code" => 404],
                    "prepared_by" => "Jaztine",
                    "date_generated" => date("Y-m-d H:i:s")
                ]);
                break;
        }
        break;
    default:
        echo json_encode([
            "payload" => [],
            "status" => ["type" => "failed", "message" => "Method not allowed", "code" => 405],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ]);
        break;
}
?>
