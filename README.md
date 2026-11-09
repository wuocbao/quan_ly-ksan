# HỆ THỐNG QUẢN LÝ KHÁCH SẠN & RESORT THÔNG MINH (MY HOTEL)

Website quản lý khách sạn và cổng trải nghiệm khách hàng hiện đại, phần giao diện chạy trên trình duyệt (HTML5 + CSS3 + JavaScript thuần). Email xác nhận đặt phòng cần Firebase Cloud Functions và SMTP.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. Dành cho Khách hàng (`index.html`)
- **Giao diện Resort 5 Sao**: Thiết kế sang trọng, hiện đại, tối ưu chuẩn Responsive trên điện thoại, máy tính bảng và máy tính để bàn.
- **Đặt phòng trực tuyến thông minh (Smart Booking)**:
  - Chọn loại phòng, ngày nhận phòng, số đêm lưu trú, số lượng khách.
  - Tự động tính toán tổng chi phí và ưu đãi (giảm 15% khi đặt từ 3 đêm).
  - Tự động sinh mã đặt phòng và đồng bộ trực tiếp với quầy lễ tân.
- **Xem chi tiết phòng**: Cung cấp thông tin kích thước phòng, loại giường, tiện nghi cao cấp, chính sách check-in/out.
- **Tra cứu hóa đơn điện tử & In ấn**:
  - Khách nhập mã hóa đơn nhận được khi trả phòng để xem chi tiết tiền phòng, các món ăn/dịch vụ đã gọi và tổng tiền thanh toán.
  - Hỗ trợ in hóa đơn hoặc tải file PDF trực tiếp.
- **Mô phỏng trải nghiệm quét mã QR phòng**: Bấm vào nút "Thử QR phòng" để trải nghiệm ngay quy trình khách quét mã tại phòng để gọi món, chat với lễ tân và gọi trợ giúp khẩn cấp.
- **Gửi phản hồi / Góp ý trực tuyến**: Form liên hệ giúp khách gửi yêu cầu hoặc ý kiến đóng góp cho khách sạn.
- **Hỗ trợ chế độ Sáng / Tối (Light & Dark Mode)** tiện lợi.

---

### 2. Dành cho Quản trị & Nghiệp vụ Lễ tân (`quantri.html`)
- **Đăng nhập phân quyền**:
  - **Quản lý (`admin` / `admin123`)**: Toàn quyền xem doanh thu, biểu đồ phân tích, quản lý nhân viên, thực đơn, cài đặt tài khoản ngân hàng VietQR, sao lưu dữ liệu.
  - **Nhân viên (`nhanvien1` / `123456`)**: Quản lý phòng, nhận khách, thêm dịch vụ, check-out, đơn gọi món, chat khách hàng.
- **Quản lý phòng chuyên sâu (25 phòng: 15 Thường, 10 VIP Suite)**:
  - **4 trạng thái trực quan**: 🟢 Trống | 🟡 Đã đặt trước | 🔴 Đang ở | 🟣 Cần dọn dẹp.
  - **Lọc & Tìm kiếm**: Tìm theo số phòng, tên khách, số điện thoại, lọc theo trạng thái, loại phòng, số tầng (Tầng 1: P1-P10, Tầng 2: P11-P20, Tầng 3: P21-P25).
  - **Đặt phòng & Check-in**: Ghi nhận CCCD, số điện thoại, hình thức thuê (theo ngày / theo giờ), tiền cọc trước.
  - **Thêm dịch vụ & Gọi món**: Thêm nhanh từ thực đơn hoặc nhập chi phí phát sinh tự do (giặt ủi, thuê xe, ăn uống...).
  - **Chuyển phòng (Transfer Room)**: Chuyển khách sang phòng trống khác, tự động bảo lưu toàn bộ phụ phí và cọc.
  - **Quy trình buồng phòng (Housekeeping)**: Báo phòng cần dọn dẹp sau khi khách trả phòng, nhân viên dọn xong bấm xác nhận để phòng sẵn sàng đón khách mới.
  - **Check-out thông minh & In Hóa Đơn Chuẩn**:
    - Tự động tính tiền phòng, phụ phí, trừ tiền cọc.
    - Tự động tạo mã **VietQR** chuẩn ngân hàng kèm số tiền và nội dung hóa đơn để khách quét thanh toán không cần gõ STK.
    - Cửa sổ in hóa đơn chuyên nghiệp (chuẩn A5/A4) có logo, thông tin khách sạn, chi tiết từng khoản mục và chữ ký.
    - **Reset bảo mật khi Check-out**: Ngay khi check-out phòng, toàn bộ đơn đặt hàng và tin nhắn chat của phòng đó sẽ được tự động xóa sạch, đảm bảo tính riêng tư cho khách tiếp theo.
    - **Kích hoạt mã QR theo lượt Check-in**: Mã QR tại mỗi phòng chỉ có hiệu lực mở menu gọi món, chat và SOS sau khi phòng đã được lễ tân Check-in (trạng thái Đang ở). Nếu phòng trống hoặc đang dọn dẹp, quét QR sẽ thông báo chưa kích hoạt.
