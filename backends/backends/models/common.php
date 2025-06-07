<?php 

class Common {
    public function generateResponse($data, $remark, $message, $statusCode) {
        $response = [
            "payload" => $data,
            "status" => [
                "type" => $remark,
                "message" => $message,
                "code" => $statusCode
            ],
            "prepared_by" => "Jaztine",
            "date_generated" => date("Y-m-d H:i:s")
        ];

        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
}
?>
