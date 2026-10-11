/**
 * Script can thiệp RevenueCat API - Mô phỏng subscription cao cấp
 * Type: http-response
 * Target: api.revenuecat.com/v1/subscribers/* và /v1/receipts
 */

const requestUrl = $request.url;
const responseBody = $response.body;

console.log("[RevenueCat] Đang xử lý: " + requestUrl);

if (responseBody) {
    try {
        let data = JSON.parse(responseBody);
        console.log("[RevenueCat] Dữ liệu gốc: " + JSON.stringify(data).substring(0, 500) + "...");

        // ============================================================
        // XỬ LÝ ENDPOINT /subscribers/{app_user_id}
        // ============================================================
        if (requestUrl.includes("/subscribers/")) {
            if (data.subscriber) {
                const now = new Date();
                const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
                const futureDateStr = futureDate.toISOString();

                // --- Sửa entitlements: thêm quyền "pro" ---
                if (!data.subscriber.entitlements) {
                    data.subscriber.entitlements = {};
                }
                
                // Thêm entitlement "pro" nếu chưa có
                if (!data.subscriber.entitlements.pro) {
                    data.subscriber.entitlements.pro = {
                        expires_date: futureDateStr,
                        grace_period_expires_date: null,
                        product_identifier: "com.app.pro.yearly",
                        purchase_date: now.toISOString()
                    };
                    console.log("[RevenueCat] Đã thêm entitlement 'pro'");
                } else {
                    // Nếu đã có, gia hạn thêm
                    data.subscriber.entitlements.pro.expires_date = futureDateStr;
                    console.log("[RevenueCat] Đã gia hạn entitlement 'pro'");
                }

                // --- Sửa subscriptions: thêm subscription active ---
                if (!data.subscriber.subscriptions) {
                    data.subscriber.subscriptions = {};
                }
                
                const subKey = "com.app.pro.yearly";
                data.subscriber.subscriptions[subKey] = {
                    expires_date: futureDateStr,
                    grace_period_expires_date: null,
                    purchase_date: now.toISOString(),
                    original_purchase_date: now.toISOString(),
                    period_type: "normal",
                    store: "app_store",
                    is_sandbox: false,
                    unsubscribe_detected_at: null,
                    billing_issues_detected_at: null,
                    ownership_type: "PURCHASED",
                    store_transaction_id: "1000000000000000"
                };
                console.log("[RevenueCat] Đã thêm subscription active");

                // --- Sửa non_subscriptions nếu cần ---
                if (!data.subscriber.non_subscriptions) {
                    data.subscriber.non_subscriptions = {};
                }

                // --- Sửa thông tin user ---
                data.subscriber.original_app_user_id = data.subscriber.original_app_user_id || "$RCAnonymousID:mock-user-id";
                data.subscriber.first_seen = data.subscriber.first_seen || "2024-01-01T00:00:00Z";
                data.subscriber.management_url = data.subscriber.management_url || null;
                data.subscriber.original_application_version = data.subscriber.original_application_version || "1.0";
                data.subscriber.original_purchase_date = data.subscriber.original_purchase_date || now.toISOString();
                data.subscriber.other_purchases = data.subscriber.other_purchases || {};
                data.subscriber.subscription_status = "active";
            }
        }

        // ============================================================
        // XỬ LÝ ENDPOINT /receipts (xác thực biên lai)
        // ============================================================
        if (requestUrl.includes("/receipts")) {
            // Đảm bảo response trả về thành công
            if (data.attributes) {
                data.attributes = data.attributes || {};
            }
            
            // Thêm thông tin subscription giả
            data.subscriber = data.subscriber || {};
            const now = new Date();
            const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            
            if (!data.subscriber.entitlements) {
                data.subscriber.entitlements = {};
            }
            data.subscriber.entitlements.pro = {
                expires_date: futureDate.toISOString(),
                grace_period_expires_date: null,
                product_identifier: "com.app.pro.yearly",
                purchase_date: now.toISOString()
            };
            console.log("[RevenueCat] Đã xử lý endpoint /receipts");
        }

        // ============================================================
        // TRẢ VỀ DỮ LIỆU ĐÃ SỬA
        // ============================================================
        const modifiedBody = JSON.stringify(data);
        console.log("[RevenueCat] Đã hoàn tất, trả về dữ liệu đã sửa");
        $done({ body: modifiedBody });

    } catch (error) {
        console.log("[RevenueCat] Lỗi parse JSON: " + error);
        $done({});
    }
} else {
    console.log("[RevenueCat] Không có body, bỏ qua");
    $done({});
}