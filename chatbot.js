/* ==========================================================================
   CHATBOT & CSKH TRỰC TUYẾN 24/7 — MY HOTEL RESORT (chatbot.js)
   - Độc lập, dùng tiền tố .chatbot-
   - Tự động đọc dữ liệu phòng thực tế từ LocalStorage / Firestore
   - Hỗ trợ chuyển sang chế độ "Chat trực tiếp với Nhân viên CSKH 24/7"
     đồng bộ thẳng vào tab Chat (Mục "CSKH Web") của trang Quản trị Lễ tân!
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ks_chatbot_history_v1';
  const LIVE_MODE_KEY = 'ks_chatbot_live_mode';
  const GUEST_NAME_KEY = 'ks_chatbot_guest_name';
  const CSKH_ROOM_ID = 0; // room = 0 đại diện cho kênh CSKH Website 24/7 trong trang Quản trị

  function getHotelLiveState() {
    try {
      const raw = localStorage.getItem('ks_web_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length) {
        return parsed;
      }
    } catch (e) {}
    return null;
  }

  function formatVND(n) {
    return Math.round(n || 0).toLocaleString('vi-VN') + ' ₫';
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));
  }

  // Danh sách nút gợi ý nhanh (Nút đầu tiên nổi bật: Liên hệ CSKH 24/7)
  const QUICK_QUESTIONS = [
    { label: '👩‍💼 Liên hệ CSKH 24/7', text: '__LIVE_CSKH__', highlight: true },
    { label: '🛏️ Loại phòng & Giá', text: 'Tư vấn các loại phòng và giá phòng' },
    { label: '📊 Phòng trống', text: 'Kiểm tra tình trạng phòng trống' },
    { label: '📅 Cách đặt phòng', text: 'Hướng dẫn cách đặt phòng' },
    { label: '🔍 Tra cứu đơn đặt', text: 'Hướng dẫn tra cứu trạng thái đơn đặt phòng' },
    { label: '🕒 Giờ Check-in/out', text: 'Quy trình nhận phòng và trả phòng' },
    { label: '🍽️ Dịch vụ & QR', text: 'Khách sạn có những tiện ích và dịch vụ gì?' }
  ];

  function buildBotReply(userInput) {
    const q = userInput.toLowerCase().trim();
    const state = getHotelLiveState();
    const settings = (state && state.settings) || {
      hotelName: 'MY HOTEL RESORT',
      hotelAddress: '123 Đường Bờ Biển, Bãi Sau, TP. Vũng Tàu',
      hotline: '0900 000 000',
      email: 'hotro@myhotel.vn'
    };

    let stdDay = 300000, stdHour = 60000, vipDay = 600000, vipHour = 120000;
    if (state && state.rooms) {
      const rStd = state.rooms.find(r => r.loai !== 'VIP');
      const rVip = state.rooms.find(r => r.loai === 'VIP');
      if (rStd) { stdDay = rStd.gn || stdDay; stdHour = rStd.gg || stdHour; }
      if (rVip) { vipDay = rVip.gn || vipDay; vipHour = rVip.gg || vipHour; }
    }

    // 1. Chào hỏi
    if (/^(xin chào|chào|hi|hello|alo|hey|chào shop|chào khách sạn)\b/.test(q)) {
      return {
        html: `Xin chào Quý khách! 👋 Em là Trợ lý ảo của <b>${escHtml(settings.hotelName)}</b>.<br>Em có thể tư vấn phòng, kiểm tra phòng trống, hoặc kết nối Quý khách <b>Chat trực tiếp với Nhân viên CSKH 24/7</b> ngay tại đây ạ!` +
              `<br><button type="button" class="chatbot-inline-btn" data-cb-action="start-live-cskh">👩‍💼 Chat với Nhân viên CSKH 24/7</button>`
      };
    }

    // 2. Kiểm tra phòng trống thực tế
    if (q.includes('phòng trống') || q.includes('còn phòng') || q.includes('tình trạng phòng')) {
      if (state && Array.isArray(state.rooms)) {
        const emptyStd = state.rooms.filter(r => r.loai !== 'VIP' && r.tt === 0).length;
        const emptyVip = state.rooms.filter(r => r.loai === 'VIP' && r.tt === 0).length;
        return {
          html: `📊 <b>Tình trạng phòng thực tế trên hệ thống hiện tại:</b><br>` +
                `• Phòng Standard Deluxe (Thường): còn <b>${emptyStd} phòng trống</b><br>` +
                `• Phòng VIP Executive Suite: còn <b>${emptyVip} phòng trống</b><br>` +
                `<small style="opacity:0.8">* Lưu ý: Số lượng phòng trống có thể thay đổi theo thời điểm nhận phòng thực tế. Quý khách vui lòng gửi yêu cầu đặt phòng để lễ tân giữ phòng và xác nhận chính thức qua email/điện thoại ạ.</small><br>` +
                `<button type="button" class="chatbot-inline-btn" data-cb-action="open-book">📅 Mở Form Đặt Phòng</button>` +
                `<button type="button" class="chatbot-inline-btn" data-cb-action="start-live-cskh">👩‍💼 Gặp CSKH 24/7</button>`
        };
      }
      return {
        html: `Quý khách vui lòng mở <b>Form Đặt Phòng Trực Tuyến</b> hoặc bấm <b>Chat với Nhân viên CSKH 24/7</b> bên dưới để lễ tân kiểm tra và giữ phòng ngay ạ!<br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="open-book">📅 Đặt Phòng Trực Tuyến</button>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="start-live-cskh">👩‍💼 Chat với CSKH 24/7</button>`
      };
    }

    // 3. Tư vấn loại phòng & Giá phòng
    if (q.includes('giá') || q.includes('loại phòng') || q.includes('hạng phòng') || q.includes('vip') || q.includes('phòng thường') || q.includes('bao nhiêu tiền')) {
      return {
        html: `🏨 Hiện tại <b>${escHtml(settings.hotelName)}</b> phục vụ 2 hạng phòng (thuê linh hoạt theo <b>Ngày/Đêm</b> hoặc <b>Theo Giờ</b>):<br><br>` +
              `1️⃣ <b>🛏️ Phòng Standard Deluxe (15 phòng · 28m²)</b><br>` +
              `• Giá niêm yết: <b>${formatVND(stdDay)}/đêm</b> hoặc <b>${formatVND(stdHour)}/giờ</b><br>` +
              `• Tiện nghi: Giường King/Twin, Smart TV 50", Wifi tốc độ cao, minibar.<br><br>` +
              `2️⃣ <b>👑 Phòng VIP Executive Suite (10 phòng · 55m²)</b><br>` +
              `• Giá niêm yết: <b>${formatVND(vipDay)}/đêm</b> hoặc <b>${formatVND(vipHour)}/giờ</b><br>` +
              `• Tiện nghi: Ban công hướng biển, bồn tắm massage, Smart TV 65", <b>miễn phí Buffet sáng</b>.<br><br>` +
              `🎁 <b>Ưu đãi:</b> Giảm ngay <b>15%</b> tổng tiền phòng khi đặt từ <b>3 đêm trở lên</b>!<br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="open-book-std">Đặt Phòng Thường</button>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="open-book-vip">Đặt Phòng VIP</button>`
      };
    }

    // 4. Hướng dẫn cách đặt phòng
    if (q.includes('cách đặt') || q.includes('đặt phòng') || q.includes('book') || q.includes('thuê phòng')) {
      return {
        html: `📅 <b>Hướng dẫn đặt phòng nhanh tại ${escHtml(settings.hotelName)}:</b><br>` +
              `• <b>Bước 1:</b> Nhấn nút <b>"Đặt phòng"</b> trên thanh menu (hoặc nút bên dưới).<br>` +
              `• <b>Bước 2:</b> Chọn hạng phòng (Standard Deluxe / VIP Suite) và hình thức thuê (<b>Theo ngày/đêm</b> hoặc <b>Theo giờ</b>).<br>` +
              `• <b>Bước 3:</b> Nhập Họ tên, SĐT, Email và nhấn <b>"Gửi Yêu Cầu Đặt Phòng"</b>.<br>` +
              `• <b>Bước 4:</b> Lễ tân duyệt đơn trong 5–10 phút và gửi <b>Email xác nhận</b> tự động.<br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="open-book">📅 Mở Form Đặt Phòng Ngay</button>`
      };
    }

    // 5. Tra cứu trạng thái đơn đặt phòng & Hóa đơn
    if (q.includes('tra cứu') || q.includes('hóa đơn') || q.includes('bill') || q.includes('mã đơn') || q.includes('đơn đặt')) {
      return {
        html: `🔍 <b>Tra cứu trực tuyến:</b><br>` +
              `Quý khách có thể nhập <b>Mã hóa đơn</b> (<code>HD...</code>) hoặc <b>Mã đặt phòng</b> (<code>bk_...</code>) hoặc <b>Số điện thoại</b> tại mục Tra cứu trên trang chủ để xem trạng thái duyệt phòng &amp; chi tiết hóa đơn.<br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="go-invoice">🔍 Đi tới mục Tra Cứu Ngay</button>`
      };
    }

    // 6. Quy trình Check-in / Check-out
    if (q.includes('check-in') || q.includes('checkin') || q.includes('check in') || q.includes('check-out') || q.includes('checkout') || q.includes('check out') || q.includes('nhận phòng') || q.includes('trả phòng') || q.includes('thủ tục')) {
      return {
        html: `🕒 <b>Quy trình Nhận phòng (Check-in) &amp; Trả phòng (Check-out):</b><br><br>` +
              `✅ <b>Nhận phòng (Check-in):</b><br>` +
              `• Giờ nhận phòng tiêu chuẩn (thuê theo ngày): từ <b>14:00</b> (thuê theo giờ nhận linh hoạt 24/7).<br>` +
              `• Quý khách xuất trình <b>CCCD/Hộ chiếu</b> tại quầy lễ tân. Sau khi Check-in, mã QR trong phòng sẽ được kích hoạt.<br><br>` +
              `🧾 <b>Trả phòng (Check-out):</b><br>` +
              `• Giờ trả phòng tiêu chuẩn: trước <b>12:00 trưa</b>.<br>` +
              `• Các đơn đồ ăn/uống gọi qua QR sẽ tự động được cộng vào hóa đơn khi Check-out.`
      };
    }

    // 7. Tiện ích, Dịch vụ & Gọi món QR
    if (q.includes('dịch vụ') || q.includes('tiện ích') || q.includes('ăn uống') || q.includes('gọi món') || q.includes('qr') || q.includes('giặt ủi') || q.includes('thuê xe') || q.includes('spa') || q.includes('buffet')) {
      return {
        html: `🍽️ <b>Dịch vụ &amp; Tiện ích nổi bật tại khách sạn:</b><br>` +
              `• <b>Gọi món tận phòng qua QR:</b> Quét mã QR tại bàn đầu giường để đặt đồ ăn, thức uống nóng sốt phục vụ trong 15 phút.<br>` +
              `• <b>Chat Lễ tân &amp; Nút SOS 24/7:</b> Nhắn tin yêu cầu thêm khăn, dọn phòng hoặc bấm nút khẩn cấp ngay trên giao diện QR.<br>` +
              `• <b>Dịch vụ Giặt ủi &amp; Thuê xe máy:</b> Giặt ủi (50.000 ₫) và thuê xe máy (150.000 ₫/ngày) — đăng ký tại quầy lễ tân.<br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="open-qr-demo">📱 Xem Thử Giao Diện QR Phòng</button>`
      };
    }

    // 8. Liên hệ nhân viên / CSKH 24/7
    if (q.includes('liên hệ') || q.includes('nhân viên') || q.includes('cskh') || q.includes('lễ tân') || q.includes('hotline') || q.includes('số điện thoại') || q.includes('tư vấn viên')) {
      return {
        html: `👩‍💼 <b>Kết nối Nhân viên CSKH &amp; Lễ tân 24/7:</b><br>` +
              `• <b>Cách 1 (Nhanh nhất):</b> Bấm nút bên dưới để <b>Chat trực tiếp với Nhân viên CSKH 24/7</b> ngay trong khung chat này (tin nhắn sẽ gửi thẳng tới màn hình Lễ tân trực ca).<br>` +
              `• <b>Cách 2 (Hotline 24/7):</b> <a href="tel:${escHtml(settings.hotline)}" style="color:var(--cb-gold);font-weight:700">${escHtml(settings.hotline)}</a><br>` +
              `• <b>Cách 3 (Email):</b> <a href="mailto:${escHtml(settings.email)}" style="color:var(--cb-gold)">${escHtml(settings.email)}</a><br>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="start-live-cskh">👩‍💼 Bắt đầu Chat với CSKH 24/7</button>` +
              `<button type="button" class="chatbot-inline-btn" data-cb-action="go-contact">✉️ Gửi Form Liên hệ</button>`
      };
    }

    // 9. Câu hỏi ngoài phạm vi -> Chuyển hướng sang CSKH 24/7
    return {
      html: `Dạ câu hỏi này cần nhân viên kiểm tra trực tiếp để trả lời chính xác nhất cho Quý khách ạ. 🙏<br>` +
            `Quý khách có muốn chuyển sang <b>Chat trực tiếp với Nhân viên CSKH 24/7</b> ngay tại đây hoặc gọi Hotline <b><a href="tel:${escHtml(settings.hotline)}" style="color:var(--cb-gold)">${escHtml(settings.hotline)}</a></b> không ạ?<br>` +
            `<button type="button" class="chatbot-inline-btn" data-cb-action="start-live-cskh">👩‍💼 Chat trực tiếp với CSKH 24/7</button>`
    };
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    return [];
  }

  function saveHistory(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch (e) {}
  }

  // Đẩy tin nhắn CSKH trực tuyến vào hệ thống Chat của Lễ tân (room = 0: CSKH Web)
  function sendToReceptionistLiveChat(guestName, text) {
    const msgObj = {
      id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      room: CSKH_ROOM_ID,
      from: 'khach',
      name: guestName || 'Khách Web (CSKH 24/7)',
      text,
      t: Date.now()
    };

    try {
      const chatArr = JSON.parse(localStorage.getItem('ks_chat') || '[]');
      chatArr.push(msgObj);
      localStorage.setItem('ks_chat', JSON.stringify(chatArr));
    } catch (e) {}

    try {
      const db = window.DB || (window.firebase && window.firebase.apps && window.firebase.apps.length ? window.firebase.firestore() : null);
      if (db) {
        db.collection('chat').doc(msgObj.id).set(msgObj).catch(() => {});
      }
    } catch (e) {}
  }

  function initChatbot() {
    if (document.getElementById('chatbot-widget-root')) return;

    const root = document.createElement('div');
    root.id = 'chatbot-widget-root';
    root.className = 'chatbot-root';
    root.innerHTML = `
      <div class="chatbot-greeting" id="chatbot-greeting" role="button" tabindex="0">
        <span>👋 Xin chào! Cần tư vấn hay gặp CSKH 24/7?</span>
        <button type="button" class="chatbot-greeting-close" id="chatbot-greeting-close" aria-label="Đóng lời chào" title="Đóng">✕</button>
      </div>

      <section class="chatbot-window chatbot-closed" id="chatbot-window" aria-label="Cửa sổ Trợ lý khách sạn">
        <header class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar" id="chatbot-avatar" aria-hidden="true">🛎️</div>
            <div>
              <h3 class="chatbot-title" id="chatbot-title">Trợ lý khách sạn</h3>
              <div class="chatbot-status">
                <span class="chatbot-status-dot"></span>
                <span id="chatbot-status-text">Đang trực tuyến · Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button type="button" class="chatbot-icon-btn" id="chatbot-clear-btn" title="Làm mới cuộc trò chuyện" aria-label="Làm mới">↻</button>
            <button type="button" class="chatbot-icon-btn" id="chatbot-min-btn" title="Thu nhỏ cửa sổ" aria-label="Thu nhỏ">─</button>
            <button type="button" class="chatbot-icon-btn" id="chatbot-close-btn" title="Đóng cửa sổ" aria-label="Đóng">✕</button>
          </div>
        </header>

        <!-- Thanh trạng thái khi đang kết nối trực tiếp với Nhân viên CSKH 24/7 -->
        <div class="chatbot-live-banner" id="chatbot-live-banner" style="display:none">
          <span>🟢 <b>Đang kết nối Nhân viên CSKH 24/7</b></span>
          <button type="button" class="chatbot-chip" id="chatbot-exit-live" style="padding:2px 8px;font-size:11px">Về Trợ lý AI</button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages"></div>

        <div class="chatbot-suggestions" id="chatbot-suggestions">
          ${QUICK_QUESTIONS.map(item => `
            <button type="button" class="chatbot-chip ${item.highlight ? 'chatbot-chip-live' : ''}" data-cb-question="${escHtml(item.text)}">${escHtml(item.label)}</button>
          `).join('')}
        </div>

        <div class="chatbot-input-area">
          <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Nhập câu hỏi hoặc nhắn CSKH..." autocomplete="off">
          <button type="button" class="chatbot-send-btn" id="chatbot-send-btn" aria-label="Gửi tin nhắn" title="Gửi (Enter)">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </section>

      <button type="button" class="chatbot-launcher" id="chatbot-launcher" aria-label="Mở Trợ lý khách sạn" title="Chat với Trợ lý & CSKH 24/7">
        <span class="chatbot-launcher-dot"></span>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 10h.01"></path>
          <path d="M12 10h.01"></path>
          <path d="M16 10h.01"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(root);

    const winEl = document.getElementById('chatbot-window');
    const launcherEl = document.getElementById('chatbot-launcher');
    const greetingEl = document.getElementById('chatbot-greeting');
    const greetingCloseEl = document.getElementById('chatbot-greeting-close');
    const minBtn = document.getElementById('chatbot-min-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const clearBtn = document.getElementById('chatbot-clear-btn');
    const msgListEl = document.getElementById('chatbot-messages');
    const inputEl = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const suggestEl = document.getElementById('chatbot-suggestions');
    const liveBannerEl = document.getElementById('chatbot-live-banner');
    const exitLiveBtn = document.getElementById('chatbot-exit-live');
    const titleEl = document.getElementById('chatbot-title');
    const avatarEl = document.getElementById('chatbot-avatar');

    let history = loadHistory();
    let isOpen = false;
    let isMinimized = false;
    let isLiveCSKH = localStorage.getItem(LIVE_MODE_KEY) === '1';

    function updateModeUI() {
      liveBannerEl.style.display = isLiveCSKH ? 'flex' : 'none';
      titleEl.textContent = isLiveCSKH ? 'Nhân viên CSKH 24/7' : 'Trợ lý khách sạn';
      avatarEl.textContent = isLiveCSKH ? '👩‍💼' : '🛎️';
      inputEl.placeholder = isLiveCSKH ? 'Nhắn trực tiếp cho nhân viên CSKH...' : 'Nhập câu hỏi của bạn...';
    }

    function activateLiveCSKH() {
      isLiveCSKH = true;
      try { localStorage.setItem(LIVE_MODE_KEY, '1'); } catch (e) {}
      updateModeUI();
      const guestName = localStorage.getItem(GUEST_NAME_KEY) || 'Khách Web (CSKH 24/7)';
      sendToReceptionistLiveChat(guestName, '👋 [Yêu cầu kết nối] Khách hàng trên Website vừa bấm kết nối cần Nhân viên CSKH 24/7 hỗ trợ!');
      history.push({
        sender: 'bot',
        html: `👩‍💼 <b>Đã kết nối kênh CSKH Trực Tuyến 24/7!</b><br>` +
              `Hệ thống đã phát tín hiệu gọi Nhân viên Lễ tân trực ca. Quý khách hãy nhập nội dung cần hỗ trợ (hoặc SĐT) ngay bên dưới để trò chuyện trực tiếp với nhân viên ạ!<br>` +
              `<small>📞 Hotline khẩn cấp 24/7: <b><a href="tel:0900000000" style="color:var(--cb-gold)">0900 000 000</a></b></small>`,
        time: Date.now()
      });
      saveHistory(history);
      renderMessages();
      inputEl.focus();
    }

    function deactivateLiveCSKH() {
      isLiveCSKH = false;
      try { localStorage.removeItem(LIVE_MODE_KEY); } catch (e) {}
      updateModeUI();
      history.push({
        sender: 'bot',
        html: `🛎️ Đã chuyển về chế độ <b>Trợ lý tự động</b>. Quý khách có thể bấm <b>"👩‍💼 Liên hệ CSKH 24/7"</b> bất cứ lúc nào nếu cần gặp nhân viên ạ.`,
        time: Date.now()
      });
      saveHistory(history);
      renderMessages();
    }

    function renderMessages() {
      msgListEl.innerHTML = history.map(m => `
        <div class="chatbot-msg ${m.sender === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'}">
          <div class="chatbot-bubble">${m.sender === 'user' ? escHtml(m.text) : m.html}</div>
          <span class="chatbot-time">${m.staffName ? escHtml(m.staffName) + ' · ' : ''}${formatTime(m.time)}</span>
        </div>
      `).join('');
      msgListEl.scrollTop = msgListEl.scrollHeight;
    }

    // Lắng nghe tin nhắn trả lời từ Lễ tân (room === 0) qua LocalStorage hoặc Firestore
    function syncStaffReplies(chatArray) {
      if (!Array.isArray(chatArray)) return;
      const staffMsgs = chatArray.filter(m => Number(m.room) === CSKH_ROOM_ID && m.from === 'nv');
      let changed = false;
      staffMsgs.forEach(sm => {
        if (!history.some(h => h.liveId === sm.id)) {
          history.push({
            liveId: sm.id,
            sender: 'bot',
            staffName: '👩‍💼 ' + (sm.name || 'CSKH 24/7'),
            html: `<b>👩‍💼 ${escHtml(sm.name || 'Nhân viên CSKH')}:</b><br>${escHtml(sm.text)}`,
            time: sm.t || Date.now()
          });
          changed = true;
        }
      });
      if (changed) {
        saveHistory(history);
        renderMessages();
      }
    }

    window.addEventListener('storage', e => {
      if (e.key === 'ks_chat') {
        try { syncStaffReplies(JSON.parse(e.newValue || '[]')); } catch (err) {}
      }
    });

    // Kiểm tra định kỳ từ localStorage (hỗ trợ cả khi mở cùng trình duyệt hoặc iframe)
    setInterval(() => {
      try {
        const raw = localStorage.getItem('ks_chat');
        if (raw) syncStaffReplies(JSON.parse(raw));
      } catch (e) {}
    }, 1500);

    try {
      const db = window.DB || (window.firebase && window.firebase.apps && window.firebase.apps.length ? window.firebase.firestore() : null);
      if (db) {
        db.collection('chat').onSnapshot(snap => {
          const arr = snap.docs.map(d => d.data()).filter(m => Number(m.room) === CSKH_ROOM_ID);
          syncStaffReplies(arr);
        }, () => {});
      }
    } catch (e) {}

    function ensureWelcomeMessage() {
      if (history.length === 0) {
        history.push({
          sender: 'bot',
          html: `Xin chào Quý khách đến với <b>MY HOTEL RESORT</b>! 🌟<br>` +
                `Em là <b>Trợ lý khách sạn</b>. Quý khách có thể chọn nhanh câu hỏi gợi ý hoặc bấm <b>"👩‍💼 Liên hệ CSKH 24/7"</b> để chat trực tiếp với nhân viên lễ tân ạ!`,
          time: Date.now()
        });
        saveHistory(history);
      }
      updateModeUI();
      renderMessages();
    }

    function openChat() {
      isOpen = true;
      isMinimized = false;
      winEl.classList.remove('chatbot-closed', 'chatbot-minimized');
      greetingEl.classList.add('chatbot-hidden');
      ensureWelcomeMessage();
      setTimeout(() => inputEl.focus(), 120);
    }

    function closeChat() {
      isOpen = false;
      winEl.classList.add('chatbot-closed');
    }

    function toggleMinimize() {
      if (!isOpen) return;
      isMinimized = !isMinimized;
      winEl.classList.toggle('chatbot-minimized', isMinimized);
      if (!isMinimized) {
        msgListEl.scrollTop = msgListEl.scrollHeight;
        inputEl.focus();
      }
    }

    function sendUserMessage(text) {
      const clean = String(text || '').trim();
      if (!clean) return;

      if (clean === '__LIVE_CSKH__') {
        activateLiveCSKH();
        return;
      }

      if (isMinimized) {
        isMinimized = false;
        winEl.classList.remove('chatbot-minimized');
      }

      const userMsg = {
        sender: 'user',
        text: clean,
        time: Date.now()
      };
      history.push(userMsg);
      saveHistory(history);
      renderMessages();

      // Nếu đang ở chế độ Chat trực tiếp với Nhân viên CSKH 24/7 -> gửi thẳng vào bảng Chat lễ tân
      if (isLiveCSKH) {
        const guestName = localStorage.getItem(GUEST_NAME_KEY) || 'Khách Web (CSKH 24/7)';
        sendToReceptionistLiveChat(guestName, clean);
        setTimeout(() => {
          history.push({
            sender: 'bot',
            html: `<small style="color:var(--cb-muted)">✓ Đã chuyển tin nhắn tới quầy Lễ tân CSKH 24/7. Nhân viên sẽ phản hồi Quý khách trong giây lát...</small>`,
            time: Date.now()
          });
          saveHistory(history);
          renderMessages();
        }, 250);
        return;
      }

      const typingEl = document.createElement('div');
      typingEl.className = 'chatbot-msg chatbot-msg-bot';
      typingEl.innerHTML = `<div class="chatbot-bubble chatbot-typing"><span></span><span></span><span></span></div>`;
      msgListEl.appendChild(typingEl);
      msgListEl.scrollTop = msgListEl.scrollHeight;

      setTimeout(() => {
        if (typingEl.parentNode) typingEl.remove();
        const reply = buildBotReply(clean);
        history.push({
          sender: 'bot',
          html: reply.html,
          time: Date.now()
        });
        saveHistory(history);
        renderMessages();
      }, 340);
    }

    launcherEl.addEventListener('click', () => {
      if (isOpen) closeChat();
      else openChat();
    });

    greetingEl.addEventListener('click', (e) => {
      if (e.target === greetingCloseEl) return;
      openChat();
    });

    greetingCloseEl.addEventListener('click', (e) => {
      e.stopPropagation();
      greetingEl.classList.add('chatbot-hidden');
    });

    closeBtn.addEventListener('click', closeChat);
    minBtn.addEventListener('click', toggleMinimize);
    exitLiveBtn.addEventListener('click', deactivateLiveCSKH);

    clearBtn.addEventListener('click', () => {
      history = [];
      isLiveCSKH = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LIVE_MODE_KEY);
      } catch (e) {}
      ensureWelcomeMessage();
    });

    sendBtn.addEventListener('click', () => {
      const val = inputEl.value;
      inputEl.value = '';
      sendUserMessage(val);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = inputEl.value;
        inputEl.value = '';
        sendUserMessage(val);
      }
    });

    suggestEl.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cb-question]');
      if (!chip) return;
      const q = chip.getAttribute('data-cb-question');
      if (q !== '__LIVE_CSKH__' && isLiveCSKH) {
        isLiveCSKH = false;
        try { localStorage.removeItem(LIVE_MODE_KEY); } catch (err) {}
        updateModeUI();
      }
      sendUserMessage(q);
    });

    msgListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cb-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-cb-action');
      if (act === 'start-live-cskh') {
        activateLiveCSKH();
      } else if (act === 'open-book' && typeof window.openBook === 'function') {
        window.openBook();
      } else if (act === 'open-book-std' && typeof window.openBook === 'function') {
        window.openBook('Thường');
      } else if (act === 'open-book-vip' && typeof window.openBook === 'function') {
        window.openBook('VIP');
      } else if (act === 'open-qr-demo' && typeof window.openQRDemo === 'function') {
        window.openQRDemo();
      } else if (act === 'go-invoice') {
        location.hash = '#hoadon';
        const hc = document.getElementById('hc');
        if (hc) hc.focus();
      } else if (act === 'go-contact') {
        location.hash = '#lienhe';
        const ct = document.getElementById('ct_name');
        if (ct) ct.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
