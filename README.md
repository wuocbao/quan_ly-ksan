# Quản lý khách sạn (web)

Website quản lý khách sạn chạy hoàn toàn trên trình duyệt (HTML + CSS + JavaScript thuần, không cần build).

## Chức năng
- Đăng nhập phân quyền **Quản lý / Nhân viên**
- 25 phòng (Thường, VIP): lọc, sắp xếp, đặt phòng, check-in, thêm dịch vụ, check-out và hóa đơn
- Nhân viên: check-in / check-out **ca làm** (phải vào ca mới thao tác phòng được)
- Quản lý: xem **doanh thu** (ngày / tháng / năm / tổng), lịch sử ca, thêm nhân viên
- **Gọi đồ ăn uống qua QR**: mỗi phòng một mã QR, khách quét để gọi món và chat với lễ tân; nhân viên nhận đơn và phục vụ

Tài khoản mẫu: `admin` / `admin123` (quản lý), `nhanvien1` / `123456` (nhân viên).

## Cấu trúc
```
index.html   giao diện chính
style.css    kiểu dáng (có chế độ sáng/tối)
app.js       toàn bộ logic
config.js    cấu hình Firebase (tùy chọn)
```

## Chạy thử trên máy
Mở thẳng `index.html` bằng trình duyệt, hoặc chạy server nhỏ trong thư mục này:
```
python -m http.server 8000
```
rồi vào http://localhost:8000

## Đưa lên GitHub Pages
1. Tạo repository mới trên GitHub (ví dụ `khachsan-web`).
2. Upload 5 file (`index.html`, `style.css`, `app.js`, `config.js`, `README.md`) vào nhánh `main`.
3. Vào **Settings → Pages**, mục *Build and deployment* chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, bấm **Save**.
4. Chờ 1-2 phút, trang chạy tại `https://<tên-github>.github.io/<tên-repo>/`.

Mã QR tự trỏ về địa chỉ trang đang chạy, nên không cần sửa gì sau khi deploy. Hãy mở tab **QR phòng** trên địa chỉ GitHub Pages rồi mới in.

## Bật dữ liệu dùng chung (để khách quét QR gọi đồ thật)
GitHub Pages chỉ chứa file tĩnh, không có máy chủ. Mặc định (`FIREBASE_CONFIG = null`) dữ liệu nằm trong trình duyệt của từng thiết bị, nên đơn của khách trên điện thoại **không** tới máy nhân viên. Để có dữ liệu dùng chung, dùng Firebase Firestore (có gói miễn phí):

1. Vào https://console.firebase.google.com, tạo project.
2. **Build → Firestore Database → Create database**.
3. Tab **Rules**, dán rồi **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /orders/{id} { allow read, write: if true; }
       match /chat/{id}   { allow read, write: if true; }
     }
   }
   ```
4. **Project settings → Your apps → Web (`</>`)**, đăng ký app và copy đối tượng `firebaseConfig`.
5. Dán vào `config.js` thay cho `null`, commit lại. Khi kết nối được, cảnh báo ⚠ trên đầu trang sẽ biến mất.

## Lưu ý bảo mật
Đây là bản demo chạy phía trình duyệt:
- Tài khoản, mật khẩu, phòng, doanh thu và ca làm lưu trong `localStorage` của từng trình duyệt (mật khẩu dạng chữ thường). Đừng dùng cho dữ liệu thật.
- Rules ở trên cho phép bất kỳ ai ghi vào `orders` và `chat` (cần để khách không đăng nhập vẫn gọi đồ được). Hãy thêm kiểm tra, giới hạn tần suất hoặc dùng Firebase Authentication nếu triển khai thật.
- Muốn doanh thu, phòng và tài khoản dùng chung giữa các máy thì cần chuyển chúng sang cơ sở dữ liệu (ví dụ Firestore) và đăng nhập phía máy chủ.
