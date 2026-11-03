const K='ks_web_v1',TT=['Trống','Đã đặt','Đang ở'];
let S,cur=null,tab='ph';
const F={tt:'',loai:'',gia:'',sx:'ma'},R={m:'all',v:''};
const dlg=document.getElementById('dlg');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>Math.round(n).toLocaleString('vi-VN')+' ₫';
const fmtD=i=>i.split('-').reverse().join('/');
const fmtT=t=>new Date(t).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'});
const dur=ms=>Math.floor(ms/3600000)+'h'+String(Math.floor(ms%3600000/60000)).padStart(2,'0')+'p';
const room=m=>S.rooms.find(r=>r.ma===m);
const inCa=()=>S.ca.some(c=>c.u===cur.u&&c.ra==null);
function load(){
  try{S=JSON.parse(localStorage.getItem(K))}catch(e){S=null}
  if(!S||!S.rooms){
    S={rooms:[],users:[{u:'admin',p:'admin123',r:'QL',n:'Quản lý'},{u:'nhanvien1',p:'123456',r:'NV',n:'Nhân viên 1'}],ca:[],dt:[]};
    for(let i=1;i<=25;i++){const v=i>15;S.rooms.push({ma:i,loai:v?'VIP':'Thường',gn:v?600000:300000,gg:v?120000:60000,tt:0,k:null})}
  }
  try{const u=sessionStorage.getItem('ks_cur');if(u)cur=S.users.find(x=>x.u===u)||null}catch(e){}
}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',2800)}
function modal(t,body,ok,txt){
  dlg.innerHTML='<h3>'+t+'</h3><div>'+body+'</div><div class="row"><button class="bt" onclick="dlg.close()">Hủy</button><button class="bt pr" id="okb">'+(txt||'Xác nhận')+'</button></div>';
  document.getElementById('okb').onclick=()=>{if(ok()!==false)dlg.close()};
  dlg.showModal();
}
const val=id=>document.getElementById(id).value.trim();
function guard(){if(cur.r==='NV'&&!inCa()){toast('Bạn phải check-in ca làm trước');return false}return true}

/* ---------- đăng nhập ---------- */
function login(){
  const u=val('lu'),p=document.getElementById('lp').value,a=S.users.find(x=>x.u===u&&x.p===p);
  if(!a){document.getElementById('le').textContent='Sai tên đăng nhập hoặc mật khẩu!';return}
  cur=a;tab=a.r==='QL'?'ph':'ph';try{sessionStorage.setItem('ks_cur',a.u)}catch(e){}
  render();
}
function doLogout(){cur=null;try{sessionStorage.removeItem('ks_cur')}catch(e){}render()}
function logout(){
  if(cur.r==='NV'&&inCa())
    modal('Đăng xuất','<p>Bạn chưa check-out ca làm. Check-out ca và đăng xuất?</p>',()=>{const o=S.ca.find(c=>c.u===cur.u&&c.ra==null);o.ra=Date.now();save();doLogout()},'Check-out & đăng xuất');
  else doLogout();
}

