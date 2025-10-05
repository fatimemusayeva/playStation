const pricePerHour = 5;
let sessions = JSON.parse(localStorage.getItem("sessions")) || {};
let reports = JSON.parse(localStorage.getItem("reports")) || [];
let currentMenuKabinet = null;

// --- Kabinetləri yarat ---
const kabContainer = document.getElementById("kabinetler");
for (let i = 1; i <= 15; i++) {
  kabContainer.innerHTML += `
  <div class="kabinet" id="kab${i}">
    <h3>Kabinet ${i}</h3>
    <p>Başlama: <span id="startTime${i}">-</span></p>
    <p>Bitmə: <span id="endTime${i}">-</span></p>
    <p>Oyun: <span id="price${i}">0</span> AZN</p>
    <p>Sifarişlər: <span id="orders${i}">Yoxdur</span></p>
    <p><b>Ümumi: <span id="total${i}">0</span> AZN</b></p>
    <button onclick="startSession(${i})">Başla</button>
    <button onclick="endSession(${i})">Bitir</button>
    <button onclick="openMenu(${i})">Menyu</button>
    <button onclick="resetSession(${i})">Sıfırla</button>
  </div>`;

  if (sessions[i]) updateSessionDisplay(i);
  updateCabinetColor(i);
}

// --- Kabinet status fon rəngi ---
function updateCabinetColor(id) {
  const kab = document.getElementById("kab" + id);
  if (sessions[id]?.startTime && !sessions[id]?.ended) kab.style.background = "#1a8cff";
  else if (sessions[id]?.ended && !sessions[id]?.reset) kab.style.background = "#ff4444";
  else kab.style.background = "#1e1e2f";
}

