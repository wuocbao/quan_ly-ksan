/* Cấu hình dữ liệu dùng chung (đơn gọi món + chat giữa khách và nhân viên).
 *
 * Để null  -> chạy chế độ cục bộ: dữ liệu chỉ nằm trong trình duyệt của từng thiết bị.
 * Điền Firebase -> khách quét QR trên điện thoại gửi đơn/chat, nhân viên thấy ngay trên máy khác.
 * Cách lấy cấu hình: xem mục "Bật dữ liệu dùng chung" trong README.md
 */
window.FIREBASE_CONFIG = null;

/* Ví dụ sau khi điền:
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "ten-du-an.firebaseapp.com",
  projectId: "ten-du-an",
  appId: "..."
};
*/