/* ---------- nghiệp vụ phòng ---------- */
function datPhong(ma){
  if(!guard())return;
  modal('Đặt phòng '+ma,
   '<label>Tên khách<input id="f1"></label><label>Số điện thoại<input id="f2"></label><label>Ngày nhận phòng<input id="f3" type="date" value="'+new Date().toLocaleDateString('en-CA')+'"></label><label>Tính tiền theo<select id="f4"><option value="ngay">Ngày</option><option value="gio">Giờ</option></select></label><label>Số ngày/giờ dự kiến<input id="f5" type="number" min="1" value="1"></label>',
   ()=>{
    const ten=val('f1'),sdt=val('f2'),ngay=val('f3'),sl=parseInt(val('f5'));
    if(!ten||!sdt||!ngay||!(sl>0)){toast('Vui lòng nhập đủ và hợp lệ');return false}
    const r=room(ma);r.k={ten,sdt,ngay,kieu:val('f4'),sl,pp:0};r.tt=1;save();render();toast('Đặt phòng '+ma+' thành công');
   });
}
function checkIn(ma){if(!guard())return;const r=room(ma);r.tt=2;save();render();toast('Check-in phòng '+ma+' thành công')}
function dichVu(ma){
  if(!guard())return;
  modal('Thêm dịch vụ phòng '+ma,'<label>Tiền dịch vụ (ăn uống, giặt ủi…)<input id="f1" type="number" min="0" value="0"></label>',()=>{
    const t=parseFloat(val('f1'));if(!(t>=0)){toast('Số tiền không hợp lệ');return false}
    const r=room(ma);r.k.pp+=t;save();render();toast('Tổng phụ phí: '+money(r.k.pp));
  });
}
function checkOut(ma){
  if(!guard())return;
  const r=room(ma),k=r.k,dv=k.kieu==='ngay'?'ngày':'giờ',dg=k.kieu==='ngay'?r.gn:r.gg;
  window._c=()=>{const n=parseInt(document.getElementById('sl').value)||0,tp=n*dg;
    document.getElementById('hd').innerHTML='Tiền phòng: '+n+' '+dv+' × '+money(dg)+' = '+money(tp)+'<br>Phụ phí: '+money(k.pp)+'<br><b>Tổng cộng: '+money(tp+k.pp)+'</b>'};
  modal('Check-out phòng '+ma,'<p>'+esc(k.ten)+' · '+esc(k.sdt)+'<br><span class="mut">Nhận phòng: '+fmtD(k.ngay)+'</span></p><label>Số '+dv+' thực tế đã ở<input id="sl" type="number" min="1" value="'+k.sl+'" oninput="_c()"></label><div class="inv" id="hd"></div>',()=>{
    const n=parseInt(val('sl'));if(!(n>0)){toast('Số lượng không hợp lệ');return false}
    const tp=n*dg;
    S.dt.push({t:Date.now(),ma,loai:r.loai,ten:k.ten,tp,pp:k.pp,tong:tp+k.pp,u:cur.u});
    r.tt=0;r.k=null;save();render();toast('Check-out thành công. Phòng '+ma+' đã trống');
  },'Thanh toán');
  _c();
}

/* ---------- ca làm ---------- */
function toggleCa(){
  const o=S.ca.find(c=>c.u===cur.u&&c.ra==null);
  if(o){o.ra=Date.now();toast('Đã check-out ca. Thời gian làm: '+dur(o.ra-o.vao))}
  else{S.ca.push({u:cur.u,vao:Date.now(),ra:null});toast('Đã check-in ca làm')}
  save();render();
}
function caTable(list){
  if(!list.length)return '<p class="mut">Chưa có ca làm nào.</p>';
  return '<div class="tb card"><table><tr><th>Tài khoản</th><th>Vào ca</th><th>Ra ca</th><th>Thời gian</th></tr>'+
   list.slice().sort((a,b)=>b.vao-a.vao).map(c=>'<tr><td>'+esc(c.u)+'</td><td>'+fmtT(c.vao)+'</td><td>'+(c.ra?fmtT(c.ra):'—')+'</td><td>'+(c.ra?dur(c.ra-c.vao):'đang làm')+'</td></tr>').join('')+'</table></div>';
}

/* ---------- quản lý nhân viên ---------- */
function themNV(){
  const u=val('nu'),p=val('np'),n=val('nn');
  if(!u||!p||!n){toast('Nhập đủ thông tin');return}
  if(S.users.some(x=>x.u===u)){toast('Tên đăng nhập đã tồn tại');return}
  S.users.push({u,p,r:'NV',n});save();render();toast('Đã tạo tài khoản '+u);
}