// --- Başla ---
function startSession(id) {
  if (sessions[id]?.startTime && !sessions[id]?.ended) { 
    alert("Bu kabinet artıq aktivdir!"); 
    return; 
  }
  let start = new Date();
  sessions[id] = { startTime: start, endTime: null, price: 0, orders: [], orderPrice: 0, ended: false, reset: false };
  updateSessionDisplay(id);
  updateCabinetColor(id);
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// --- Bitir ---
function endSession(id) {
  if (!sessions[id]?.startTime || sessions[id]?.ended) { 
    alert("Əvvəlcə 'Başla' düyməsinə basın!"); 
    return; 
  }
  let end = new Date();
  let diffMs = end - new Date(sessions[id].startTime);
  let diffHours = diffMs / (1000 * 60 * 60);
  let price = Math.ceil(diffHours * pricePerHour);

  sessions[id].price = price;
  sessions[id].ended = true;
  sessions[id].endTime = end; // ← endTime saxlanır

  reports.push({
    kabinet: id,
    start: sessions[id].startTime,
    end: end,
    oyun: sessions[id].price,
    sifaris: sessions[id].orderPrice,
    total: sessions[id].price + sessions[id].orderPrice
  });

  localStorage.setItem("reports", JSON.stringify(reports));
  updateSessionDisplay(id);
  updateCabinetColor(id);
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// --- Sıfırla ---
function resetSession(id) {
  sessions[id] = { startTime: null, endTime: null, price: 0, orders: [], orderPrice: 0, ended: false, reset: true };
  updateSessionDisplay(id);
  updateCabinetColor(id);
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// --- Sifariş əlavə ---
function addOrder(id, item, cost) {
  if (!sessions[id]?.startTime || sessions[id]?.ended) { 
    alert("Əvvəlcə kabineti başladın!"); 
    return; 
  }
  sessions[id].orders.push({ name: item, price: cost });
  sessions[id].orderPrice = (sessions[id].orderPrice || 0) + cost;
  updateSessionDisplay(id);
  updateMenuOrders();
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// --- Sifariş sil ---
function removeOrder(index) {
  if (!currentMenuKabinet) return;
  let orders = sessions[currentMenuKabinet].orders;
  sessions[currentMenuKabinet].orderPrice -= orders[index].price;
  orders.splice(index, 1);
  updateSessionDisplay(currentMenuKabinet);
  updateMenuOrders();
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// --- Menu overlay sifarişləri ---
function updateMenuOrders() {
  const container = document.getElementById("selectedOrders");
  container.innerHTML = "";
  let total = 0;
  if (sessions[currentMenuKabinet]?.orders) {
    sessions[currentMenuKabinet].orders.forEach((o, i) => {
      total += o.price;
      let div = document.createElement("div");
      div.className = "order-item";
      div.innerHTML = `${o.name} - ${o.price} AZN <button onclick="removeOrder(${i})">Sil</button>`;
      container.appendChild(div);
    });
  }
  document.getElementById("menuTotal").innerText = "Ümumi: " + total + " AZN";
}

// --- Menu aç/bağla (mərkəzləşdirilmiş) ---
function openMenu(id) {
  currentMenuKabinet = id;
  document.getElementById("menuKabinetTitle").innerText = "Kabinet " + id + " Menyu";
  const overlay = document.getElementById("overlayMenu");
  overlay.classList.add("active"); // CSS display:flex olacaq
  updateMenuOrders();
}

function closeMenu() {
  document.getElementById("overlayMenu").classList.remove("active"); // CSS display:none olacaq
}

// --- Session display ---
function updateSessionDisplay(id) {
  if (!sessions[id]) sessions[id] = { startTime: null, endTime: null, price: 0, orders: [], orderPrice: 0, ended: false, reset: false };

  document.getElementById("startTime" + id).innerText = sessions[id].startTime 
    ? new Date(sessions[id].startTime).toLocaleTimeString() 
    : "-";

  document.getElementById("endTime" + id).innerText = sessions[id].endTime 
    ? new Date(sessions[id].endTime).toLocaleTimeString() 
    : "-";

  document.getElementById("price" + id).innerText = sessions[id].price || 0;
  document.getElementById("orders" + id).innerText = sessions[id].orders.length > 0 
    ? sessions[id].orders.map(o => o.name).join(",") 
    : "Yoxdur";

  let total = (sessions[id].price || 0) + (sessions[id].orderPrice || 0);
  document.getElementById("total" + id).innerText = total;
  updateCabinetColor(id);
}

// --- Hesabat ---
function showReport(type) {
  let now = new Date();
  let filtered = reports.filter(r => {
    let d = new Date(r.start);
    if (type === "daily") return d.toDateString() === now.toDateString();
    else if (type === "weekly") { 
      let weekAgo = new Date(); 
      weekAgo.setDate(now.getDate() - 7); 
      return d >= weekAgo; 
    } else if (type === "monthly") { 
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); 
    }
    return false;
  });

  let html = `<table>
    <tr><th>Kabinet</th><th>Başlama</th><th>Bitmə</th><th>Oyun</th><th>Sifariş</th><th>Ümumi</th><th>Sil</th></tr>`;
  let totalIncome = 0;
  filtered.forEach((r, i) => {
    html += `<tr>
      <td>${r.kabinet}</td>
      <td>${new Date(r.start).toLocaleString()}</td>
      <td>${new Date(r.end).toLocaleString()}</td>
      <td>${r.oyun} AZN</td>
      <td>${r.sifaris} AZN</td>
      <td>${r.total} AZN</td>
      <td><button onclick="deleteReport(${i})">Sil</button></td>
    </tr>`;
    totalIncome += r.total;
  });
  html += "</table>";
  document.getElementById("reportTable").innerHTML = html;
  document.getElementById("totalIncome").innerText = `💰 Ümumi Gəlir: ${totalIncome} AZN`;
}

// --- Hesabat sil ---
function deleteReport(index) {
  reports.splice(index, 1);
  localStorage.setItem("reports", JSON.stringify(reports));
  showReport('daily');
}

function resetReports() {
  if (confirm("Bütün hesabat məlumatlarını silmək istəyirsiniz?")) {
    reports = [];
    localStorage.setItem("reports", JSON.stringify(reports));
    showReport('daily');
  }
}

setInterval(() => {
  for (let id in sessions) {
    if (sessions[id]?.startTime && !sessions[id]?.ended) {
      let diffMs = new Date() - new Date(sessions[id].startTime);
      let diffHours = diffMs / (1000 * 60 * 60);
      sessions[id].price = Math.ceil(diffHours * pricePerHour);
      updateSessionDisplay(id);
    }
  }
}, 1000);


// --- Bütün kabinetləri boşalt ---
function resetAllKabinet() {
  if (!confirm("Bütün kabinetləri sıfırlamaq istəyirsiniz?")) return;

  for (let i = 1; i <= 15; i++) {
    sessions[i] = { startTime: null, endTime: null, price: 0, orders: [], orderPrice: 0, ended: false, reset: true };
    updateSessionDisplay(i);
    updateCabinetColor(i);
  }

  localStorage.setItem("sessions", JSON.stringify(sessions));
  alert("Bütün kabinetlər sıfırlandı!");
}
