/**
 * THHIEU Request Script - Cache Buster
 * Type: http-request
 * Mục đích: Xóa If-None-Match / If-Modified-Since để ép server trả 200 OK
 */

const requestUrl = $request.url;
console.log("[THHIEU-Req] URL: " + requestUrl);

// Clone headers ra biến mới để sửa
let headers = Object.assign({}, $request.headers || {});

// ─── XÓA CACHE HEADERS (cả biến thể hoa/thường) ───
delete headers["If-None-Match"];
delete headers["if-none-match"];
delete headers["If-Modified-Since"];
delete headers["if-modified-since"];

// ─── ÉP NO-CACHE ĐỂ CHẮC CHẮN ───
headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
headers["Pragma"] = "no-cache";
headers["Expires"] = "0";

console.log("[THHIEU-Req] Đã xóa cache headers, sẵn sàng gửi đi");

// Trả request đã sửa header về cho Shadowrocket
$done({ headers: headers });