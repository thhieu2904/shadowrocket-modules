/**
 * THHIEU Response Script - RevenueCat Subscriber Modifier
 * Type: http-response
 * Target: api.revenuecat.com/v1/subscribers/{id}
 * 
 * Dựa trên log phân tích từ app Locket (build 2283)
 * - User ID mẫu: ghoyfJ5UPqY7Cw7zOQ7gfhjMUzs2
 * - Entitlement key: "Gold" (Locket dùng key này, KHÔNG phải "pro")
 * - Cần ép expire_date xa để không bị hết hạn
 */

const requestUrl = $request.url;
const responseBody = $response.body;

console.log("[THHIEU-Res] URL: " + requestUrl);

// ═══════════════════════════════════════════════════════════
// CẤU HÌNH — Chỉnh sửa nếu app đổi tên key/product
// ═══════════════════════════════════════════════════════════

// Key entitlement — Locket dùng "Gold" là chính, thêm fallback cho chắc
const ENTITLEMENT_KEYS = ["Gold", "gold", "premium", "Premium", "pro"];

// Product ID — Locket Gold subscription
// (Nếu app đổi, bạn có thể xem trong log response body để biết chính xác)
const PRODUCT_IDS = [
    "com.locket.Locket.gold.monthly",
    "com.locket.Locket.gold.yearly",
    "locket_gold_monthly",
    "locket_gold_yearly"
];

// Thời hạn subscription: 10 năm kể từ giờ
const EXPIRY_DAYS = 3650;

// ═══════════════════════════════════════════════════════════

if (!responseBody) {
    // Trường hợp này chỉ xảy ra nếu script request KHÔNG chạy
    // → nghĩa là bạn quên bật script http-request
    console.log("[THHIEU-Res] ⚠️ Body rỗng — kiểm tra thhieu-req.js đã chạy chưa!");
    $done({});
} else {
    try {
        const data = JSON.parse(responseBody);

        // Lấy user ID từ URL để log
        const uidMatch = requestUrl.match(/subscribers\/([^\/?]+)/);
        const userId = uidMatch ? uidMatch[1] : "unknown";
        console.log("[THHIEU-Res] User ID: " + userId);

        // Log các entitlement hiện có (nếu server trả về)
        if (data.subscriber && data.subscriber.entitlements) {
            const keys = Object.keys(data.subscriber.entitlements);
            console.log("[THHIEU-Res] Entitlements gốc: " +
                (keys.length ? keys.join(", ") : "(trống)"));
        }

        // Tính mốc thời gian
        const now = new Date();
        const futureDate = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const futureISO = futureDate.toISOString();
        const nowISO = now.toISOString();

        // Đảm bảo các object con tồn tại
        if (!data.subscriber) data.subscriber = {};
        if (!data.subscriber.entitlements) data.subscriber.entitlements = {};
        if (!data.subscriber.subscriptions) data.subscriber.subscriptions = {};
        if (!data.subscriber.non_subscriptions) data.subscriber.non_subscriptions = {};
        if (!data.subscriber.other_purchases) data.subscriber.other_purchases = {};

        // ─── INJECT ENTITLEMENTS ───
        ENTITLEMENT_KEYS.forEach(function (key) {
            const existing = data.subscriber.entitlements[key];
            data.subscriber.entitlements[key] = {
                expires_date: futureISO,
                purchase_date: (existing && existing.purchase_date) || nowISO,
                product_identifier: PRODUCT_IDS[0],
                grace_period_expires_date: null
            };
        });
        console.log("[THHIEU-Res] ✅ Đã inject " + ENTITLEMENT_KEYS.length +
            " entitlement keys: " + ENTITLEMENT_KEYS.join(", "));

        // ─── INJECT SUBSCRIPTIONS ───
        PRODUCT_IDS.forEach(function (pid) {
            const existing = data.subscriber.subscriptions[pid];
            data.subscriber.subscriptions[pid] = {
                expires_date: futureISO,
                purchase_date: (existing && existing.purchase_date) || nowISO,
                original_purchase_date: (existing && existing.original_purchase_date) || nowISO,
                store: "app_store",
                is_sandbox: false,
                unsubscribe_detected_at: null,
                billing_issues_detected_at: null,
                period_type: "normal",
                ownership_type: "PURCHASED",
                store_transaction_id: "2000000000000000",
                grace_period_expires_date: null
            };
        });
        console.log("[THHIEU-Res] ✅ Đã inject " + PRODUCT_IDS.length + " subscriptions");

        // ─── CÁC FIELD CƠ BẢN KHÁC ───
        data.subscriber.original_app_user_id =
            data.subscriber.original_app_user_id || userId;
        data.subscriber.first_seen = data.subscriber.first_seen || nowISO;
        data.subscriber.original_purchase_date =
            data.subscriber.original_purchase_date || nowISO;
        data.subscriber.original_application_version =
            data.subscriber.original_application_version || "1.0";

        // ─── TRẢ VỀ ───
        const modified = JSON.stringify(data);
        console.log("[THHIEU-Res] 📦 Body mới: " + modified.length + " bytes");
        $done({ body: modified });

    } catch (e) {
        console.log("[THHIEU-Res] ❌ Lỗi parse JSON: " + e);
        $done({});
    }
}