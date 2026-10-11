/**
 * Script chuyển hướng dựa trên phản hồi HTTP (type=http-response)
 * Hoàn thiện từ khung sườn gốc - Tích hợp logic redirect
 */

// Lấy thông tin URL và Body từ gói tin phản hồi
const requestUrl = $request.url;
const responseBody = $response.body;

// In log để debug
console.log("[Redirect] Đang can thiệp vào URL: " + requestUrl);

if (responseBody) {
    try {
        // Bước 1: Parse JSON
        let data = JSON.parse(responseBody);

        // Bước 2: Log cấu trúc gốc để quan sát
        console.log("[Debug] Dữ liệu gốc: " + JSON.stringify(data));

        // ========================================================
        // Bước 3: LOGIC CHUYỂN HƯỚNG
        // ========================================================
        
        // --- Cách 1: Chuyển hướng dựa trên trường cụ thể trong JSON ---
        // Ví dụ: nếu API trả về redirect_url hoặc một flag cần redirect
        if (data.redirect_url) {
            console.log("[Redirect] Phát hiện redirect_url: " + data.redirect_url);
            
            // Trả về response 302 để chuyển hướng client
            $done({
                status: 302,
                headers: {
                    "Location": data.redirect_url,
                    "Content-Type": "text/html"
                },
                body: "<html><body>Redirecting...</body></html>"
            });
            return; // Dừng script tại đây
        }

        // --- Cách 2: Chuyển hướng dựa trên một điều kiện cụ thể ---
        // Ví dụ: nếu user chưa verified, chuyển hướng đến trang xác thực
        if (data.user && data.user.is_verified === false) {
            console.log("[Redirect] User chưa verified, chuyển hướng...");
            
            $done({
                status: 302,
                headers: {
                    "Location": "https://your-app.com/verify",
                    "Content-Type": "text/html"
                },
                body: "<html><body>Redirecting to verification...</body></html>"
            });
            return;
        }

        // --- Cách 3: Chuyển hướng đến URL cố định dựa trên pattern ---
        // Ví dụ: chuyển tất cả request đến một domain cụ thể
        if (requestUrl.includes("old-api.example.com")) {
            let newUrl = requestUrl.replace("old-api.example.com", "new-api.example.com");
            console.log("[Redirect] Chuyển hướng đến: " + newUrl);
            
            $done({
                status: 307, // 307 giữ nguyên method (POST, PUT, v.v.)
                headers: {
                    "Location": newUrl
                }
            });
            return;
        }

        // ========================================================
        // Bước 4: Nếu không có redirect, trả về dữ liệu đã sửa (nếu cần)
        // ========================================================
        
        // Ví dụ sửa dữ liệu trước khi trả về
        // if (data.someField) {
        //     data.someField = "newValue";
        // }

        // Đóng gói và trả về JSON đã sửa
        $done({ body: JSON.stringify(data) });

    } catch (error) {
        console.log("[Debug] Lỗi parse JSON: " + error);
        // Nếu không phải JSON hợp lệ, giữ nguyên gói gốc
        $done({});
    }
} else {
    // Không có body, bỏ qua
    $done({});
}