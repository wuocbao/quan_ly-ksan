/* ==========================================================================
   MY HOTEL - Quản Trị & Nghiệp Vụ Khách Sạn
   Phiên bản nâng cao, đầy đủ tính năng
   ========================================================================== */

const K = 'ks_web_v1';
const TT = ['Trống', 'Đã đặt', 'Đang ở', 'Đang dọn'];
const TT_CLASS = ['s0', 's1', 's2', 's3'];

let S = null;
let cur = null;
let tab = 'ph'; // ph, od, bk, ch, mn, qr, ca, dt, lc, nv, st
const F = { tt: '', loai: '', tang: '', q: '', sx: 'ma' };
const R = { m: 'day', v: new Date().toLocaleDateString('en-CA') };

let DB = null;
let ORD = [];
let CHAT = [];
let ALR = [];
let BK = [];
let alrInit = false;
let G = null;
let C = null;
let cart = {};
const DEMO_MODE = new URLSearchParams(location.search).get('demo') === '1';

let chatTimerInterval = null;
let chatIdleSeconds = 0;
const IDLE_WARN_SECONDS = 5;
const CHAT_TOTAL_TIMEOUT_SECONDS = 65;
let chatClosed = false;

const dlg = document.getElementById('dlg');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => (Math.round(n || 0)).toLocaleString('vi-VN') + ' ₫';
const fmtD = i => i ? i.split('-').reverse().join('/') : '';
const fmtT = t => t ? new Date(t).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const dur = ms => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return (h > 0 ? h + ' giờ ' : '') + m + ' phút';
};
const room = m => S.rooms.find(r => r.ma === Number(m));
const inCa = () => S.ca.some(c => c.u === cur?.u && c.ra == null);