- **Xử lý Đặt phòng Trực tuyến (Online Bookings)**:
  - Tiếp nhận đơn đặt phòng từ khách gửi qua `index.html`.
  - Nút **"Xếp phòng ngay"**: Tự động gợi ý các phòng trống phù hợp loại phòng khách chọn, bấm 1 nút là xếp khách vào phòng ngay lập tức.
  - Khách cung cấp email khi đặt phòng; sau khi lễ tân xếp phòng/duyệt đơn, hệ thống gửi thư xác nhận và cập nhật trạng thái gửi trong danh sách đặt phòng.
- **Quản lý Đơn gọi món & Phục vụ (Room Service)**:
  - Khách quét QR phòng gọi đồ -> Lễ tân nhận đơn -> Bếp chuẩn bị -> Phục vụ.
  - Khi hoàn thành phục vụ, hệ thống tự động cộng tiền món ăn vào phụ phí phòng của khách.
- **Quản lý Thực đơn & Dịch vụ (Menu Management)**:
  - Thêm món mới, sửa giá, đổi tên, chọn biểu tượng emoji, phân loại (Đồ uống, Món ăn, Dịch vụ).
  - Bật / tắt trạng thái Còn hàng / Tạm hết món.
- **Hệ thống Live Chat Khách - Lễ tân**:
  - Hội thoại trực tiếp giữa từng phòng với quầy lễ tân.
  - Tích hợp câu trả lời mẫu nhanh (Quick Replies) giúp nhân viên phản hồi nhanh chóng.
  - **Tự động đóng phiên chat thông minh**: Trong lúc nhắn tin giao diện hoàn toàn sạch sẽ; chỉ khi không có tương tác sau khoảng 5 giây thì thông báo đếm ngược 1 phút mới xuất hiện; tự động ẩn đi ngay khi người dùng gõ phím, gửi tin nhắn hoặc bấm gia hạn.
- **Báo động Khẩn cấp (SOS Alerts)**:
  - Khi khách bấm nút đỏ trên trang phòng, chuông cảnh báo âm thanh bíp (`AudioContext`) sẽ vang lên và banner đỏ xuất hiện trên đầu trang của nhân viên.
  - Nút tiếp nhận và xử lý sự cố kịp thời.
- **Báo cáo Doanh thu & Thống kê Chuyên sâu**:
  - Thống kê doanh thu theo Ngày / Tháng / Năm / Toàn bộ thời gian.
  - **Biểu đồ cột trực quan** thống kê doanh thu 7 ngày gần nhất.
  - Bảng kê chi tiết mọi hóa đơn đã thanh toán.
  - Nút **Xuất Excel (CSV chuẩn UTF-8)** lưu trữ dữ liệu kế toán.
  - Xem lại và in lại bất kỳ hóa đơn cũ nào.
- **Quản lý Ca làm việc**:
  - Nhân viên check-in / check-out ca làm việc để hệ thống ghi nhận thời gian làm.
  - Quản lý xem toàn bộ lịch sử ca của tất cả nhân viên.
- **Cài đặt Khách sạn & Cấu hình Thanh toán VietQR**:
  - Tùy chỉnh Tên khách sạn, Hotline, Địa chỉ, Email.
  - Cấu hình Ngân hàng thụ hưởng (Ngân hàng, Số tài khoản, Chủ tài khoản) để tự động xuất mã QR thanh toán nhanh.
  - **Sao lưu & Khôi phục dữ liệu**: Xuất file JSON dự phòng và nạp lại khi cần chuyển thiết bị.

---

## 📁 CẤU TRÚC THƯ MỤC

```text
├── index.html        # Trang chủ khách hàng (đặt phòng, tra cứu hóa đơn, giới thiệu)
├── quantri.html      # Trang quản trị điều hành khách sạn và giao diện quét QR phòng (#phong-X)
├── style.css         # Bộ stylesheet hoàn chỉnh (hỗ trợ Light/Dark mode, print bill, responsive)
├── app.js            # Toàn bộ logic nghiệp vụ, quản lý phòng, hóa đơn, thực đơn, chat, QR
├── config.js         # Cấu hình Firebase Firestore (tùy chọn)
└── README.md         # Hướng dẫn chi tiết
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### 1. Chạy thử trên máy tính
Bạn chỉ cần mở trực tiếp file `index.html` hoặc `quantri.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari).