/* ---------- giao diện ---------- */
function loginHTML(){
  return '<div class="login card"><h3>🏨 Quản lý khách sạn</h3><p class="mut">Đăng nhập để tiếp tục</p><label>Tên đăng nhập<input id="lu" autocomplete="username"></label><label>Mật khẩu<input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')login()"></label><div class="err" id="le"></div><button class="bt pr" style="width:100%" onclick="login()">Đăng nhập</button><p class="mut" style="margin-top:14px">Tài khoản mẫu:<br>Quản lý: admin / admin123<br>Nhân viên: nhanvien1 / 123456</p></div>';
}
function roomsHTML(){
  const L=S.rooms.filter(r=>(F.tt===''||r.tt==F.tt)&&(!F.loai||r.loai===F.loai)&&(!F.gia||r.gn<=+F.gia));
  const key=r=>r.tt?r.k.ngay:'9999';
  if(F.sx==='gia')L.sort((a,b)=>a.gn-b.gn||a.ma-b.ma);
  else if(F.sx==='ngay')L.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:a.ma-b.ma);
  const opt=(v,t,c)=>'<option value="'+v+'"'+(c==v?' selected':'')+'>'+t+'</option>';
  const f='<div class="fl"><label>Trạng thái<select onchange="F.tt=this.value;render()">'+opt('','Tất cả',F.tt)+opt(0,'Trống',F.tt)+opt(1,'Đã đặt',F.tt)+opt(2,'Đang ở',F.tt)+'</select></label>'+
   '<label>Loại phòng<select onchange="F.loai=this.value;render()">'+opt('','Tất cả',F.loai)+opt('Thường','Thường',F.loai)+opt('VIP','VIP',F.loai)+'</select></label>'+
   '<label>Giá tối đa/ngày<input type="number" min="0" step="50000" value="'+F.gia+'" onchange="F.gia=this.value;render()" placeholder="VND"></label>'+
   '<label>Sắp xếp<select onchange="F.sx=this.value;render()">'+opt('ma','Theo mã phòng',F.sx)+opt('gia','Theo giá',F.sx)+opt('ngay','Theo ngày nhận',F.sx)+'</select></label></div>';
  if(!L.length)return f+'<p class="mut">Không có phòng phù hợp.</p>';
  return f+'<div class="grid">'+L.map(r=>{
    const k=r.k,b=r.tt===0?'<button class="bt pr sm" onclick="datPhong('+r.ma+')">Đặt phòng</button>':r.tt===1?'<button class="bt pr sm" onclick="checkIn('+r.ma+')">Check-in</button>':'<button class="bt sm" onclick="dichVu('+r.ma+')">+ Dịch vụ</button><button class="bt pr sm" onclick="checkOut('+r.ma+')">Check-out</button>';
    return '<div class="card"><div class="top"><b>Phòng '+r.ma+'</b><span class="bd s'+r.tt+'">'+TT[r.tt]+'</span></div><div class="mut">'+r.loai+' · '+money(r.gn)+'/ngày · '+money(r.gg)+'/giờ</div>'+
     (k?'<div class="gi">👤 '+esc(k.ten)+' · '+esc(k.sdt)+'<br>Nhận: '+fmtD(k.ngay)+' · '+k.sl+' '+(k.kieu==='ngay'?'ngày':'giờ')+(k.pp?'<br>Phụ phí: '+money(k.pp):'')+'</div>':'')+
     '<div class="act">'+b+'</div></div>';
  }).join('')+'</div>';
}
function doanhThuHTML(){
  const inp=R.m==='day'?'type="date"':R.m==='month'?'type="month"':'type="number" min="2000"';
  const L=S.dt.filter(d=>{const s=new Date(d.t).toLocaleDateString('en-CA');
    return R.m==='all'||!R.v||(R.m==='day'?s===R.v:R.m==='month'?s.slice(0,7)===R.v:s.slice(0,4)===R.v)}).sort((a,b)=>b.t-a.t);
  const sum=k=>L.reduce((t,d)=>t+d[k],0);
  const o=(v,t)=>'<option value="'+v+'"'+(R.m===v?' selected':'')+'>'+t+'</option>';
  return '<div class="fl"><label>Xem theo<select onchange="R.m=this.value;R.v=\'\';render()">'+o('all','Tổng doanh thu')+o('day','Theo ngày')+o('month','Theo tháng')+o('year','Theo năm')+'</select></label>'+
   (R.m==='all'?'':'<label>Thời gian<input '+inp+' value="'+R.v+'" onchange="R.v=this.value;render()"></label>')+'</div>'+
   '<div class="stats"><div class="card">Số hóa đơn<b>'+L.length+'</b></div><div class="card">Tiền phòng<b>'+money(sum('tp'))+'</b></div><div class="card">Phụ phí dịch vụ<b>'+money(sum('pp'))+'</b></div><div class="card">Tổng doanh thu<b>'+money(sum('tong'))+'</b></div></div>'+
   (L.length?'<div class="tb card"><table><tr><th>Thời gian</th><th>Phòng</th><th>Loại</th><th>Khách</th><th>Tiền phòng</th><th>Phụ phí</th><th>Tổng</th><th>NV</th></tr>'+
    L.map(d=>'<tr><td>'+fmtT(d.t)+'</td><td>'+d.ma+'</td><td>'+d.loai+'</td><td>'+esc(d.ten)+'</td><td>'+money(d.tp)+'</td><td>'+money(d.pp)+'</td><td><b>'+money(d.tong)+'</b></td><td>'+esc(d.u)+'</td></tr>').join('')+'</table></div>':'<p class="mut">Không có hóa đơn nào.</p>');
}
function caHTML(){
  const o=S.ca.find(c=>c.u===cur.u&&c.ra==null);
  return '<div class="card" style="margin-bottom:14px"><h3>Ca làm của bạn</h3><p>'+(o?'Đang trong ca từ '+fmtT(o.vao):'Bạn chưa vào ca.')+'</p><button class="bt pr" onclick="toggleCa()">'+(o?'Check-out ca làm':'Check-in ca làm')+'</button></div><h3>Lịch sử ca của bạn</h3>'+caTable(S.ca.filter(c=>c.u===cur.u));
}
function nvHTML(){
  return '<div class="card" style="margin-bottom:14px"><h3>Thêm tài khoản nhân viên</h3><div class="fl"><label>Tên đăng nhập<input id="nu"></label><label>Mật khẩu<input id="np"></label><label>Họ tên<input id="nn"></label></div><button class="bt pr" onclick="themNV()">Tạo tài khoản</button></div>'+
   '<div class="tb card"><table><tr><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th></tr>'+S.users.map(u=>'<tr><td>'+esc(u.u)+'</td><td>'+esc(u.n)+'</td><td>'+(u.r==='QL'?'Quản lý':'Nhân viên')+'</td></tr>').join('')+'</table></div>';
}
function render(){
  const app=document.getElementById('app');
  if(G){app.innerHTML=guestHTML();paintMsgs();return}
  if(!cur){app.innerHTML=loginHTML();return}
  const tabs=[['ph','Phòng'],['od','Đơn gọi món',ORD.filter(o=>o.st<2).length],['ch','Chat',unreadN()],['qr','QR phòng']];
  if(cur.r==='NV')tabs.push(['ca','Ca làm']);else tabs.push(['dt','Doanh thu'],['lc','Lịch sử ca'],['nv','Nhân viên']);
  if(!tabs.some(t=>t[0]===tab))tab='ph';
  const body=tab==='ph'?roomsHTML():tab==='od'?ordersHTML():tab==='ch'?chatTabHTML():tab==='qr'?qrHTML():tab==='ca'?caHTML():tab==='dt'?doanhThuHTML():tab==='lc'?'<h3>Lịch sử ca làm</h3>'+caTable(S.ca):nvHTML();
  app.innerHTML='<header><div class="hd"><b>🏨 Khách sạn</b><span class="sp"></span><span class="mut">'+esc(cur.n)+' ('+(cur.r==='QL'?'Quản lý':'Nhân viên')+')</span>'+
   (cur.r==='NV'?'<span class="bd '+(inCa()?'s0':'s1')+'">'+(inCa()?'Đang trong ca':'Chưa vào ca')+'</span>':'')+
   '<button class="bt sm" onclick="logout()">Đăng xuất</button></div><nav>'+tabs.map(t=>'<button class="'+(t[0]===tab?'on':'')+'" onclick="tab=\''+t[0]+'\';render()">'+t[1]+(t[2]?' <span class="bd s2">'+t[2]+'</span>':'')+'</button>').join('')+'</nav>'+alertBar()+'</header>'+(DB?'':'<p class="mut" style="padding:6px 16px;margin:0">⚠ Chưa kết nối dữ liệu dùng chung: đơn và chat chỉ hiện trên thiết bị này.</p>')+'<main>'+body+'</main>';paintMsgs();
}
/* ---------- gọi món + chat (dùng chung qua db) ---------- */
const BASE=location.href.split('#')[0];
const MENU=[['cf','Cà phê sữa',30000,'☕'],['td','Trà đào',35000,'🧋'],['ns','Nước suối',15000,'💧'],['cc','Coca-Cola',25000,'🥤'],['bi','Bia',35000,'🍺'],['bm','Bánh mì',30000,'🥖'],['pho','Phở bò',65000,'🍜'],['com','Cơm gà',70000,'🍗'],['mx','Mì xào hải sản',75000,'🍝'],['tc','Trái cây',45000,'🍉']];
const ST=['Chờ xác nhận','Đang chuẩn bị','Đã phục vụ'],SC=['s1','s3','s0'];
let DB=null,ORD=[],CHAT=[],ALR=[],alrInit=false,G=null,C=null,cart={};
const newId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const unread=r=>CHAT.some(m=>m.room===r&&m.from==='khach'&&m.t>((S.seen||{})[r]||0));
const unreadN=()=>[...new Set(CHAT.map(m=>m.room))].filter(unread).length;
function seen(r){(S.seen=S.seen||{})[r]=Date.now();save()}
function readHash(){const m=/^#phong-(\d+)$/.exec(location.hash);G=m&&room(+m[1])?+m[1]:null}
function refresh(){const a=document.activeElement;if(a&&a.id==='ci')paintMsgs();else render()}
async function initDB(){
  try{if(window.FIREBASE_CONFIG&&window.firebase){firebase.initializeApp(FIREBASE_CONFIG);DB=firebase.firestore()}}catch(e){console.error(e);DB=null}
  if(!DB){render();return}
  const sub=(col,fn)=>DB.collection(col).onSnapshot(s=>{fn(s.docs.map(d=>d.data()));refresh()},()=>{});
  sub('orders',a=>ORD=a);sub('chat',a=>CHAT=a);sub('alerts',a=>{if(alrInit&&!G&&cur){const old=new Set(ALR.map(x=>x.id));if(a.some(x=>x.st===0&&!old.has(x.id)))beep()}alrInit=true;ALR=a});render();
}
function put(col,o){
  if(DB){try{DB.collection(col).doc(o.id).set(o).catch(e=>{console.error(e);toast('Không gửi được: '+(e.code||e.message))})}catch(e){console.error(e);toast('Không gửi được: '+(e.code||e.message))}return}
  const L=col==='orders'?ORD:col==='chat'?CHAT:ALR,i=L.findIndex(x=>x.id===o.id);
  if(i<0)L.push(o);else L[i]=o;
  S[col]=L;save();refresh();
}
function msgsHTML(r){
  const me=G?'khach':'nv',L=CHAT.filter(m=>m.room===r).sort((a,b)=>a.t-b.t);
  return L.length?L.map(m=>'<div class="bub'+(m.from===me?' me':'')+'"><small>'+esc(m.name)+' · '+new Date(m.t).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})+'</small>'+esc(m.text)+'</div>').join(''):'<span class="mut">Chưa có tin nhắn.</span>';
}
function paintMsgs(){const e=document.getElementById('msgs');if(e){e.innerHTML=msgsHTML(G||C);e.scrollTop=e.scrollHeight}}
function chatBox(room,who){
  const f='guiChat(\''+who+'\','+room+')';
  return '<h3 style="margin-top:16px">💬 Chat '+(who==='khach'?'với lễ tân':'phòng '+room)+'</h3><div class="card"><div id="msgs" class="msgs"></div><div class="fl" style="margin:10px 0 0;flex-wrap:nowrap"><input id="ci" placeholder="Nhập tin nhắn…" onkeydown="if(event.key===\'Enter\')'+f+'"><button class="bt pr" onclick="'+f+'">Gửi</button></div></div>';
}
function guiChat(who,room){
  const text=val('ci');if(!text)return;
  put('chat',{id:newId('c'),room,from:who,name:who==='nv'?cur.n:'Khách',text,t:Date.now()});
  document.getElementById('ci').value='';
}
function ordList(L){
  return L.length?L.map(o=>'<div class="card" style="margin-bottom:8px"><div class="top"><span class="mut">'+fmtT(o.t)+'</span><span class="bd '+SC[o.st]+'">'+ST[o.st]+'</span></div><div class="gi">'+o.items.map(i=>i.q+' × '+esc(i.n)).join(', ')+'</div><b>'+money(o.tot)+'</b></div>').join(''):'<p class="mut">Bạn chưa gọi món nào.</p>';
}
/* --- khách --- */
function qty(id,d){cart[id]=Math.max(0,(cart[id]||0)+d);render()}
function guiDon(){
  const items=MENU.filter(m=>cart[m[0]]).map(m=>({n:m[1],q:cart[m[0]],p:m[2]}));
  if(!items.length){toast('Hãy chọn món trước');return}
  put('orders',{id:newId('o'),room:G,items,tot:items.reduce((t,i)=>t+i.q*i.p,0),t:Date.now(),st:0});
  cart={};toast('Đã gửi đơn! Nhân viên sẽ phục vụ sớm.');render();
}
function guestHTML(){
  const tot=MENU.reduce((t,m)=>t+(cart[m[0]]||0)*m[2],0);
  return '<header><div class="hd"><b>🏨 Khách sạn</b><span class="sp"></span><span class="mut">Phòng '+G+'</span></div></header>'+(DB?'':'<p class="mut" style="padding:6px 16px;margin:0">⚠ Chưa kết nối dữ liệu dùng chung: đơn và chat chỉ hiện trên thiết bị này.</p>')+
   '<main><button class="sos" onclick="baoKC()">🚨 Báo khẩn cấp</button>'+guestAlerts()+'<div class="card"><h3>🍽️ Gọi đồ ăn uống</h3>'+MENU.map(m=>'<div class="top" style="padding:6px 0;gap:10px"><span class="ph">'+m[3]+'<img src="images/'+m[0]+'.jpg" alt="" onerror="if(!this.dataset.t){this.dataset.t=1;this.src=\'images/'+m[0]+'.png\'}else this.remove()"></span><span style="flex:1">'+m[1]+'<br><span class="mut">'+money(m[2])+'</span></span><span><button class="bt sm" onclick="qty(\''+m[0]+'\',-1)">−</button> <b>'+(cart[m[0]]||0)+'</b> <button class="bt sm" onclick="qty(\''+m[0]+'\',1)">+</button></span></div>').join('')+
   '<div class="top" style="margin-top:10px"><b>Tổng: '+money(tot)+'</b><button class="bt pr" onclick="guiDon()">Gửi đơn</button></div></div>'+
   '<h3 style="margin-top:16px">Đơn của bạn</h3>'+ordList(ORD.filter(o=>o.room===G).sort((a,b)=>b.t-a.t))+chatBox(G,'khach')+'</main>';
}
/* --- nhân viên --- */
function doiDon(id,st){
  if(!guard())return;
  const o=ORD.find(x=>x.id===id);if(!o)return;
  const r=room(o.room),ok=st===2&&!o.charged&&r&&r.tt===2;
  if(ok){r.k.pp+=o.tot;save()}
  put('orders',Object.assign({},o,{st,by:cur.u,charged:!!(ok||o.charged)}));
  toast(st===2?(ok?'Đã phục vụ và cộng '+money(o.tot)+' vào phụ phí phòng '+o.room:'Đã phục vụ (phòng chưa có khách đang ở nên chưa tính phụ phí)'):'Đã nhận đơn');
}
function ordersHTML(){
  const L=ORD.slice().sort((a,b)=>a.st-b.st||a.t-b.t);
  if(!L.length)return '<p class="mut">Chưa có đơn gọi món nào.</p>';
  return '<div class="grid">'+L.map(o=>'<div class="card"><div class="top"><b>Phòng '+o.room+'</b><span class="bd '+SC[o.st]+'">'+ST[o.st]+'</span></div><div class="mut">'+fmtT(o.t)+'</div><div class="gi">'+o.items.map(i=>i.q+' × '+esc(i.n)).join('<br>')+'</div><b>'+money(o.tot)+'</b><div class="act">'+
   (o.st===0?'<button class="bt pr sm" onclick="doiDon(\''+o.id+'\',1)">Nhận đơn</button>':o.st===1?'<button class="bt pr sm" onclick="doiDon(\''+o.id+'\',2)">Đã phục vụ</button>':'')+
   '<button class="bt sm" onclick="tab=\'ch\';C='+o.room+';render()">Chat</button></div></div>').join('')+'</div>';
}
function chatTabHTML(){
  const rs=[...new Set(CHAT.map(m=>m.room))].sort((a,b)=>a-b);
  if(C)seen(C);
  return '<div class="fl">'+(rs.length?rs.map(r=>'<button class="bt'+(C===r?' pr':'')+'" onclick="C='+r+';render()">Phòng '+r+(unread(r)&&C!==r?' 🔴':'')+'</button>').join(''):'<span class="mut">Chưa có tin nhắn nào từ khách.</span>')+'</div>'+(C?chatBox(C,'nv'):'');
}
function qrSvg(url){
  if(typeof qrcode!=='function')return '<p class="mut">Không tải được thư viện QR</p>';
  const q=qrcode(0,'M');q.addData(url);q.make();return q.createSvgTag({cellSize:4,margin:2,scalable:true});
}
function qrHTML(){
  return '<p class="mut">In mã QR dán trong từng phòng. Khách quét sẽ vào trang gọi đồ và chat của đúng phòng đó.</p><div class="grid">'+S.rooms.map(r=>'<div class="card qr" style="text-align:center"><b>Phòng '+r.ma+'</b><div style="background:#fff;padding:6px;border-radius:8px;margin-top:8px">'+qrSvg(BASE+'#phong-'+r.ma)+'</div></div>').join('')+'</div>';
}
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.frequency.value=880;o.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},700)}catch(e){}}
function baoKC(){
  if(ALR.some(a=>a.room===G&&a.st<2&&Date.now()-a.t<60000)){toast('Bạn vừa gửi báo khẩn cấp, nhân viên đang đến');return}
  modal('🚨 Báo khẩn cấp phòng '+G,'<label>Loại sự cố<select id="f1"><option>Cấp cứu y tế</option><option>Cháy / khói</option><option>An ninh / có người lạ</option><option>Cần hỗ trợ gấp</option></select></label><label>Ghi chú (không bắt buộc)<input id="f2"></label><p class="mut">Nguy hiểm đến tính mạng: gọi ngay 115 (cấp cứu), 114 (cứu hỏa), 113 (công an).</p>',()=>{
    put('alerts',{id:newId('a'),room:G,type:val('f1'),note:val('f2'),t:Date.now(),st:0,by:''});
    toast('Đã gửi báo khẩn cấp! Nhân viên sẽ đến ngay.');
  },'Gửi báo khẩn cấp');
}
function guestAlerts(){
  const L=ALR.filter(a=>a.room===G&&a.st<2);
  return L.length?'<div class="card" style="margin-bottom:12px;border-color:#b91c1c">'+L.map(a=>'🚨 '+esc(a.type)+' ('+fmtT(a.t)+'): '+(a.st===1?'<b>nhân viên đã tiếp nhận</b>':'đang chờ nhân viên')).join('<br>')+'</div>':'';
}
function doiAlert(id,st){
  const a=ALR.find(x=>x.id===id);if(!a)return;
  put('alerts',Object.assign({},a,{st,by:(st===1||!a.by)?cur.n:a.by}));
}
function alertBar(){
  const L=ALR.filter(a=>a.st<2).sort((a,b)=>a.t-b.t);
  document.title=(L.length?'🚨 ('+L.length+') ':'')+'Quản lý khách sạn';
  if(!L.length)return '';
  return '<div class="alr">'+L.map(a=>'<div class="ar"><div><b>🚨 KHẨN CẤP – Phòng '+a.room+'</b> · '+esc(a.type)+(a.note?' · '+esc(a.note):'')+'<br><small>'+fmtT(a.t)+' · '+(a.st===1?'Đã tiếp nhận bởi '+esc(a.by):'Chưa xử lý')+'</small></div><div class="act" style="margin:0">'+(a.st===0?'<button class="bt sm" onclick="doiAlert(\''+a.id+'\',1)">Tiếp nhận</button>':'')+'<button class="bt sm" onclick="doiAlert(\''+a.id+'\',2)">Đã xử lý</button></div></div>').join('')+'</div>';
}
window.addEventListener('hashchange',()=>{readHash();render()});
load();ORD=S.orders||[];CHAT=S.chat||[];ALR=S.alerts||[];readHash();render();initDB();
