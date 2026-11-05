# 📊 StatsMath PRO - Công Cụ Thống Kê & Toán Học PWA

Ứng dụng web và cài đặt (Progressive Web App - PWA) chuyên tính toán thống kê mô tả (Trung bình, Trung vị, Mode, Độ lệch chuẩn, Phương sai) và máy tính toán học cơ bản. 

Ứng dụng hoạt động mượt mà trên cả **máy tính xách tay (Laptop/PC)** và **điện thoại di động (Android / iOS)**, hỗ trợ chạy hoàn toàn **Offline (ngoại tuyến)** 

---

## ✨ Tính Năng Nổi Bật

1. **Tính toán Thống Kê Tức Thì (Real-time Statistics)**:
   - **Trung bình (Mean / x̄)**
   - **Trung vị (Median / Me)** - Tự động tính đúng cả khi số phần tử chẵn hoặc lẻ
   - **Mốt** - Phần tử xuất hiện nhiều nhất
   - **Số lượng phần tử (Count - N)**
   - **Tổng cộng (Sum - Σ)**
   - **Giá trị nhỏ nhất (Min) & Lớn nhất (Max)**
   - **Phương sai (Variance / $\sigma^2$)**
   - **Độ lệch chuẩn (Std Dev / $\sigma$)**
   - **Dãy số sắp xếp tăng dần**

2. **Hai Phương Thức Nhập Số Tiện Lợi (Dual Input Modes)**:
   - **Nhập từng số riêng lẻ**: Nhập số rồi ấn `+ Thêm` hoặc phím `Enter`, số xuất hiện dưới dạng huy hiệu (chip) có nút `×` để xóa từng số.
   - **Dán nhanh danh sách số (Bulk Textarea)**: Dán hàng chục, hàng trăm số cách nhau bởi dấu phẩy `,`, khoảng trắng hoặc dòng mới. Hai chế độ luôn đồng bộ 2 chiều với nhau.

3. **Lịch Sử Tính Toán (Persistent History)**:
   - Lưu trữ tự động trong `localStorage` của trình duyệt.
   - Xem lại các phiên tính trước, thời gian thực hiện, số lượng phần tử.
   - Nút **"Nạp lại"** khôi phục ngay lập tức dãy số từ lịch sử.

4. **Máy Tính Cơ Bản Tích Hợp (Quick Math Calculator)**:
   - Tính nhanh biểu thức: `+`, `-`, `×`, `÷`, `%`, căn bậc hai `√x`, lũy thừa `xʸ`, dấu ngoặc đơn.
   - Nút **"📥 Nạp"**: Chuyển ngay kết quả tính toán vào dãy số thống kê.

5. **Giao Diện Đẹp Mắt (Modern Glassmorphism UI)**:
   - Chế độ Dark Mode chống mỏi mắt với hiệu ứng kính mờ (glassmorphism) và ánh sáng ambient neon.
   - Tương thích 100% kích thước màn hình điện thoại, máy tính bảng và màn hình lớn.

---



## 🧪 Kiểm Thử Tự Động (Unit Tests)
- Mở tệp `test.html` trong trình duyệt.
- Bạn sẽ thấy kết quả kiểm thử tự động cho tất cả các thuật toán:
  - Phân tích cú pháp chuỗi số (dấu phẩy, khoảng trắng, số âm, số thập phân).
  - Tính trung bình, trung vị (số lượng chẵn và lẻ).
  - Tìm mode (đơn yếu vị và đa yếu vị).
  - Phương sai mẫu, độ lệch chuẩn mẫu và tổng thể.
  - Bộ thẩm định biểu thức toán học.

---