Hoặc nếu muốn chạy server cục bộ:
```powershell
# Chạy với Python (nếu có):
python -m http.server 8000

# Hoặc dùng extension Live Server của VS Code
```
Sau đó truy cập: `http://localhost:8000`

### 2. Tài khoản đăng nhập mẫu
- **Quản lý**: Tên đăng nhập `admin` / Mật khẩu `admin123`
- **Nhân viên**: Tên đăng nhập `nhanvien1` / Mật khẩu `123456`

### 3. Trải nghiệm quét mã QR trong phòng
- Truy cập địa chỉ: `quantri.html#phong-1` (thay số 1 bằng số phòng bất kỳ từ 1 đến 25).
- Bạn sẽ thấy giao diện dành riêng cho khách trong phòng đó: gọi đồ ăn/uống, chat với lễ tân và bấm nút báo khẩn cấp SOS.
- QR thật chỉ hoạt động khi phòng đã check-in; nút **"Thử QR phòng"** mở chế độ thử nghiệm và vẫn dùng được khi phòng chưa check-in.
- Trên trang quản trị, tab **QR phòng** cho phép xem và in toàn bộ mã QR của 25 phòng để dán lên bàn hoặc cửa phòng.

### 5. Bật email xác nhận đặt phòng
Email được gửi bởi Firebase Cloud Functions, không gửi trực tiếp từ trình duyệt. Cần Firebase Blaze plan và SMTP credentials:
1. Cài Firebase CLI, đăng nhập và chọn đúng project Firebase của hệ thống.
2. Tại thư mục dự án, cài dependencies bằng `npm install --prefix functions`.
3. Tạo SMTP credentials an toàn (ví dụ SMTP relay hoặc app password) và cấu hình các secrets:
   ```powershell
   firebase functions:secrets:set SMTP_HOST
   firebase functions:secrets:set SMTP_PORT
   firebase functions:secrets:set SMTP_USER
   firebase functions:secrets:set SMTP_PASS
   firebase functions:secrets:set SMTP_FROM
   ```
4. Triển khai hàm gửi email: `firebase deploy --only functions:sendBookingApprovalEmail`.

Hàm chỉ gửi khi đơn được lễ tân **Xếp phòng ngay** (trạng thái `approved`), không gửi khi chỉ đánh dấu đã liên hệ hoặc hủy đơn. Firestore Security Rules cần giới hạn quyền cập nhật trạng thái duyệt đơn cho nhân viên có xác thực trước khi đưa hệ thống vào sử dụng thực tế; ứng dụng hiện tại chưa tích hợp Firebase Authentication.

### 4. Triển khai miễn phí lên GitHub Pages
1. Tạo một repository mới trên GitHub (ví dụ: `myhotel-web`).
2. Tải toàn bộ các file trong thư mục lên nhánh `main`.
3. Vào **Settings → Pages** trên GitHub repository.
4. Ở mục *Build and deployment*, chọn nhánh `main`, thư mục `/ (root)` rồi bấm **Save**.
5. Sau 1-2 phút, website của bạn sẽ hoạt động tại địa chỉ:
   `https://<tên-user>.github.io/<tên-repo>/`
   *(Mã QR phòng sẽ tự động trỏ đúng tên miền của bạn)*.


## 📧 Gửi email xác nhận khi lễ tân duyệt đơn (EmailJS)

1. Đăng ký miễn phí tại https://www.emailjs.com (200 email/tháng).
2. **Email Services** → Add Service → chọn Gmail → kết nối → lấy **Service ID**.
3. **Email Templates** → Create → ô *To Email* điền `{{to_email}}`, tiêu đề ví dụ `Xác nhận đặt phòng {{booking_id}} – {{hotel_name}}`, nội dung có thể dùng `{{message}}` (nội dung soạn sẵn) hoặc các biến: `{{to_name}}`, `{{room_type}}`, `{{room_number}}`, `{{checkin_date}}`, `{{nights}}`, `{{hotline}}`, `{{staff_name}}` → lấy **Template ID**.
4. **Account → General** → lấy **Public Key**.
5. Vào trang Quản trị → tab **Cài đặt** → nhập 3 mã trên → Lưu.

Khi lễ tân bấm **Xếp phòng ngay** hoặc **Đã liên hệ**, hệ thống tự gửi email tới khách. Nếu chưa cấu hình, hệ thống mở ứng dụng mail với nội dung soạn sẵn để gửi thủ công. Có nút **Gửi lại email** nếu gửi thất bại.