/* --- Mặc định ban đầu --- */
const DEFAULT_MENU = [
  { id: 'cf', n: 'Cà phê sữa đá', p: 30000, ic: '☕', cat: 'drink', st: 1, img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80' },
  { id: 'td', n: 'Trà đào cam sả', p: 35000, ic: '🧋', cat: 'drink', st: 1, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80' },
  { id: 'ns', n: 'Nước suối Dasani', p: 15000, ic: '💧', cat: 'drink', st: 1, img: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=80' },
  { id: 'cc', n: 'Coca-Cola lon', p: 25000, ic: '🥤', cat: 'drink', st: 1, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80' },
  { id: 'bi', n: 'Bia Heineken lon', p: 35000, ic: '🍺', cat: 'drink', st: 1, img: 'https://images.unsplash.com/photo-1608270191986-e97d1052136e?auto=format&fit=crop&w=500&q=80' },
  { id: 'bm', n: 'Bánh mì ốp la pate', p: 35000, ic: '🥖', cat: 'food', st: 1, img: 'images/menu-banhmi.jpg' },
  { id: 'pho', n: 'Phở bò đặc biệt', p: 65000, ic: '🍜', cat: 'food', st: 1, img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=500&q=80' },
  { id: 'com', n: 'Cơm gà xối mỡ', p: 70000, ic: '🍗', cat: 'food', st: 1, img: 'images/menu-comga.jpg' },
  { id: 'mx', n: 'Mì xào hải sản', p: 75000, ic: '🍝', cat: 'food', st: 1, img: 'images/menu-mixao.jpg' },
  { id: 'tc', n: 'Đĩa trái cây tươi', p: 45000, ic: '🍉', cat: 'food', st: 1, img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500&q=80' },
  { id: 'gu', n: 'Dịch vụ giặt ủi thường', p: 50000, ic: '🧺', cat: 'serv', st: 1, img: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=500&q=80' },
  { id: 'tx', n: 'Thuê xe máy (1 ngày)', p: 150000, ic: '🛵', cat: 'serv', st: 1, img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=500&q=80' }
];

// Ảnh cũ không khớp món (tự động thay bằng ảnh mới trong DEFAULT_MENU)
const OUTDATED_MENU_IMGS = ['photo-1626804475297-41608ea09aeb', 'photo-1604908176997-125f25cc6f3d', 'photo-1569718212165-3a8278d5f624'];

const DEFAULT_SETTINGS = {
  hotelName: 'MY HOTEL RESORT',
  hotelAddress: '123 Đường Bờ Biển, Bãi Sau, TP. Vũng Tàu',
  hotline: '0900 000 000',
  email: 'hotro@myhotel.vn',
  bankName: 'MBBANK',
  bankAccount: '0900000000',
  bankOwner: 'MY HOTEL'
};

/* --- Quản lý dữ liệu LocalStorage & Firebase --- */
function load() {
  try {
    S = JSON.parse(localStorage.getItem(K));
  } catch (e) {
    S = null;
  }

  if (!S || !S.rooms || !S.rooms.length) {
    S = {
      rooms: [],
      users: [
        { u: 'admin', p: 'admin123', r: 'QL', n: 'Quản lý' },
        { u: 'nhanvien1', p: '123456', r: 'NV', n: 'Nhân viên 1' }
      ],
      ca: [],
      dt: [],
      menu: DEFAULT_MENU,
      settings: DEFAULT_SETTINGS,
      seen: {}
    };
    for (let i = 1; i <= 25; i++) {
      const v = i > 15;
      S.rooms.push({
        ma: i,
        loai: v ? 'VIP' : 'Thường',
        gn: v ? 600000 : 300000,
        gg: v ? 120000 : 60000,
        tt: 0,
        k: null
      });
    }
  }

  // Bổ sung các mảng nếu bản cũ chưa có
  if (!S.menu || !S.menu.length) S.menu = DEFAULT_MENU;
  else {
    S.menu.forEach(m => {
      const d = DEFAULT_MENU.find(x => x.id === m.id);
      if (d && (!m.img || OUTDATED_MENU_IMGS.some(x => m.img.includes(x)))) m.img = d.img;
    });
  }
  if (!S.settings) S.settings = DEFAULT_SETTINGS;
  if (!S.seen) S.seen = {};

  try {
    const u = sessionStorage.getItem('ks_cur');
    if (u) cur = S.users.find(x => x.u === u) || null;
  } catch (e) {}

  // Lấy dữ liệu dự phòng từ các key localStorage
  try {
    const localBk = JSON.parse(localStorage.getItem('ks_bookings') || '[]');
    if (localBk.length) {
      localBk.forEach(b => {
        if (!BK.some(x => x.id === b.id)) BK.push(b);
      });
    }
  } catch (e) {}
}

const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {
    console.error('Lỗi lưu localStorage', e);
  }
};

function toast(t) {
  const e = document.getElementById('toast');
  if (!e) return;
  e.textContent = t;
  e.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { e.style.display = 'none'; }, 3000);
}

function modal(t, body, ok, txt, cancelTxt) {
  dlg.innerHTML = `
    <h3>${t}</h3>
    <div>${body}</div>
    <div class="row">
      <button class="bt" onclick="dlg.close()">${cancelTxt || 'Đóng'}</button>
      ${ok ? `<button class="bt pr" id="okb">${txt || 'Xác nhận'}</button>` : ''}
    </div>
  `;
  if (ok) {
    document.getElementById('okb').onclick = () => {
      if (ok() !== false) dlg.close();
    };
  }
  dlg.showModal();
}

const val = id => {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
};

function guard() {
  if (cur && cur.r === 'NV' && !inCa()) {
    toast('⚠ Bạn phải check-in ca làm trước khi thao tác!');
    return false;
  }
  return true;
}

/* ---------- Theme Mode (Sáng / Tối) ---------- */
function initTheme() {
  const saved = localStorage.getItem('ks_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ks_theme', next);
  render();
}

/* ---------- Đăng nhập / Đăng xuất ---------- */
function login() {
  const u = val('lu');
  const p = document.getElementById('lp')?.value;
  const a = S.users.find(x => x.u === u && x.p === p);
  if (!a) {
    const errEl = document.getElementById('le');
    if (errEl) errEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu!';
    return;
  }
  cur = a;
  tab = 'ph';
  try { sessionStorage.setItem('ks_cur', a.u); } catch (e) {}
  render();
  toast('Chào mừng ' + a.n + ' (' + (a.r === 'QL' ? 'Quản lý' : 'Nhân viên') + ')!');
}

function doLogout() {
  cur = null;
  try { sessionStorage.removeItem('ks_cur'); } catch (e) {}
  render();
}

function logout() {
  if (cur && cur.r === 'NV' && inCa()) {
    modal('Đăng xuất ca làm', '<p>Bạn đang trong ca làm. Bạn có muốn check-out ca và đăng xuất không?</p>', () => {
      const o = S.ca.find(c => c.u === cur.u && c.ra == null);
      if (o) o.ra = Date.now();
      save();
      doLogout();
    }, 'Check-out & Đăng xuất', 'Không');
  } else {
    doLogout();
  }
}

/* ---------- Nghiệp vụ Quản lý Phòng ---------- */
function datPhong(ma) {
  if (!guard()) return;
  const r = room(ma);
  modal(
    `📅 Đặt trước phòng ${ma} (${r.loai})`,
    `
    <label>Họ tên khách hàng (*)<input id="f1" placeholder="Ví dụ: Nguyễn Văn A"></label>
    <label>Số điện thoại (*)<input id="f2" type="tel" placeholder="Ví dụ: 0912345678"></label>
    <label>Số CCCD / CMND<input id="f_cccd" placeholder="Số định danh"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label>Ngày nhận phòng<input id="f3" type="date" value="${new Date().toLocaleDateString('en-CA')}"></label></div>
      <div><label>Giờ dự kiến<input id="f_gio" type="time" value="14:00"></label></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <label>Tính tiền theo
          <select id="f4">
            <option value="ngay">Theo ngày (${money(r.gn)}/ngày)</option>
            <option value="gio">Theo giờ (${money(r.gg)}/giờ)</option>
          </select>
        </label>
      </div>
      <div><label>Số ngày / giờ dự kiến<input id="f5" type="number" min="1" value="1"></label></div>
    </div>
    <label>Tiền cọc trước (nếu có)<input id="f_coc" type="number" min="0" value="0" placeholder="VND"></label>
    <label>Ghi chú<input id="f_note" placeholder="Yêu cầu riêng của khách"></label>
    `,
    () => {
      const ten = val('f1');
      const sdt = val('f2');
      const cccd = val('f_cccd');
      const ngay = val('f3');
      const sl = parseInt(val('f5')) || 1;
      const coc = parseFloat(val('f_coc')) || 0;
      const note = val('f_note');
      if (!ten || !sdt || !ngay || !(sl > 0)) {
        toast('Vui lòng điền đủ họ tên, SĐT và ngày nhận');
        return false;
      }
      r.k = {
        ten,
        sdt,
        cccd,
        ngay,
        gioVao: val('f_gio') || '14:00',
        kieu: val('f4'),
        sl,
        pp: 0,
        coc,
        note,
        items: [],
        checkinTime: null
      };
      r.tt = 1; // Đã đặt
      save();
      render();
      toast(`Đã ghi nhận đặt phòng ${ma}`);
    },
    'Xác nhận đặt phòng'
  );
}

function checkInNhanh(ma) {
  if (!guard()) return;
  const r = room(ma);
  if (r.tt === 1) {
    // Khách đã đặt trước
    r.tt = 2; // Đang ở
    r.k.checkinTime = Date.now();
    save();
    render();
    toast(`Check-in phòng ${ma} thành công!`);
  } else if (r.tt === 0) {
    // Khách vãng lai check-in trực tiếp
    modal(
      `🔑 Check-in trực tiếp phòng ${ma} (${r.loai})`,
      `
      <label>Họ tên khách (*)<input id="f1" placeholder="Nguyễn Văn A"></label>
      <label>Số điện thoại (*)<input id="f2" type="tel" placeholder="0912345678"></label>
      <label>Số CCCD / CMND<input id="f_cccd"></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label>Hình thức thuê
            <select id="f4">
              <option value="ngay">Theo ngày (${money(r.gn)}/ngày)</option>
              <option value="gio">Theo giờ (${money(r.gg)}/giờ)</option>
            </select>
          </label>
        </div>
        <div><label>Số lượng dự kiến<input id="f5" type="number" min="1" value="1"></label></div>
      </div>
      <label>Tiền cọc (nếu có)<input id="f_coc" type="number" min="0" value="0"></label>
      `,
      () => {
        const ten = val('f1');
        const sdt = val('f2');
        if (!ten || !sdt) {
          toast('Vui lòng nhập tên và số điện thoại');
          return false;
        }
        r.k = {
          ten,
          sdt,
          cccd: val('f_cccd'),
          ngay: new Date().toLocaleDateString('en-CA'),
          gioVao: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          kieu: val('f4'),
          sl: parseInt(val('f5')) || 1,
          pp: 0,
          coc: parseFloat(val('f_coc')) || 0,
          note: '',
          items: [],
          checkinTime: Date.now()
        };
        r.tt = 2; // Đang ở
        save();
        render();
        toast(`Check-in trực tiếp phòng ${ma} thành công!`);
      },
      'Check-in ngay'
    );
  }
}

function dichVu(ma) {
  if (!guard()) return;
  const r = room(ma);
  if (!r.k) return;

  const servList = S.menu.filter(m => m.st && m.cat === 'serv');
  const menuOpts = (servList.length ? servList : S.menu.filter(m => m.st)).map(m =>
    `<option value="${m.id}">${m.ic || '🧺'} ${m.n} - ${money(m.p)}</option>`
  ).join('');

  modal(
    `🧺 Thêm Dịch Vụ (Giặt ủi, Thuê xe...) - Phòng ${ma}`,
    `
    <div style="background:color-mix(in srgb, var(--bd) 25%, transparent);padding:10px;border-radius:8px;margin-bottom:12px">
      Khách: <b>${esc(r.k.ten)}</b> · Phụ phí dịch vụ hiện tại: <b>${money(r.k.pp)}</b><br>
      <small class="mut">💡 Lưu ý: Đồ ăn / thức uống khách gọi qua QR sẽ tự động được cộng vào hóa đơn khi Check-out.</small>
    </div>
    <label>Chọn dịch vụ khách sạn (Giặt ủi, thuê xe...)
      <select id="f_menu_item">
        <option value="">-- Chọn dịch vụ --</option>
        ${menuOpts}
      </select>
    </label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label>Số lượng<input id="f_menu_qty" type="number" min="1" value="1"></label></div>
      <div><label>Hoặc nhập số tiền dịch vụ khác<input id="f_custom_p" type="number" min="0" placeholder="0 VND"></label></div>
    </div>
    <label>Tên dịch vụ phát sinh (nếu nhập số tiền tùy ý)<input id="f_custom_name" placeholder="Ví dụ: Giặt ủi nhanh, Đưa đón sân bay..."></label>
    `,
    () => {
      const mid = val('f_menu_item');
      const qty = parseInt(val('f_menu_qty')) || 1;
      const customP = parseFloat(val('f_custom_p')) || 0;
      const customName = val('f_custom_name');

      let addPrice = 0;
      let itemName = '';

      if (mid) {
        const item = S.menu.find(m => m.id === mid);
        if (item) {
          addPrice = item.p * qty;
          itemName = `${qty} × ${item.n}`;
        }
      } else if (customP > 0) {
        addPrice = customP;
        itemName = customName || 'Phụ phí dịch vụ';
      }

      if (addPrice <= 0) {
        toast('Vui lòng chọn món hoặc nhập số tiền dịch vụ hợp lệ');
        return false;
      }

      r.k.pp += addPrice;
      r.k.items = r.k.items || [];
      r.k.items.push({ name: itemName, price: addPrice, time: Date.now() });

      save();
      render();
      toast(`Đã thêm ${itemName} (+${money(addPrice)}) vào phòng ${ma}`);
    },
    'Thêm dịch vụ'
  );
}

function chuyenPhong(ma) {
  if (!guard()) return;
  const curR = room(ma);
  if (!curR || !curR.k) return;

  const emptyRooms = S.rooms.filter(r => r.tt === 0);
  if (!emptyRooms.length) {
    toast('Không còn phòng trống nào để chuyển!');
    return;
  }

  const roomOpts = emptyRooms.map(r =>
    `<option value="${r.ma}">Phòng ${r.ma} (${r.loai} - ${money(r.gn)}/ngày)</option>`
  ).join('');

  modal(
    `🔄 Chuyển phòng cho khách từ Phòng ${ma}`,
    `
    <p>Khách hàng: <b>${esc(curR.k.ten)}</b></p>
    <label>Chọn phòng trống muốn chuyển tới:
      <select id="f_new_room">
        ${roomOpts}
      </select>
    </label>
    <p class="mut">Toàn bộ thông tin khách hàng, số ngày/giờ, tiền cọc và phụ phí dịch vụ (${money(curR.k.pp)}) sẽ được chuyển sang phòng mới.</p>
    `,
    () => {
      const targetMa = parseInt(val('f_new_room'));
      const targetR = room(targetMa);
      if (!targetR || targetR.tt !== 0) {
        toast('Phòng đích không hợp lệ hoặc đã có người');
        return false;
      }

      // Chuyển dữ liệu khách & các đơn gọi món / chat sang phòng mới
      targetR.k = curR.k;
      targetR.tt = curR.tt;
      curR.k = null;
      curR.tt = 3; // Chuyển phòng cũ thành trạng thái Cần dọn dẹp

      ORD.forEach(o => { if (Number(o.room) === Number(ma)) o.room = targetMa; });
      try { localStorage.setItem('ks_orders', JSON.stringify(ORD)); } catch (e) {}
      CHAT.forEach(m => { if (Number(m.room) === Number(ma)) m.room = targetMa; });
      try { localStorage.setItem('ks_chat', JSON.stringify(CHAT)); } catch (e) {}
      if (DB) {
        try {
          DB.collection('orders').where('room', '==', Number(ma)).get().then(s => s.forEach(d => d.ref.update({ room: targetMa }))).catch(() => {});
          DB.collection('chat').where('room', '==', Number(ma)).get().then(s => s.forEach(d => d.ref.update({ room: targetMa }))).catch(() => {});
        } catch (e) {}
      }

      save();
      render();
      toast(`Đã chuyển khách từ phòng ${ma} sang phòng ${targetMa}! Phòng ${ma} chuyển sang trạng thái đang dọn.`);
    },
    'Xác nhận chuyển'
  );
}

function doiTrangThaiDon(ma, st) {
  if (!guard()) return;
  const r = room(ma);
  if (!r) return;
  r.tt = st; // 3: đang dọn, 0: dọn xong trống
  if (st === 0) {
    r.k = null;
    resetRoomDataOnCheckout(ma);
  }
  save();
  render();
  toast(st === 3 ? `Phòng ${ma} đã đánh dấu cần dọn dẹp` : `Phòng ${ma} đã dọn xong và sẵn sàng đón khách!`);
}

function resetRoomDataOnCheckout(ma) {
  // 1. Xóa toàn bộ đơn gọi món của phòng này
  ORD = ORD.filter(o => Number(o.room) !== Number(ma));
  try { localStorage.setItem('ks_orders', JSON.stringify(ORD)); } catch (e) {}

  // 2. Xóa toàn bộ đoạn chat của phòng này
  CHAT = CHAT.filter(m => Number(m.room) !== Number(ma));
  try { localStorage.setItem('ks_chat', JSON.stringify(CHAT)); } catch (e) {}

  // 3. Xóa các cảnh báo khẩn cấp của phòng này
  ALR = ALR.filter(a => Number(a.room) !== Number(ma));
  try { localStorage.setItem('ks_alerts', JSON.stringify(ALR)); } catch (e) {}

  // 4. Đồng bộ xóa trên Firestore nếu có kết nối
  if (DB) {
    try {
      DB.collection('orders').where('room', '==', Number(ma)).get().then(s => s.forEach(d => d.ref.delete())).catch(() => {});
      DB.collection('chat').where('room', '==', Number(ma)).get().then(s => s.forEach(d => d.ref.delete())).catch(() => {});
      DB.collection('alerts').where('room', '==', Number(ma)).get().then(s => s.forEach(d => d.ref.delete())).catch(() => {});
    } catch (e) {
      console.warn('Lỗi xóa Firestore phòng ' + ma, e);
    }
  }

  // 5. Reset giỏ hàng và trạng thái đã đọc
  if (Number(G) === Number(ma)) cart = {};
  if (Number(C) === Number(ma)) C = null;
  if (S.seen && S.seen[ma]) delete S.seen[ma];
}

function checkOut(ma) {
  if (!guard()) return;
  const r = room(ma);
  const k = r.k;
  if (!k) return;

  const isDay = k.kieu === 'ngay';
  const unit = isDay ? 'ngày' : 'giờ';
  const dg = isDay ? r.gn : r.gg;

  // Toàn bộ đơn gọi món QR của khách trong kỳ lưu trú (cả đơn chờ giao & đơn đã giao) -> tự động gom vào bill
  const allQrOrders = ORD.filter(o =>
    Number(o.room) === Number(ma) && o.st !== 3 &&
    (!k.checkinTime || !o.t || o.t >= k.checkinTime)
  );
  const pendingOrders = allQrOrders.filter(o => !o.charged);
  const orderItems = [];
  pendingOrders.forEach(o => (o.items || []).forEach(it => {
    orderItems.push({ name: `${it.q} × ${it.n} (gọi món)`, price: it.q * it.p, time: o.t || Date.now() });
  }));
  const pendingOrderTotal = orderItems.reduce((s, it) => s + it.price, 0);
  const totalQrAmount = allQrOrders.reduce((s, o) => s + (o.tot || 0), 0);
  const chargedQrAmount = totalQrAmount - pendingOrderTotal;
  const serviceOnlyAmount = Math.max(0, (k.pp || 0) - chargedQrAmount);

  const calc = () => {
    const curSl = parseInt(document.getElementById('co_sl')?.value) || 0;
    const rawTp = curSl * dg;
    const discRate = (isDay && curSl >= 3) ? 0.15 : 0;
    const tp = Math.round(rawTp * (1 - discRate));
    const pp = (k.pp || 0) + pendingOrderTotal;
    const coc = k.coc || 0;
    const tong = tp + pp;
    const thucThu = Math.max(0, tong - coc);

    const el = document.getElementById('co_preview');
    if (el) {
      el.innerHTML = `
        <div style="line-height:1.6">
          <div style="display:flex;justify-content:space-between">
            <span>Tiền phòng (${curSl} ${unit} × ${money(dg)}${discRate ? ' · <span style="color:var(--ok)">Giảm 15%</span>' : ''}):</span>
            <b>${money(tp)}</b>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span>Dịch vụ phát sinh (giặt ủi, thuê xe...):</span>
            <b>${money(serviceOnlyAmount)}</b>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span>Đồ ăn / uống khách gọi qua QR${allQrOrders.length ? ` (${allQrOrders.length} đơn)` : ''}:</span>
            <b>${money(totalQrAmount)}</b>
          </div>
          ${coc > 0 ? `
          <div style="display:flex;justify-content:space-between;color:var(--ok)">
            <span>Tiền đã cọc trước:</span>
            <b>-${money(coc)}</b>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--bd);margin-top:6px;padding-top:6px;font-size:16px">
            <span>Thực thu cần thanh toán:</span>
            <b style="color:var(--bz)">${money(thucThu)}</b>
          </div>
        </div>
      `;
    }
  };

  modal(
    `🧾 Check-out & Thanh Toán Phòng ${ma}`,
    `
    <div style="background:color-mix(in srgb, var(--bd) 25%, transparent);padding:10px;border-radius:8px;margin-bottom:12px">
      👤 <b>${esc(k.ten)}</b> · 📞 ${esc(k.sdt)} ${k.cccd ? '· CCCD: ' + esc(k.cccd) : ''}<br>
      <span class="mut">Nhận phòng: ${fmtD(k.ngay)} ${k.gioVao ? '(' + esc(k.gioVao) + ')' : ''}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <label>Số ${unit} thực tế ở
          <input id="co_sl" type="number" min="1" value="${k.sl || 1}" oninput="window._recalcCO()">
        </label>
      </div>
      <div>
        <label>Phương thức thanh toán
          <select id="co_pm">
            <option value="Tiền mặt">💵 Tiền mặt</option>
            <option value="Chuyển khoản QR">📱 Chuyển khoản VietQR</option>
            <option value="Thẻ tín dụng">💳 Quẹt thẻ POS</option>
          </select>
        </label>
      </div>
    </div>
    <div class="inv" id="co_preview"></div>
    `,
    () => {
      const slVal = parseInt(val('co_sl')) || 1;
      const pm = val('co_pm') || 'Tiền mặt';
      const discRate = (isDay && slVal >= 3) ? 0.15 : 0;
      const tp = Math.round(slVal * dg * (1 - discRate));
      const pp = (k.pp || 0) + pendingOrderTotal;
      const coc = k.coc || 0;
      const tong = tp + pp;
      const thucThu = Math.max(0, tong - coc);

      const code = ('HD' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 4)).toUpperCase();
      const inv = {
        code,
        t: Date.now(),
        ma,
        loai: r.loai,
        ten: k.ten,
        sdt: k.sdt,
        cccd: k.cccd || '',
        sl: slVal,
        kieu: k.kieu,
        tp,
        pp,
        coc,
        tong,
        thucThu,
        pm,
        u: cur.u,
        items: (k.items || []).concat(orderItems)
      };

      S.dt.push(inv);

      // Đồng bộ sang Firebase nếu có
      if (DB) {
        try {
          DB.collection('invoices').doc(code).set(inv).catch(e => console.error(e));
        } catch (e) {
          console.error(e);
        }
      }

      // Cập nhật trạng thái phòng -> Chuyển sang đang dọn
      r.tt = 3; // Đang dọn dẹp
      r.k = null;

      // Xóa và reset toàn bộ đơn đặt hàng và đoạn chat của phòng này khi check-out
      resetRoomDataOnCheckout(ma);

      save();
      render();

      // Mở modal in hóa đơn & thông báo
      setTimeout(() => inHoaDon(code), 250);
    },
    'Thanh toán & Xuất hóa đơn'
  );

  window._recalcCO = calc;
  setTimeout(calc, 50);
}

/* ---------- In Hóa Đơn Chuẩn Khách Sạn & VietQR ---------- */
function inHoaDon(code) {
  const inv = S.dt.find(x => x.code === code);
  if (!inv) {
    toast('Không tìm thấy hóa đơn ' + code);
    return;
  }

  const s = S.settings || DEFAULT_SETTINGS;
  const qrUrl = `https://img.vietqr.io/image/${s.bankName || 'MBBANK'}-${s.bankAccount || '0900000000'}-compact2.png?amount=${inv.thucThu}&addInfo=${encodeURIComponent(inv.code + ' ' + inv.ten)}`;

  const itemsList = (inv.items && inv.items.length)
    ? inv.items.map((it, idx) => `<tr><td>${idx + 1}</td><td>${esc(it.name)}</td><td style="text-align:right">${money(it.price)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="mut" style="text-align:center">Không có dịch vụ phát sinh</td></tr>`;

  const billHTML = `
    <div class="invoice-box" id="print_area">
      <div class="invoice-header">
        <div>
          <b style="font-size:18px;color:#0f2b48">${esc(s.hotelName)}</b><br>
          <span style="font-size:12px;color:#555">📍 ${esc(s.hotelAddress)}</span><br>
          <span style="font-size:12px;color:#555">📞 Hotline: ${esc(s.hotline)}</span>
        </div>
        <div style="text-align:right">
          <b style="font-size:16px;color:var(--gold)">MÃ HĐ: ${esc(inv.code)}</b><br>
          <span style="font-size:12px;color:#666">Ngày: ${fmtT(inv.t)}</span>
        </div>
      </div>

      <div class="invoice-title">
        <h2>HÓA ĐƠN THANH TOÁN</h2>
        <span style="font-size:13px;color:#666">Dịch vụ lưu trú & ăn uống</span>
      </div>

      <div class="invoice-meta">
        <div>
          Khách hàng: <b>${esc(inv.ten)}</b><br>
          Số điện thoại: <b>${esc(inv.sdt)}</b><br>
          ${inv.cccd ? 'CCCD: ' + esc(inv.cccd) + '<br>' : ''}
        </div>
        <div style="text-align:right">
          Phòng: <b>${inv.ma} (${esc(inv.loai)})</b><br>
          Thời gian ở: <b>${inv.sl} ${inv.kieu === 'ngay' ? 'ngày' : 'giờ'}</b><br>
          Thu ngân: <b>${esc(inv.u)}</b>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Diễn giải dịch vụ</th>
            <th style="text-align:right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Tiền phòng (${inv.sl} ${inv.kieu === 'ngay' ? 'ngày' : 'giờ'}${inv.kieu === 'ngay' && inv.sl >= 3 ? ' - đã giảm 15%' : ''})</td>
            <td style="text-align:right">${money(inv.tp)}</td>
          </tr>
          ${itemsList}
        </tbody>
      </table>

      <div class="invoice-total">
        <div>Tổng cộng chi phí: <b>${money(inv.tong)}</b></div>
        ${inv.coc > 0 ? `<div>Đã thanh toán trước (Cọc): <b>-${money(inv.coc)}</b></div>` : ''}
        <div style="font-size:17px;margin-top:4px">
          SỐ TIỀN THANH TOÁN: <b style="color:#0f2b48">${money(inv.thucThu)}</b>
        </div>
        <div style="font-size:12px;color:#666;margin-top:2px">
          Phương thức: ${esc(inv.pm || 'Tiền mặt')}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border:1px dashed #ccc;padding:10px;border-radius:8px;margin-top:14px">
        <div>
          <b style="font-size:13px">Thanh toán chuyển khoản VietQR:</b><br>
          <span style="font-size:12px;color:#555">Ngân hàng: ${esc(s.bankName)} - STK: ${esc(s.bankAccount)}</span><br>
          <span style="font-size:12px;color:#555">Chủ TK: ${esc(s.bankOwner)}</span>
        </div>
        <div>
          <img src="${qrUrl}" alt="VietQR" style="height:90px;width:auto;border-radius:4px" onerror="this.style.display='none'">
        </div>
      </div>

      <div class="invoice-footer">
        <div>
          <b>Khách hàng</b><br>
          <small>(Ký và ghi rõ họ tên)</small>
        </div>
        <div>
          <b>Người lập phiếu</b><br>
          <small>${esc(inv.u)}</small>
        </div>
      </div>
    </div>
  `;

  modal(
    `Hóa đơn thanh toán - ${inv.code}`,
    `
    ${billHTML}
    <div style="text-align:center;margin-top:14px" class="no-print">
      <button class="bt pr" onclick="window.print()">🖨️ In hóa đơn này</button>
    </div>
    `,
    null,
    null,
    'Đóng'
  );
}

/* ---------- Ca làm việc của Nhân viên ---------- */
function toggleCa() {
  const o = S.ca.find(c => c.u === cur.u && c.ra == null);
  if (o) {
    o.ra = Date.now();
    toast(`Đã check-out ca làm. Bạn đã làm việc: ${dur(o.ra - o.vao)}`);
  } else {
    S.ca.push({ u: cur.u, vao: Date.now(), ra: null, note: '' });
    toast('Đã check-in ca làm! Chúc bạn một ca làm việc hiệu quả.');
  }
  save();
  render();
}

function caTable(list) {
  if (!list.length) return '<p class="mut">Chưa có dữ liệu ca làm nào.</p>';
  return `
    <div class="tb card">
      <table>
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Vào ca</th>
            <th>Ra ca</th>
            <th>Thời gian làm</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${list.slice().sort((a, b) => b.vao - a.vao).map(c => `
            <tr>
              <td><b>${esc(c.u)}</b></td>
              <td>${fmtT(c.vao)}</td>
              <td>${c.ra ? fmtT(c.ra) : '—'}</td>
              <td>${c.ra ? dur(c.ra - c.vao) : 'Đang trong ca'}</td>
              <td><span class="bd ${c.ra ? 's0' : 's1'}">${c.ra ? 'Đã kết thúc' : 'Đang làm'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------- Quản lý Nhân viên ---------- */
function themNV() {
  const u = val('nu');
  const p = val('np');
  const n = val('nn');
  if (!u || !p || !n) {
    toast('Vui lòng nhập đủ tên đăng nhập, mật khẩu và họ tên');
    return;
  }
  if (S.users.some(x => x.u === u)) {
    toast('Tên đăng nhập đã tồn tại!');
    return;
  }
  S.users.push({ u, p, r: 'NV', n });
  save();
  render();
  toast(`Đã tạo tài khoản nhân viên ${u} thành công!`);
}

function xoaNV(u) {
  if (u === 'admin') {
    toast('Không thể xóa tài khoản Quản trị trưởng');
    return;
  }
  modal(
    'Xóa tài khoản nhân viên',
    `<p>Bạn có chắc chắn muốn xóa tài khoản <b>${esc(u)}</b>?</p>`,
    () => {
      S.users = S.users.filter(x => x.u !== u);
      save();
      render();
      toast('Đã xóa tài khoản ' + u);
    },
    'Xóa',
    'Hủy'
  );
}

function doiMatKhauNV(u) {
  modal(
    `Đổi mật khẩu cho ${esc(u)}`,
    `<label>Mật khẩu mới<input id="new_pw" type="password"></label>`,
    () => {
      const np = val('new_pw');
      if (!np) {
        toast('Mật khẩu không được để trống');
        return false;
      }
      const user = S.users.find(x => x.u === u);
      if (user) {
        user.p = np;
        save();
        toast('Đã cập nhật mật khẩu mới cho ' + u);
      }
    },
    'Lưu mật khẩu'
  );
}

/* ---------- Quản lý Thực đơn (Menu & Dịch vụ) ---------- */
function themMon() {
  modal(
    'Thêm Món / Dịch vụ Mới',
    `
    <label>Tên món / dịch vụ (*)<input id="mn_name" placeholder="Ví dụ: Nước ép dưa hấu"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label>Đơn vị giá (VND)<input id="mn_price" type="number" min="0" placeholder="40000"></label></div>
      <div><label>Biểu tượng emoji<input id="mn_ic" placeholder="🥤, 🍲, 🚴"></label></div>
    </div>
    <label>Phân loại
      <select id="mn_cat">
        <option value="drink">Đồ uống (Nước, cà phê, bia...)</option>
        <option value="food">Món ăn (Cơm, phở, mì...)</option>
        <option value="serv">Dịch vụ (Giặt ủi, xe, spa...)</option>
      </select>
    </label>
    `,
    () => {
      const name = val('mn_name');
      const price = parseFloat(val('mn_price')) || 0;
      const ic = val('mn_ic') || '🍽️';
      const cat = val('mn_cat') || 'food';

      if (!name || price < 0) {
        toast('Tên và đơn giá không hợp lệ');
        return false;
      }
      const id = 'm' + Date.now().toString(36).slice(-5);
      S.menu.push({ id, n: name, p: price, ic, cat, st: 1 });
      save();
      render();
      toast(`Đã thêm món "${name}" vào thực đơn`);
    },
    'Thêm vào menu'
  );
}

function toggleMon(id) {
  const item = S.menu.find(m => m.id === id);
  if (item) {
    item.st = item.st ? 0 : 1;
    save();
    render();
    toast(`${item.n}: ${item.st ? 'Còn hàng' : 'Hết hàng'}`);
  }
}

function xoaMon(id) {
  modal(
    'Xóa món / dịch vụ',
    '<p>Bạn có chắc muốn xóa món này khỏi menu?</p>',
    () => {
      S.menu = S.menu.filter(m => m.id !== id);
      save();
      render();
      toast('Đã xóa món');
    },
    'Xóa',
    'Hủy'
  );
}

/* ---------- Cài đặt Khách Sạn ---------- */
function luuCaiDat() {
  S.settings = {
    hotelName: val('st_name') || 'MY HOTEL RESORT',
    hotelAddress: val('st_addr') || '',
    hotline: val('st_hotline') || '',
    email: val('st_email') || '',
    bankName: val('st_bank') || 'MBBANK',
    bankAccount: val('st_acc') || '',
    bankOwner: val('st_owner') || '',
    ejsService: val('st_ejs_service') || '',
    ejsTemplate: val('st_ejs_template') || '',
    ejsKey: val('st_ejs_key') || ''
  };
  save();
  toast('Đã lưu cấu hình khách sạn thành công!');
  render();
}

function backupData() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(S, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `hotel_backup_${new Date().toLocaleDateString('en-CA')}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Đã tải xuống file sao lưu dữ liệu!');
}

function restoreData(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.rooms && data.users) {
        S = data;
        save();
        render();
        toast('Đã khôi phục dữ liệu thành công!');
      } else {
        toast('File không hợp lệ');
      }
    } catch (err) {
      toast('Lỗi đọc file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function resetDataDemo() {
  modal(
    'Khôi phục dữ liệu gốc',
    '<p style="color:var(--bz)">⚠ Thao tác này sẽ đặt lại danh sách phòng, hóa đơn và tài khoản về trạng thái ban đầu!</p>',
    () => {
      localStorage.removeItem(K);
      load();
      save();
      render();
      toast('Đã đặt lại dữ liệu mẫu ban đầu!');
    },
    'Đặt lại',
    'Hủy'
  );
}

/* ---------- Giao Diện Quản Trị ---------- */
const LOGO = '<svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#d4a343" stroke-width="2.2" stroke-linecap="round"><path d="M10 34V16l8-6 8 6v18M26 34V22l8 4v8M4 40c4-3 8-3 12 0s8 3 12 0 8-3 12 0"/><path d="M14 20h4M14 26h4"/></svg>';
const BRAND = `<a class="brand" href="index.html" title="Trở về trang chủ">${LOGO}<div><b>MY HOTEL</b><small>HOTEL &amp; RESORT</small></div></a>`;

function loginHTML() {
  return `
    <div class="lg">
      <div class="login card">
        <div style="border-radius:12px;overflow:hidden;margin:-10px -10px 16px;height:130px;position:relative">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
               onerror="this.src='images/admin-bg.jpg'"
               alt="MY HOTEL Resort Lobby" style="width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,23,40,0.25),rgba(7,23,40,0.88));display:flex;align-items:flex-end;padding:12px">
            <div style="display:flex;align-items:center;gap:10px">
              ${LOGO}
              <div>
                <b style="color:#fff;font-family:Georgia,serif;font-size:19px;letter-spacing:0.5px">MY HOTEL RESORT</b>
                <small style="display:block;color:var(--gold);font-size:11px;letter-spacing:1px">PORTAL QUẢN TRỊ</small>
              </div>
            </div>
          </div>
        </div>
        <p class="mut" style="text-align:center;margin-bottom:18px;color:#cbd5e1">Đăng nhập hệ thống điều hành &amp; lễ tân</p>
        <label>Tên đăng nhập
          <input id="lu" autocomplete="username" placeholder="Tên đăng nhập">
        </label>
        <label>Mật khẩu
          <input id="lp" type="password" autocomplete="current-password" placeholder="Mật khẩu" onkeydown="if(event.key==='Enter')login()">
        </label>
        <div class="err" id="le"></div>
        <button class="bt pr" style="width:100%;padding:11px;font-size:15px" onclick="login()">Đăng nhập hệ thống</button>
        <div style="text-align:center;margin-top:14px">
          <a href="index.html" style="font-size:13px;color:var(--gold);text-decoration:underline">← Về trang chủ khách hàng</a>
        </div>
      </div>
    </div>
  `;
}

function roomsHTML() {
  let L = S.rooms.filter(r => {
    const matchTT = F.tt === '' || r.tt == F.tt;
    const matchLoai = !F.loai || r.loai === F.loai;
    const matchTang = !F.tang || (F.tang == 1 ? (r.ma >= 1 && r.ma <= 10) : F.tang == 2 ? (r.ma >= 11 && r.ma <= 20) : (r.ma >= 21 && r.ma <= 25));
    const matchQ = !F.q || String(r.ma).includes(F.q) || (r.k && r.k.ten.toLowerCase().includes(F.q.toLowerCase())) || (r.k && r.k.sdt.includes(F.q));
    return matchTT && matchLoai && matchTang && matchQ;
  });

  if (F.sx === 'gia') L.sort((a, b) => a.gn - b.gn || a.ma - b.ma);
  else if (F.sx === 'tt') L.sort((a, b) => b.tt - a.tt || a.ma - b.ma);
  else L.sort((a, b) => a.ma - b.ma);

  const opt = (v, t, c) => `<option value="${v}" ${c == v ? 'selected' : ''}>${t}</option>`;

  // Thống kê nhanh phòng
  const count0 = S.rooms.filter(r => r.tt === 0).length;
  const count1 = S.rooms.filter(r => r.tt === 1).length;
  const count2 = S.rooms.filter(r => r.tt === 2).length;
  const count3 = S.rooms.filter(r => r.tt === 3).length;

  const f = `
    <div class="stats" style="margin-top:0">
      <div class="card" style="border-left:4px solid var(--ok);cursor:pointer" onclick="F.tt='0';render()">
        <small>🟢 Phòng trống</small><b>${count0}</b>
      </div>
      <div class="card" style="border-left:4px solid var(--wn);cursor:pointer" onclick="F.tt='1';render()">
        <small>🟡 Đã đặt trước</small><b>${count1}</b>
      </div>
      <div class="card" style="border-left:4px solid var(--bz);cursor:pointer" onclick="F.tt='2';render()">
        <small>🔴 Đang có khách</small><b>${count2}</b>
      </div>
      <div class="card" style="border-left:4px solid var(--purple);cursor:pointer" onclick="F.tt='3';render()">
        <small>🟣 Cần dọn dẹp</small><b>${count3}</b>
      </div>
    </div>

    <div class="fl">
      <label>Tìm kiếm phòng / khách
        <input placeholder="Số phòng, tên, SĐT..." value="${esc(F.q)}" oninput="F.q=this.value;render()">
      </label>
      <label>Trạng thái
        <select onchange="F.tt=this.value;render()">
          ${opt('', 'Tất cả trạng thái', F.tt)}
          ${opt(0, 'Trống (sẵn sàng)', F.tt)}
          ${opt(1, 'Đã đặt trước', F.tt)}
          ${opt(2, 'Đang ở', F.tt)}
          ${opt(3, 'Đang dọn dẹp', F.tt)}
        </select>
      </label>
      <label>Loại phòng
        <select onchange="F.loai=this.value;render()">
          ${opt('', 'Tất cả loại', F.loai)}
          ${opt('Thường', 'Thường', F.loai)}
          ${opt('VIP', 'VIP Suite', F.loai)}
        </select>
      </label>
      <label>Tầng
        <select onchange="F.tang=this.value;render()">
          ${opt('', 'Tất cả các tầng', F.tang)}
          ${opt('1', 'Tầng 1 (P.1 - 10)', F.tang)}
          ${opt('2', 'Tầng 2 (P.11 - 20)', F.tang)}
          ${opt('3', 'Tầng 3 (P.21 - 25)', F.tang)}
        </select>
      </label>
      <label>Sắp xếp
        <select onchange="F.sx=this.value;render()">
          ${opt('ma', 'Theo số phòng', F.sx)}
          ${opt('tt', 'Theo trạng thái', F.sx)}
          ${opt('gia', 'Theo giá phòng', F.sx)}
        </select>
      </label>
    </div>
  `;

  if (!L.length) return f + '<p class="mut" style="text-align:center;padding:30px">Không tìm thấy phòng nào phù hợp bộ lọc.</p>';

  return f + `
    <div class="grid">
      ${L.map(r => {
        const k = r.k;
        let actBtns = '';

        if (r.tt === 0) {
          actBtns = `
            <button class="bt pr sm" onclick="checkInNhanh(${r.ma})">Check-in</button>
            <button class="bt sm" onclick="datPhong(${r.ma})">Đặt trước</button>
          `;
        } else if (r.tt === 1) {
          actBtns = `
            <button class="bt pr sm" onclick="checkInNhanh(${r.ma})">Nhận phòng</button>
            <button class="bt sm" onclick="modal('Hủy đặt phòng','Hủy đặt phòng ${r.ma}?',()=>{room(${r.ma}).tt=0;room(${r.ma}).k=null;save();render();toast('Đã hủy đặt phòng')},'Hủy đặt')">Hủy</button>
          `;
        } else if (r.tt === 2) {
          actBtns = `
            <button class="bt sm" onclick="dichVu(${r.ma})" title="Thêm dịch vụ giặt ủi, thuê xe...">+ Dịch vụ</button>
            <button class="bt sm" onclick="chuyenPhong(${r.ma})" title="Đổi sang phòng trống khác">Chuyển P</button>
            <button class="bt pr sm" onclick="checkOut(${r.ma})">Check-out</button>
          `;
        } else if (r.tt === 3) {
          actBtns = `
            <button class="bt success sm" onclick="doiTrangThaiDon(${r.ma},0)">✓ Dọn xong</button>
          `;
        }

        const roomImg = r.loai === 'VIP'
          ? 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=75'
          : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=75';
        const fallbackRoomImg = r.loai === 'VIP' ? 'images/phong-vip.jpg' : 'images/phong-thuong.jpg';

        return `
          <div class="card r${r.tt}" style="padding:0;overflow:hidden">
            <div style="position:relative;height:105px;overflow:hidden">
              <img src="${roomImg}" onerror="this.src='${fallbackRoomImg}'" alt="Phòng ${r.ma}" style="width:100%;height:100%;object-fit:cover">
              <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.75))"></div>
              <div style="position:absolute;top:8px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:center">
                <b style="color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.9);font-size:16px">Phòng ${r.ma}</b>
                <span class="bd ${TT_CLASS[r.tt]}">${TT[r.tt]}</span>
              </div>
              <div style="position:absolute;bottom:6px;left:10px;color:#fff;font-size:12px;text-shadow:0 1px 3px rgba(0,0,0,0.9)">
                ${r.loai === 'VIP' ? '👑 VIP Suite' : '🛏️ Thường'} · ${money(r.gn)}/ngày
              </div>
            </div>
            <div style="padding:12px">
              ${k ? (() => {
                const roomQrOrders = r.tt === 2 ? ORD.filter(o =>
                  Number(o.room) === Number(r.ma) && o.st !== 3 &&
                  (!k.checkinTime || !o.t || o.t >= k.checkinTime)
                ) : [];
                const qrTot = roomQrOrders.reduce((s, o) => s + (o.tot || 0), 0);
                const chargedQr = roomQrOrders.filter(o => o.charged).reduce((s, o) => s + (o.tot || 0), 0);
                const servTot = Math.max(0, (k.pp || 0) - chargedQr);
                return `
                <div class="gi">
                  👤 <b>${esc(k.ten)}</b> · ${esc(k.sdt)}<br>
                  🕒 Nhận: ${fmtD(k.ngay)} (${k.sl} ${k.kieu === 'ngay' ? 'ngày' : 'giờ'})
                  ${servTot ? `<br>🧺 Dịch vụ: <b>${money(servTot)}</b>` : ''}
                  ${qrTot ? `<br>🍽️ Gọi món QR: <b>${money(qrTot)}</b>` : ''}
                  ${k.coc ? `<br>💵 Cọc: <b>${money(k.coc)}</b>` : ''}
                </div>
              `})() : (r.tt === 3 ? '<div class="gi" style="color:var(--purple)">🧹 Đang dọn dẹp vệ sinh phòng</div>' : '<div class="gi" style="opacity:0.6">Phòng trống sẵn sàng đón khách</div>')}
              <div class="act">
                ${actBtns}
                <a href="#phong-${r.ma}" target="_blank" class="bt sm" title="Xem giao diện khách quét QR phòng này">QR</a>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function doanhThuHTML() {
  const inp = R.m === 'day' ? 'type="date"' : R.m === 'month' ? 'type="month"' : 'type="number" min="2020" max="2035"';
  const L = S.dt.filter(d => {
    const s = new Date(d.t).toLocaleDateString('en-CA');
    return R.m === 'all' || !R.v || (R.m === 'day' ? s === R.v : R.m === 'month' ? s.slice(0, 7) === R.v : s.slice(0, 4) === R.v);
  }).sort((a, b) => b.t - a.t);

  const sum = k => L.reduce((t, d) => t + (d[k] || 0), 0);
  const totalTong = sum('tong');
  const totalTP = sum('tp');
  const totalPP = sum('pp');
  const totalThucThu = sum('thucThu') || totalTong;

  // Dữ liệu biểu đồ cột 7 ngày gần nhất
  const chartDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-CA');
    const daySum = S.dt.filter(x => new Date(x.t).toLocaleDateString('en-CA') === dayStr)
      .reduce((t, x) => t + (x.thucThu || x.tong || 0), 0);
    chartDays.push({ label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), val: daySum });
  }
  const maxDayVal = Math.max(...chartDays.map(x => x.val), 1000000);

  const o = (v, t) => `<option value="${v}" ${R.m === v ? 'selected' : ''}>${t}</option>`;

  return `
    <div class="fl">
      <label>Xem báo cáo theo
        <select onchange="R.m=this.value;R.v='';render()">
          ${o('all', 'Toàn bộ thời gian')}
          ${o('day', 'Theo ngày cụ thể')}
          ${o('month', 'Theo tháng')}
          ${o('year', 'Theo năm')}
        </select>
      </label>
      ${R.m === 'all' ? '' : `<label>Chọn thời gian<input ${inp} value="${R.v}" onchange="R.v=this.value;render()"></label>`}
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="bt pr" onclick="exportCSV()">📥 Xuất Excel (CSV)</button>
        <button class="bt" onclick="window.print()">🖨️ In báo cáo</button>
      </div>
    </div>

    <div class="stats">
      <div class="card">
        <small>Tổng số hóa đơn</small><b>${L.length}</b>
      </div>
      <div class="card">
        <small>Tiền phòng</small><b>${money(totalTP)}</b>
      </div>
      <div class="card">
        <small>Phụ phí dịch vụ</small><b>${money(totalPP)}</b>
      </div>
      <div class="card" style="border-left:4px solid var(--gold)">
        <small>Tổng thực thu</small><b style="color:var(--gold)">${money(totalThucThu)}</b>
      </div>
    </div>

    <!-- Biểu đồ doanh thu 7 ngày -->
    <div class="card" style="margin-bottom:16px">
      <h3 style="font-size:16px;margin:0 0 10px">📊 Doanh thu 7 ngày gần nhất</h3>
      <div class="chart-bar-container">
        ${chartDays.map(cd => {
          const pct = Math.round((cd.val / maxDayVal) * 100);
          return `
            <div class="chart-col">
              <span class="chart-bar-val">${cd.val > 0 ? (Math.round(cd.val / 1000) + 'k') : ''}</span>
              <div class="chart-bar" style="height:${Math.max(pct, 4)}%" title="${cd.label}: ${money(cd.val)}"></div>
              <span class="chart-bar-lbl">${cd.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <h3 style="margin-top:20px">Danh sách hóa đơn chi tiết (${L.length})</h3>
    ${L.length ? `
      <div class="tb card">
        <table>
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Thời gian</th>
              <th>Phòng</th>
              <th>Khách hàng</th>
              <th>Tiền phòng</th>
              <th>Phụ phí</th>
              <th>Thực thu</th>
              <th>Hình thức</th>
              <th>Thu ngân</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${L.map(d => `
              <tr>
                <td><b>${esc(d.code)}</b></td>
                <td>${fmtT(d.t)}</td>
                <td>Phòng ${d.ma} (${esc(d.loai)})</td>
                <td>${esc(d.ten)}</td>
                <td>${money(d.tp)}</td>
                <td>${money(d.pp)}</td>
                <td><b style="color:var(--gold)">${money(d.thucThu || d.tong)}</b></td>
                <td>${esc(d.pm || 'Tiền mặt')}</td>
                <td>${esc(d.u)}</td>
                <td>
                  <button class="bt sm" onclick="inHoaDon('${d.code}')">Xem / In HĐ</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p class="mut">Không có hóa đơn nào trong khoảng thời gian đã chọn.</p>'}
  `;
}

function exportCSV() {
  if (!S.dt.length) {
    toast('Chưa có hóa đơn nào để xuất dữ liệu');
    return;
  }
  let csv = '\uFEFFMã HĐ,Thời gian,Phòng,Loại phòng,Khách hàng,SĐT,Tiền phòng,Phụ phí,Tổng cộng,Hình thức,Thu ngân\n';
  S.dt.forEach(d => {
    csv += `"${d.code}","${fmtT(d.t)}","${d.ma}","${d.loai}","${d.ten}","${d.sdt || ''}",${d.tp},${d.pp},${d.thucThu || d.tong},"${d.pm || ''}","${d.u}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Danh_Sach_Hoa_Don_${new Date().toLocaleDateString('en-CA')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Đã xuất file CSV thành công!');
}

function caHTML() {
  const o = S.ca.find(c => c.u === cur.u && c.ra == null);
  return `
    <div class="card" style="margin-bottom:16px">
      <h3>Ca làm việc của bạn (${esc(cur.n)})</h3>
      <p style="font-size:15px">
        ${o ? `🟢 Đang trong ca từ lúc: <b>${fmtT(o.vao)}</b> (Đã làm: <b>${dur(Date.now() - o.vao)}</b>)` : '⚪ Bạn hiện chưa vào ca làm.'}
      </p>
      <button class="bt pr" onclick="toggleCa()">
        ${o ? '🛑 Check-out kết thúc ca làm' : '▶️ Check-in bắt đầu ca làm'}
      </button>
    </div>
    <h3>Lịch sử các ca làm của bạn</h3>
    ${caTable(S.ca.filter(c => c.u === cur.u))}
  `;
}

function nvHTML() {
  return `
    <div class="card" style="margin-bottom:16px">
      <h3>➕ Thêm tài khoản nhân viên mới</h3>
      <div class="fl">
        <label>Tên đăng nhập<input id="nu" placeholder="Ví dụ: nhanvien2"></label>
        <label>Mật khẩu<input id="np" type="password" placeholder="Mật khẩu"></label>
        <label>Họ và tên<input id="nn" placeholder="Ví dụ: Trần Thị B"></label>
      </div>
      <button class="bt pr" onclick="themNV()">Tạo tài khoản</button>
    </div>

    <h3>Danh sách nhân sự khách sạn</h3>
    <div class="tb card">
      <table>
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Họ và tên</th>
            <th>Vai trò</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${S.users.map(u => `
            <tr>
              <td><b>${esc(u.u)}</b></td>
              <td>${esc(u.n)}</td>
              <td><span class="bd ${u.r === 'QL' ? 's0' : 's-info'}">${u.r === 'QL' ? 'Quản lý' : 'Nhân viên'}</span></td>
              <td>
                <button class="bt sm" onclick="doiMatKhauNV('${u.u}')">Đổi MK</button>
                ${u.u !== 'admin' && u.u !== cur.u ? `<button class="bt danger sm" onclick="xoaNV('${u.u}')">Xóa</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function menuTabHTML() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <h3 style="margin:0">🍽️ Quản lý Thực Đơn &amp; Dịch Vụ Khách Sạn</h3>
      <button class="bt pr" onclick="themMon()">➕ Thêm món / dịch vụ mới</button>
    </div>

    <div class="tb card">
      <table>
        <thead>
          <tr>
            <th>Hình ảnh</th>
            <th>Tên món / dịch vụ</th>
            <th>Phân loại</th>
            <th>Đơn giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${S.menu.map(m => `
            <tr>
              <td style="width:60px;padding:6px 10px">
                <div style="width:50px;height:50px;border-radius:10px;overflow:hidden;background:var(--bd);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.12)">
                  <img src="${m.img || ('images/' + m.id + '.jpg')}" onerror="this.src='images/${m.id}.jpg'" alt="" style="width:100%;height:100%;object-fit:cover">
                </div>
              </td>
              <td><b>${esc(m.n)}</b></td>
              <td>${m.cat === 'drink' ? 'Đồ uống' : m.cat === 'food' ? 'Món ăn' : 'Dịch vụ'}</td>
              <td><b>${money(m.p)}</b></td>
              <td>
                <span class="bd ${m.st ? 's0' : 's2'}">${m.st ? 'Còn phục vụ' : 'Tạm hết'}</span>
              </td>
              <td>
                <button class="bt sm" onclick="toggleMon('${m.id}')">${m.st ? 'Khóa' : 'Mở lại'}</button>
                <button class="bt danger sm" onclick="xoaMon('${m.id}')">Xóa</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function settingsTabHTML() {
  const s = S.settings || DEFAULT_SETTINGS;
  return `
    <div class="card" style="margin-bottom:16px;max-width:800px">
      <h3>⚙️ Cài Đặt Thông Tin Khách Sạn &amp; Thanh Toán</h3>
      <div class="fl">
        <label>Tên khách sạn / Resort<input id="st_name" value="${esc(s.hotelName)}"></label>
        <label>Hotline lễ tân<input id="st_hotline" value="${esc(s.hotline)}"></label>
      </div>
      <div class="fl">
        <label>Địa chỉ khách sạn<input id="st_addr" value="${esc(s.hotelAddress)}"></label>
        <label>Email hỗ trợ<input id="st_email" value="${esc(s.email)}"></label>
      </div>

      <h4 style="margin:16px 0 6px;color:var(--gold)">Cấu hình VietQR Chuyển Khoản Tự Động</h4>
      <div class="fl">
        <label>Mã ngân hàng (VietQR)<input id="st_bank" placeholder="MBBANK, VCB, TCB, ACB..." value="${esc(s.bankName)}"></label>
        <label>Số tài khoản thụ hưởng<input id="st_acc" placeholder="Số tài khoản" value="${esc(s.bankAccount)}"></label>
        <label>Tên chủ tài khoản<input id="st_owner" placeholder="NGUYEN VAN A" value="${esc(s.bankOwner)}"></label>
      </div>

      <h4 style="margin:16px 0 6px;color:var(--gold)">📧 Gửi Email Xác Nhận Đặt Phòng (EmailJS)</h4>
      <p class="mut" style="margin:0 0 8px;font-size:13px">
        Tạo tài khoản miễn phí tại <a href="https://www.emailjs.com" target="_blank" rel="noopener">emailjs.com</a> → thêm Email Service (Gmail) → tạo Email Template với biến:
        <code>{{to_email}}</code>, <code>{{to_name}}</code>, <code>{{hotel_name}}</code>, <code>{{room_type}}</code>, <code>{{room_number}}</code>, <code>{{checkin_date}}</code>, <code>{{nights}}</code>, <code>{{hotline}}</code>, <code>{{booking_id}}</code>, <code>{{staff_name}}</code>, <code>{{message}}</code>.
        Ô "To Email" trong template đặt là <code>{{to_email}}</code>.
      </p>
      <div class="fl">
        <label>Service ID<input id="st_ejs_service" placeholder="service_xxxxxxx" value="${esc(s.ejsService || '')}"></label>
        <label>Template ID<input id="st_ejs_template" placeholder="template_xxxxxxx" value="${esc(s.ejsTemplate || '')}"></label>
        <label>Public Key<input id="st_ejs_key" placeholder="xxxxxxxxxxxxxxx" value="${esc(s.ejsKey || '')}"></label>
      </div>
      <p class="mut" style="font-size:12px;margin:0 0 10px">Trạng thái: ${emailConfigured() ? '<b style="color:var(--ok)">✅ Đã cấu hình</b>' : '<b style="color:var(--wn)">⚠ Chưa cấu hình — khi duyệt đơn sẽ mở ứng dụng mail để gửi thủ công</b>'}</p>
      <button class="bt pr" onclick="luuCaiDat()">💾 Lưu Cài Đặt</button>
    </div>

    <div class="card" style="max-width:800px">
      <h3>💾 Sao Lưu &amp; Khôi Phục Dữ Liệu</h3>
      <p class="mut">Tải về toàn bộ cơ sở dữ liệu phòng, hóa đơn, thực đơn để lưu trữ dự phòng hoặc chuyển máy.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="bt" onclick="backupData()">📤 Tải file sao lưu (JSON)</button>
        <label class="bt" style="cursor:pointer;margin:0">
          📥 Khôi phục từ file JSON
          <input type="file" accept=".json" style="display:none" onchange="restoreData(event)">
        </label>
        <button class="bt danger" onclick="resetDataDemo()">⚠ Khôi phục dữ liệu demo gốc</button>
      </div>
    </div>
  `;
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (G) {
    app.innerHTML = guestHTML();
    paintMsgs();
    return;
  }

  if (!cur) {
    app.innerHTML = loginHTML();
    return;
  }

  const unhandledBookings = BK.filter(b => !b.st).length;
  const activeOrders = ORD.filter(o => o.st < 2).length;
  const unreadCount = unreadN();

  const tabs = [
    ['ph', 'Phòng'],
    ['od', 'Gọi món', activeOrders],
    ['bk', 'Đặt online', unhandledBookings],
    ['ch', 'Chat', unreadCount],
    ['mn', 'Thực đơn'],
    ['qr', 'QR phòng']
  ];

  if (cur.r === 'NV') {
    tabs.push(['ca', 'Ca làm']);
  } else {
    tabs.push(['dt', 'Doanh thu'], ['lc', 'Lịch sử ca'], ['nv', 'Nhân viên'], ['st', 'Cài đặt']);
  }

  if (!tabs.some(t => t[0] === tab)) tab = 'ph';

  if (tab !== 'ch' && !G) {
    if (chatTimerInterval) {
      clearInterval(chatTimerInterval);
      chatTimerInterval = null;
    }
  }

  const body =
    tab === 'ph' ? roomsHTML() :
    tab === 'od' ? ordersHTML() :
    tab === 'bk' ? bookingsHTML() :
    tab === 'ch' ? chatTabHTML() :
    tab === 'mn' ? menuTabHTML() :
    tab === 'qr' ? qrHTML() :
    tab === 'ca' ? caHTML() :
    tab === 'dt' ? doanhThuHTML() :
    tab === 'lc' ? '<h3>Lịch sử toàn bộ ca làm việc</h3>' + caTable(S.ca) :
    tab === 'nv' ? nvHTML() : settingsTabHTML();

  const navH = '<nav>' + tabs.map(t =>
    `<button class="${t[0] === tab ? 'on' : ''}" onclick="tab='${t[0]}';render()">
      ${t[1]} ${t[2] ? `<span class="badge-count">${t[2]}</span>` : ''}
    </button>`
  ).join('') + '</nav>';

  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  app.innerHTML = `
    <header>
      <div class="hd">
        ${BRAND}
        ${navH}
        <span class="sp"></span>
        <button class="bt icon-btn sm" onclick="toggleTheme()" title="Chuyển chế độ Sáng / Tối">
          ${currentTheme === 'dark' ? '☀️ Sáng' : '🌙 Tối'}
        </button>
        <span class="mut" style="font-size:13px">
          ${esc(cur.n)} (<b>${cur.r === 'QL' ? 'Quản lý' : 'Nhân viên'}</b>)
        </span>
        ${cur.r === 'NV' ? `<span class="bd ${inCa() ? 's0' : 's1'}">${inCa() ? 'Đang trong ca' : 'Chưa vào ca'}</span>` : ''}
        <button class="bt sm" onclick="logout()">Đăng xuất</button>
      </div>
      ${alertBar()}
    </header>
    ${DB ? '' : '<div style="background:rgba(212,163,67,0.15);padding:6px 18px;font-size:12px;color:var(--tx);text-align:center">💡 Đang chạy chế độ lưu trữ trình duyệt (LocalStorage). Kết nối Firebase ở <code>config.js</code> nếu muốn đồng bộ tức thời giữa nhiều thiết bị.</div>'}
    <main>${body}</main>
  `;

  paintMsgs();
}

/* ==========================================================================
   Gọi Món, Đặt Phòng Online, Chat & Báo Khẩn Cấp
   ========================================================================== */

const BASE = location.href.split('#')[0];
const ST = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đã phục vụ', 'Đã hủy'];
const SC = ['s1', 's3', 's0', 's2'];

const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const unread = r => CHAT.some(m => m.room === r && m.from === 'khach' && m.t > ((S.seen || {})[r] || 0));
const unreadN = () => [...new Set(CHAT.map(m => m.room))].filter(unread).length;

function seen(r) {
  S.seen = S.seen || {};
  S.seen[r] = Date.now();
  save();
}

function readHash() {
  const m = /^#phong-(\d+)$/.exec(location.hash);
  G = m && room(+m[1]) ? +m[1] : null;
}

function refresh() {
  const a = document.activeElement;
  if (a && a.id === 'ci') paintMsgs();
  else render();
}

/* --- Khởi tạo kết nối Firebase và Fallback --- */
async function initDB() {
  try {
    if (window.FIREBASE_CONFIG && window.firebase) {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      DB = firebase.firestore();
    }
  } catch (e) {
    console.warn('Firebase init warning:', e);
    DB = null;
  }

  // Luôn nạp dữ liệu từ localStorage để không bao giờ bị rỗng
  try {
    ORD = JSON.parse(localStorage.getItem('ks_orders') || '[]');
    CHAT = JSON.parse(localStorage.getItem('ks_chat') || '[]');
    ALR = JSON.parse(localStorage.getItem('ks_alerts') || '[]');
    BK = JSON.parse(localStorage.getItem('ks_bookings') || '[]');
  } catch (e) {}

  if (!DB) {
    render();
    return;
  }

  const sub = (col, fn) => {
    try {
      DB.collection(col).onSnapshot(s => {
        const arr = s.docs.map(d => d.data());
        fn(arr);
        refresh();
      }, err => console.warn('Snapshot error:', col, err));
    } catch (e) {
      console.warn('Sub error:', col, e);
    }
  };

  sub('orders', a => { ORD = a; localStorage.setItem('ks_orders', JSON.stringify(a)); });
  sub('bookings', a => { BK = a; localStorage.setItem('ks_bookings', JSON.stringify(a)); });
  sub('chat', a => { CHAT = a; localStorage.setItem('ks_chat', JSON.stringify(a)); resetChatTimer(false); });
  sub('alerts', a => {
    if (alrInit && !G && cur) {
      const old = new Set(ALR.map(x => x.id));
      if (a.some(x => x.st === 0 && !old.has(x.id))) beep();
    }
    alrInit = true;
    ALR = a;
    localStorage.setItem('ks_alerts', JSON.stringify(a));
  });

  render();
}

function put(col, o) {
  // Cập nhật mảng local & localStorage
  const L = col === 'orders' ? ORD : col === 'chat' ? CHAT : col === 'alerts' ? ALR : BK;
  const i = L.findIndex(x => x.id === o.id);
  if (i < 0) L.push(o);
  else L[i] = o;

  try {
    localStorage.setItem('ks_' + col, JSON.stringify(L));
  } catch (e) {}

  // Đẩy lên Firebase nếu có
  if (DB) {
    try {
      DB.collection(col).doc(o.id).set(o).catch(e => {
        console.warn('DB set warning:', e);
      });
    } catch (e) {
      console.warn('DB put catch:', e);
    }
  }

  refresh();
}

/* --- Xử lý Đặt Phòng Online từ Khách Hàng --- */
function bookingsHTML() {
  const L = BK.slice().sort((a, b) => (a.st || 0) - (b.st || 0) || (b.t || 0) - (a.t || 0));
  if (!L.length) return '<p class="mut" style="text-align:center;padding:30px">Chưa có yêu cầu đặt phòng trực tuyến nào từ khách hàng.</p>';

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">Danh sách yêu cầu đặt phòng trực tuyến (${L.length})</h3>
    </div>
    <div class="grid">
      ${L.map(b => `
        <div class="card" style="border-left:4px solid ${b.st ? 'var(--ok)' : 'var(--wn)'}">
          <div class="top">
            <b>${esc(b.ten)}</b>
            <span class="bd ${b.st === 1 ? 's0' : b.st === 2 ? 's2' : 's1'}">
              ${b.st === 1 ? 'Đã xếp phòng' : b.st === 2 ? 'Đã hủy' : 'Mới - Chờ xử lý'}
            </span>
          </div>
          <div class="gi">
            📞 <b><a href="tel:${esc(b.sdt)}">${esc(b.sdt)}</a></b><br>
            ✉️ <b>${esc(b.email || 'Chưa có email')}</b><br>
            ${b.emailStatus ? `<span class="mut">Email: ${b.emailStatus === 'sent' ? '<b style="color:var(--ok)">✅ Đã gửi xác nhận</b>' : b.emailStatus === 'failed' ? '<b style="color:var(--bz)">❌ Gửi thất bại — kiểm tra cấu hình EmailJS</b>' : b.emailStatus === 'sending' || b.emailStatus === 'pending' ? '⏳ Đang gửi xác nhận' : b.emailStatus === 'manual' ? '✉️ Đã mở ứng dụng mail (gửi thủ công)' : b.emailStatus === 'unavailable' ? 'Chưa bật dịch vụ gửi email' : 'Chưa có email'}</span><br>` : ''}
            Loại phòng: <b>${esc(b.loai)}</b><br>
            Nhận phòng: <b>${fmtD(b.ngay)}</b>${b.kieu === 'gio' && b.gioVao ? ' lúc ' + esc(b.gioVao) : ''} (${bkDur(b)})<br>
            ${b.khach ? `Khách: ${esc(b.khach)}<br>` : ''}
            ${b.note ? `📝 Ghi chú: <i>${esc(b.note)}</i><br>` : ''}
            <span class="mut">Gửi lúc: ${fmtT(b.t)}</span>
          </div>
          <div class="act">
            ${!b.st ? `
              <button class="bt pr sm" onclick="xepPhongTuBooking('${b.id}')">Xếp phòng ngay</button>
              <button class="bt sm" onclick="doiBK('${b.id}', 1)">Đã liên hệ</button>
              <button class="bt danger sm" onclick="doiBK('${b.id}', 2)">Hủy</button>
            ` : `${b.assignedRoom ? `<span class="mut">Đã xếp vào <b>Phòng ${b.assignedRoom}</b></span>` : ''}${b.st === 1 && b.email && b.emailStatus !== 'sent' ? ` <button class="bt sm" onclick="guiLaiEmail('${b.id}')">📧 Gửi lại email</button>` : ''}`}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function doiBK(id, st) {
  const b = BK.find(x => x.id === id);
  if (b) {
    const nb = Object.assign({}, b, { st, by: cur.n });
    if (st === 1) {
      nb.approved = true;
      nb.emailStatus = b.email ? 'sending' : 'missing';
    }
    put('bookings', nb);
    toast(st === 1 ? 'Đã duyệt đơn — trạng thái: đã liên hệ' : 'Đã hủy yêu cầu');
    if (st === 1 && b.email) sendBookingConfirmEmail(nb);
  }
}

/* --- Gửi email xác nhận khi lễ tân duyệt đơn --- */
function emailConfigured() {
  const s = S && S.settings || {};
  return !!(s.ejsService && s.ejsTemplate && s.ejsKey);
}

function setBookingEmailStatus(id, emailStatus) {
  const b = BK.find(x => x.id === id);
  if (b) put('bookings', Object.assign({}, b, { emailStatus }));
}

function bookingEmailText(b) {
  const s = S.settings || DEFAULT_SETTINGS;
  return `Kính gửi Quý khách ${b.ten},

${s.hotelName || 'MY HOTEL'} xin xác nhận đơn đặt phòng của Quý khách đã được DUYỆT.

• Mã đơn: ${b.id}
• Loại phòng: ${b.loai || '—'}${b.assignedRoom ? `\n• Số phòng: Phòng ${b.assignedRoom}` : ''}
• Ngày nhận phòng: ${fmtD(b.ngay)} (${b.kieu === 'gio' ? 'lúc ' + (b.gioVao || '—') : 'từ 14:00'})
• Hình thức thuê: ${b.kieu === 'gio' ? 'Theo giờ' : 'Theo ngày'} – ${bkDur(b)}

Khi đến nhận phòng, Quý khách vui lòng mang theo CCCD/Hộ chiếu. Sau khi Check-in, Quý khách có thể quét mã QR trong phòng để gọi món và chat với lễ tân.

Mọi thắc mắc xin liên hệ hotline ${s.hotline || ''}${s.email ? ' hoặc email ' + s.email : ''}.
Địa chỉ: ${s.hotelAddress || ''}

Trân trọng,
${cur ? cur.n : 'Lễ tân'} – ${s.hotelName || 'MY HOTEL'}`;
}

function openMailtoFallback(b) {
  const s = S.settings || DEFAULT_SETTINGS;
  const subject = `[${s.hotelName || 'MY HOTEL'}] Xác nhận đặt phòng ${b.id}`;
  const url = `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bookingEmailText(b))}`;
  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function sendBookingConfirmEmail(b) {
  if (!b || !b.email) return;
  const s = S.settings || DEFAULT_SETTINGS;

  if (!emailConfigured() || typeof emailjs === 'undefined') {
    setBookingEmailStatus(b.id, 'manual');
    toast(`⚠ Chưa cấu hình EmailJS — mở ứng dụng mail để gửi tới ${b.email}`);
    openMailtoFallback(b);
    return;
  }

  emailjs.send(s.ejsService, s.ejsTemplate, {
    to_email: b.email,
    to_name: b.ten,
    hotel_name: s.hotelName,
    room_type: b.loai || '',
    room_number: b.assignedRoom ? `Phòng ${b.assignedRoom}` : 'Sẽ được xếp khi nhận phòng',
    checkin_date: fmtD(b.ngay),
    nights: bkDur(b),
    hotline: s.hotline,
    booking_id: b.id,
    staff_name: cur ? cur.n : 'Lễ tân',
    message: bookingEmailText(b)
  }, { publicKey: s.ejsKey }).then(() => {
    setBookingEmailStatus(b.id, 'sent');
    toast(`📧 Đã gửi email xác nhận tới ${b.email}`);
  }).catch(e => {
    console.warn('EmailJS error:', e);
    setBookingEmailStatus(b.id, 'failed');
    toast('⚠ Gửi email thất bại: ' + ((e && (e.text || e.message)) || 'lỗi không xác định'));
  });
}

function guiLaiEmail(id) {
  const b = BK.find(x => x.id === id);
  if (!b) return;
  if (!b.email) { toast('Đơn này không có email'); return; }
  setBookingEmailStatus(id, 'sending');
  sendBookingConfirmEmail(b);
}

// Thời lượng đặt phòng: theo ngày (đêm) hoặc theo giờ
function bkDur(b) {
  return b.kieu === 'gio' ? `${b.gio || b.dem || 1} giờ` : `${b.dem || 1} đêm`;
}

function xepPhongTuBooking(id) {
  if (!guard()) return;
  const b = BK.find(x => x.id === id);
  if (!b) return;

  // Lọc các phòng trống phù hợp loại phòng
  const emptyRooms = S.rooms.filter(r => r.tt === 0 && (!b.loai || r.loai === b.loai || b.loai.includes(r.loai)));
  const fallbackRooms = S.rooms.filter(r => r.tt === 0);
  const targetList = emptyRooms.length ? emptyRooms : fallbackRooms;

  if (!targetList.length) {
    toast('Hiện không còn phòng trống nào để xếp!');
    return;
  }

  const roomOpts = targetList.map(r =>
    `<option value="${r.ma}">Phòng ${r.ma} (${r.loai} - ${money(r.gn)}/ngày)</option>`
  ).join('');

  modal(
    `Xếp phòng cho khách: ${esc(b.ten)}`,
    `
    <p>SĐT: <b>${esc(b.sdt)}</b> · Loại phòng mong muốn: <b>${esc(b.loai)}</b> · ${bkDur(b)}</p>
    <label>Chọn phòng trống:
      <select id="f_assign_r">
        ${roomOpts}
      </select>
    </label>
    `,
    () => {
      const ma = parseInt(val('f_assign_r'));
      const r = room(ma);
      if (!r || r.tt !== 0) {
        toast('Phòng được chọn không hợp lệ hoặc đã có người');
        return false;
      }
      r.k = {
        ten: b.ten,
        sdt: b.sdt,
        cccd: '',
        ngay: b.ngay || new Date().toLocaleDateString('en-CA'),
        gioVao: b.kieu === 'gio' ? (b.gioVao || '14:00') : '14:00',
        kieu: b.kieu === 'gio' ? 'gio' : 'ngay',
        sl: (b.kieu === 'gio' ? b.gio : b.dem) || 1,
        pp: 0,
        coc: 0,
        note: b.note || '',
        items: []
      };
      r.tt = 1; // Đã đặt trước
      save();

      // Cập nhật booking
      const nb = Object.assign({}, b, {
        st: 1,
        assignedRoom: ma,
        approved: true,
        emailStatus: b.email ? 'sending' : 'missing',
        by: cur.n
      });
      put('bookings', nb);
      render();
      toast(`Đã xếp khách ${b.ten} vào Phòng ${ma} thành công!`);
      if (b.email) sendBookingConfirmEmail(nb);
    },
    'Xác nhận xếp phòng'
  );
}

/* --- Xử lý Đơn Gọi Món --- */
function doiDon(id, st) {
  if (!guard()) return;
  const o = ORD.find(x => x.id === id);
  if (!o) return;

  const r = room(o.room);
  const ok = st === 2 && !o.charged && r && r.tt === 2;

  if (ok) {
    r.k.pp += o.tot;
    r.k.items = r.k.items || [];
    o.items.forEach(it => {
      r.k.items.push({ name: `${it.q} × ${it.n}`, price: it.q * it.p, time: Date.now() });
    });
    save();
  }

  put('orders', Object.assign({}, o, { st, by: cur.u, charged: !!(ok || o.charged) }));

  if (st === 2) {
    toast(ok ? `Đã phục vụ và cộng ${money(o.tot)} vào phụ phí phòng ${o.room}` : 'Đã phục vụ (phòng chưa có khách ở để tính phụ phí)');
  } else {
    toast('Đã cập nhật trạng thái đơn gọi món');
  }
}

function ordersHTML() {
  const L = ORD.slice().sort((a, b) => a.st - b.st || (b.t || 0) - (a.t || 0));
  if (!L.length) return '<p class="mut" style="text-align:center;padding:30px">Chưa có đơn gọi món ăn / đồ uống nào.</p>';

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">Đơn gọi món từ khách phòng (${L.length})</h3>
    </div>
    <div class="grid">
      ${L.map(o => `
        <div class="card" style="border-left:4px solid ${o.st === 2 ? 'var(--ok)' : o.st === 1 ? 'var(--info)' : 'var(--wn)'}">
          <div class="top">
            <b>Phòng ${o.room}</b>
            <span class="bd ${SC[o.st]}">${ST[o.st]}</span>
          </div>
          <div class="mut">${fmtT(o.t)}</div>
          <div class="gi">
            ${o.items.map(i => `<b>${i.q}</b> × ${esc(i.n)} (${money(i.p)})`).join('<br>')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span>Tổng tiền:</span>
            <b style="color:var(--gold);font-size:16px">${money(o.tot)}</b>
          </div>
          <div class="act">
            ${o.st === 0 ? `<button class="bt pr sm" onclick="doiDon('${o.id}', 1)">Nhận chế biến</button>` : ''}
            ${o.st === 1 ? `<button class="bt success sm" onclick="doiDon('${o.id}', 2)">✓ Đã giao món</button>` : ''}
            <button class="bt sm" onclick="tab='ch';C=${o.room};render()">Chat với phòng</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* --- Xử lý Tin Nhắn Chat --- */
function msgsHTML(r) {
  const me = G ? 'khach' : 'nv';
  const L = CHAT.filter(m => m.room === r).sort((a, b) => a.t - b.t);
  if (!L.length) return '<span class="mut" style="text-align:center;display:block;padding:20px">Chưa có tin nhắn nào. Gửi lời chào để bắt đầu hội thoại!</span>';

  return L.map(m => `
    <div class="bub ${m.from === me ? 'me' : ''}">
      <small>${esc(m.name)} · ${new Date(m.t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
      ${esc(m.text)}
    </div>
  `).join('');
}

function paintMsgs() {
  const e = document.getElementById('msgs');
  if (e) {
    e.innerHTML = msgsHTML(G || C);
    e.scrollTop = e.scrollHeight;
  }
}

function quickReply(text) {
  const el = document.getElementById('ci');
  if (el) {
    el.value = text;
    el.focus();
  }
  onChatUserActive();
}

function onChatUserActive() {
  chatIdleSeconds = 0;
  chatClosed = false;
  const noticeEl = document.getElementById('chat_timer_notice');
  if (noticeEl) {
    noticeEl.style.display = 'none';
    noticeEl.classList.remove('urgent');
  }
  if (!chatTimerInterval) {
    ensureChatTimer(G || C, G ? 'khach' : 'nv');
  }
}

function resetChatTimer(showConfirmation = true) {
  onChatUserActive();
  if (showConfirmation) toast('Đã gia hạn phiên chat thêm 1 phút!');
}

function ensureChatTimer(roomNum, who) {
  if (chatTimerInterval) return;
  chatTimerInterval = setInterval(() => {
    chatIdleSeconds++;
    const noticeEl = document.getElementById('chat_timer_notice');
    const countEl = document.getElementById('chat_countdown');

    // Sau 5 giây KHÔNG CÓ TƯƠNG TÁC thì mới bắt đầu HIỆN THÔNG BÁO
    if (chatIdleSeconds >= IDLE_WARN_SECONDS) {
      if (noticeEl) noticeEl.style.display = 'flex';
      const remaining = Math.max(0, CHAT_TOTAL_TIMEOUT_SECONDS - chatIdleSeconds);
      if (countEl) countEl.textContent = remaining;
      if (noticeEl) {
        if (remaining <= 15) noticeEl.classList.add('urgent');
        else noticeEl.classList.remove('urgent');
      }

      if (remaining <= 0) {
        clearInterval(chatTimerInterval);
        chatTimerInterval = null;
        chatClosed = true;
        toast('Cửa sổ chat đã tự động đóng sau 1 phút không có hoạt động.');
        render();
      }
    } else {
      // Dưới 5 giây: ẩn thông báo hoàn toàn
      if (noticeEl) noticeEl.style.display = 'none';
    }
  }, 1000);
}

function reopenChat(roomNum, who) {
  chatClosed = false;
  chatIdleSeconds = 0;
  render();
  onChatUserActive();
  toast('Đã mở lại cửa sổ chat!');
}

function chatBox(roomNum, who) {
  const isKhach = who === 'khach';

  if (chatClosed) {
    return `
      <h3 style="margin-top:16px">💬 Hội thoại ${isKhach ? 'với Lễ tân khách sạn' : `với Khách phòng ${roomNum}`}</h3>
      <div class="chat-closed-box">
        <div style="font-size:36px;margin-bottom:8px">🔒</div>
        <b style="font-size:16px;color:var(--gold)">Cửa sổ chat đã tự động đóng</b>
        <p class="mut" style="margin:8px auto 16px;max-width:380px;line-height:1.5">
          Cửa sổ trò chuyện đã tạm đóng vì không có tin nhắn mới hoặc hoạt động chat trong 1 phút vừa qua.
        </p>
        <button class="bt pr" onclick="reopenChat(${roomNum}, '${who}')">💬 Mở lại cửa sổ chat</button>
      </div>
    `;
  }

  ensureChatTimer(roomNum, who);

  return `
    <h3 style="margin-top:16px">💬 Hội thoại ${isKhach ? 'với Lễ tân khách sạn' : `với Khách phòng ${roomNum}`}</h3>
    <div class="card">
      <!-- Thông báo đếm ngược: ẨN MẶC ĐỊNH, CHỈ HIỆN KHI KHÔNG TƯƠNG TÁC KHOẢNG 5 GIÂY -->
      <div class="chat-timer-notice" id="chat_timer_notice" style="display:none">
        <div style="display:flex;align-items:center;gap:8px">
          <span>⏳</span>
          <span>Không có tương tác. Cửa sổ chat sẽ tự động đóng sau <b id="chat_countdown">60</b>s.</span>
        </div>
        <button class="bt sm" type="button" onclick="resetChatTimer()" style="padding:2px 8px;font-size:12px">Gia hạn 1p</button>
      </div>

      <div id="msgs" class="msgs" onscroll="onChatUserActive()" onclick="onChatUserActive()"></div>

      <!-- Câu trả lời nhanh -->
      <div class="chat-quick">
        ${isKhach ? `
          <button onclick="quickReply('Lễ tân ơi, cho mình hỏi?')">Lễ tân ơi?</button>
          <button onclick="quickReply('Cho mình xin thêm nước suối và khăn tắm với!')">Xin thêm đồ</button>
          <button onclick="quickReply('Món mình gọi bao lâu nữa có ạ?')">Kiểm tra món</button>
          <button onclick="quickReply('Cảm ơn lễ tân nhiều nhé!')">Cảm ơn</button>
        ` : `
          <button onclick="quickReply('Dạ MY HOTEL xin nghe, em có thể hỗ trợ gì cho quý khách ạ?')">Chào hỏi</button>
          <button onclick="quickReply('Dạ món của quý khách đang được bếp chế biến và sẽ mang lên trong 10-15 phút ạ!')">Báo thời gian món</button>
          <button onclick="quickReply('Dạ nhân viên buồng phòng đang mang đồ lên ngay cho quý khách ạ!')">Báo buồng phòng</button>
          <button onclick="quickReply('Dạ vâng, cảm ơn quý khách. Chúc quý khách kỳ nghỉ tuyệt vời!')">Chúc kỳ nghỉ</button>
        `}
      </div>

      <div class="fl" style="margin:6px 0 0;flex-wrap:nowrap;gap:8px">
        <input id="ci" placeholder="Nhập tin nhắn..." oninput="onChatUserActive()" onkeydown="onChatUserActive();if(event.key==='Enter')guiChat('${who}', ${roomNum})">
        <button class="bt pr" onclick="guiChat('${who}', ${roomNum})">Gửi</button>
      </div>
    </div>
  `;
}

function guiChat(who, roomNum) {
  const text = val('ci');
  if (!text) return;
  onChatUserActive();
  put('chat', {
    id: newId('c'),
    room: roomNum,
    from: who,
    name: who === 'nv' ? (cur ? cur.n : 'Lễ tân') : `Khách P.${roomNum}`,
    text,
    t: Date.now()
  });
  const el = document.getElementById('ci');
  if (el) el.value = '';
}

function chatTabHTML() {
  const rs = [...new Set(CHAT.map(m => m.room))].sort((a, b) => a - b);
  if (C) seen(C);

  return `
    <div style="margin-bottom:12px">
      <h3>Chọn phòng để hội thoại:</h3>
      <div class="fl" style="gap:8px">
        ${rs.length ? rs.map(r => `
          <button class="bt ${C === r ? 'pr' : ''}" onclick="C=${r};chatClosed=false;resetChatTimer(false);render()">
            Phòng ${r} ${unread(r) && C !== r ? '<span class="badge-count">Mới</span>' : ''}
          </button>
        `).join('') : '<span class="mut">Chưa có tin nhắn nào từ khách hàng các phòng.</span>'}
      </div>
    </div>
    ${C ? chatBox(C, 'nv') : '<p class="mut" style="text-align:center;padding:20px">Vui lòng bấm chọn một phòng ở trên để mở khung chat.</p>'}
  `;
}

/* --- QR Code Trang Quản Trị --- */
function qrSvg(url) {
  if (typeof qrcode !== 'function') return '<p class="mut">Không tải được thư viện QR</p>';
  try {
    const q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch (e) {
    return '<p class="mut">Lỗi tạo QR</p>';
  }
}

function qrHTML() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div>
        <h3 style="margin:0">Mã QR Gọi Món &amp; Tiện Ích Phòng</h3>
        <p class="mut" style="margin:4px 0 0">In và dán mã QR trong từng phòng. Khách quét mã để gọi món, chat và báo khẩn cấp.</p>
      </div>
      <button class="bt pr" onclick="window.print()">🖨️ In tất cả mã QR</button>
    </div>
    <div class="grid">
      ${S.rooms.map(r => `
        <div class="card" style="text-align:center">
          <b style="font-size:16px;color:var(--gold)">PHÒNG ${r.ma} (${r.loai})</b>
          <div style="background:#fff;padding:8px;border-radius:10px;margin:10px auto;max-width:180px">
            ${qrSvg(BASE + '#phong-' + r.ma)}
          </div>
          <a href="#phong-${r.ma}" target="_blank" class="bt sm" style="width:100%">Mở thử trang khách</a>
        </div>
      `).join('')}
    </div>
  `;
}

/* --- Báo Khẩn Cấp (SOS) --- */
function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const o = c.createOscillator();
    o.frequency.value = 880;
    o.connect(c.destination);
    o.start();
    setTimeout(() => { o.stop(); c.close(); }, 800);
  } catch (e) {}
}

function baoKC() {
  if (ALR.some(a => a.room === G && a.st < 2 && Date.now() - a.t < 60000)) {
    toast('Bạn vừa gửi báo động khẩn cấp! Nhân viên đang khẩn trương có mặt.');
    return;
  }
  modal(
    `🚨 BÁO ĐỘNG KHẨN CẤP - PHÒNG ${G}`,
    `
    <label>Tình huống khẩn cấp
      <select id="f_sos_type">
        <option>Cấp cứu y tế / Sức khỏe</option>
        <option>Hỏa hoạn / Khói cháy</option>
        <option>An ninh / Có người lạ đột nhập</option>
        <option>Sự cố điện nước / Nguy hiểm</option>
        <option>Cần hỗ trợ lễ tân gấp</option>
      </select>
    </label>
    <label>Mô tả tình hình (không bắt buộc) 
      <input id="f_sos_note" placeholder="Chi tiết sự việc...">
    </label>
    <div style="background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;font-size:13px;margin-top:10px">
      ⚠ Trường hợp đe dọa trực tiếp tính mạng: Vui lòng gọi ngay <b>115</b> (Cấp cứu), <b>114</b> (Cứu hỏa), <b>113</b> (Công an).
    </div>
    `,
    () => {
      put('alerts', {
        id: newId('a'),
        room: G,
        type: val('f_sos_type'),
        note: val('f_sos_note'),
        t: Date.now(),
        st: 0,
        by: ''
      });
      toast('ĐÃ GỬI BÁO ĐỘNG KHẨN CẤP! Nhân viên đang đến ngay!');
    },
    'GỬI BÁO ĐỘNG NGAY'
  );
}

function doiAlert(id, st) {
  const a = ALR.find(x => x.id === id);
  if (!a) return;
  put('alerts', Object.assign({}, a, { st, by: (st === 1 || !a.by) ? cur.n : a.by }));
  toast(st === 1 ? 'Đã tiếp nhận báo động khẩn cấp' : 'Đã xử lý xong sự cố');
}

function alertBar() {
  const L = ALR.filter(a => a.st < 2).sort((a, b) => a.t - b.t);
  document.title = (L.length ? '🚨 (' + L.length + ') ' : '') + 'MY HOTEL';
  if (!L.length) return '';

  return `
    <div class="alr">
      ${L.map(a => `
        <div class="ar">
          <div>
            <b>🚨 KHẨN CẤP – PHÒNG ${a.room}</b>: ${esc(a.type)} ${a.note ? '· ' + esc(a.note) : ''}<br>
            <small>${fmtT(a.t)} · ${a.st === 1 ? 'Đã tiếp nhận bởi: ' + esc(a.by) : 'Đang chờ xử lý gấp!'}</small>
          </div>
          <div class="act" style="margin:0">
            ${a.st === 0 ? `<button class="bt sm" style="background:#fff;color:#000" onclick="doiAlert('${a.id}', 1)">Tiếp nhận</button>` : ''}
            <button class="bt success sm" onclick="doiAlert('${a.id}', 2)">✓ Đã xử lý xong</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function guestAlerts() {
  const L = ALR.filter(a => a.room === G && a.st < 2);
  if (!L.length) return '';
  return `
    <div class="card" style="margin-bottom:14px;border-color:var(--bz);background:color-mix(in srgb, var(--bz) 8%, transparent)">
      ${L.map(a => `
        🚨 <b>${esc(a.type)}</b> (${fmtT(a.t)}):
        ${a.st === 1 ? '<b style="color:var(--ok)">Nhân viên đã tiếp nhận và đang đến</b>' : '<span style="color:var(--bz)">Đã phát tín hiệu đến toàn bộ lễ tân...</span>'}
      `).join('<br>')}
    </div>
  `;
}

/* ==========================================================================
   Giao Diện Dành Riêng Cho Khách Hàng Quét Mã QR Phòng (#phong-X)
   ========================================================================== */

function qty(id, d) {
  cart[id] = Math.max(0, (cart[id] || 0) + d);
  render();
}

function guiDon() {
  const activeItems = S.menu.filter(m => (cart[m.id] || 0) > 0).map(m => ({
    n: m.n,
    q: cart[m.id],
    p: m.p
  }));

  if (!activeItems.length) {
    toast('Vui lòng bấm chọn số lượng món bạn muốn gọi!');
    return;
  }

  const tot = activeItems.reduce((t, i) => t + i.q * i.p, 0);

  put('orders', {
    id: newId('o'),
    room: G,
    items: activeItems,
    tot,
    t: Date.now(),
    st: 0
  });

  cart = {};
  toast('Đã gửi đơn gọi món thành công! Bếp sẽ chuẩn bị ngay cho bạn.');
  render();
}

function ordList(L) {
  if (!L.length) return '<p class="mut" style="text-align:center;padding:14px">Bạn chưa có đơn gọi món nào.</p>';
  return L.map(o => `
    <div class="card" style="margin-bottom:10px">
      <div class="top">
        <span class="mut">${fmtT(o.t)}</span>
        <span class="bd ${SC[o.st]}">${ST[o.st]}</span>
      </div>
      <div class="gi">
        ${o.items.map(i => `${i.q} × ${esc(i.n)}`).join(', ')}
      </div>
      <div style="text-align:right">
        Tổng tiền: <b style="color:var(--gold);font-size:16px">${money(o.tot)}</b>
      </div>
    </div>
  `).join('');
}

function guestInactiveQRHTML(currentRoom) {
  const s = S.settings || DEFAULT_SETTINGS;
  const statusName = currentRoom ? TT[currentRoom.tt] : 'Chưa xác định';
  const statusClass = currentRoom ? TT_CLASS[currentRoom.tt] : 's1';

  return `
    <header>
      <div class="hd">
        ${BRAND}
        <span class="sp"></span>
        <span class="bd ${statusClass}" style="font-size:13px;padding:4px 12px">
          Phòng ${G} (${statusName})
        </span>
        <button class="bt icon-btn sm" onclick="toggleTheme()" title="Sáng / Tối">🌓</button>
      </div>
    </header>

    <main style="max-width:540px;margin:32px auto;text-align:center">
      <div class="card" style="padding:36px 24px;border-top:4px solid var(--wn);box-shadow:var(--shadow)">
        <div style="width:72px;height:72px;margin:0 auto 16px;border-radius:50%;background:rgba(234,179,8,0.15);display:flex;align-items:center;justify-content:center;font-size:36px">
          🔒
        </div>
        <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 10px;color:var(--tx)">
          MÃ QR PHÒNG ${G} CHƯA KÍCH HOẠT
        </h2>
        <p class="mut" style="font-size:15px;line-height:1.6;margin:0 auto 20px;max-width:440px">
          Dịch vụ gọi món tại phòng, chat lễ tân và tiện ích qua mã QR chỉ có hiệu lực sau khi quý khách đã hoàn tất thủ tục <b>Check-in (nhận phòng)</b> tại quầy lễ tân.
        </p>

        <div style="background:color-mix(in srgb, var(--bd) 35%, transparent);border-radius:12px;padding:16px;text-align:left;margin-bottom:24px;font-size:14px;line-height:1.7">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="mut">Số phòng:</span>
            <b>Phòng ${G} (${currentRoom ? currentRoom.loai : ''})</b>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="mut">Trạng thái phòng:</span>
            <span class="bd ${statusClass}">${statusName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="mut">Hotline Lễ tân:</span>
            <b><a href="tel:${esc(s.hotline)}" style="color:var(--gold)">${esc(s.hotline || '0900 000 000')}</a></b>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span class="mut">Giờ nhận phòng tiêu chuẩn:</span>
            <span>14:00 · Phục vụ 24/7</span>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="bt pr" onclick="location.reload()">🔄 Kiểm tra lại trạng thái</button>
          <a href="index.html" class="bt">🏨 Về trang chủ</a>
          <a href="quantri.html" class="bt sm" style="opacity:0.8">🔑 Đăng nhập Lễ tân</a>
        </div>
      </div>
    </main>
  `;
}

function guestHTML() {
  const currentRoom = room(G);

  // Chỉ khi phòng đã Check-in (tt === 2: Đang ở) thì quét QR mới có hiệu lực
  if (!DEMO_MODE && (!currentRoom || currentRoom.tt !== 2)) {
    return guestInactiveQRHTML(currentRoom);
  }

  const tot = S.menu.reduce((t, m) => t + (cart[m.id] || 0) * m.p, 0);

  return `
    <header>
      <div class="hd">
        ${BRAND}
        <span class="sp"></span>
        <span class="bd ${DEMO_MODE ? 's1' : 's0'}" style="font-size:14px;padding:4px 12px">
          ${DEMO_MODE ? 'THỬ NGHIỆM · ' : ''}Phòng ${G} (${currentRoom ? currentRoom.loai : ''})
        </span>
        <button class="bt icon-btn sm" onclick="toggleTheme()" title="Sáng / Tối">🌓</button>
      </div>
    </header>

    <main>
      ${DEMO_MODE ? '<div class="card" style="margin-bottom:14px;text-align:center;border-color:var(--wn)">🧪 Chế độ thử nghiệm QR — bỏ qua trạng thái check-in.</div>' : ''}
      <button class="sos" onclick="baoKC()">🚨 BÁO ĐỘNG KHẨN CẤP / CẦN TRỢ GIÚP</button>
      ${guestAlerts()}

      <div class="card">
        <div class="top" style="margin-bottom:12px">
          <div>
            <h3 style="margin:0">🍽️ Thực Đơn Ăn Uống Tại Phòng</h3>
            <span class="mut">Món ăn và thức uống sẽ được nhân viên mang đến tận phòng và tự động cộng vào hóa đơn trả phòng</span>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          ${S.menu.filter(m => m.st && m.cat !== 'serv').map(m => `
            <div class="top" style="padding:10px 0;border-bottom:1px solid var(--bd);gap:14px;align-items:center">
              <span class="ph" style="width:72px;height:72px;border-radius:12px;overflow:hidden;flex:none;box-shadow:0 3px 10px rgba(0,0,0,0.12)">
                <img src="${m.img || ('images/' + m.id + '.jpg')}" onerror="this.src='images/${m.id}.jpg'" alt="" style="width:100%;height:100%;object-fit:cover">
              </span>
              <div style="flex:1">
                <b style="font-size:15px">${esc(m.n)}</b><br>
                <span style="color:var(--gold);font-weight:700;font-size:15px">${money(m.p)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <button class="bt sm" style="width:34px;height:34px;padding:0;font-size:18px" onclick="qty('${m.id}', -1)">−</button>
                <b style="min-width:26px;text-align:center;font-size:16px">${cart[m.id] || 0}</b>
                <button class="bt sm" style="width:34px;height:34px;padding:0;font-size:18px" onclick="qty('${m.id}', 1)">+</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="top" style="margin-top:16px;padding-top:12px;border-top:2px solid var(--bd)">
          <div>
            <span class="mut">Tạm tính giỏ hàng:</span><br>
            <b style="font-size:20px;color:var(--gold)">${money(tot)}</b>
          </div>
          <button class="bt pr" style="padding:10px 20px" onclick="guiDon()">Gửi Đơn Lên Lễ Tân</button>
        </div>
      </div>

      <h3 style="margin-top:22px">📋 Đơn đã gọi của phòng bạn</h3>
      ${ordList(ORD.filter(o => o.room === G).sort((a, b) => b.t - a.t))}

      ${chatBox(G, 'khach')}
    </main>
  `;
}

/* --- Lắng nghe sự kiện --- */
window.addEventListener('hashchange', () => {
  chatClosed = false;
  resetChatTimer(false);
  readHash();
  render();
});

// Lắng nghe thay đổi Storage từ tab khác (như index.html hoặc tab lễ tân)
window.addEventListener('storage', e => {
  if (e.key === K || e.key === 'ks_web_v1') {
    load();
    refresh();
  }
  if (e.key === 'ks_bookings') {
    try {
      BK = JSON.parse(e.newValue || '[]');
      refresh();
    } catch (err) {}
  }
  if (e.key === 'ks_orders') {
    try {
      ORD = JSON.parse(e.newValue || '[]');
      refresh();
    } catch (err) {}
  }
  if (e.key === 'ks_chat') {
    try {
      CHAT = JSON.parse(e.newValue || '[]');
      onChatUserActive();
      refresh();
    } catch (err) {}
  }
  if (e.key === 'ks_alerts') {
    try {
      ALR = JSON.parse(e.newValue || '[]');
      refresh();
    } catch (err) {}
  }
});

// Khởi chạy
initTheme();
load();
readHash();
render();
initDB();
