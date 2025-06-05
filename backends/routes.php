<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
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

$db = new Connection();
$pdo = $db->connect();
$get = new Get($pdo);
$post = new Post($pdo);
$patch = new Patch($pdo);
$delete = new Delete($pdo);



$request = explode('/', $_REQUEST['request']);
$request_method = $_SERVER['REQUEST_METHOD'];

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
                echo json_encode(['message' => 'Endpoint not found']);
                break;
        }

        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {
            case 'register':
                  echo $post->registerUser($data);
                exit;
                  break;
            case 'login':
                 echo $post->loginUser($data); // Change $data to $data
                exit;
                 break;
            case 'addemployee':
                echo $post->addEmployee($data);
                break; 
            case 'addDtr':
                echo $post->addDtr($data);
                break; 
            default:
                echo json_encode(['message' => 'Endpoint not found']);
                break;
        }
        break;
case 'PATCH':
    $data = json_decode(file_get_contents("php://input"), true);
    switch ($request[0]) {
        case 'updateemployee':
            if (isset($data['id'])) {
                $id = $data['id'];
                $employeeid = $data['employeeid'] ?? null;
                $fullname = $data['fullname'] ?? null;

                $response = $patch->updateEmployee($id, $employeeid, $fullname);
                echo json_encode($response);
            } else {
                echo json_encode([
                    "payload" => [],
                    "message" => "Employee ID is required.",
                    "code" => 400
                ]);
            }
            break;
            case 'updateDtr':
            // Make sure to extract the fields from $data
            $id = $data['id'] ?? null;
            $timein = $data['timein'] ?? null;
            $timeout = $data['timeout'] ?? null;
            echo $patch->updateDtr($id, $timein, $timeout);
            break;
    }
    break;
case 'DELETE':
    $data = json_decode(file_get_contents("php://input"), true);
    switch ($request[0]) {
        case "deleteuser":
            if (isset($data['id'])) {
                $id = $data['id'];
                $response = $delete->deleteAccounts($id);
                echo json_encode($response);
            } else {
                echo json_encode([
                    "payload" => [],
                    "message" => "User ID is required.",
                    "code" => 400
                ]);
            }
            break;

        case 'deleteemployee':
            if (isset($data['id'])) {
                $id = $data['id'];
                echo $delete->deleteEmployee($id);
            } else {
                echo json_encode([
                    "payload" => [],
                    "message" => "Employee ID is required.",
                    "code" => 400
                ]);
            }
            break;

        case 'deletedtr':
            if (isset($data['id'])) {
                $id = $data['id'];
                echo $delete->deleteDtr($id);
            } else {
                echo json_encode([
                    "payload" => [],
                    "message" => "DTR ID is required.",
                    "code" => 400
                ]);
            }
            break;

        default:
            echo json_encode(['message' => 'Delete endpoint not found']);
            break;
    }
    break;
    default:
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
?>