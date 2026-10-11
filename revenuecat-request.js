/**
 * Script 1: Xóa cache headers trước khi gửi request đi
 * Mục đích: Ép server luôn trả về HTTP 200 OK kèm full body JSON thay vì 304 Not Modified
 */
let headers = $request.headers;

delete headers['If-None-Match'];
delete headers['if-none-match'];
delete headers['If-Modified-Since'];
delete headers['if-modified-since'];

console.log("[RevenueCat-Request] Đã xóa cache headers cho request: " + $request.url);
$done({ headers });
