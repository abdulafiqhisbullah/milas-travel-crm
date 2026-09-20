const sharedData = { suppliers: null, bookings: null };

window.addEventListener('storage', event => {
  if (event.key !== 'milas-bookings' || !event.newValue) return;
  try {
    const bookings = JSON.parse(event.newValue);
    if (!Array.isArray(bookings)) return;
    sharedData.bookings = bookings;
    if (state?.active === 'bookings') render();
  } catch {}
});

function persistSharedCollection(collection, records) {
  sharedData[collection] = records;
  try { localStorage.setItem(`milas-${collection}`, JSON.stringify(records)); } catch {}
  fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sharedData) }).catch(() => {});
}

async function loadSharedData() {
  const stateSources = ['./data/crm-state.json', '/api/state'];
  for (const source of stateSources) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Shared state request failed: ${response.status}`);
      if (!response.headers.get('content-type')?.includes('application/json')) continue;
      const data = await response.json();
      if (!Array.isArray(data.suppliers) && !Array.isArray(data.bookings)) throw new Error('Invalid shared state payload');
      if (Array.isArray(data.suppliers)) sharedData.suppliers = data.suppliers;
      if (Array.isArray(data.bookings)) sharedData.bookings = data.bookings;
      try {
        if (Array.isArray(sharedData.suppliers)) localStorage.setItem('milas-suppliers', JSON.stringify(sharedData.suppliers));
        if (Array.isArray(sharedData.bookings)) localStorage.setItem('milas-bookings', JSON.stringify(sharedData.bookings));
      } catch {}
      break;
    } catch (error) {
      if (source !== '/api/state') console.warn(`Shared CRM state source unavailable: ${source}`, error);
    }
  }
  render();
}

const navGroups = [
  { label: 'Workspace', items: [['dashboard','Dashboard','▦']] },
  { label: 'CRM', items: [['leads','Leads','◌'],['pipeline','Sales Pipeline','⌁'],['followups','Follow-ups','◷']] },
  { label: 'Sales', items: [['quotations','Quotations','▤'],['invoices','Invoices','▧']] },
  { label: 'Bookings', items: [['bookings','All Bookings','▣'],['upcoming','Upcoming Travel','◫']] },
  { label: 'Finance & Ops', items: [['payments','Payment Records','₿'],['outstanding','Outstanding Payments','!'],['reports','Reports','⌘']] },
  { label: 'Databased', items: [['customers','Customers','◎'],['suppliers','Suppliers','⬡'],['products','Tour Packages','◇']] },
  { label: 'System', items: [['settings','Settings','⚙']] },
];

const views = {
  dashboard: { eyebrow: 'Overview', title: 'Selamat datang, Afiq', subtitle: 'Pantau prestasi jualan dan perjalanan yang memerlukan tindakan.', action: '+ New Lead' },
  leads: { eyebrow: 'CRM / Leads', title: 'Leads', subtitle: 'Urus pertanyaan baharu dan gerakkan prospek ke quotation.', action: '+ New Lead' },
  customers: { eyebrow: 'CRM / Customers', title: 'Customers', subtitle: 'Satu profil pelanggan untuk semua sejarah perjalanan.', action: '+ New Customer' },
  pipeline: { eyebrow: 'CRM / Sales Pipeline', title: 'Sales Pipeline', subtitle: 'Lihat pergerakan lead dari pertanyaan ke confirmed booking.', action: '+ New Lead' },
  followups: { eyebrow: 'CRM / Follow-ups', title: 'Follow-ups', subtitle: 'Jangan lepaskan panggilan, WhatsApp atau tindakan susulan.', action: '+ New Follow-up' },
  quotations: { eyebrow: 'Sales', title: 'Quotations', subtitle: 'Quotation berkongsi customer dan pricing engine yang sama.', action: '+ New Quotation' },
  invoices: { eyebrow: 'Sales', title: 'Invoices', subtitle: 'Invoice dijana secara automatik daripada quotation yang telah ditukar.', action: '' },
  bookings: { eyebrow: 'Bookings', title: 'All Bookings', subtitle: 'Sumber kebenaran tunggal untuk semua tempahan Milas Travel.', action: '+ New Booking' },
  calendar: { eyebrow: 'Bookings', title: 'Booking Calendar', subtitle: 'Rancang kapasiti perjalanan mengikut tarikh.', action: 'Today' },
  upcoming: { eyebrow: 'Bookings', title: 'Upcoming Travel', subtitle: 'Perjalanan akan datang yang memerlukan persediaan.', action: '' },
  products: { eyebrow: 'Catalogue', title: 'Tour Packages', subtitle: 'Produk, harga dan snapshot komersial disimpan secara berpusat.', action: '+ Add Package' },
  categories: { eyebrow: 'Catalogue', title: 'Categories', subtitle: 'Master data kategori yang boleh diubah tanpa sentuh kod.', action: '+ Add Category' },
  addons: { eyebrow: 'Catalogue', title: 'Add-ons', subtitle: 'Tambahan fleksibel untuk quotation dan booking.', action: '+ Add Add-on' },
  pricing: { eyebrow: 'Catalogue', title: 'Pricing', subtitle: 'Satu pricing engine untuk sales, manual dan website booking.', action: '+ New Price Rule' },
  payments: { eyebrow: 'Finance', title: 'Payment Records', subtitle: 'Jejak kutipan booking tanpa menjadi sistem accounting penuh.', action: '+ Record Payment' },
  outstanding: { eyebrow: 'Finance', title: 'Outstanding Payments', subtitle: 'Baki bayaran yang memerlukan tindakan.', action: '+ Record Payment' },
  operations: { eyebrow: 'Operations', title: 'Operations', subtitle: 'Booking confirmed muncul di sini untuk persediaan perjalanan.', action: '+ New Task' },
  suppliers: { eyebrow: 'Operations', title: 'Suppliers', subtitle: 'Rakan tour, transport dan guide dalam satu masterlist.', action: '+ Add Supplier' },
  reports: { eyebrow: 'Management', title: 'Reports', subtitle: 'Bezakan nilai booking, cash collected dan baki tertunggak.', action: 'Export Report' },
  settings: { eyebrow: 'System', title: 'Settings', subtitle: 'Konfigurasi master data, role dan permission Milas Travel.', action: 'Save Changes' },
};

function currentMonthKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
function monthLabel(monthKey) { const [year, month] = monthKey.split('-').map(Number); return new Intl.DateTimeFormat('ms-MY', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1)); }
function upcomingMonthOptions(selectedMonth) {
  const options = [];
  const now = new Date();
  for (let offset = 0; offset < 24; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push(`<option value="${key}" ${key === selectedMonth ? 'selected' : ''}>${monthLabel(key)}</option>`);
  }
  return options.join('');
}
const state = { active: 'dashboard', range: 'This Month', upcomingMonth: currentMonthKey(), bookingSearch: '', bookingFilter: 'All statuses', bookingView: 'list', bookingGroup: 'status', leadSearch: '', leadFilter: 'All statuses', toast: '' };

function metric(label, value, note, tone = '') {
  return `<article class="metric ${tone}"><div class="metric-label">${label}<span class="metric-dot"></span></div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;
}
function dashboard() {
  return `<section class="dashboard-view"><div class="metrics">${metric('New Leads','24','+18.2% vs last month','teal')}${metric('Confirmed Bookings','18','6 pending confirmation','blue')}${metric('Booking Value','RM 84,620','Gross confirmed value','violet')}${metric('Cash Collected','RM 52,400','62% of booking value','amber')}${metric('Outstanding','RM 32,220','11 bookings need follow-up','red')}${metric('Upcoming Trips','12','Next 30 days','green')}</div><div class="dashboard-grid">
    <div class="main-column"><article class="panel funnel-panel"><div class="panel-head"><div><h2>Sales funnel</h2><p>Conversion mengikut status untuk bulan ini</p></div><button class="ghost-btn">View pipeline <span>→</span></button></div><div class="funnel"><div class="funnel-row"><span>Leads</span><div class="bar"><i style="width:100%"></i></div><b>124</b></div><div class="funnel-row"><span>Quotation</span><div class="bar"><i style="width:68%"></i></div><b>84</b></div><div class="funnel-row"><span>Booking</span><div class="bar"><i style="width:39%"></i></div><b>48</b></div><div class="funnel-row"><span>Confirmed</span><div class="bar"><i style="width:15%"></i></div><b>18</b></div></div></article>
      <article class="panel"><div class="panel-head"><div><h2>Recent bookings</h2><p>Booking terbaru dalam source of truth</p></div><button class="ghost-btn">View all <span>→</span></button></div><div class="table-wrap"><table><thead><tr><th>Booking</th><th>Customer</th><th>Package</th><th>Travel date</th><th>Value</th><th>Status</th></tr></thead><tbody><tr><td><strong>MIL-260916-001</strong></td><td>Sarah Lim</td><td>3D2N Kinabatangan</td><td>22 Sep 2026</td><td>RM 4,680</td><td><span class="status confirmed">Confirmed</span></td></tr><tr><td><strong>MIL-260915-008</strong></td><td>Daniel Wong</td><td>Island Hopping Semporna</td><td>24 Sep 2026</td><td>RM 2,240</td><td><span class="status deposit">Deposit paid</span></td></tr><tr><td><strong>MIL-260915-007</strong></td><td>Nur Aina</td><td>Kundasang Nature Escape</td><td>30 Sep 2026</td><td>RM 3,850</td><td><span class="status pending">Pending payment</span></td></tr></tbody></table></div></article>
    </div><aside class="side-column"><article class="panel attention"><div class="panel-head"><div><h2>Needs attention</h2><p>Keutamaan untuk hari ini</p></div><span class="count-badge">8</span></div><div class="attention-list"><div><span class="attention-icon red-bg">!</span><section><strong>Outstanding payment</strong><small>3 bookings overdue by 7+ days</small></section><b>→</b></div><div><span class="attention-icon amber-bg">◷</span><section><strong>Follow-ups due</strong><small>5 follow-ups due today</small></section><b>→</b></div><div><span class="attention-icon blue-bg">⌂</span><section><strong>Trips this week</strong><small>4 bookings need preparation</small></section><b>→</b></div></div></article><article class="panel mini-calendar"><div class="panel-head"><div><h2>Upcoming travel</h2><p>Next 7 days</p></div><button class="icon-btn">•••</button></div><div class="trip"><span class="date-box"><b>18</b><small>SEP</small></span><section><strong>Sepilok + Kinabatangan</strong><small>3 bookings · 8 travellers</small></section><span class="teal-tag">Ready</span></div><div class="trip"><span class="date-box"><b>20</b><small>SEP</small></span><section><strong>Mabul Island Escape</strong><small>2 bookings · 5 travellers</small></section><span class="amber-tag">Prepare</span></div><div class="trip"><span class="date-box"><b>22</b><small>SEP</small></span><section><strong>Kundasang Weekend</strong><small>1 booking · 2 travellers</small></section><span class="blue-tag">Pending</span></div></article></aside></div></section>`;
}

const moduleData = {
  leads: { heads:['Lead ID','Customer','Source','Interested package','Est. value','Status'], rows:[['LD-000124','Tan Jia Wei','WhatsApp','Kinabatangan 3D2N','RM 3,640','Qualified'],['LD-000123','Amanda Lee','Website','Semporna Island','RM 2,240','Contacted'],['LD-000122','Mohd Firdaus','Referral','Kundasang Nature','RM 3,850','New Lead']] },
  customers: { heads:['Customer ID','Customer','Contact','Nationality','Bookings','Balance'], rows:[['CUS-00124','Sarah Lim','sarah@example.com','Malaysia','4','RM 1,200'],['CUS-00123','Daniel Wong','+60 12-345 6789','Singapore','2','RM 0'],['CUS-00122','Nur Aina','nur.aina@example.com','Malaysia','1','RM 3,850']] },
  quotations: { heads:['Quotation','Customer','Package','Travel date','Total','Status'], rows:[['QT-260916-014','Tan Jia Wei','3D2N Kinabatangan','22 Sep 2026','RM 3,640','Sent'],['QT-260915-013','Amanda Lee','Island Hopping Semporna','24 Sep 2026','RM 2,240','Accepted'],['QT-260915-012','Mohd Firdaus','Kundasang Nature','30 Sep 2026','RM 3,850','Draft']] },
  bookings: { heads:['Booking','Customer','Package','Travel date','Value','Status'], rows:[['MIL-260916-001','Sarah Lim','3D2N Kinabatangan','22 Sep 2026','RM 4,680','Confirmed'],['MIL-260915-008','Daniel Wong','Island Hopping Semporna','24 Sep 2026','RM 2,240','Deposit paid'],['MIL-260915-007','Nur Aina','Kundasang Nature Escape','30 Sep 2026','RM 3,850','Pending payment']] },
  products: { heads:['Package ID','Package','Destination','Duration','Adult price','Status'], rows:[['MTT-D1012','3D2N Kinabatangan River','Kinabatangan','3D2N','RM 1,820','Published'],['MTT-S0703','Semporna Island Hopping','Semporna','1 Day','RM 280','Published'],['MTT-K0402','Kundasang Nature Escape','Kundasang','2D1N','RM 980','Draft']] },
  categories: { heads:['Category','Packages','Featured','Last updated','Status'], rows:[['Wildlife','8','Yes','16 Sep 2026','Active'],['Island','12','Yes','14 Sep 2026','Active'],['Honeymoon','3','No','02 Sep 2026','Active']] },
  addons: { heads:['Add-on','Applies to','Price','Bookings this month','Status'], rows:[['Airport Transfer','All packages','RM 120','14','Active'],['Private Transport','Kundasang, Wildlife','RM 450','6','Active'],['Additional Night','Selected packages','RM 280','3','Active']] },
  pricing: { heads:['Rule','Package','Adult','Child','Valid from','Status'], rows:[['PR-2026-09','Kinabatangan 3D2N','RM 1,820','RM 1,365','01 Sep 2026','Active'],['PR-2026-08','Semporna Island','RM 280','RM 210','01 Aug 2026','Active'],['PR-2026-07','Kundasang Escape','RM 980','RM 735','01 Jul 2026','Active']] },
  payments: { heads:['Payment ID','Booking','Customer','Date','Amount','Type'], rows:[['PAY-00188','MIL-260916-001','Sarah Lim','16 Sep 2026','RM 2,000','Deposit'],['PAY-00187','MIL-260915-008','Daniel Wong','15 Sep 2026','RM 1,120','Full payment'],['PAY-00186','MIL-260915-007','Nur Aina','15 Sep 2026','RM 1,000','Partial payment']] },
  outstanding: { heads:['Booking','Customer','Due date','Booking value','Outstanding','Age'], rows:[['MIL-260915-007','Nur Aina','16 Sep 2026','RM 3,850','RM 2,850','Due today'],['MIL-260914-004','Jason Tan','12 Sep 2026','RM 5,200','RM 1,800','4 days overdue'],['MIL-260910-002','Lee Mei','08 Sep 2026','RM 2,900','RM 900','8 days overdue']] },
  suppliers: { heads:['Supplier','Type','Contact','Coverage','Bookings','Status'], rows:[['Greenview Travel & Tours','Tour','Mr. Rahman','Kinabatangan','8','Active'],['Sabah Transfer Co.','Transport','+60 13-555 0192','Sabah','12','Active'],['Borneo Guide Network','Tour Guide','hello@bguides.my','East Sabah','5','Active']] },
  operations: { heads:['Task','Booking','Travel date','Assigned to','Due','Status'], rows:[['Confirm tour','MIL-260916-001','22 Sep 2026','Rizal Karim','18 Sep','Ready'],['Confirm transport','MIL-260915-008','24 Sep 2026','Rizal Karim','19 Sep','Pending'],['Prepare traveller info','MIL-260915-007','30 Sep 2026','Sarah Ahmad','25 Sep','Pending']] },
};

function dashboardMoney(value) {
  return `RM ${Number(value || 0).toLocaleString('en-MY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}
function dashboardDateInRange(value, range) {
  const date = parseBookingDate(value);
  if (!date) return range === 'This Month';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'Today') return date.toDateString() === start.toDateString();
  if (range === 'This Week') { const weekStart = new Date(start); weekStart.setDate(start.getDate() - start.getDay()); const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7); return date >= weekStart && date < weekEnd; }
  if (range === 'Custom Date') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
function dashboard() {
  const leads = storedLeads(), quotations = storedQuotations(), bookings = storedBookings(), invoices = storedInvoices();
  const scopedLeads = leads.filter(item => dashboardDateInRange(item.receivedDate, state.range));
  const scopedQuotations = quotations.filter(item => dashboardDateInRange(item.travelDate, state.range));
  const scopedBookings = bookings.filter(item => item.status !== 'CANCEL' && dashboardDateInRange(item.startDate, state.range));
  const confirmed = scopedBookings.filter(item => item.status === 'CONFIRMED');
  const bookingValue = scopedBookings.reduce((sum, item) => sum + Number(String(item.sales || item.value || 0).replace(/[^0-9.-]/g, '') || 0), 0);
  const cashCollected = invoices.reduce((sum, invoice) => sum + invoicePaymentState(invoice).paid, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoicePaymentState(invoice).balance, 0);
  const upcoming = bookings.filter(item => { const date = parseBookingDate(item.startDate); const today = new Date(); const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30); return date && date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && date <= limit && !['CANCEL','COMPLETE'].includes(item.status); });
  const followups = leads.filter(item => item.followUpStatus !== 'Done' && item.followUpDate && item.followUpDate <= localDateKey());
  const funnel = { leads: scopedLeads.length, quotation: scopedQuotations.length, booking: scopedBookings.length, confirmed: confirmed.length };
  const maxFunnel = Math.max(1, funnel.leads, funnel.quotation, funnel.booking, funnel.confirmed);
  const recent = [...bookings].sort((a, b) => (parseBookingDate(b.bookingDate) || 0) - (parseBookingDate(a.bookingDate) || 0)).slice(0, 5);
  const upcomingWeek = bookings.filter(item => { const date = parseBookingDate(item.startDate); const today = new Date(); const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7); return date && date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && date <= limit && !['CANCEL','COMPLETE'].includes(item.status); }).slice(0, 3);
  const won = scopedLeads.filter(item => item.status === 'Won').length;
  const monthlyInvoices = invoices.filter(item => dashboardDateInRange(item.issuedAt, 'This Month'));
  const salesMonthly = monthlyInvoices.reduce((sum, item) => sum + Number(String(item.total || 0).replace(/[^0-9.-]/g, '') || 0), 0);
  const completedTours = bookings.filter(isCompletedBooking);
  const salesComplete = completedTours.reduce((sum, item) => sum + bookingSalesValue(item), 0);
  const conversionRate = scopedLeads.length ? `${((won / scopedLeads.length) * 100).toFixed(1)}%` : '0.0%';
  const row = item => `<tr><td><strong>${item.orderId || '—'}</strong></td><td>${item.customer || '—'}</td><td>${packageDisplay(item.package || item.name)}</td><td>${formatTravelDate(item.startDate)}</td><td>${item.sales || '—'}</td><td><span class="status ${String(item.status || '').toLowerCase().replaceAll(' ','-')}">${item.status || '—'}</span></td></tr>`;
  return `<section class="dashboard-view"><div class="metrics">${metric('New Leads',scopedLeads.filter(item => item.status === 'New Lead').length,'Current filter','teal')}${metric('Quotation',scopedQuotations.length,'Quotation dalam filter','blue')}${metric('Won',won,'Closed successfully','violet')}${metric('Conversion Rate',conversionRate,'New Leads → Won','green')}${metric('Sales Monthly',dashboardMoney(salesMonthly),'Invoice generated this month','violet')}${metric('Sales Complete',dashboardMoney(salesComplete),`${completedTours.length} completed tour${completedTours.length === 1 ? '' : 's'}`,'green')}${metric('Cash Collected',dashboardMoney(cashCollected),'Payments received','amber')}${metric('Outstanding',dashboardMoney(outstanding),`${invoices.filter(item => invoicePaymentState(item).balance > 0).length} invoices need follow-up`,'red')}${metric('Upcoming Trips',upcoming.length,'Next 30 days','green')}</div><div class="dashboard-grid"><div class="main-column"><article class="panel funnel-panel"><div class="panel-head"><div><h2>Sales funnel</h2><p>Data sebenar mengikut ${state.range.toLowerCase()}</p></div><button class="ghost-btn" data-nav="pipeline">View pipeline <span>→</span></button></div><div class="funnel">${[['Leads',funnel.leads,'teal'],['Quotation',funnel.quotation,'blue'],['Booking',funnel.booking,'violet'],['Confirmed',funnel.confirmed,'amber']].map(([label,value]) => `<div class="funnel-row"><span>${label}</span><div class="bar"><i style="width:${Math.round(value / maxFunnel * 100)}%"></i></div><b>${value}</b></div>`).join('')}</div></article><article class="panel"><div class="panel-head"><div><h2>Recent bookings</h2><p>Booking terbaru dalam source of truth</p></div><button class="ghost-btn" data-nav="bookings">View all <span>→</span></button></div><div class="table-wrap"><table><thead><tr><th>Booking</th><th>Customer</th><th>Package</th><th>Travel date</th><th>Value</th><th>Status</th></tr></thead><tbody>${recent.length ? recent.map(row).join('') : '<tr><td colspan="6" class="empty-cell">Tiada booking.</td></tr>'}</tbody></table></div></article></div><aside class="side-column"><article class="panel attention"><div class="panel-head"><div><h2>Needs attention</h2><p>Tindakan berdasarkan rekod semasa</p></div><span class="count-badge">${invoices.filter(item => invoicePaymentState(item).balance > 0).length + followups.length + upcomingWeek.length}</span></div><div class="attention-list"><div><span class="attention-icon red-bg">!</span><section><strong>Outstanding payment</strong><small>${invoices.filter(item => invoicePaymentState(item).balance > 0).length} invoice belum selesai</small></section><b data-nav="outstanding">→</b></div><div><span class="attention-icon amber-bg">◷</span><section><strong>Follow-ups due</strong><small>${followups.length} follow-up perlu tindakan</small></section><b data-nav="followups">→</b></div><div><span class="attention-icon blue-bg">⌂</span><section><strong>Trips this week</strong><small>${upcomingWeek.length} booking perlu persediaan</small></section><b data-nav="upcoming">→</b></div></div></article><article class="panel mini-calendar"><div class="panel-head"><div><h2>Upcoming travel</h2><p>Next 7 days</p></div></div>${upcomingWeek.length ? upcomingWeek.map(item => { const date = parseBookingDate(item.startDate); return `<div class="trip"><span class="date-box"><b>${String(date.getDate()).padStart(2,'0')}</b><small>${new Intl.DateTimeFormat('en',{month:'short'}).format(date).toUpperCase()}</small></span><section><strong>${packageDisplay(item.package || item.name)}</strong><small>${item.customer || 'Customer'} · ${item.adult || 0} travellers</small></section><span class="teal-tag">${item.status || 'Ready'}</span></div>`; }).join('') : '<div class="empty-bookings">Tiada perjalanan dalam 7 hari.</div>'}</article></aside></div></section>`;
}

function localDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateKeyOffset(value, offset) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function leadFollowUpDate(receivedDate) {
  return dateKeyOffset(receivedDate, 3);
}
const leadSeed = moduleData.leads.rows.map(([id, customer, source, packageName, value, status], index) => {
  const receivedDate = index === 1 ? localDateKey() : localDateKey(-3);
  return { id, customer, phone: '', email: '', source, packageName, value, status, receivedDate, followUpDate: leadFollowUpDate(receivedDate), followUpStatus: 'Pending' };
});
function normaliseLead(lead) {
  const receivedDate = lead.receivedDate || dateKeyOffset(lead.followUpDate, -3) || localDateKey();
  const status = lead.status === 'Qualified' ? 'Follow-up' : lead.status;
  return normalisePhoneRecord({...lead, status, receivedDate, followUpDate: leadFollowUpDate(receivedDate)});
}
function storedLeads() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-leads') || 'null');
    if (!Array.isArray(saved)) return leadSeed.map(lead => ({...lead}));
    const leads = saved.map(normaliseLead);
    if (JSON.stringify(leads) !== JSON.stringify(saved)) localStorage.setItem('milas-leads', JSON.stringify(leads));
    return leads;
  } catch { return leadSeed.map(lead => ({...lead})); }
}
const leadStatuses = ['New Lead', 'Contacted', 'Quotation Sent', 'Follow-up', 'Invoice Sent', 'Won', 'Lost'];
const leadSources = ['WhatsApp', 'Website', 'Referral', 'Facebook', 'Instagram', 'Other'];
function nextLeadId(leads) {
  const sequence = leads.map(lead => Number(String(lead.id || '').replace('LD-', ''))).filter(Number.isFinite);
  return `LD-${String(Math.max(0, ...sequence) + 1).padStart(6, '0')}`;
}
function leadMatches(record) {
  const search = String(state.leadSearch || '').trim().toLowerCase();
  return (!state.leadFilter || state.leadFilter === 'All statuses' || record.status === state.leadFilter) && (!search || Object.values(record).join(' ').toLowerCase().includes(search));
}
function leadsView() {
  const search = String(state.leadSearch || '').trim().toLowerCase();
  const leads = storedLeads().filter(lead => lead.status === 'New Lead' && (!search || Object.values(lead).join(' ').toLowerCase().includes(search)));
  return `<article class="panel list-panel leads-list"><div class="toolbar"><div class="search-field">⌕ <input data-lead-search value="${state.leadSearch || ''}" placeholder="Search new leads..." /></div><span class="lead-list-hint">Hanya lead baharu yang belum dihubungi</span></div><div class="table-wrap"><table><thead><tr><th>Lead ID</th><th>Customer</th><th>Phone number</th><th>Email</th><th>Source</th><th>Interested package</th><th>Est. value</th><th>Follow-up</th><th>Status</th><th>Open</th><th>Contact</th></tr></thead><tbody>${leads.length ? leads.map(lead => { const phone = String(lead.phone || '').replace(/[^0-9]/g, ''); return `<tr><td class="id-cell">${lead.id}</td><td><strong>${lead.customer || '—'}</strong></td><td>${lead.phone || '—'}</td><td>${lead.email || '—'}</td><td>${lead.source || '—'}</td><td>${lead.packageName || '—'}</td><td>${lead.value || '—'}</td><td>${formatTravelDate(lead.followUpDate)}</td><td><span class="status new-lead">New Lead</span></td><td><button class="ghost-btn lead-open" data-open-lead="${encodeURIComponent(JSON.stringify(lead))}">Open</button></td><td><button class="contact-btn" data-contact-whatsapp="${phone}" data-contact-lead-id="${lead.id}" ${phone ? '' : 'disabled'}>Contact</button></td></tr>`; }).join('') : '<tr><td colspan="11" class="empty-cell">Tiada new lead yang belum dihubungi.</td></tr>'}</tbody></table></div></article>`;
}
function leadEditor(record = {}) {
  const lead = normaliseLead({...record});
  if (!lead.id) lead.id = nextLeadId(storedLeads());
  const input = (key, label, type = 'text', attrs = '') => `<label>${label}<input name="${key}" type="${type}" value="${lead[key] || ''}" ${key === 'id' ? 'readonly' : ''} ${attrs} /></label>`;
  const requiredContact = 'required';
  const requiredMark = '<span class="required-mark" aria-hidden="true">*</span>';
  const quotationAction = record.id && lead.status === 'Contacted' ? `<button type="button" class="proceed-quotation" data-proceed-quotation="${lead.id}">Proceed to quotation</button>` : '';
  const editorActions = quotationAction || '<button type="button" class="ghost-btn" data-close-lead>Cancel</button><button type="submit" class="primary-btn">Save lead</button>';
  return `<div class="modal-backdrop" id="leadModal"><form class="booking-modal lead-modal" id="leadForm" onsubmit="return handleLeadSubmit(event)"><div class="modal-head"><div><span class="eyebrow">CRM / Leads</span><h2>${record.id ? 'Edit lead' : 'New lead'}</h2><p>Simpan dan urus lead baharu Milas Travel.</p></div><button type="button" class="modal-close" data-close-lead>×</button></div><div class="editor-grid">${input('id','Lead ID')}${input('customer',`Customer name ${requiredMark}`,'text',requiredContact)}${phoneFieldMarkup('phone',`Phone number ${requiredMark}`,lead.phone,Boolean(requiredContact))}${input('email',`Email ${requiredMark}`,'email',requiredContact)}${nationalityFieldMarkup(lead.nationality, true, `Nationality ${requiredMark}`)}<label>Source<select name="source">${leadSources.map(source => `<option ${lead.source === source ? 'selected' : ''}>${source}</option>`).join('')}</select></label>${input('packageName','Interested package')}${input('value','Estimated value')}${input('receivedDate','Lead received date','date','data-lead-received-date')}${input('followUpDate','Follow-up date','date','readonly data-lead-follow-up')}<label>Status<select name="status">${leadStatuses.map(status => `<option ${lead.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Follow-up status<select name="followUpStatus"><option ${lead.followUpStatus !== 'Done' ? 'selected' : ''}>Pending</option><option ${lead.followUpStatus === 'Done' ? 'selected' : ''}>Done</option></select></label><label class="full-width">Notes<textarea name="notes" rows="4">${lead.notes || ''}</textarea></label></div><div class="modal-actions">${editorActions}</div></form></div>`;
}
function persistLeadForm(form) {
  const lead = combinePhoneField(Object.fromEntries(new FormData(form).entries())), leads = storedLeads(), originalId = form.dataset.originalLeadId || lead.id;
  lead.receivedDate = lead.receivedDate || localDateKey();
  lead.followUpDate = leadFollowUpDate(lead.receivedDate);
  const index = leads.findIndex(item => item.id === originalId);
  if (index >= 0) leads[index] = {...leads[index], ...lead}; else leads.push(lead);
  localStorage.setItem('milas-leads', JSON.stringify(leads));
  syncLeadToCustomer(lead);
}
function handleLeadSubmit(event) {
  event.preventDefault();
  if (!event.target.reportValidity()) return false;
  persistLeadForm(event.target);
  document.querySelector('#leadModal')?.remove();
  state.active = 'leads';
  state.toast = 'Lead berjaya disimpan.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
  return false;
}

function storedQuotations() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-quotations') || 'null');
    if (!Array.isArray(saved)) return moduleData.quotations.rows.map(([id, customer, packageName, travelDate, total, status]) => ({id, customer, phone: '', email: '', packageName, travelDate, total, status}));
    const quotations = [];
    const leadIds = new Set();
    saved.map(normalisePhoneRecord).forEach(quotation => {
      if (quotation.leadId && leadIds.has(quotation.leadId)) return;
      if (quotation.leadId) leadIds.add(quotation.leadId);
      quotations.push(quotation);
    });
    if (JSON.stringify(quotations) !== JSON.stringify(saved)) localStorage.setItem('milas-quotations', JSON.stringify(quotations));
    return quotations;
  } catch { return []; }
}
function quotationDocumentSnapshot(quotation) {
  const packageName = quotation.packageName || '';
  const product = storedTourProducts().find(item => item.productId === quotation.packageId || item.name === packageName || (packageName && String(packageName).includes(item.name))) || {};
  return JSON.parse(JSON.stringify({
    ...quotation,
    documentProduct: product,
    documentPricing: quotationPricing(quotation.packageId, quotation.optionalPackage)
  }));
}
function storedInvoices() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-invoices') || 'null');
    if (!Array.isArray(saved)) return [];
    let updated = false;
    const invoices = saved.map(invoice => {
      if (invoice.quotationSnapshot) return invoice;
      const quotation = storedQuotations().find(item => item.id === invoice.quotationId);
      updated = true;
      return {...invoice, quotationSnapshot: quotationDocumentSnapshot({...quotation, ...invoice, id: invoice.quotationId})};
    });
    if (updated) localStorage.setItem('milas-invoices', JSON.stringify(invoices));
    return invoices;
  } catch { return []; }
}
function nextInvoiceNumber(invoices) {
  const sequence = invoices.map(invoice => Number(String(invoice.id || '').match(/(\d+)$/)?.[1])).filter(Number.isFinite);
  return `INV-${String(Math.max(0, ...sequence) + 1).padStart(6, '0')}`;
}
function markLeadInvoiceSent(leadId) {
  if (!leadId) return;
  const leads = storedLeads();
  const index = leads.findIndex(lead => lead.id === leadId);
  if (index < 0) return;
  leads[index] = {...leads[index], status: 'Invoice Sent'};
  localStorage.setItem('milas-leads', JSON.stringify(leads));
}
function convertQuotationToInvoice(quotation) {
  const invoices = storedInvoices();
  const existing = invoices.find(invoice => invoice.quotationId === quotation.id);
  if (existing) {
    markLeadInvoiceSent(existing.leadId || quotation.leadId);
    return existing;
  }
  const invoice = {...quotation, id: nextInvoiceNumber(invoices), quotationId: quotation.id, status: 'Draft', issuedAt: new Date().toISOString(), quotationSnapshot: quotationDocumentSnapshot(quotation)};
  invoices.unshift(invoice);
  localStorage.setItem('milas-invoices', JSON.stringify(invoices));
  markLeadInvoiceSent(invoice.leadId);
  const quotations = storedQuotations();
  const index = quotations.findIndex(item => item.id === quotation.id);
  if (index >= 0) {
    quotations[index] = {...quotations[index], invoiceId: invoice.id};
    localStorage.setItem('milas-quotations', JSON.stringify(quotations));
  }
  return invoice;
}
// Company payment details shared by invoice preview and PDF.
const invoiceBankDetails = Object.freeze({
  bankName: 'PUBLIC BANK',
  accountName: 'Milas Travel & Tours Sdn Bhd',
  accountNumber: '3239149436'
});

function invoicePdfMarkup({data, bankDetails = invoiceBankDetails}) {
  const snapshot = data.quotationSnapshot || storedInvoices().find(invoice => invoice.id === data.id)?.quotationSnapshot || quotationDocumentSnapshot(data);
  return quotationPdfMarkup({
    data: {...snapshot, id: data.id},
    packageName: snapshot.packageName || '',
    total: snapshot.total || '0',
    documentType: 'INVOICE',
    documentDate: data.issuedAt,
    quotationReference: data.quotationId,
    bankDetails
  });
}
function invoicePreview(data) {
  const previewDocument = invoicePdfMarkup({data}).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const printable = encodeURIComponent(JSON.stringify({data}));
  return `<div class="modal-backdrop" id="invoicePreviewModal"><article class="booking-modal quotation-preview"><div class="modal-head"><div><span class="eyebrow">Invoice preview</span><h2>${data.id || 'Invoice'}</h2><p>Invoice draft berjaya dijana daripada quotation.</p></div><button type="button" class="modal-close" data-close-invoice-preview>×</button></div><iframe class="quotation-a4-frame" title="A4 invoice preview" srcdoc="${previewDocument}"></iframe><div class="modal-actions"><button type="button" class="ghost-btn" data-close-invoice-preview>Back</button><button type="button" class="primary-btn" data-print-invoice="${printable}">Save as PDF</button></div></article></div>`;
}
function invoicePaymentState(invoice) {
  const total = Number(String(invoice.total || '0').replace(/[^0-9.-]/g, '') || 0);
  const history = Array.isArray(invoice.paymentHistory) ? invoice.paymentHistory : (Number(invoice.paymentAmount || 0) > 0 ? [{ amount: Number(invoice.paymentAmount), paymentType: invoice.paymentType || 'deposit', paidAt: invoice.paidAt }] : []);
  const paid = history.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { total, history, paid: Math.min(total, paid), balance: Math.max(0, total - paid) };
}
function paymentFields(summary) {
  return '<label>Invoice total<input name="invoiceTotal" value="RM ' + summary.total.toFixed(2) + '" readonly /></label><label>Payment type<select name="paymentType"><option value="deposit">Deposit</option><option value="full">Full payment</option></select></label><label>Jumlah payment<input name="paymentAmount" type="number" min="0.01" max="' + summary.balance.toFixed(2) + '" step="0.01" placeholder="0.00" required /></label><label>Payment sebelum ini<input name="previousPayment" value="RM ' + summary.paid.toFixed(2) + '" readonly /></label><label>Baki outstanding sebelum ini<input name="previousOutstanding" value="RM ' + summary.balance.toFixed(2) + '" readonly /></label><label>Baki terkini<input name="balancePayment" value="RM ' + summary.balance.toFixed(2) + '" readonly /></label>';
}
function invoicePaymentModal(invoice) {
  const summary = invoicePaymentState(invoice);
  const payload = encodeURIComponent(JSON.stringify(invoice));
  return '<div class="modal-backdrop" id="invoicePaymentModal"><form class="booking-modal" id="invoicePaymentForm" data-invoice="' + payload + '" data-invoice-total="' + summary.total.toFixed(2) + '" data-previous-outstanding="' + summary.balance.toFixed(2) + '"><div class="modal-head"><div><span class="eyebrow">Invoice payment</span><h2>' + (invoice.id || 'Invoice') + '</h2><p>Rekod pembayaran dan baki invoice.</p></div><button type="button" class="modal-close" data-close-invoice-payment>×</button></div><div class="editor-grid">' + paymentFields(summary) + '</div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-invoice-payment>Cancel</button><button type="submit" class="primary-btn">Save payment</button></div></form></div>';
}
function recordPaymentModal() {
  const invoices = storedInvoices().filter(invoice => invoicePaymentState(invoice).balance > 0);
  const first = invoices[0];
  const summary = invoicePaymentState(first || {});
  const firstPayload = first ? encodeURIComponent(JSON.stringify(first)) : '';
  const options = invoices.map(invoice => '<option value="' + encodeURIComponent(JSON.stringify(invoice)) + '">' + (invoice.id || 'Invoice') + ' — ' + (invoice.customer || 'Customer') + ' · RM ' + invoicePaymentState(invoice).balance.toFixed(2) + ' outstanding</option>').join('');
  return '<div class="modal-backdrop" id="invoicePaymentModal"><form class="booking-modal" id="invoicePaymentForm" data-invoice="' + firstPayload + '" data-invoice-total="' + summary.total.toFixed(2) + '" data-previous-outstanding="' + summary.balance.toFixed(2) + '"><div class="modal-head"><div><span class="eyebrow">Record payment</span><h2>Invoice payment</h2><p>Pilih invoice dan rekod bayaran seterusnya.</p></div><button type="button" class="modal-close" data-close-invoice-payment>×</button></div><div class="editor-grid">' + (invoices.length ? '<label>Invoice<select name="invoiceId" data-payment-invoice>' + options + '</select></label>' + paymentFields(summary) : '<p class="empty-bookings">Tiada invoice outstanding untuk direkodkan.</p>') + '</div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-invoice-payment>Cancel</button>' + (invoices.length ? '<button type="submit" class="primary-btn">Save payment</button>' : '') + '</div></form></div>';
}
function updateInvoicePaymentSummary(form) {
  const outstanding = Number(form.dataset.previousOutstanding || 0);
  const type = form.querySelector('[name="paymentType"]')?.value;
  const amountInput = form.querySelector('[name="paymentAmount"]');
  const balanceInput = form.querySelector('[name="balancePayment"]');
  if (!amountInput || !balanceInput) return;
  if (type === 'full') {
    amountInput.value = outstanding.toFixed(2);
    amountInput.readOnly = true;
  } else {
    amountInput.readOnly = false;
  }
  const amount = Math.min(outstanding, Math.max(0, Number(amountInput.value || 0)));
  balanceInput.value = 'RM ' + (outstanding - amount).toFixed(2);
}
function recordInvoicePayment(invoice, paymentType, paymentAmount) {
  const invoices = storedInvoices(), current = invoices.find(item => item.id === invoice.id);
  if (!current) return false;
  const summary = invoicePaymentState(current), amount = Number(paymentAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > summary.balance || (paymentType === 'full' && amount !== summary.balance)) return false;
  const paymentLabel = paymentType === 'full' ? 'Full payment' : 'Deposit paid';
  const entry = { amount: Number(amount.toFixed(2)), paymentType, paymentLabel, paidAt: new Date().toISOString(), previousOutstanding: Number(summary.balance.toFixed(2)), balance: Number((summary.balance - amount).toFixed(2)) };
  const history = [...summary.history, entry], newBalance = Math.max(0, summary.balance - amount);
  Object.assign(current, { paymentType, paymentStatus: newBalance === 0 ? 'Full payment' : paymentLabel, paymentAmount: (summary.paid + amount).toFixed(2), balancePayment: newBalance.toFixed(2), paymentHistory: history, status: newBalance === 0 ? 'Paid' : paymentLabel, paidAt: entry.paidAt });
  localStorage.setItem('milas-invoices', JSON.stringify(invoices));
  const leads = storedLeads(), lead = leads.find(item => item.id === current.leadId || item.id === current.quotationSnapshot?.leadId);
  if (lead) { lead.status = 'Won'; localStorage.setItem('milas-leads', JSON.stringify(leads)); }
  const bookings = storedBookings(), booking = bookings.find(item => item.invoiceId === current.id);
  if (booking) { booking.payment = paymentLabel + ' (RM ' + amount.toFixed(2) + ')'; booking.paymentAmount = current.paymentAmount; booking.balancePayment = newBalance.toFixed(2); persistSharedCollection('bookings', bookings); }
  else { bookings.unshift({ status: 'NEW ORDER', name: (current.packageName || 'Invoice') + ' — ' + current.id, bookingDate: new Date().toLocaleDateString('en-GB'), startDate: current.travelDate || '', assignee: 'Afiq Milas', channel: 'Quotation', supplier: 'Pending', type: 'Multi Day', customer: current.customer || '', package: current.packageName || '', adult: current.adults || '0', children: current.children || '0', sales: 'RM ' + summary.total.toFixed(2), payment: paymentLabel + ' (RM ' + amount.toFixed(2) + ')', paymentAmount: current.paymentAmount, balancePayment: newBalance.toFixed(2), email: current.email || '', orderId: nextBookingId(bookings), proof: 'Attached', invoice: current.id, invoiceId: current.id, commission: '5%' }); persistSharedCollection('bookings', bookings); }
  const syncedBooking = bookings.find(item => item.invoiceId === current.id);
  if (syncedBooking) {
    syncedBooking.sales = 'RM ' + summary.total.toFixed(2);
    syncedBooking.total = 'RM ' + summary.total.toFixed(2);
    syncedBooking.nationality = current.nationality || current.quotationSnapshot?.nationality || '';
    syncedBooking.optionalPackage = current.optionalPackage || current.quotationSnapshot?.optionalPackage || '';
    syncedBooking.addOns = current.selectedAddons || current.quotationSnapshot?.selectedAddons || [];
    syncedBooking.selectedAddons = current.selectedAddons || current.quotationSnapshot?.selectedAddons || [];
    syncedBooking.adult = current.adults || '0';
    syncedBooking.children = current.children || '0';
    syncedBooking.infant = current.infants || '0';
    syncedBooking.singleSupplement = current.singleSupplement || '0';
    syncedBooking.payment = newBalance === 0 ? 'Paid' : 'Pending';
    syncedBooking.paymentAmount = current.paymentAmount;
    syncedBooking.amountPayment = current.paymentAmount;
    syncedBooking.amountOutstanding = newBalance.toFixed(2);
    syncedBooking.balancePayment = newBalance.toFixed(2);
    persistSharedCollection('bookings', bookings);
  }
  return true;
}
function addQuotationInvoiceButtons() {
  document.querySelectorAll('[data-whatsapp-quotation]').forEach(whatsappButton => {
    if (whatsappButton.parentElement.querySelector('[data-convert-invoice]')) return;
    const openButton = whatsappButton.parentElement.querySelector('[data-open-quotation]');
    if (!openButton) return;
    const button = document.createElement('button');
    button.className = 'invoice-btn';
    button.type = 'button';
    button.dataset.convertInvoice = openButton.dataset.openQuotation;
    button.title = 'Tukar quotation kepada invoice';
    button.textContent = 'Convert to invoice';
    whatsappButton.parentElement.appendChild(button);
  });
}
const quotationActionObserver = new MutationObserver(addQuotationInvoiceButtons);
quotationActionObserver.observe(document.body, {childList: true, subtree: true});
function nextQuotationNumber(quotations) {
  const sequence = quotations.map(quotation => Number(String(quotation.id || '').match(/(\d+)$/)?.[1])).filter(Number.isFinite);
  return `QT-${localDateKey().replaceAll('-', '').slice(2)}-${String(Math.max(0, ...sequence) + 1).padStart(3, '0')}`;
}
function quotationPricing(packageId, optionalPackage = '') {
  const product = storedTourProducts().find(item => item.productId === packageId || item.name === packageId);
  const records = pricingDataFromValue(product?.pricing);
  const selected = (optionalPackage && records.find(item => item.optional && item.option === optionalPackage)) || records.find(item => !item.optional) || records[0];
  const price = key => {
    const raw = selected?.prices?.[key];
    if (raw && typeof raw === 'object') return Number(raw.basePrice || raw.supplierCost || 0);
    return Number(raw || 0);
  };
  const legacyAdult = Number(String(product?.pricing || '').match(/Adult:\s*(?:RM\s*)?([\d,\.]+)/i)?.[1]?.replaceAll(',', '') || 0);
  return {adult: price('adult') || legacyAdult, child: price('child'), infant: price('infant'), solo: price('solo')};
}
function quotationOptionalPackages(packageId) {
  const product = storedTourProducts().find(item => item.productId === packageId || item.name === packageId);
  return pricingDataFromValue(product?.pricing).filter(item => item.optional && !legacyPricingOptions.includes(item.option));
}
function quotationAddons(packageId) {
  const product = storedTourProducts().find(item => item.productId === packageId || item.name === packageId);
  return addonsDataFromValue(product?.addons).map(addon => ({...addon, basePrice: Number(addon.basePrice || addon.price || 0) || 0})).filter(addon => addon.name);
}
function selectedQuotationAddons(value) {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function quotationExtrasMarkup(packageId, quotation = {}) {
  const optionalPackages = quotationOptionalPackages(packageId);
  const addons = quotationAddons(packageId);
  const selectedAddons = selectedQuotationAddons(quotation.selectedAddons).map(addon => addon.name);
  if (!optionalPackages.length && !addons.length) return '';
  const selectedAddonLabel = selectedAddons.length ? selectedAddons.join(', ') : 'Pilih add-on';
  return `<div class="quotation-extras full-width" data-quotation-extras>${optionalPackages.length ? `<label class="quotation-extra-field">Optional package<select name="optionalPackage" data-quotation-calculator><option value="">Base package</option>${optionalPackages.map(option => `<option value="${escapeMarkup(option.option)}" ${quotation.optionalPackage === option.option ? 'selected' : ''}>${escapeMarkup(option.option)}</option>`).join('')}</select></label>` : ''}${addons.length ? `<label class="quotation-extra-field">Add-ons<details class="multi-select quotation-addon-multi"><summary>${escapeMarkup(selectedAddonLabel)}</summary><div class="multi-select-options">${addons.map(addon => `<label><input type="checkbox" name="selectedAddons" value="${escapeMarkup(JSON.stringify({name: addon.name, basePrice: addon.basePrice}))}" data-quotation-calculator ${selectedAddons.includes(addon.name) ? 'checked' : ''} />${escapeMarkup(addon.name)} <span>RM ${addon.basePrice.toFixed(2)}</span></label>`).join('')}</div></details></label>` : ''}</div>`;
}
function quotationAddonsTotal(form) {
  return selectedQuotationAddons(new FormData(form).getAll('selectedAddons')).reduce((sum, value) => {
    try { const addon = typeof value === 'string' ? JSON.parse(value) : value; return sum + (Number(addon.basePrice) || 0); } catch { return sum; }
  }, 0);
}
function quotationTotal(form) {
  const pricing = quotationPricing(form.querySelector('[data-quotation-package]')?.value, form.querySelector('[name="optionalPackage"]')?.value);
  const number = key => Number(form.querySelector(`[name="${key}"]`)?.value || 0);
  const subtotal = pricing.adult * number('adults') + pricing.child * number('children') + pricing.infant * number('infants') + pricing.solo * number('singleSupplement') + quotationAddonsTotal(form);
  const discount = Math.min(100, Math.max(0, number('discount')));
  return Math.max(0, subtotal * (1 - discount / 100));
}
function updateQuotationTotal(form) {
  const total = form?.querySelector('[data-quotation-total]');
  if (total) total.value = quotationTotal(form).toFixed(2);
}
function quotationsView() {
  const quotations = storedQuotations();
  return `<article class="panel list-panel quotations-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search quotations..." /></div><button class="ghost-btn">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Quotation</th><th>Customer</th><th>Phone number</th><th>Email</th><th>Package</th><th>Travel date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${quotations.length ? quotations.map(quotation => { const printable = encodeURIComponent(JSON.stringify({data: quotation, packageName: quotation.packageName || '', total: quotation.total || '0'})); const whatsapp = encodeURIComponent(JSON.stringify({phone: quotation.phone || '', customer: quotation.customer || '', quotationId: quotation.id || ''})); const phone = String(quotation.phone || '').replace(/[^0-9]/g, ''); return `<tr><td class="id-cell">${quotation.id}</td><td><strong>${quotation.customer || '—'}</strong></td><td>${quotation.phone || '—'}</td><td>${quotation.email || '—'}</td><td>${quotation.packageName || '—'}</td><td>${formatTravelDate(quotation.travelDate)}</td><td>${quotation.total || '—'}</td><td><span class="status ${String(quotation.status || '').toLowerCase().replaceAll(' ','-')}">${quotation.status || 'Draft'}</span></td><td><div class="quotation-row-actions"><button class="ghost-btn quotation-open" data-open-quotation="${encodeURIComponent(JSON.stringify(quotation))}">Open</button><button class="primary-btn quotation-pdf" data-print-quotation="${printable}">Save as PDF</button><button class="whatsapp-btn" data-whatsapp-quotation="${whatsapp}" aria-label="WhatsApp ${quotation.customer || 'client'}" title="Hubungi client melalui WhatsApp" ${phone ? '' : 'disabled'}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2 22l5.5-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.9 12l-.5.8.7 2.6-2.7-.7-.8.5A8 8 0 1 1 12 4Zm-3.2 3.9c-.2 0-.5.1-.7.4-.2.3-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.6 4 3.5 2 .8 2.4.6 2.8.6.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.3-.2-.6-.3l-1.5-.7c-.2-.1-.4-.1-.6.1l-.6.8c-.2.2-.3.2-.6.1-.3-.1-1.1-.4-1.8-1.1-.7-.6-1.1-1.4-1.2-1.7-.1-.3 0-.4.1-.6l.4-.5c.2-.2.2-.4.1-.6l-.7-1.7c-.2-.5-.4-.5-.6-.5h-.2Z"/></svg></button></div></td></tr>`; }).join('') : '<tr><td colspan="9" class="empty-cell">Tiada quotation.</td></tr>'}</tbody></table></div></article>`;
}
function invoicesView() {
  const invoices = storedInvoices();
  return `<article class="panel list-panel invoices-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search invoices..." /></div><button class="ghost-btn">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Quotation</th><th>Customer</th><th>Package</th><th>Travel date</th><th>Issued</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${invoices.length ? invoices.map(invoice => { const payload = encodeURIComponent(JSON.stringify({data: invoice})); return `<tr><td class="id-cell">${invoice.id || '—'}</td><td>${invoice.quotationId || '—'}</td><td><strong>${invoice.customer || '—'}</strong><small class="table-subtext">${invoice.email || invoice.phone || ''}</small></td><td>${invoice.packageName || '—'}</td><td>${formatTravelDate(invoice.travelDate)}</td><td>${invoice.issuedAt ? new Intl.DateTimeFormat('en-GB').format(new Date(invoice.issuedAt)) : '—'}</td><td>RM ${Number(String(invoice.total || '0').replace(/[^0-9.-]/g, '') || 0).toFixed(2)}</td><td><span class="status ${String(invoice.status || 'Draft').toLowerCase().replaceAll(' ', '-')}">${invoice.status || 'Draft'}</span></td><td><div class="quotation-row-actions"><button class="ghost-btn" data-open-invoice="${payload}">Open</button><button class="primary-btn quotation-pdf" data-print-invoice="${payload}">Save as PDF</button><button class="ghost-btn" data-invoice-payment="${payload}">Payment</button></div></td></tr>`; }).join('') : '<tr><td colspan="9" class="empty-cell">Belum ada invoice. Convert quotation untuk menjana invoice secara automatik.</td></tr>'}</tbody></table></div></article>`;
}
const quotationStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected'];
function quotationEditor(record = {}) {
  const quotation = {...record};
  if (!quotation.id) quotation.id = nextQuotationNumber(storedQuotations());
  const products = storedTourProducts();
  const selectedProduct = products.find(product => product.productId === quotation.packageId || product.name === quotation.packageName || (quotation.packageName && String(quotation.packageName).includes(product.name))) || products[0];
  const requiredMark = '<span class="required-mark" aria-hidden="true">*</span>';
  const input = (key, label, type = 'text') => {
    const required = ['customer', 'phone', 'email'].includes(key);
    const displayedLabel = required ? `${label} ${requiredMark}` : label;
    if (key === 'phone') return phoneFieldMarkup('phone', displayedLabel, quotation.phone, true);
    return `<label>${displayedLabel}<input name="${key}" type="${type}" value="${quotation[key] || ''}" ${key === 'id' ? 'readonly' : ''} ${required ? 'required' : ''} /></label>`;
  };
  const packageId = selectedProduct?.productId || quotation.packageId || '';
  return `<div class="modal-backdrop" id="quotationModal"><form class="booking-modal quotation-modal" id="quotationForm" onsubmit="return handleQuotationSubmit(event)"><div class="modal-head"><div><span class="eyebrow">Sales / Quotations</span><h2>${record.id ? 'Edit quotation' : 'New quotation'}</h2><p>Lengkapkan dan simpan quotation customer.</p></div><button type="button" class="modal-close" data-close-quotation>×</button></div><div class="editor-grid">${input('id','Quotation number')}${input('leadId','Lead ID')}${input('customer','Customer name')}${input('phone','Phone number','tel')}${input('email','Email','email')}${nationalityFieldMarkup(quotation.nationality, true, `Nationality ${requiredMark}`)}<label class="full-width">Package<select name="packageId" data-quotation-package>${products.length ? products.map(product => `<option value="${product.productId}" ${product.productId === packageId ? 'selected' : ''}>${product.productId} — ${product.name || 'Unnamed package'}</option>`).join('') : '<option value="">Tiada package dalam database</option>'}</select></label><div class="quotation-extras-slot full-width">${quotationExtrasMarkup(packageId, quotation)}</div>${input('travelDate','Travel date','date')}<label>No of adults<input name="adults" type="number" min="0" step="1" value="${quotation.adults || 0}" data-quotation-calculator /></label><label>No of children<input name="children" type="number" min="0" step="1" value="${quotation.children || 0}" data-quotation-calculator /></label><label>No of infants<input name="infants" type="number" min="0" step="1" value="${quotation.infants || 0}" data-quotation-calculator /></label><label>Single supplement<input name="singleSupplement" type="number" min="0" step="1" value="${quotation.singleSupplement || 0}" data-quotation-calculator /></label><label>Discount (%)<input name="discount" type="number" min="0" max="100" step="0.01" value="${quotation.discount || 0}" data-quotation-calculator /></label><label>Total<input name="total" type="text" value="${quotation.total || '0.00'}" data-quotation-total readonly /></label><label>Status<select name="status">${quotationStatuses.map(status => `<option ${quotation.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label class="full-width">Notes<textarea name="notes" rows="4">${quotation.notes || ''}</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-preview-quotation>Preview quotation</button><button type="submit" class="primary-btn">Save</button></div></form></div>`;
}
function quotationPreview(data, packageName, total) {
  const previewDocument = quotationPdfMarkup({data, packageName, total}).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<div class="modal-backdrop" id="quotationPreviewModal"><article class="booking-modal quotation-preview"><div class="modal-head"><div><span class="eyebrow">Quotation preview</span><h2>${data.id || 'New quotation'}</h2><p>Format A4 sebelum quotation disimpan.</p></div><button type="button" class="modal-close" data-close-quotation-preview>×</button></div><iframe class="quotation-a4-frame" title="A4 quotation preview" srcdoc="${previewDocument}"></iframe><div class="modal-actions"><button type="button" class="ghost-btn" data-close-quotation-preview>Back</button></div></article></div>`;
}
function quotationPdfMarkup({data, packageName, total, documentType = 'QUOTATION', documentDate, quotationReference, bankDetails}) {
  const escapeDocumentText = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  total = Number(String(total || '0').replace(/[^0-9.-]/g, '')) || 0;
  const product = data.documentProduct || storedTourProducts().find(item => item.productId === data.packageId || item.name === packageName || (packageName && String(packageName).includes(item.name))) || {};
  const bulletItems = value => String(value || '').split(/\r?\n/).map(item => item.trim().replace(/^(?:[•*-]|\d+[.)])\s*/, '')).filter(Boolean);
  const includedItems = bulletItems(product.included ?? product.whatsIncluded ?? product.whatIncluded ?? product.inclusions);
  const excludedItems = bulletItems(product.excluded ?? product.whatsExcluded ?? product.whatExcluded ?? product.exclusions);
  const packageNotes = [
    includedItems.length ? `<div class="package-note"><strong>What's included</strong><ul>${includedItems.map(item => `<li>${escapeDocumentText(item)}</li>`).join('')}</ul></div>` : '',
    excludedItems.length ? `<div class="package-note"><strong>What's excluded</strong><ul>${excludedItems.map(item => `<li>${escapeDocumentText(item)}</li>`).join('')}</ul></div>` : '',
  ].join('');
  const itineraryDays = itineraryDaysFromValue(product.itinerary).filter(day => String(day.details || '').trim());
  const itineraryMarkup = itineraryDays.length ? `<div class="itinerary-notes"><strong>Itinerary</strong>${itineraryDays.map(day => `<div class="itinerary-day"><b>Day ${day.day}</b><span>${escapeDocumentText(day.details)}</span></div>`).join('')}</div>` : '';
  const pricing = data.documentPricing || quotationPricing(data.packageId, data.optionalPackage);
  const selectedAddons = selectedQuotationAddons(data.selectedAddons);
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + (Number(addon.basePrice) || 0), 0);
  const line = (label, count, unit) => {
    const quantity = Number(count || 0);
    if (quantity <= 0) return '';
    return `<tr><td>${label}</td><td>${quantity}</td><td>RM ${Number(unit || 0).toFixed(2)}</td><td>RM ${(quantity * Number(unit || 0)).toFixed(2)}</td></tr>`;
  };
  const hasParticipants = [data.adults, data.children, data.infants, data.singleSupplement].some(value => Number(value || 0) > 0);
  const subtotal = hasParticipants
    ? pricing.adult * Number(data.adults || 0) + pricing.child * Number(data.children || 0) + pricing.infant * Number(data.infants || 0) + pricing.solo * Number(data.singleSupplement || 0) + addonTotal
    : (Number(data.discount || 0) < 100 ? total / (1 - Number(data.discount || 0) / 100) : total);
  const issueDate = new Date(documentDate || Date.now());
  const displayedDate = Number.isNaN(issueDate.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB').format(issueDate);
  const discountAmount = Math.max(0, subtotal - Number(total || 0));
  const bankDetailsMarkup = documentType === 'INVOICE' && bankDetails?.bankName && bankDetails?.accountName && bankDetails?.accountNumber
    ? `<section class="bank-details" aria-label="Bank details"><div class="section-title">Bank details</div><dl><dt>Account no.</dt><dd class="bank-account-number">${escapeDocumentText(bankDetails.accountNumber)}</dd><dt>Bank</dt><dd>${escapeDocumentText(bankDetails.bankName)}</dd><dt>Account name</dt><dd>${escapeDocumentText(bankDetails.accountName)}</dd></dl></section>`
    : '';

  const addonRows = selectedAddons.map(addon => `<tr><td>${escapeDocumentText(addon.name || 'Add-on')}</td><td>1</td><td>RM ${(Number(addon.basePrice) || 0).toFixed(2)}</td><td>RM ${(Number(addon.basePrice) || 0).toFixed(2)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeDocumentText(data.id || documentType)}</title><style>@page{size:210mm 297mm;margin:14mm}*{box-sizing:border-box}body{margin:0;padding:14mm;font-family:Arial,sans-serif;color:#24364a;font-size:12px}@media print{body{padding:0}}.sheet{width:100%;min-height:267mm}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #18a889;padding-bottom:18px}.brand{display:flex;gap:10px;align-items:center}.logo{width:42px;height:42px;border-radius:12px;background:#18a889;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800}.company h1{margin:0;font-size:21px;color:#122238}.company p{margin:4px 0 0;color:#718096}.quote-meta{text-align:right}.quote-meta h2{margin:0 0 6px;color:#18a889;font-size:22px}.quote-meta p{margin:3px 0;color:#718096}.section{margin-top:24px}.section-title{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#18a889;margin-bottom:8px}.recipient{background:#f4faf8;border:1px solid #d9eee8;border-radius:8px;padding:13px;display:grid;grid-template-columns:120px 1fr;gap:6px}.recipient strong{color:#718096}.package{border:1px solid #dce5eb;border-radius:8px;padding:15px}.package h3{margin:0 0 5px;font-size:17px}.package p{margin:0;color:#718096}.package-notes{display:grid;grid-template-columns:1fr;gap:8px;margin-top:72px;width:65%;text-align:left}.package-note{padding:0}.package-note strong{display:block;color:#477466;margin-bottom:5px}.package-note ul{margin:0;padding-left:18px}.package-note li{margin:3px 0}.itinerary-notes{display:grid;gap:7px;margin-top:18px;width:65%;text-align:left;break-inside:avoid}.itinerary-notes>strong{color:#477466}.itinerary-day{display:grid;grid-template-columns:48px minmax(0,1fr);gap:8px}.itinerary-day b{color:#477466}.itinerary-day span{white-space:pre-wrap}.pricing{width:100%;border-collapse:collapse;margin-top:12px}.pricing th{background:#edf8f5;color:#477466;text-align:left;font-size:11px}.pricing th,.pricing td{padding:10px;border-bottom:1px solid #e7edf0}.pricing td:nth-child(2),.pricing td:nth-child(3),.pricing td:nth-child(4),.pricing th:nth-child(2),.pricing th:nth-child(3),.pricing th:nth-child(4){text-align:right}.invoice-summary{display:flex;justify-content:space-between;align-items:flex-start;gap:32px;margin-top:58px}.totals{margin:0 0 0 auto;width:280px;flex:0 0 280px}.totals div{display:flex;justify-content:space-between;padding:5px 0}.totals .grand{border-top:2px solid #18a889;margin-top:5px;padding-top:10px;font-size:17px;font-weight:800;color:#18a889}.bank-details{width:58%;margin:0;padding:14px;border:1px solid #d9eee8;border-left:3px solid #18a889;border-radius:8px;background:#f4faf8;text-align:left;break-inside:avoid;page-break-inside:avoid}.bank-details dl{display:grid;grid-template-columns:88px minmax(0,1fr);gap:7px 10px;margin:0;line-height:1.5}.bank-details dt{color:#718096}.bank-details dd{margin:0;font-weight:700;overflow-wrap:anywhere}.bank-account-number{font-variant-numeric:tabular-nums;letter-spacing:.03em}.footer{border-top:1px solid #dce5eb;margin-top:34px;padding-top:12px;color:#8492a3;text-align:center;font-size:10px}</style></head><body><main class="sheet"><header class="header"><div class="brand"><div class="logo">M</div><div class="company"><h1>Milas Travel &amp; Tours</h1><p>Sabah, Malaysia</p></div></div><div class="quote-meta"><h2>${documentType}</h2><p><strong>${escapeDocumentText(data.id || '—')}</strong></p><p>${displayedDate}</p>${quotationReference ? `<p>Quotation: ${escapeDocumentText(quotationReference)}</p>` : ''} </div></header><section class="section"><div class="section-title">Bill to</div><div class="recipient"><strong>Name</strong><span>${escapeDocumentText(data.customer || '—')}</span><strong>Phone</strong><span>${escapeDocumentText(data.phone || '—')}</span><strong>Email</strong><span>${escapeDocumentText(data.email || '—')}</span></div></section><section class="section"><div class="section-title">Package details</div><div class="package"><h3>${escapeDocumentText(packageName || '—')}</h3><p>Travel date: ${data.travelDate ? formatTravelDate(data.travelDate) : '—'}</p>${data.optionalPackage ? `<p>Optional package: ${escapeDocumentText(data.optionalPackage)}</p>` : ''}</div><table class="pricing"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${line('Adult',data.adults,pricing.adult)}${line('Child',data.children,pricing.child)}${line('Infant',data.infants,pricing.infant)}${line('Single supplement',data.singleSupplement,pricing.solo)}${addonRows}${!hasParticipants && !selectedAddons.length ? `<tr><td>${escapeDocumentText(packageName || 'Package')}</td><td>1</td><td>RM ${subtotal.toFixed(2)}</td><td>RM ${subtotal.toFixed(2)}</td></tr>` : ''}</tbody></table>${packageNotes ? `<div class="package-notes">${packageNotes}</div>` : ''}${itineraryMarkup}<div class="invoice-summary">${bankDetailsMarkup}<div class="totals"><div><span>Subtotal</span><strong>RM ${Number(subtotal).toFixed(2)}</strong></div><div><span>Discount (${data.discount || 0}%)</span><strong>- RM ${discountAmount.toFixed(2)}</strong></div><div class="grand"><span>Total</span><span>RM ${Number(total || 0).toFixed(2)}</span></div></div></div>${data.notes ? `<div class="section"><div class="section-title">Notes</div><p style="white-space:pre-wrap">${escapeDocumentText(data.notes)}</p></div>` : ''} </section><footer class="footer">Thank you for choosing Milas Travel &amp; Tours · Sabah, Malaysia</footer></main></body></html>`;
}
function requiredQuotationFieldsValid(form) {
  const requiredAddons = [...form.querySelectorAll('.quotation-extra-field[data-required-field="true"]')]
    .some(label => label.querySelector('[name="selectedAddons"]') && !form.querySelector('[name="selectedAddons"]:checked'));
  if (requiredAddons) {
    const checkbox = form.querySelector('[name="selectedAddons"]');
    checkbox?.setCustomValidity('Sila pilih sekurang-kurangnya satu add-on.');
    checkbox?.reportValidity();
    checkbox?.setCustomValidity('');
    return false;
  }
  return true;
}
function handleQuotationSubmit(event) {
  event.preventDefault();
  if (!event.target.reportValidity() || !requiredQuotationFieldsValid(event.target)) return false;
  const formData = new FormData(event.target);
  const quotation = combinePhoneField(Object.fromEntries(formData.entries()));
  quotation.selectedAddons = formData.getAll('selectedAddons').map(value => { try { return JSON.parse(value); } catch { return null; } }).filter(Boolean);
  const packageSelect = event.target.querySelector('[data-quotation-package]');
  quotation.packageName = packageSelect?.selectedOptions[0]?.textContent || quotation.packageId || '';
  quotation.total = quotationTotal(event.target).toFixed(2);
  const quotations = storedQuotations();
  const index = quotations.findIndex(item => item.id === quotation.id);
  if (index >= 0) quotations[index] = {...quotations[index], ...quotation}; else quotations.unshift(quotation);
  localStorage.setItem('milas-quotations', JSON.stringify(quotations));
  document.querySelector('#quotationModal')?.remove();
  state.active = 'quotations';
  state.toast = 'Quotation berjaya disimpan.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
  return false;
}

function tableView(key) {
  const v = views[key], data = moduleData[key] || moduleData.bookings;
  return `<article class="panel list-panel"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search ${v.title.toLowerCase()}..." /></div><select><option>All statuses</option><option>Active</option><option>Pending</option><option>Confirmed</option></select><button class="ghost-btn" data-action="filter">Filter</button></div><div class="table-wrap"><table><thead><tr>${data.heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row=>`<tr>${row.map((cell,i)=>`<td class="${i===0?'id-cell':''}">${i===row.length-1?`<span class="status ${cell.toLowerCase().replaceAll(' ','-')}">${cell}</span>`:cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div></article>`;
}
function syncPaymentRecordsView() {
  const payments = storedInvoices().flatMap(invoice => {
    const summary = invoicePaymentState(invoice);
    return summary.history.map((payment, index) => ({ invoice, payment, index }));
  });
  moduleData.payments.heads = ['Payment ID', 'Invoice', 'Customer', 'Date', 'Amount paid', 'Balance', 'Type', 'Status'];
  moduleData.payments.rows = payments.map(({ invoice, payment }, index) => [
    'PAY-' + String(index + 1).padStart(5, '0'),
    invoice.id || '—',
    invoice.customer || '—',
    payment.paidAt ? new Intl.DateTimeFormat('en-GB').format(new Date(payment.paidAt)) : '—',
    'RM ' + Number(payment.amount || 0).toFixed(2),
    'RM ' + Number(payment.balance || 0).toFixed(2),
    payment.paymentLabel || (payment.paymentType === 'full' ? 'Full payment' : 'Deposit paid'),
    'Recorded'
  ]);
}
function outstandingView() {
  const invoices = storedInvoices().filter(invoice => invoicePaymentState(invoice).balance > 0);
  const rows = invoices.map(invoice => {
    const summary = invoicePaymentState(invoice);
    const payload = encodeURIComponent(JSON.stringify({data: invoice}));
    const phone = String(invoice.phone || '').replace(/[^0-9]/g, '');
    const whatsapp = encodeURIComponent(JSON.stringify({phone, customer: invoice.customer || '', invoiceId: invoice.id || '', balance: summary.balance.toFixed(2)}));
    const issued = invoice.issuedAt ? new Intl.DateTimeFormat('en-GB').format(new Date(invoice.issuedAt)) : '—';
    return '<tr><td class="id-cell">' + (invoice.id || '—') + '</td><td><strong>' + (invoice.customer || '—') + '</strong><small class="table-subtext">' + (invoice.email || invoice.phone || '') + '</small></td><td>' + (invoice.packageName || '—') + '</td><td>RM ' + summary.total.toFixed(2) + '</td><td>RM ' + summary.paid.toFixed(2) + '</td><td>RM ' + summary.balance.toFixed(2) + '</td><td>' + issued + '</td><td><span class="status outstanding">Outstanding</span></td><td><div class="quotation-row-actions"><button class="primary-btn" data-invoice-payment="' + payload + '">Record Payment</button><button class="whatsapp-btn outstanding-whatsapp" data-whatsapp-outstanding="' + whatsapp + '" aria-label="WhatsApp ' + (invoice.customer || 'client') + ' untuk outstanding payment" title="Follow up outstanding payment" ' + (phone ? '' : 'disabled') + '><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2 22l5.5-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.9 12l-.5.8.7 2.6-2.7-.7-.8.5A8 8 0 1 1 12 4Zm-3.2 3.9c-.2 0-.5.1-.7.4-.2.3-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.6 4 3.5 2 .8 2.4.6 2.8.6.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.3-.2-.6-.3l-1.5-.7c-.2-.1-.4-.1-.6.1l-.6.8c-.2.2-.3.2-.6.1-.3-.1-1.1-.4-1.2-1.7-.1-.3 0-.4.1-.6l.4-.5c.2-.2.2-.4.1-.6l-.7-1.7c-.2-.5-.4-.5-.6-.5h-.2Z"/></svg></button></div></td></tr>';
  }).join('');
  return '<article class="panel list-panel outstanding-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search outstanding payments..." /></div><select><option>All outstanding</option><option>Deposit balance</option></select><button class="ghost-btn" data-action="filter">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Package</th><th>Invoice total</th><th>Paid</th><th>Outstanding</th><th>Issued</th><th>Status</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="9" class="empty-cell">Tiada outstanding payment.</td></tr>') + '</tbody></table></div></article>';
}

const productStatuses = ['Draft', 'Semak', 'Approved', 'Live'];
const tourCategories = ['Wildlife & nature', 'Island & Beaches', 'Cultural & City', 'Honeymoon'];
const tourLocations = ['Kota Kinabalu', 'Sandakan', 'Tawau', 'Kundasang', 'Lahad Datu', 'Kinabatangan'];
const legacyPricingOptions = ['Standard', 'Deluxe Twin', 'Deluxe King'];
const pricingTypes = [['adult', 'Adult'], ['child', 'Child 4-11'], ['infant', 'Infant 0-3'], ['solo', 'Solo Traveller']];
const productSeed = moduleData.products.rows.map(([id, name, destination, duration, adultPrice, status]) => ({ productId: id, name, supplierName: 'Belum ditetapkan', tourCategory: destination === 'Semporna' ? 'Island & Beaches' : 'Wildlife & nature', locations: tourLocations.includes(destination) ? [destination] : [], supplierCode: '', datePublish: '2026-09-16', status: status === 'Published' ? 'Live' : 'Draft', overview: `${name} di ${destination} · ${duration}`, itinerary: '', included: '', excluded: '', departureInfo: '', pricing: `Adult: ${adultPrice}`, availability: '', addons: '', cancellationPolicy: '' }));
function storedTourProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-product-database') || 'null');
    return Array.isArray(saved) && saved.length ? saved : productSeed.map(product => ({...product}));
  } catch { return productSeed.map(product => ({...product})); }
}
function saveTourProducts(products) { localStorage.setItem('milas-product-database', JSON.stringify(products)); }
function nextProductId(products) {
  const prefix = 'MTT-P-';
  const sequence = products.map(product => Number(String(product.productId || '').replace(prefix, ''))).filter(Number.isFinite);
  return `${prefix}${String(Math.max(0, ...sequence) + 1).padStart(4, '0')}`;
}
function productStatusClass(status) { return String(status || '').toLowerCase().replaceAll(' ', '-'); }
function itineraryDaysFromValue(value) {
  const text = String(value || '').trim();
  if (!text) return [{ day: 1, details: '' }];
  const chunks = text.split(/\n(?=Day\s+\d+)/i).filter(Boolean);
  return (chunks.length ? chunks : [text]).map((chunk, index) => {
    const match = chunk.match(/^Day\s+(\d+)\s*\n?([\s\S]*)$/i);
    return { day: match ? Number(match[1]) : index + 1, details: match ? match[2].trim() : chunk.trim() };
  });
}
function itineraryDayRow(day, details = '') {
  return `<div class="itinerary-day" data-itinerary-day><div class="itinerary-day-head"><strong>Day ${day}</strong>${day > 1 ? '<button type="button" class="ghost-btn itinerary-remove" data-remove-itinerary>Remove</button>' : ''}</div><textarea data-itinerary-details rows="3" placeholder="Contoh: Tiba, lawatan, makan dan aktiviti untuk hari ini">${details}</textarea></div>`;
}
function itineraryEditor(value = '') {
  const days = itineraryDaysFromValue(value);
  return `<label class="full-width itinerary-field">Itinerary<div id="itineraryBuilder">${days.map(item => itineraryDayRow(item.day, item.details)).join('')}</div><button type="button" class="ghost-btn itinerary-add" data-add-itinerary>+ Add day</button><input type="hidden" name="itinerary" value="${String(value || '').replaceAll('"', '&quot;')}" /></label>`;
}
function pricingDataFromValue(value) {
  try {
    const parsed = JSON.parse(value || 'null');
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}
function pricingEditor(value = '') {
  const pricing = pricingDataFromValue(value);
  const optionalPricing = pricing.filter(item => item.optional && !legacyPricingOptions.includes(item.option)).map((item, index) => optionalPricingCard(item.option || `Optional package ${index + 1}`, item)).join('');
  return `<label class="full-width pricing-field">Pricing <small class="pricing-note">Masukkan supplier cost dan margin sendiri. Base price = supplier cost ÷ (1 - margin%).</small><div class="optional-pricing"><div class="optional-pricing-head"><strong>Optional package</strong><span>Tambah hanya jika package mempunyai pilihan tambahan.</span></div><div id="optionalPricingBuilder">${optionalPricing}</div><div class="optional-pricing-actions"><button type="button" class="ghost-btn optional-add" data-add-optional>+ Add optional package</button><button type="button" class="primary-btn optional-save" data-save-optional>Save optional package</button></div></div><input type="hidden" name="pricing" value="${String(value || '').replaceAll('"', '&quot;')}" /></label>`;
}
function optionalPricingCard(option = '', current = {prices: {}}) {
  return `<section class="pricing-option optional-pricing-option" data-pricing-option="${option}"><div class="pricing-option-head"><input class="pricing-option-name" data-pricing-name value="${option}" placeholder="Nama optional package" /><button type="button" class="ghost-btn pricing-remove" data-remove-optional>Remove</button></div><div class="pricing-row pricing-row-head"><span></span><span>Supplier cost</span><span>Margin %</span><span>Base price</span></div>${pricingTypes.map(([key, label]) => { const raw = current.prices?.[key]; const cost = raw && typeof raw === 'object' ? raw.supplierCost || '' : raw || ''; const margin = raw && typeof raw === 'object' && raw.margin !== undefined ? raw.margin : '55'; const marginValue = Number(margin); const base = cost !== '' && margin !== '' && marginValue < 100 ? (Number(cost) / (1 - marginValue / 100)).toFixed(2) : ''; return `<div class="pricing-row"><span>${label}</span><input type="number" min="0" step="0.01" data-price-cost="${key}" value="${cost}" placeholder="0.00" /><input type="number" min="0" max="99.99" step="0.01" data-price-margin="${key}" value="${margin}" placeholder="55" /><input type="text" data-price-base="${key}" value="${base}" placeholder="Auto" readonly /></div>`; }).join('')}</section>`;
}
function serializedPricing(form) {
  return [...form.querySelectorAll('[data-pricing-option]')].map(option => ({ option: option.querySelector('[data-pricing-name]')?.value.trim() || option.dataset.pricingOption, optional: option.classList.contains('optional-pricing-option'), prices: Object.fromEntries([...option.querySelectorAll('[data-price-cost]')].map(input => { const row = input.parentElement; return [input.dataset.priceCost, { supplierCost: input.value, margin: row.querySelector('[data-price-margin]').value, basePrice: row.querySelector('[data-price-base]').value }]; })) }));
}
function addonsDataFromValue(value) {
  try {
    const parsed = JSON.parse(value || 'null');
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value || '').split('\n').map(item => item.trim()).filter(Boolean).map(name => ({ name, supplierCost: '', margin: '55', basePrice: '' }));
}
function addonCard(addon = {}) {
  const supplierCost = addon.supplierCost ?? addon.price ?? '';
  const margin = addon.margin ?? '55';
  const basePrice = addon.basePrice || (supplierCost !== '' && Number(margin) < 100 ? (Number(supplierCost) / (1 - Number(margin) / 100)).toFixed(2) : '');
  return `<div class="addon-row" data-addon-row><input data-addon-name value="${addon.name || ''}" placeholder="Nama aktiviti tambahan" /><div class="addon-price-input"><span>RM</span><input type="number" min="0" step="0.01" data-addon-cost value="${supplierCost}" placeholder="Cost" /></div><div class="addon-price-input"><input type="number" min="0" max="99.99" step="0.01" data-addon-margin value="${margin}" placeholder="Margin %" /><span>%</span></div><div class="addon-price-input addon-base-price"><span>RM</span><input type="text" data-addon-base value="${basePrice}" placeholder="Auto" readonly /></div><button type="button" class="ghost-btn addon-remove" data-remove-addon>Remove</button></div>`;
}
function addonEditor(value = '') {
  const addons = addonsDataFromValue(value);
  return `<label class="full-width addon-field">Add-ons <small class="pricing-note">Tambah aktiviti pilihan dan harga setiap aktiviti.</small><div id="addonBuilder">${addons.map(addonCard).join('')}</div><button type="button" class="ghost-btn addon-add" data-add-addon>+ Add activity</button><input type="hidden" name="addons" value="${String(value || '').replaceAll('"', '&quot;')}" /></label>`;
}
function serializedAddons(form) {
  return [...form.querySelectorAll('[data-addon-row]')].map(row => ({ name: row.querySelector('[data-addon-name]')?.value.trim() || '', supplierCost: row.querySelector('[data-addon-cost]')?.value || '', margin: row.querySelector('[data-addon-margin]')?.value || '', basePrice: row.querySelector('[data-addon-base]')?.value || '' })).filter(addon => addon.name || addon.supplierCost);
}
function productDataFromForm(form) {
  const itinerary = [...form.querySelectorAll('[data-itinerary-day]')].map((day, index) => `Day ${index + 1}\n${day.querySelector('[data-itinerary-details]').value.trim()}`).join('\n\n');
  form.querySelector('input[name="itinerary"]').value = itinerary;
  form.querySelector('input[name="pricing"]').value = JSON.stringify(serializedPricing(form));
  form.querySelector('input[name="addons"]').value = JSON.stringify(serializedAddons(form));
  const formData = new FormData(form);
  const product = Object.fromEntries(formData.entries());
  product.locations = formData.getAll('locations');
  return product;
}
function persistProductForm(form) {
  const product = productDataFromForm(form);
  const products = storedTourProducts();
  const originalId = form.dataset.originalProductId || product.productId;
  const index = products.findIndex(item => item.productId === originalId);
  const previous = index >= 0 ? products[index] : null;
  const changes = previous ? Object.keys(product).filter(key => key !== 'history' && JSON.stringify(previous[key] ?? '') !== JSON.stringify(product[key] ?? '')) : ['Package created'];
  product.history = [...(previous?.history || [])];
  if (changes.length) product.history.unshift({ timestamp: new Date().toISOString(), action: previous ? 'Updated' : 'Created', changes: changes.map(change => change === 'Package created' ? change : productFieldLabel(change)) });
  if (index >= 0) products[index] = product; else products.push(product);
  saveTourProducts(products);
  form.dataset.originalProductId = product.productId;
  return product;
}
function productFieldLabel(key) {
  return ({name:'Name package', productId:'Product ID Milas', supplierName:'Supplier Name', supplierCode:'Supplier code', tourCategory:'Tour category', locations:'Location', datePublish:'Date publish', status:'Status', overview:'Package overview', itinerary:'Itinerary', included:"What's included", excluded:"What's excluded", departureInfo:'Departure / pick up information', pricing:'Pricing', availability:'Availability calendar', addons:'Add-ons', cancellationPolicy:'Cancellation policy'})[key] || key;
}
function productHistorySection(history = []) {
  return `<section class="product-history"><div class="product-history-head"><div><h3>History log</h3><p>Rekod perubahan package.</p></div><span>${history.length} perubahan</span></div>${history.length ? `<div class="product-history-list">${history.map(entry => `<div class="product-history-item"><span class="history-dot"></span><div><strong>${entry.action}</strong><small>${new Date(entry.timestamp).toLocaleString('ms-MY')} · ${entry.changes.join(', ')}</small></div></div>`).join('')}</div>` : '<div class="empty-bookings">Belum ada perubahan direkodkan.</div>'}</section>`;
}
function productEditor(record = {}) {
  const product = {...record};
  if (!product.productId) product.productId = nextProductId(storedTourProducts());
  const selectedLocations = Array.isArray(product.locations) ? product.locations : product.locations ? [product.locations] : [];
  const input = (key, label, value = product[key] || '') => key === 'supplierName' ? supplierSelectMarkup(value) : `<label>${label}<input name="${key}" value="${value}" /></label>`;
  const textarea = (key, label, value = product[key] || '') => `<label class="full-width">${label}<textarea name="${key}" rows="4">${value}</textarea></label>`;
  const bulletTextarea = (key, label, value = product[key] || '') => `<label class="full-width bullet-editor">${label}<div class="bullet-editor-controls"><button type="button" class="ghost-btn" data-add-bullet="${key}">• Add bullet</button></div><textarea name="${key}" rows="4">${value}</textarea></label>`;
  const locationPicker = `<label>Location<details class="multi-select"><summary>${selectedLocations.length ? selectedLocations.join(', ') : 'Pilih lokasi tour'}</summary><div class="multi-select-options">${tourLocations.map(location => `<label><input type="checkbox" name="locations" value="${location}" ${selectedLocations.includes(location) ? 'checked' : ''} />${location}</label>`).join('')}</div></details></label>`;
  return `<div class="modal-backdrop" id="productModal"><form class="booking-modal product-modal" id="productForm"><div class="modal-head"><div><span class="eyebrow">Tour Packages Database</span><h2>${product.productId && record.productId ? 'Edit package' : 'New package'}</h2><p>Maklumat package disimpan sebagai master data Milas Travel.</p></div><button type="button" class="modal-close" data-close-product>×</button></div><div class="product-form-content"><div class="send-section-title">PRODUCT INFORMATION</div><div class="editor-grid">${input('name','Name package')}${input('productId','Product ID Milas')}${input('supplierName','Supplier Name')}${input('supplierCode','Supplier code')}<label>Tour category<select name="tourCategory"><option value="">Pilih kategori tour</option>${tourCategories.map(category => `<option value="${category}" ${product.tourCategory === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label>${locationPicker}<label>Date publish<input type="date" name="datePublish" value="${product.datePublish || todayIso()}" /></label><label>Status<select name="status">${productStatuses.map(status => `<option value="${status}" ${product.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label></div><div class="send-section-title">PACKAGE OVERVIEW</div><div class="editor-grid">${textarea('overview','Package overview')}</div><div class="send-section-title">ITINERARY</div><div class="editor-grid">${itineraryEditor(product.itinerary)}</div><div class="send-section-title">WHAT'S INCLUDED / EXCLUDED</div><div class="editor-grid">${bulletTextarea('included',"What's included")}${bulletTextarea('excluded',"What's excluded")}</div><div class="send-section-title">DEPARTURE / PICK UP INFORMATION</div><div class="editor-grid">${textarea('departureInfo','Departure / pick up information')}</div><div class="send-section-title">PRICING</div><div class="editor-grid">${pricingEditor(product.pricing)}</div><div class="send-section-title">AVAILABILITY CALENDAR</div><div class="editor-grid">${textarea('availability','Availability calendar')}</div><div class="send-section-title">ADD-ONS</div><div class="editor-grid">${addonEditor(product.addons)}</div><div class="send-section-title">CANCELLATION POLICY</div><div class="editor-grid">${textarea('cancellationPolicy','Cancellation policy')}</div>${productHistorySection(product.history)}</div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-product>Cancel</button><button type="submit" class="primary-btn">Save package</button></div></form></div>`;
}
function tourPackagesView() {
  const products = storedTourProducts();
  return `<article class="panel list-panel products-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search tour packages..." /></div><select><option>All statuses</option>${productStatuses.map(status => `<option>${status}</option>`).join('')}</select><button class="ghost-btn">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Product ID Milas</th><th>Package</th><th>Supplier</th><th>Date publish</th><th>Status</th><th></th></tr></thead><tbody>${products.map(product => `<tr><td class="id-cell">${product.productId}</td><td><strong>${product.name || '—'}</strong></td><td>${product.supplierName || '—'}</td><td>${formatTravelDate(product.datePublish)}</td><td><span class="status ${productStatusClass(product.status)}">${product.status}</span></td><td><button class="ghost-btn product-open" data-open-product="${encodeURIComponent(JSON.stringify(product))}">Open</button></td></tr>`).join('')}</tbody></table></div></article>`;
}

function pipelineView() {
  const leads = storedLeads();
  const stages = ['New Lead', 'Contacted', 'Quotation Sent', 'Follow-up', 'Invoice Sent', 'Won', 'Lost'];
  return `<section class="pipeline-grid">${stages.map(status => { const stageLeads = leads.filter(lead => lead.status === status); return `<article class="pipeline-column"><div class="pipeline-title"><strong>${status}</strong><span>${stageLeads.length}</span></div>${stageLeads.length ? stageLeads.map(lead => `<div class="lead-card" role="button" tabindex="0" title="Open lead" data-open-lead="${encodeURIComponent(JSON.stringify(lead))}"><strong>${lead.customer || '—'}</strong><small>${lead.phone || lead.email || lead.source || '—'}</small><span>${lead.packageName || lead.value || '—'}</span></div>`).join('') : '<div class="empty-bookings">Tiada lead.</div>'}</article>`; }).join('')}</section>`;
}

function calendarView() { return `<article class="panel calendar-panel"><div class="calendar-head"><button class="ghost-btn">←</button><strong>September 2026</strong><button class="ghost-btn">→</button></div><div class="calendar-week">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-days">${Array.from({length:30},(_,i)=>`<button class="day ${[18,20,22,24,30].includes(i+1)?'has-trip':''}"><b>${i+1}</b>${[18,20,22,24,30].includes(i+1)?'<small>trip</small>':''}</button>`).join('')}</div></article>`; }

function upcomingView() {
  const selectedMonth = state.upcomingMonth || currentMonthKey();
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
  const bookings = sortOngoingBookings(storedBookings().filter(record => { const date = parseBookingDate(record.startDate); return date && date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonthNumber; }));
  return `<article class="panel upcoming-list"><div class="panel-head"><div><h2>Upcoming travel schedule</h2><p>Semua tempahan untuk bulan yang dipilih, disusun mengikut tarikh travel.</p></div><div class="upcoming-controls"><label for="upcomingMonth">Bulan</label><select id="upcomingMonth" class="upcoming-month-select">${upcomingMonthOptions(selectedMonth)}</select></div></div>${bookings.length ? bookings.map(record => { const date = parseBookingDate(record.startDate), formattedDate = formatTravelDate(record.startDate), packageName = packageDisplay(record.package || record.name), statusClass = record.status === 'ON GOING' ? 'amber-tag' : record.status === 'CONFIRMED' ? 'blue-tag' : 'teal-tag'; return `<div class="trip" data-upcoming-booking="${encodeURIComponent(JSON.stringify(record))}"><span class="date-box"><b>${String(date.getDate()).padStart(2, '0')}</b><small>${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}</small></span><section>${record.customer ? '<strong>' + record.customer + '</strong>' : ''}<strong>${packageName}</strong><small>${formattedDate} · Booking ID: ${record.orderId || '—'}</small></section><span class="${statusClass}">${record.status}</span></div>`; }).join('') : '<div class="empty-bookings">Tiada tempahan untuk bulan ini.</div>'}</article>`;
}

function reportsView() { return `<section class="report-grid"><article class="panel report-card"><span>Sales this month</span><strong>RM 84,620</strong><div class="report-bars"><i style="height:40%"></i><i style="height:58%"></i><i style="height:48%"></i><i style="height:76%"></i><i style="height:62%"></i><i style="height:90%"></i></div><small>Jan — Jun 2026</small></article><article class="panel report-card"><span>Lead conversion rate</span><strong>14.5%</strong><div class="progress-line"><i style="width:64%"></i></div><small>+3.2% vs previous month</small></article><article class="panel report-card"><span>Cash collection</span><strong>RM 52,400</strong><div class="progress-line amber-line"><i style="width:62%"></i></div><small>62% of confirmed booking value</small></article></section>`; }

function allBookingsView() {
  const groups = [
    ['COMPLETE','2,302','complete',[]],
    ['CANCEL','193','cancel',[]],
    ['ON GOING','1','ongoing',[['Sepilok Orangutan, Sun Bear & City Tour [Share Tour]','12/11/25','2 days ago','Farzana Milas Travel','GYG','Pending','Day Tour']]],
    ['CONFIRMED','10','confirmed',[
      ['2D1N Turtle Island (Fullboard)','1/29/26','Tomorrow','Azra','Viator','Confirm','Multi Day'],
      ['Semporna Island Hopping [Package A]','12/19/25','9/23/26','Farzana Milas Travel','GYG','Pending','Day Tour'],
      ['Semporna Island Hopping [Package C]','12/19/25','9/24/26','Farzana Milas Travel','GYG','Pending','Day Tour'],
    ]],
    ['NEW ORDER','0','new-order',[]],
  ];
  return `<section class="all-bookings"><div class="booking-toolbar"><div class="search-field">⌕ <input placeholder="Search bookings..." /></div><button class="view-control">▤ View: List</button><button class="view-control">▦ Group by: Status</button><button class="view-control">Filter</button><span class="toolbar-spacer"></span><button class="primary-btn">+ Add Booking</button></div>${groups.map(([name,count,tone,rows])=>`<article class="booking-status-group ${name==='ON GOING'?'expanded':''}"><button class="status-group-heading"><span class="status-caret">${name==='ON GOING'?'⌄':'›'}</span><span class="booking-status ${tone}"><b>●</b>${name}</span><span class="booking-count">${count}</span>${name==='ON GOING'?'<span class="status-actions">••• &nbsp;＋</span>':''}</button>${name==='ON GOING'?`<div class="booking-grid-wrap"><table class="clickup-booking-table"><thead><tr><th>Name</th><th>Booking Date</th><th>Start date</th><th>Assignee</th><th>Channel Platform</th><th>Supplier Confirmation</th><th>Type</th><th>Customer</th><th>Package</th><th>Adult</th><th>Children</th><th>Sales Amount</th><th>Payment</th><th>Email</th><th>OrderID</th><th>Order Proof/Payment</th><th>Invoice</th><th>Comm 5%</th></tr></thead><tbody>${rows.map(row=>`<tr><td><span class="booking-check">✓</span><strong>${row[0]}</strong></td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td><span class="field-chip pink">${row[4]}</span></td><td><span class="field-chip ${row[5]==='Confirm'?'green':'yellow'}">${row[5]}</span></td><td><span class="field-chip blue">${row[6]}</span></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td class="clip">⌕</td><td class="clip">⌕</td><td>—</td></tr>`).join('')}</tbody></table><button class="add-task">＋ Add Task</button></div>`:''}</article>`).join('')}</section>`;
}

function bookingTable(rows) {
  return `<div class="booking-grid-wrap"><table class="clickup-booking-table"><thead><tr>${['Name','Booking Date','Start date','Assignee','Channel Platform','Supplier Confirmation','Type','Customer','Package','Adult','Children','Sales Amount','Payment','Email','OrderID','Order Proof/Payment','Invoice','Comm 5%'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td><span class="booking-check">✓</span><strong>${row[0]}</strong></td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td><span class="field-chip pink">${row[4]}</span></td><td><span class="field-chip ${row[5]==='Confirm'?'green':'yellow'}">${row[5]}</span></td><td><span class="field-chip blue">${row[6]}</span></td><td>${row[7]||'—'}</td><td>${row[8]||'—'}</td><td>${row[9]||'—'}</td><td>${row[10]||'—'}</td><td>${row[11]||'—'}</td><td>${row[12]||'—'}</td><td>${row[13]||'—'}</td><td>${row[14]||'—'}</td><td class="clip">${row[15]||'⌕'}</td><td class="clip">${row[16]||'⌕'}</td><td>${row[17]||'—'}</td></tr>`).join('')}</tbody></table><button class="add-task">＋ Add Task</button></div>`;
}

function allBookingsViewV2() {
  const groups = [
    ['COMPLETE','2,302','complete',[['Completed Kinabatangan River Tour','08/09/26','Completed','Sarah Ahmad','Website','Confirm','Multi Day','Sarah Lim','Kinabatangan','2','0','RM 3,640','Paid','sarah@example.com','MIL-260908-002','⌕','⌕','5%']]],
    ['CANCEL','193','cancel',[['Cancelled Mabul Island Booking','02/09/26','Cancelled','Afiq Milas','OTA','Pending','Day Tour','Daniel Wong','Mabul Island','2','0','RM 2,240','Refunded','daniel@example.com','MIL-260902-004','⌕','⌕','—']]],
    ['ON GOING','1','ongoing',[['Sepilok Orangutan, Sun Bear & City Tour [Share Tour]','12/11/25','2 days ago','Farzana Milas Travel','GYG','Pending','Day Tour','—','Sepilok','—','—','—','Paid','—','GYG83XRZAA7N','⌕','⌕','7.32']]],
    ['CONFIRMED','10','confirmed',[['2D1N Turtle Island (Fullboard)','1/29/26','Tomorrow','Azra','Viator','Confirm','Multi Day','—','Turtle Island','2','0','RM 2,900','Deposit paid','—','MIL-260929-001','⌕','⌕','5%'],['Semporna Island Hopping [Package A]','12/19/25','9/23/26','Farzana Milas Travel','GYG','Pending','Day Tour','—','Semporna','2','0','RM 2,240','Deposit paid','—','MIL-260923-002','⌕','⌕','5%']]],
    ['NEW ORDER','0','new-order',[]],
  ];
  return `<section class="all-bookings"><div class="booking-toolbar"><div class="search-field">⌕ <input placeholder="Search bookings..." /></div><button class="view-control">▤ View: List</button><button class="view-control">▦ Group by: Status</button><button class="view-control">Filter</button><span class="toolbar-spacer"></span></div>${groups.map(([name,count,tone,rows],index)=>`<article class="booking-status-group ${index===2?'expanded':''}"><button class="status-group-heading"><span class="status-caret">${index===2?'⌄':'›'}</span><span class="booking-status ${tone}"><b>●</b>${name}</span><span class="booking-count">${count}</span><span class="status-actions">••• &nbsp;＋</span></button>${rows.length?bookingTable(rows):`<div class="empty-bookings">No bookings in this status</div>`}</article>`).join('')}</section>`;
}

const bookingSeed = [
  { status:'ON GOING', name:'Sepilok Orangutan, Sun Bear & City Tour [Share Tour]', bookingDate:'12/11/25', startDate:'2 days ago', assignee:'Farzana Milas Travel', channel:'GYG', supplier:'Pending', type:'Day Tour', customer:'', package:'Sepilok', adult:'', children:'', sales:'', payment:'Paid', email:'', orderId:'GYG83XRZAA7N', proof:'Attached', invoice:'Attached', commission:'7.32' },
  { status:'CONFIRMED', name:'2D1N Turtle Island (Fullboard)', bookingDate:'1/29/26', startDate:'Tomorrow', assignee:'Azra', channel:'Viator', supplier:'Confirm', type:'Multi Day', customer:'', package:'Turtle Island', adult:'2', children:'0', sales:'RM 2,900', payment:'Deposit paid', email:'', orderId:'MIL-260929-001', proof:'Attached', invoice:'Attached', commission:'5%' },
  { status:'CONFIRMED', name:'Semporna Island Hopping [Package A]', bookingDate:'12/19/25', startDate:'9/23/26', assignee:'Farzana Milas Travel', channel:'GYG', supplier:'Pending', type:'Day Tour', customer:'', package:'Semporna', adult:'2', children:'0', sales:'RM 2,240', payment:'Deposit paid', email:'', orderId:'MIL-260923-002', proof:'Attached', invoice:'Attached', commission:'5%' },
  { status:'COMPLETE', name:'Completed Kinabatangan River Tour', bookingDate:'08/09/26', startDate:'Completed', assignee:'Sarah Ahmad', channel:'Website', supplier:'Confirm', type:'Multi Day', customer:'Sarah Lim', package:'Kinabatangan', adult:'2', children:'0', sales:'RM 3,640', payment:'Paid', email:'sarah@example.com', orderId:'MIL-260908-002', proof:'Attached', invoice:'Attached', commission:'5%' },
  { status:'CANCEL', name:'Cancelled Mabul Island Booking', bookingDate:'02/09/26', startDate:'Cancelled', assignee:'Afiq Milas', channel:'OTA', supplier:'Pending', type:'Day Tour', customer:'Daniel Wong', package:'Mabul Island', adult:'2', children:'0', sales:'RM 2,240', payment:'Refunded', email:'daniel@example.com', orderId:'MIL-260902-004', proof:'Attached', invoice:'Attached', commission:'—' },
];
function parseBookingDate(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const now = new Date();
  if (normalized === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (normalized === 'tomorrow') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const relativeMatch = /^(\d+)\s+days?\s+ago$/.exec(normalized);
  if (relativeMatch) return new Date(now.getFullYear(), now.getMonth(), now.getDate() - Number(relativeMatch[1]));
  let year, month, day;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (isoMatch) [, year, month, day] = isoMatch;
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(normalized);
  if (!isoMatch && slashMatch) {
    let [, first, second, rawYear] = slashMatch;
    year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    day = Number(first) > 12 ? first : second;
    month = Number(first) > 12 ? second : first;
  }
  const textMatch = /^(\d{1,2})\s+(jan|feb|mac|mar|apr|mei|may|jun|jul|ogs|aug|sep|sept|okt|oct|nov|dis|dec)\.?\s+(\d{4})$/i.exec(normalized);
  if (!isoMatch && !slashMatch && textMatch) {
    const monthMap = { jan:1, feb:2, mac:3, mar:3, apr:4, mei:5, may:5, jun:6, jul:7, ogs:8, aug:8, sep:9, sept:9, okt:10, oct:10, nov:11, dis:12, dec:12 };
    day = textMatch[1]; month = monthMap[textMatch[2].toLowerCase()]; year = textMatch[3];
  }
  if (!year || !month || !day) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatTravelDate(value) {
  const isoDate = parseBookingDate(value);
  if (isoDate) return [isoDate.getDate(), isoDate.getMonth() + 1, isoDate.getFullYear()].map((part, index) => index < 2 ? String(part).padStart(2, '0') : String(part)).join('/');
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value || '');
  if (slashMatch) {
    let [, first, second, rawYear] = slashMatch;
    const day = Number(first) > 12 ? first : second;
    const month = Number(first) > 12 ? second : first;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  const textMatch = /^(\d{1,2})\s+(jan|feb|mac|mar|apr|mei|may|jun|jul|ogs|aug|sep|sept|okt|oct|nov|dis|dec)\.?\s+(\d{4})$/i.exec((value || '').trim());
  if (textMatch) {
    const monthMap = { jan:1, feb:2, mac:3, mar:3, apr:4, mei:5, may:5, jun:6, jul:7, ogs:8, aug:8, sep:9, sept:9, okt:10, oct:10, nov:11, dis:12, dec:12 };
    return `${textMatch[1].padStart(2, '0')}/${String(monthMap[textMatch[2].toLowerCase()]).padStart(2, '0')}/${textMatch[3]}`;
  }
  return value || '—';
}
function syncBookingStatuses(records) {
  const today = new Date();
  let changed = false;
  records.forEach(record => {
    if (record.status !== 'CONFIRMED') return false;
    const travelDate = parseBookingDate(record.startDate);
    if (!travelDate || travelDate.getFullYear() !== today.getFullYear() || travelDate.getMonth() !== today.getMonth()) return false;
    record.status = 'ON GOING';
    changed = true;
  });
  if (changed) {
    persistSharedCollection('bookings', records);
  }
  return records;
}
function sortOngoingBookings(rows) {
  return [...rows].sort((a, b) => {
    const aDate = parseBookingDate(a.startDate), bDate = parseBookingDate(b.startDate);
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate - bDate;
  });
}
function invoiceBookingFields(invoice, summary) {
  const source = {...(invoice.quotationSnapshot || {}), ...invoice};
  const packageName = source.packageName || 'Invoice';
  return {
    customer: source.customer || '',
    phone: source.phone || '',
    email: source.email || '',
    nationality: source.nationality || '',
    package: packageName,
    optionalPackage: source.optionalPackage || '',
    addOns: source.selectedAddons || [],
    selectedAddons: source.selectedAddons || [],
    adult: source.adults || '0',
    children: source.children || '0',
    infant: source.infants || '0',
    singleSupplement: source.singleSupplement || '0',
    sales: 'RM ' + summary.total.toFixed(2),
    total: 'RM ' + summary.total.toFixed(2),
    payment: summary.balance <= 0 ? 'Paid' : 'Pending',
    paymentAmount: summary.paid.toFixed(2),
    amountPayment: summary.paid.toFixed(2),
    amountOutstanding: summary.balance.toFixed(2),
    balancePayment: summary.balance.toFixed(2)
  };
}
function reconcileInvoiceBookings(records) {
  const invoices = storedInvoices();
  const knownInvoiceIds = new Set(records.map(record => record.invoiceId || record.invoice).filter(Boolean));
  let changed = false;
  invoices.forEach(invoice => {
    const summary = invoicePaymentState(invoice);
    if (!invoice.id || summary.paid <= 0) return;
    const existing = records.find(record => record.invoiceId === invoice.id || record.invoice === invoice.id);
    if (existing) {
      const fields = invoiceBookingFields(invoice, summary);
      const fieldsChanged = Object.entries(fields).some(([key, value]) => JSON.stringify(existing[key]) !== JSON.stringify(value));
      if (fieldsChanged) { Object.assign(existing, fields); changed = true; }
      knownInvoiceIds.add(invoice.id);
      return;
    }
    const packageName = invoice.packageName || invoice.quotationSnapshot?.packageName || 'Invoice';
    records.unshift({
      status: 'NEW ORDER',
      name: packageName + ' — ' + invoice.id,
      bookingDate: invoice.issuedAt ? new Intl.DateTimeFormat('en-GB').format(new Date(invoice.issuedAt)) : new Date().toLocaleDateString('en-GB'),
      startDate: invoice.travelDate || '',
      assignee: 'Afiq Milas',
      channel: 'Quotation',
      supplier: 'Pending',
      type: 'Multi Day',
      customer: invoice.customer || '',
      phone: invoice.phone || '',
      nationality: invoice.nationality || invoice.quotationSnapshot?.nationality || '',
      package: packageName,
      optionalPackage: invoice.optionalPackage || invoice.quotationSnapshot?.optionalPackage || '',
      addOns: invoice.selectedAddons || invoice.quotationSnapshot?.selectedAddons || [],
      selectedAddons: invoice.selectedAddons || invoice.quotationSnapshot?.selectedAddons || [],
      adult: invoice.adults || '0',
      children: invoice.children || '0',
      infant: invoice.infants || '0',
      singleSupplement: invoice.singleSupplement || '0',
      sales: 'RM ' + summary.total.toFixed(2),
      total: 'RM ' + summary.total.toFixed(2),
      payment: summary.balance <= 0 ? 'Paid' : 'Pending',
      paymentAmount: summary.paid.toFixed(2),
      amountPayment: summary.paid.toFixed(2),
      amountOutstanding: summary.balance.toFixed(2),
      balancePayment: summary.balance.toFixed(2),
      email: invoice.email || '',
      orderId: nextBookingId(records),
      proof: 'Attached',
      invoice: invoice.id,
      invoiceId: invoice.id,
      commission: '5%'
    });
    knownInvoiceIds.add(invoice.id);
    changed = true;
  });
  if (changed) persistSharedCollection('bookings', records);
  return records;
}
function storedBookings() {
  if (Array.isArray(sharedData.bookings)) return syncBookingStatuses(reconcileInvoiceBookings(sharedData.bookings));
  try {
    const records = JSON.parse(localStorage.getItem('milas-bookings') || 'null') || bookingSeed.map(record => ({...record}));
    return syncBookingStatuses(reconcileInvoiceBookings(records));
  } catch { return syncBookingStatuses(reconcileInvoiceBookings(bookingSeed.map(record => ({...record})))); }
}
function bookingCount(records, status) {
  return records.filter(item => item.status === status).length.toLocaleString('en-US');
}
function upcomingTodayCount() {
  const today = new Date();
  return storedBookings().filter(record => {
    if (record.status === 'CANCEL' || record.status === 'COMPLETE') return false;
    const travelDate = parseBookingDate(record.startDate);
    return travelDate && travelDate.getFullYear() === today.getFullYear() && travelDate.getMonth() === today.getMonth() && travelDate.getDate() === today.getDate();
  }).length;
}
function newOrderCount() {
  return storedBookings().filter(record => record.status === 'NEW ORDER').length;
}
function newLeadCount() {
  return storedLeads().filter(lead => /new\s*lead/i.test(String(lead.status || ''))).length;
}
function followUpsDueCount() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return storedLeads().filter(lead => {
    if (/^(done|completed|closed)$/i.test(String(lead.followUpStatus || ''))) return false;
    const dueDate = parseBookingDate(lead.followUpDate);
    return dueDate && dueDate <= today;
  }).length;
}
function isBookingSent(bookingId) {
  try {
    if (bookingId === 'MIL-260916-005') return localStorage.getItem('milas-confirmed-send-005') === 'true';
    const unsent = JSON.parse(localStorage.getItem('milas-unsent-bookings') || '{}');
    if (unsent[bookingId]) return false;
    return !!JSON.parse(localStorage.getItem('milas-sent-bookings') || '{}')[bookingId];
  } catch { return false; }
}
function markBookingSent(bookingId, channel) {
  try {
    const sent = JSON.parse(localStorage.getItem('milas-sent-bookings') || '{}');
    const unsent = JSON.parse(localStorage.getItem('milas-unsent-bookings') || '{}');
    delete unsent[bookingId];
    sent[bookingId] = { sentAt: new Date().toISOString(), channel };
    localStorage.setItem('milas-unsent-bookings', JSON.stringify(unsent));
    localStorage.setItem('milas-sent-bookings', JSON.stringify(sent));
    const verified = JSON.parse(localStorage.getItem('milas-verified-sent') || '{}');
    verified[bookingId] = { sentAt: new Date().toISOString(), channel };
    localStorage.setItem('milas-verified-sent', JSON.stringify(verified));
    if (bookingId === 'MIL-260916-005') localStorage.setItem('milas-confirmed-send-005', 'true');
  } catch {}
}
function repairUnsentBooking(bookingId) {
  try {
    const unsent = JSON.parse(localStorage.getItem('milas-unsent-bookings') || '{}');
    unsent[bookingId] = true;
    localStorage.setItem('milas-unsent-bookings', JSON.stringify(unsent));
  } catch {}
}
repairUnsentBooking('MIL-260916-005');
function nextBookingId(records) {
  const now = new Date(), yy = String(now.getFullYear()).slice(-2), mm = String(now.getMonth()+1).padStart(2,'0'), dd = String(now.getDate()).padStart(2,'0');
  const prefix = `MIL-${yy}${mm}${dd}-`, sequence = records.filter(item => item.orderId?.startsWith(prefix)).map(item => Number(item.orderId.slice(prefix.length))).filter(Number.isFinite);
  return `${prefix}${String(Math.max(0, ...sequence)+1).padStart(3,'0')}`;
}
function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function registeredStaff() {
  return ['Afiq Milas', 'Sarah Ahmad', 'Rizal Karim'];
}

function bookingSources() {
  return ['WhatsApp', 'Website', 'Facebook / Instagram', 'GetYourGuide', 'Viator', 'Referral', 'Repeat customer', 'Walk-in', 'Travel agent / partner', 'Other'];
}

function paymentStatuses() {
  return ['Pending', 'Paid'];
}
function bookingPaymentStatus(record) {
  const balance = Number(String(record?.balancePayment ?? '').replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(balance) && String(record?.balancePayment ?? '').trim() !== '') return balance <= 0 ? 'Paid' : 'Pending';
  return /^(paid|full payment)/i.test(String(record?.payment || '')) ? 'Paid' : 'Pending';
}

function bookingSupplierMessage(record) {
  return ['Booking request', 'Booking ID: ' + (record.orderId || '—'), 'Customer: ' + (record.customer || '—'), 'Package: ' + packageDisplay(record.package || record.name), 'Travel date: ' + formatTravelDate(record.startDate), 'Travellers: ' + (record.adult || '0') + ' adult, ' + (record.children || '0') + ' child', 'Sales amount: ' + (record.sales || '—'), 'Payment status: ' + bookingPaymentStatus(record)].join('\n');
}

function bookingSendModal(record) {
  const message = bookingSupplierMessage(record);
  return '<div class="modal-backdrop" id="sendBookingModal"><form class="booking-modal send-booking-modal" id="sendBookingForm"><div class="modal-head"><div><span class="eyebrow">Booking ' + (record.orderId || '') + '</span><h2>Send to supplier</h2><p>Semak maklumat sebelum buka WhatsApp atau email.</p></div><button type="button" class="modal-close" data-close-send>×</button></div><div class="editor-grid"><label>Channel<select name="sendChannel"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></label>' + phoneFieldMarkup('contactPhone', 'Client phone', bookingPhone(record), true) + '<label>Supplier contact<input name="supplierContact" placeholder="No. WhatsApp atau email supplier" required /></label><label class="full-width">Message<textarea name="message" rows="8" readonly>' + message + '</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-send>Cancel</button><button type="submit" class="primary-btn">Open draft</button></div></form></div>';
}

function bookingEditor(record = {}) {
  record = {...record};
  if (!record.orderId) record.orderId = nextBookingId(storedBookings());
  const fields = [['name','Booking name'],['bookingDate','Booking date'],['startDate','Start date'],['assignee','Assignee'],['channel','Channel platform'],['supplier','Supplier confirmation'],['type','Type'],['customer','Customer'],['package','Package'],['adult','Adults'],['children','Children'],['sales','Sales amount'],['payment','Payment'],['email','Email'],['orderId','OrderID'],['proof','Order proof / payment'],['invoice','Invoice'],['commission','Commission 5%']];
  return `<div class="modal-backdrop" id="bookingModal"><form class="booking-modal" id="bookingForm"><div class="modal-head"><div><span class="eyebrow">All Bookings</span><h2>${record.orderId?'Edit booking':'New booking'}</h2><p>Maklumat booking boleh dikemas kini di satu tempat.</p></div><button type="button" class="modal-close" data-close-modal>×</button></div><div class="editor-grid">${fields.map(([key,label])=>`<label>${label}<input name="${key}" value="${record[key]||''}" ${key==='orderId'?'readonly':''} ${key==='adult'||key==='children'?'type="number" min="0"':''} /></label>`).join('')}<label>Status<select name="status">${['NEW ORDER','CONFIRMED','ON GOING','COMPLETE','CANCEL'].map(status=>`<option ${record.status===status?'selected':''}>${status}</option>`).join('')}</select></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-modal>Cancel</button><button type="submit" class="primary-btn">Save booking</button></div></form></div>`;
}

function storedTourPackages() {
  const products = storedTourProducts();
  const catalogue = products.map(product => ({ id: product.productId, name: product.name }));
  try {
    const saved = JSON.parse(localStorage.getItem('milas-tour-packages') || 'null');
    return catalogue.length ? catalogue : (Array.isArray(saved) && saved.length ? saved : catalogue);
  } catch { return catalogue; }
}

function packageDisplay(value) {
  const packageRecord = storedTourPackages().find(item => item.id === value || item.name === value);
  return packageRecord ? `${packageRecord.id} — ${packageRecord.name}` : (value || '—');
}

function packageRates(packageId) {
  const product = storedTourProducts().find(item => item.productId === packageId || item.name === packageId);
  const pricingRecords = pricingDataFromValue(product?.pricing);
  const pricing = pricingRecords.find(item => item.optional && !legacyPricingOptions.includes(item.option)) || pricingRecords[0];
  const price = key => {
    const value = pricing?.prices?.[key];
    const basePrice = value && typeof value === 'object' ? value.basePrice : '';
    const parsed = Number(basePrice);
    if (Number.isFinite(parsed)) return parsed;
    const legacy = String(value || '').match(/([0-9]+(?:\.[0-9]+)?)/)?.[1];
    return legacy ? Number(legacy) : 0;
  };
  if (pricing) return { adult: price('adult'), child: price('child'), infant: price('infant') };
  const legacyAdult = String(product?.pricing || '').match(/Adult\s*:\s*(?:RM\s*)?([0-9,]+(?:\.[0-9]+)?)/i)?.[1];
  return { adult: legacyAdult ? Number(legacyAdult.replaceAll(',', '')) : 0, child: 0, infant: 0 };
}
function bookingSalesAmount(form) {
  const rates = packageRates(form.elements.package?.value);
  const count = key => Math.max(0, Number(form.elements[key]?.value || 0) || 0);
  const amount = count('adult') * rates.adult + count('children') * rates.child + count('infant') * rates.infant;
  const discountInput = form.elements.discount || [...form.querySelectorAll('input')].find(input => /discount/i.test(input.closest('label')?.textContent || ''));
  const discount = Math.min(100, Math.max(0, Number(String(discountInput?.value || 0).replace('%', '').trim()) || 0));
  const salesAmount = amount * (1 - discount / 100);
  return amount > 0 ? `RM ${salesAmount.toFixed(2)}` : '';
}
function updateBookingSales(form) {
  const salesField = form?.querySelector('[data-auto-sales]');
  if (salesField) salesField.value = bookingSalesAmount(form);
}
function isCompletedBooking(record) {
  return String(record?.status || '').trim().toUpperCase() === 'COMPLETE';
}
function bookingSalesValue(record) {
  return Number(String(record?.sales ?? record?.value ?? 0).replace(/[^0-9.-]/g, '') || 0);
}

function bookingEditor(record = {}) {
  record = {...record}; const isNew = !record.orderId; if (isNew) record.orderId = nextBookingId(storedBookings());
  record.payment = bookingPaymentStatus(record);
  const fields = getBookingFields(), packages = storedTourPackages();
  const packageOptions = `<option value="">Pilih tour package...</option>${packages.map(item => `<option value="${item.id}" ${record.package===item.id||record.package===item.name?'selected':''}>${item.id} — ${item.name}</option>`).join('')}${record.package && !packages.some(item => item.id===record.package || item.name===record.package) ? `<option selected value="${record.package}">Existing — ${record.package}</option>` : ''}`;
  const fieldMarkup = fields.filter(([, , visible]) => visible !== false).map(([key,label]) => key === 'payment'
    ? '<label>Payment<select name="payment"><option value="">Pilih status payment...</option>' + paymentStatuses().map(status => '<option value="' + status + '" ' + (record.payment===status ? 'selected' : '') + '>' + status + '</option>').join('') + (record.payment && !paymentStatuses().includes(record.payment) ? '<option selected value="' + record.payment + '">Existing — ' + record.payment + '</option>' : '') + '</select></label>'
    : key === 'channel'
    ? '<label>Source<select name="channel"><option value="">Pilih source...</option>' + bookingSources().map(source => '<option value="' + source + '" ' + (record.channel===source ? 'selected' : '') + '>' + source + '</option>').join('') + (record.channel && !bookingSources().includes(record.channel) ? '<option selected value="' + record.channel + '">Existing — ' + record.channel + '</option>' : '') + '</select></label>'
    : key === 'assignee'
    ? '<label>Assignee<select name="assignee"><option value="">Pilih staff...</option>' + registeredStaff().map(staff => '<option value="' + staff + '" ' + (record.assignee===staff ? 'selected' : '') + '>' + staff + '</option>').join('') + '</select></label>'
    : key === 'startDate'
    ? '<label>Start date<input type="date" name="startDate" value="' + (/^\d{4}-\d{2}-\d{2}$/.test(record.startDate||'') ? record.startDate : '') + '" min="' + todayIso() + '" required /></label>'
    : key === 'phone'
    ? phoneFieldMarkup('phone', label, record.phone)
    : key === 'package'
    ? `<label>${label}<select name="package">${packageOptions}</select></label>`
    : key === 'sales'
    ? `<label>${label}<input name="sales" value="${record.sales||''}" data-auto-sales readonly placeholder="Auto kira dari harga package" /></label>`
    : `<label>${label}<input name="${key}" value="${record[key]||''}" ${key==='orderId'?'readonly':''} ${key==='adult'||key==='children'||key==='infant'?'type="number" min="0"':''} ${key==='discount'?'type="number" min="0" max="100" step="0.01" placeholder="0"':''} /></label>`).join('');
  return `<div class="modal-backdrop" id="bookingModal"><form class="booking-modal" id="bookingForm"><div class="modal-head"><div><span class="eyebrow">All Bookings</span><h2>${isNew?'New booking':'Edit booking'}</h2><p>Maklumat booking boleh dikemas kini di satu tempat.</p></div><div class="modal-head-actions"><button type="button" class="view-control" data-customize-fields>⚙ Susun field</button><button type="button" class="modal-close" data-close-modal>×</button></div></div><div class="editor-grid">${fieldMarkup}<label>Status<select name="status">${['NEW ORDER','CONFIRMED','ON GOING','COMPLETE','CANCEL'].map(status=>`<option ${record.status===status?'selected':''}>${status}</option>`).join('')}</select></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-modal>Cancel</button><button type="submit" class="primary-btn">Save booking</button></div></form></div>`;
}

function fieldManager() {
  const fields = getBookingFields();
  return `<div class="modal-backdrop" id="fieldManager"><section class="field-manager"><div class="modal-head"><div><span class="eyebrow">New Booking</span><h2>Susun borang</h2><p>Tarik field secara bebas untuk ubah susunan.</p></div><button type="button" class="modal-close" data-close-fields>×</button></div><div class="field-manager-list">${fields.map(([key,label,visible],i)=>`<div class="field-manager-row" draggable="true" data-field-row data-field-index="${i}"><span class="drag-handle">☷</span><strong>${label}</strong><small>${key==='orderId'?'System field':''}</small><label class="field-toggle"><input type="checkbox" data-field-toggle="${key}" ${key==='orderId'||visible!==false?'checked':''} ${key==='orderId'?'disabled':''} /> <span>Show</span></label><button class="field-move" data-field-move="up" data-field-index="${i}" ${i===0?'disabled':''}>↑</button><button class="field-move" data-field-move="down" data-field-index="${i}" ${i===fields.length-1?'disabled':''}>↓</button></div>`).join('')}</div><div class="add-field-row"><input id="newFieldName" placeholder="New field name, e.g. Hotel / Room type" /><button class="ghost-btn" data-add-field>＋ Add field</button></div><div class="modal-actions"><button type="button" class="primary-btn" data-close-fields>Done</button></div></section></div>`;
}
function allBookingsViewV3() {
  const records = storedBookings();
  const groups = ['COMPLETE','CANCEL','ON GOING','CONFIRMED','NEW ORDER'];
  return `<section class="all-bookings"><div class="booking-toolbar"><div class="search-field">⌕ <input placeholder="Search bookings..." /></div><button class="view-control">▤ View: List</button><button class="view-control">▦ Group by: Status</button><button class="view-control">Filter</button><span class="toolbar-spacer"></span></div>${groups.map(status=>{const rows=records.filter(r=>r.status===status);return `<article class="booking-status-group ${status==='ON GOING'?'expanded':''}"><button class="status-group-heading"><span class="status-caret">${status==='ON GOING'?'⌄':'›'}</span><span class="booking-status ${status==='COMPLETE'?'complete':status==='CANCEL'?'cancel':status==='ON GOING'?'ongoing':status==='CONFIRMED'?'confirmed':'new-order'}"><b>●</b>${status}</span><span class="booking-count">${bookingCount(records, status)}</span><span class="status-actions">••• &nbsp;＋</span></button><div class="booking-grid-wrap"><table class="clickup-booking-table"><thead><tr>${['Name','Booking Date','Start date','Assignee','Channel Platform','Supplier Confirmation','Type','Customer','Package','Adult','Children','Sales Amount','Payment','Email','OrderID','Order Proof/Payment','Invoice','Comm 5%'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr data-edit-booking="${encodeURIComponent(JSON.stringify(r))}"><td><span class="booking-check">✓</span><strong>${r.name}</strong></td><td>${r.bookingDate}</td><td>${r.startDate}</td><td>${r.assignee}</td><td><span class="field-chip pink">${r.channel}</span></td><td><span class="field-chip ${r.supplier==='Confirm'?'green':'yellow'}">${r.supplier}</span></td><td><span class="field-chip blue">${r.type}</span></td><td>${r.customer||'—'}</td><td>${r.package||'—'}</td><td>${r.adult||'—'}</td><td>${r.children||'—'}</td><td>${r.sales||'—'}</td><td>${r.payment||'—'}</td><td>${r.email||'—'}</td><td>${r.orderId||'—'}</td><td class="clip">${r.proof||'⌕'}</td><td class="clip">${r.invoice||'⌕'}</td><td>${r.commission||'—'}</td></tr>`).join(''):`<tr><td colspan="18" class="empty-cell">Tiada booking dalam status ini.</td></tr>`}</tbody></table><button class="add-task" data-new-booking>＋ Add Task</button></div></article>`;}).join('')}</section>`;
}

const defaultBookingFields = [['orderId','Booking ID'],['name','Booking name'],['bookingDate','Booking date'],['startDate','Start date'],['assignee','Assignee'],['channel','Channel platform'],['supplier','Supplier confirmation'],['type','Type'],['customer','Customer'],['phone','Phone number'],['email','Email'],['nationality','Nationality'],['package','Package'],['optionalPackage','Optional package'],['addOns','Add-ons'],['adult','Adults'],['children','Children'],['infant','Infants'],['singleSupplement','Single supplement'],['discount','Discount'],['sales','Sales amount'],['payment','Status payment'],['paymentAmount','Amount payment'],['amountOutstanding','Amount outstanding'],['total','Total'],['proof','Order proof / payment'],['invoice','Invoice'],['commission','Commission 5%']];
function getStoredBookingFields() { try { const fields = JSON.parse(localStorage.getItem('milas-booking-fields') || 'null') || defaultBookingFields.map(field => [...field]); const salesIndex = fields.findIndex(([key]) => key === 'sales'); const customerIndex = fields.findIndex(([key]) => key === 'customer'); if (!fields.some(([key]) => key === 'phone')) fields.splice(customerIndex >= 0 ? customerIndex + 1 : fields.length, 0, ['phone', 'Phone number', true]); if (!fields.some(([key]) => key === 'infant')) fields.splice(salesIndex >= 0 ? salesIndex : fields.length, 0, ['infant', 'Infants', true]); if (!fields.some(([key]) => key === 'discount') && !fields.some(([, label]) => /discount/i.test(label))) fields.splice(salesIndex >= 0 ? salesIndex : fields.length, 0, ['discount', 'Discount', true]); return fields; } catch { return defaultBookingFields.map(field => [...field]); } }
function getBookingFields() {
  const fields = getStoredBookingFields();
  const requiredFields = [['nationality', 'Nationality'], ['optionalPackage', 'Optional package'], ['addOns', 'Add-ons'], ['singleSupplement', 'Single supplement'], ['paymentAmount', 'Amount payment'], ['amountOutstanding', 'Amount outstanding'], ['total', 'Total']];
  requiredFields.forEach(([key, label]) => { if (!fields.some(([fieldKey]) => fieldKey === key)) fields.push([key, label, true]); });
  return fields;
}
function saveBookingFields(fields) { localStorage.setItem('milas-booking-fields', JSON.stringify(fields)); }
function fieldManager() {
  const fields = getBookingFields();
  return `<div class="modal-backdrop" id="fieldManager"><section class="field-manager"><div class="modal-head"><div><span class="eyebrow">New Booking</span><h2>Susun borang</h2><p>Pilih field, ubah susunan atau tambah field custom.</p></div><button type="button" class="modal-close" data-close-fields>×</button></div><div class="field-manager-list">${fields.map(([key,label,visible],i)=>`<div class="field-manager-row"><span class="drag-handle">☷</span><strong>${label}</strong><small>${key==='orderId'?'System field':''}</small><label class="field-toggle"><input type="checkbox" data-field-toggle="${key}" ${key==='orderId'||visible!==false?'checked':''} ${key==='orderId'?'disabled':''} /> <span>Show</span></label><button class="field-move" data-field-move="up" data-field-index="${i}" ${i===0?'disabled':''}>↑</button><button class="field-move" data-field-move="down" data-field-index="${i}" ${i===fields.length-1?'disabled':''}>↓</button></div>`).join('')}</div><div class="add-field-row"><input id="newFieldName" placeholder="New field name, e.g. Hotel / Room type" /><button class="ghost-btn" data-add-field>＋ Add field</button></div><div class="modal-actions"><button type="button" class="primary-btn" data-close-fields>Done</button></div></section></div>`;
}
function bookingEditorLegacy(record = {}) {
  record = {...record}; const isNew = !record.orderId; if (isNew) record.orderId = nextBookingId(storedBookings());
  const fields = getBookingFields();
  return `<div class="modal-backdrop" id="bookingModal"><form class="booking-modal" id="bookingForm"><div class="modal-head"><div><span class="eyebrow">All Bookings</span><h2>${isNew?'New booking':'Edit booking'}</h2><p>Maklumat booking boleh dikemas kini di satu tempat.</p></div><div class="modal-head-actions"><button type="button" class="view-control" data-customize-fields>⚙ Susun field</button><button type="button" class="modal-close" data-close-modal>×</button></div></div><div class="editor-grid">${fields.filter(([, , visible])=>visible!==false).map(([key,label])=>`<label>${label}<input name="${key}" value="${record[key]||''}" ${key==='orderId'?'readonly':''} ${key==='adult'||key==='children'?'type="number" min="0"':''} /></label>`).join('')}<label>Status<select name="status">${['NEW ORDER','CONFIRMED','ON GOING','COMPLETE','CANCEL'].map(status=>`<option ${record.status===status?'selected':''}>${status}</option>`).join('')}</select></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-modal>Cancel</button><button type="submit" class="primary-btn">Save booking</button></div></form></div>`;
}

function fieldManager() {
  const fields = getBookingFields();
  return `<div class="modal-backdrop" id="fieldManager"><section class="field-manager"><div class="modal-head"><div><span class="eyebrow">New Booking</span><h2>Susun borang</h2><p>Tarik field secara bebas untuk ubah susunan.</p></div><button type="button" class="modal-close" data-close-fields>×</button></div><div class="field-manager-list">${fields.map(([key,label,visible],i)=>`<div class="field-manager-row" draggable="true" data-field-row data-field-index="${i}"><span class="drag-handle">☷</span><strong>${label}</strong><small>${key==='orderId'?'System field':''}</small><label class="field-toggle"><input type="checkbox" data-field-toggle="${key}" ${key==='orderId'||visible!==false?'checked':''} ${key==='orderId'?'disabled':''} /> <span>Show</span></label><button class="field-move" data-field-move="up" data-field-index="${i}" ${i===0?'disabled':''}>↑</button><button class="field-move" data-field-move="down" data-field-index="${i}" ${i===fields.length-1?'disabled':''}>↓</button></div>`).join('')}</div><div class="add-field-row"><input id="newFieldName" placeholder="New field name, e.g. Hotel / Room type" /><button class="ghost-btn" data-add-field>＋ Add field</button></div><div class="modal-actions"><button type="button" class="primary-btn" data-close-fields>Done</button></div></section></div>`;
}

function bookingSummaryTableLegacy(rows) {
  const headers = ['Booking ID','Customer Name','Package','Travel date','Booking status','Sales amount','Status payment',''];
  return `<div class="booking-grid-wrap"><table class="booking-summary-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="booking-id"><strong>${r.orderId||'—'}</strong></td><td>${r.customer||'—'}</td><td>${r.package||r.name}</td><td>${r.startDate||'—'}</td><td><span class="booking-status-cell ${r.status.toLowerCase().replaceAll(' ','-')}">${r.status}</span></td><td>${r.sales||'—'}</td><td><span class="payment-cell">${bookingPaymentStatus(r)}</span></td><td><button class="open-booking" data-open-booking="${encodeURIComponent(JSON.stringify(r))}">Open <span>→</span></button></td></tr>`).join(''):`<tr><td colspan="8" class="empty-cell">Tiada booking dalam status ini.</td></tr>`}</tbody></table><button class="add-task">＋ Add Task</button></div>`;
}

function bookingSummaryTable(rows) {
  return bookingSummaryTableBase(rows).replace(/(<button class="open-booking" data-open-booking="([^"]+)">Open <span>→<\/span><\/button>)/g, (match, openButton, encoded) => {
    const record = JSON.parse(decodeURIComponent(encoded));
    if (record.status !== 'NEW ORDER') return openButton;
    const alreadySent = isBookingSent(record.orderId);
    return openButton + ' <button class="send-booking' + (alreadySent ? ' already-sent' : '') + '" data-send-booking>' + (alreadySent ? 'Already sent' : 'Send') + '</button>';
  });
}
function bookingSummaryTableBase(rows) {
  const headers = ['Booking ID','Customer Name','Package','Travel date','Booking status','Sales amount','Status payment',''];
  return `<div class="booking-grid-wrap"><table class="booking-summary-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="booking-id"><strong>${r.orderId||'—'}</strong></td><td>${r.customer||'—'}</td><td>${packageDisplay(r.package||r.name)}</td><td>${formatTravelDate(r.startDate)}</td><td><span class="booking-status-cell ${r.status.toLowerCase().replaceAll(' ','-')}">${r.status}</span></td><td>${r.sales||'—'}</td><td><span class="payment-cell">${bookingPaymentStatus(r)}</span></td><td><button class="open-booking" data-open-booking="${encodeURIComponent(JSON.stringify(r))}">Open <span>→</span></button></td></tr>`).join(''):`<tr><td colspan="8" class="empty-cell">Tiada booking dalam status ini.</td></tr>`}</tbody></table><button class="add-task">＋ Add Task</button></div>`;
}

function bookingCards(rows) {
  return `<div class="booking-cards">${rows.length ? rows.map(record => `<article class="booking-card"><div><strong>${record.orderId || '—'}</strong><span class="booking-status-cell ${String(record.status || '').toLowerCase().replaceAll(' ','-')}">${record.status || '—'}</span></div><h3>${record.customer || '—'}</h3><p>${packageDisplay(record.package || record.name)}</p><small>${formatTravelDate(record.startDate)} · ${record.sales || '—'}</small><button class="ghost-btn open-booking" data-open-booking="${encodeURIComponent(JSON.stringify(record))}">Open</button></article>`).join('') : '<div class="empty-bookings">Tiada booking yang sepadan.</div>'}</div>`;
}
function filteredBookings(records) {
  const search = String(state.bookingSearch || '').trim().toLowerCase();
  return records.filter(record => {
    const matchesStatus = !state.bookingFilter || state.bookingFilter === 'All statuses' || record.status === state.bookingFilter;
    const haystack = Object.values(record).join(' ').toLowerCase();
    return matchesStatus && (!search || haystack.includes(search));
  });
}
function allBookingsViewV4() {
  const records = filteredBookings(storedBookings()), groups = ['COMPLETE','CANCEL','ON GOING','CONFIRMED','NEW ORDER'];
  const groupedContent = state.bookingGroup === 'status' ? groups.map(status=>{const rows=status==='ON GOING'?sortOngoingBookings(records.filter(r=>r.status===status)):records.filter(r=>r.status===status); const expanded = state.bookingSearch ? rows.length > 0 : status === 'ON GOING'; return `<article class="booking-status-group ${expanded?'expanded':''}"><button class="status-group-heading"><span class="status-caret">${expanded?'⌄':'›'}</span><span class="booking-status ${status==='COMPLETE'?'complete':status==='CANCEL'?'cancel':status==='ON GOING'?'ongoing':status==='CONFIRMED'?'confirmed':'new-order'}"><b>●</b>${status}</span><span class="booking-count">${bookingCount(records, status)}</span><span class="status-actions">••• &nbsp;＋</span></button>${state.bookingView === 'cards' ? bookingCards(rows) : bookingSummaryTable(rows)}</article>`;}).join('') : (state.bookingView === 'cards' ? bookingCards(records) : bookingSummaryTable(records));
  return `<section class="all-bookings"><div class="booking-toolbar"><div class="search-field">⌕ <input data-booking-search value="${state.bookingSearch || ''}" placeholder="Search bookings..." /></div><button class="view-control" data-booking-view>▤ View: ${state.bookingView === 'cards' ? 'Cards' : 'List'}</button><button class="view-control" data-booking-group>▦ Group by: ${state.bookingGroup === 'none' ? 'None' : 'Status'}</button><button class="view-control" data-booking-filter>Filter${state.bookingFilter && state.bookingFilter !== 'All statuses' ? ': ' + state.bookingFilter : ''}</button><div class="booking-filter-menu" data-booking-filter-menu>${['All statuses','NEW ORDER','CONFIRMED','ON GOING','COMPLETE','CANCEL'].map(status => `<button type="button" data-booking-filter-value="${status}">${status}</button>`).join('')}</div><span class="toolbar-spacer"></span></div>${groupedContent}</section>`;
}

function tourPackageStatusSection(status, products) {
  return `<section class="package-status-section ${productStatusClass(status)}"><div class="package-status-heading"><div><h2>${status}</h2><p>${status === 'Draft' ? 'Package yang masih disediakan.' : status === 'Semak' ? 'Package yang menunggu semakan.' : status === 'Approved' ? 'Package yang telah diluluskan untuk digunakan.' : 'Package yang telah diterbitkan dan boleh digunakan.'}</p></div><span class="package-status-count">${products.length}</span></div>${products.length ? `<div class="table-wrap"><table><thead><tr><th>Product ID Milas</th><th>Package</th><th>Supplier</th><th>Date publish</th><th>Status</th><th></th></tr></thead><tbody>${products.map(product => `<tr><td class="id-cell">${product.productId}</td><td><strong>${product.name || '—'}</strong></td><td>${product.supplierName || '—'}</td><td>${formatTravelDate(product.datePublish)}</td><td><span class="status ${productStatusClass(product.status)}">${product.status}</span></td><td><button class="ghost-btn product-open" data-open-product="${encodeURIComponent(JSON.stringify(product))}">Open</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-bookings">Tiada package dalam status ini.</div>'}</section>`;
}
function tourPackagesViewGrouped() {
  const products = storedTourProducts();
  return `<article class="panel list-panel products-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search tour packages..." /></div><select><option>All statuses</option>${productStatuses.map(status => `<option>${status}</option>`).join('')}</select><button class="ghost-btn">Filter</button></div><div class="package-status-sections">${productStatuses.map(status => tourPackageStatusSection(status, products.filter(product => product.status === status))).join('')}</div></article>`;
}

const supplierTypes = ['Tour', 'Transport', 'Tour Guide', 'Hotel', 'Other'];
function supplierSelectMarkup(value = '') {
  const suppliers = storedSuppliers();
  const selectedExists = suppliers.some(supplier => supplier.name === value || supplier.id === value);
  return `<label>Supplier Name<select name="supplierName"><option value="">Pilih supplier...</option>${suppliers.map(supplier => `<option value="${supplier.name}" ${supplier.name === value || supplier.id === value ? 'selected' : ''}>${supplier.name} · ${supplier.id}</option>`).join('')}${value && !selectedExists ? `<option value="${value}" selected>Existing — ${value}</option>` : ''}</select></label>`;
}
function storedSuppliers() {
  if (Array.isArray(sharedData.suppliers)) return sharedData.suppliers;
  try {
    const saved = JSON.parse(localStorage.getItem('milas-suppliers') || 'null');
    return Array.isArray(saved) ? saved : moduleData.suppliers.rows.map((row, index) => ({ id: `SUP-${String(index + 1).padStart(3, '0')}`, name: row[0], type: row[1], contact: row[2], coverage: row[3], bookings: row[4], status: row[5], code: '', email: '', notes: '' }));
  } catch { return []; }
}
function saveSuppliers(suppliers) { persistSharedCollection('suppliers', suppliers); }
function getSupplierFormDraft(id) { try { return JSON.parse(localStorage.getItem('milas-supplier-draft-' + id) || 'null') || {}; } catch { return {}; } }
function saveSupplierFormDraft(form) { const data = Object.fromEntries(new FormData(form).entries()); localStorage.setItem('milas-supplier-draft-' + data.id, JSON.stringify(data)); }
function clearSupplierFormDraft(id) { localStorage.removeItem('milas-supplier-draft-' + id); }
function importSupplierFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('id') || !params.get('name')) return;
  const keys = ['id', 'name', 'code', 'type', 'contact', 'email', 'coverage', 'status', 'notes'];
  const supplier = Object.fromEntries(keys.map(key => [key, params.get(key) || '']));
  const suppliers = storedSuppliers();
  const index = suppliers.findIndex(item => item.id === supplier.id);
  if (index >= 0) suppliers[index] = {...suppliers[index], ...supplier};
  else suppliers.push({...supplier, bookings: '0'});
  saveSuppliers(suppliers);
  clearSupplierFormDraft(supplier.id);
  window.history.replaceState({}, '', window.location.pathname);
}
function supplierEditor(record = {}) {
  const supplier = {...record};
  if (!supplier.id) supplier.id = `SUP-${String(storedSuppliers().length + 1).padStart(3, '0')}`;
  Object.assign(supplier, getSupplierFormDraft(supplier.id));
  const input = (key, label) => `<label>${label}<input name="${key}" value="${supplier[key] || ''}" ${key === 'id' ? 'readonly' : ''} /></label>`;
  return `<div class="modal-backdrop" id="supplierModal"><form class="booking-modal supplier-modal" id="supplierForm" onsubmit="return handleSupplierSubmit(event)"><div class="modal-head"><div><span class="eyebrow">Supplier masterlist</span><h2>${record.id ? 'Edit supplier' : 'New supplier'}</h2><p>Daftar dan simpan maklumat supplier Milas Travel.</p></div><button type="button" class="modal-close" data-close-supplier>×</button></div><div class="editor-grid">${input('id','Supplier ID')}${input('name','Supplier name')}${input('code','Supplier code')}<label>Supplier type<select name="type">${supplierTypes.map(type => `<option value="${type}" ${supplier.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>${input('contact','Contact person / WhatsApp')}${input('email','Email')}${input('coverage','Coverage / location')}<label>Status<select name="status"><option value="Active" ${supplier.status !== 'Inactive' ? 'selected' : ''}>Active</option><option value="Inactive" ${supplier.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></label><label class="full-width">Notes<textarea name="notes" rows="4">${supplier.notes || ''}</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-supplier>Cancel</button><button type="submit" class="primary-btn">Save supplier</button></div></form></div>`;
}
function suppliersViewActive() {
  const suppliers = storedSuppliers();
  return `<article class="panel list-panel suppliers-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search suppliers..." /></div><select><option>All statuses</option><option>Active</option><option>Inactive</option></select><button class="ghost-btn">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Supplier</th><th>Code</th><th>Type</th><th>Contact</th><th>Email</th><th>Coverage</th><th>Status</th><th></th></tr></thead><tbody>${suppliers.map(supplier => `<tr><td><strong>${supplier.name || '—'}</strong><small class="table-subtext">${supplier.id}</small></td><td>${supplier.code || '—'}</td><td>${supplier.type || '—'}</td><td>${supplier.contact || '—'}</td><td>${supplier.email || '—'}</td><td>${supplier.coverage || '—'}</td><td><span class="status ${supplier.status === 'Inactive' ? 'inactive' : 'active'}">${supplier.status || 'Active'}</span></td><td><button class="ghost-btn supplier-open" data-open-supplier="${encodeURIComponent(JSON.stringify(supplier))}">Open</button></td></tr>`).join('')}</tbody></table></div></article>`;
}

const customerFields = [
  ['fullName', 'Full name', 'text', true],
  ['phone', 'Phone number', 'tel', true],
  ['email', 'Email', 'email', false],
  ['nationality', 'Nationality', 'text', false],
  ['passportNo', 'Passport / ID number', 'text', false],
  ['passportExpiry', 'Passport expiry', 'date', false],
  ['dateOfBirth', 'Date of birth', 'date', false],
  ['company', 'Company / organisation', 'text', false],
  ['emergencyName', 'Emergency contact name', 'text', false],
  ['emergencyPhone', 'Emergency contact phone', 'tel', false],
];
function escapeMarkup(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
const countryDialCodes = Object.fromEntries('AD:+376 AE:+971 AF:+93 AG:+1268 AI:+1264 AL:+355 AM:+374 AO:+244 AQ:+672 AR:+54 AS:+1684 AT:+43 AU:+61 AW:+297 AX:+35818 AZ:+994 BA:+387 BB:+1246 BD:+880 BE:+32 BF:+226 BG:+359 BH:+973 BI:+257 BJ:+229 BL:+590 BM:+1441 BN:+673 BO:+591 BQ:+599 BR:+55 BS:+1242 BT:+975 BV:+47 BW:+267 BY:+375 BZ:+501 CA:+1 CC:+61 CD:+243 CF:+236 CG:+242 CH:+41 CI:+225 CK:+682 CL:+56 CM:+237 CN:+86 CO:+57 CR:+506 CU:+53 CV:+238 CW:+599 CX:+61 CY:+357 CZ:+420 DE:+49 DJ:+253 DK:+45 DM:+1767 DO:+1809 DZ:+213 EC:+593 EE:+372 EG:+20 EH:+212 ER:+291 ES:+34 ET:+251 FI:+358 FJ:+679 FK:+500 FM:+691 FO:+298 FR:+33 GA:+241 GB:+44 GD:+1473 GE:+995 GF:+594 GG:+44 GH:+233 GI:+350 GL:+299 GM:+220 GN:+224 GP:+590 GQ:+240 GR:+30 GS:+500 GT:+502 GU:+1671 GW:+245 GY:+592 HK:+852 HM:+672 HN:+504 HR:+385 HT:+509 HU:+36 ID:+62 IE:+353 IL:+972 IM:+44 IN:+91 IO:+246 IQ:+964 IR:+98 IS:+354 IT:+39 JE:+44 JM:+1876 JO:+962 JP:+81 KE:+254 KG:+996 KH:+855 KI:+686 KM:+269 KN:+1869 KP:+850 KR:+82 KW:+965 KY:+1345 KZ:+7 LA:+856 LB:+961 LC:+1758 LI:+423 LK:+94 LR:+231 LS:+266 LT:+370 LU:+352 LV:+371 LY:+218 MA:+212 MC:+377 MD:+373 ME:+382 MF:+590 MG:+261 MH:+692 MK:+389 ML:+223 MM:+95 MN:+976 MO:+853 MP:+1670 MQ:+596 MR:+222 MS:+1664 MT:+356 MU:+230 MV:+960 MW:+265 MX:+52 MY:+60 MZ:+258 NA:+264 NC:+687 NE:+227 NF:+672 NG:+234 NI:+505 NL:+31 NO:+47 NP:+977 NR:+674 NU:+683 NZ:+64 OM:+968 PA:+507 PE:+51 PF:+689 PG:+675 PH:+63 PK:+92 PL:+48 PM:+508 PN:+64 PR:+1787 PS:+970 PT:+351 PW:+680 PY:+595 QA:+974 RE:+262 RO:+40 RS:+381 RU:+7 RW:+250 SA:+966 SB:+677 SC:+248 SD:+249 SE:+46 SG:+65 SH:+290 SI:+386 SJ:+47 SK:+421 SL:+232 SM:+378 SN:+221 SO:+252 SR:+597 SS:+211 ST:+239 SV:+503 SX:+1721 SY:+963 SZ:+268 TC:+1649 TD:+235 TF:+262 TG:+228 TH:+66 TJ:+992 TK:+690 TL:+670 TM:+993 TN:+216 TO:+676 TR:+90 TT:+1868 TV:+688 TW:+886 TZ:+255 UA:+380 UG:+256 UM:+1 US:+1 UY:+598 UZ:+998 VA:+39 VC:+1784 VE:+58 VG:+1284 VI:+1340 VN:+84 VU:+678 WF:+681 WS:+685 YE:+967 YT:+262 ZA:+27 ZM:+260 ZW:+263 XK:+383'.split(' ').map(item => item.split(':')));
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
function phoneValueParts(value, fallback = '+60') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  const code = Object.values(countryDialCodes).sort((a, b) => b.length - a.length).find(item => digits.startsWith(item.replace('+', ''))) || fallback;
  const codeDigits = code.replace('+', '');
  return { code, local: phoneLocalDigits(digits, codeDigits) };
}
function phoneCountryOptions(selected = '+60') {
  return Object.entries(countryDialCodes).map(([, dial]) => `<option value="${dial}" ${dial === selected ? 'selected' : ''}>${escapeMarkup(dial)}</option>`).join('');
}
function phoneFieldMarkup(fieldName, label, value = '', required = false) {
  const parts = phoneValueParts(value);
  return `<label>${label}<div class="phone-input-group"><select name="${fieldName}CountryCode" aria-label="Country calling code">${phoneCountryOptions(parts.code)}</select><input name="${fieldName}" type="tel" value="${escapeMarkup(parts.local)}" placeholder="12-345 6789" pattern="[0-9][0-9\\s().-]{5,17}" title="Masukkan nombor telefon tanpa kod negara" ${required ? 'required' : ''} /></div></label>`;
}
function combinePhoneField(data, fieldName = 'phone') {
  const raw = String(data[fieldName] || '');
  const digits = raw.replace(/[^0-9]/g, '');
  const code = data[`${fieldName}CountryCode`] || '+60';
  const codeDigits = String(code).replace(/[^0-9]/g, '');
  const local = phoneLocalDigits(digits, codeDigits);
  if (local) data[fieldName] = `${code} ${local}`;
  delete data[`${fieldName}CountryCode`];
  return data;
}
function phoneLocalDigits(digits, codeDigits) {
  let local = digits;
  while (local.startsWith(codeDigits) && local.length > codeDigits.length) local = local.slice(codeDigits.length);
  return local;
}
function normalisePhoneRecord(record) {
  const next = {...record};
  ['phone', 'contactPhone', 'whatsapp'].forEach(key => {
    if (key in next && next[key]) {
      const parts = phoneValueParts(next[key]);
      next[key] = parts.local ? `${parts.code} ${parts.local}` : '';
    }
  });
  return next;
}
function nextCustomerId(customers) {
  const sequence = customers.map(customer => Number(String(customer.id || '').match(/(\d+)$/)?.[1])).filter(Number.isFinite);
  return `CUS-${String(Math.max(0, ...sequence) + 1).padStart(5, '0')}`;
}
function customerFromRecord(record, existing = {}) {
  return {
    ...existing,
    fullName: existing.fullName || record.customer || record.name || '',
    phone: existing.phone || record.phone || record.contactPhone || record.whatsapp || '',
    whatsapp: existing.whatsapp || record.whatsapp || record.phone || record.contactPhone || '',
    email: existing.email || record.email || '',
    nationality: existing.nationality || record.nationality || '',
  };
}
function syncLeadToCustomer(lead) {
  const fullName = String(lead.customer || '').trim();
  if (!fullName) return;
  const customers = storedCustomers();
  const normalise = value => String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const email = normalise(lead.email), phone = normalise(lead.phone);
  const existing = customers.find(customer => customer.sourceLeadId === lead.id)
    || customers.find(customer => (email && normalise(customer.email) === email) || (phone && normalise(customer.phone) === phone))
    || customers.find(customer => normalise(customer.fullName) === normalise(fullName));
  const now = new Date().toISOString();
  const customer = {...customerFromRecord(lead, existing || {}), sourceLeadId: lead.id, updatedAt: now};
  if (existing) {
    Object.assign(existing, customer);
  } else {
    customers.unshift({...customer, id: nextCustomerId(customers), createdAt: now});
  }
  localStorage.setItem('milas-customers', JSON.stringify(customers));
}
function storedCustomers() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-customers') || 'null');
    if (Array.isArray(saved)) return saved;
  } catch {}
  const sources = [
    ...storedLeads(),
    ...storedQuotations(),
    ...storedInvoices(),
    ...storedBookings(),
  ];
  const customers = [];
  sources.forEach(record => {
    const name = String(record.customer || record.name || '').trim();
    if (!name || name.includes('—')) return;
    const key = name.toLowerCase();
    const existing = customers.find(customer => customer.fullName.toLowerCase() === key);
    if (existing) Object.assign(existing, customerFromRecord(record, existing));
    else customers.push({...customerFromRecord(record), id: `CUS-${String(customers.length + 1).padStart(5, '0')}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()});
  });
  localStorage.setItem('milas-customers', JSON.stringify(customers));
  return customers;
}
function syncStoredLeadsToCustomers() {
  storedLeads().filter(lead => String(lead.customer || '').trim()).forEach(syncLeadToCustomer);
}
function customerMetrics(customer) {
  const name = String(customer.fullName || '').trim().toLowerCase();
  const bookings = storedBookings().filter(record => String(record.customer || '').trim().toLowerCase() === name);
  const invoices = storedInvoices().filter(invoice => String(invoice.customer || '').trim().toLowerCase() === name);
  const balance = invoices.reduce((sum, invoice) => sum + invoicePaymentState(invoice).balance, 0);
  return { bookings: bookings.length, balance };
}
function customerView() {
  syncStoredLeadsToCustomers();
  const customers = storedCustomers();
  return `<article class="panel list-panel customers-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search customers..." /></div><button class="ghost-btn" data-action="filter">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Customer ID</th><th>Customer</th><th>Phone number</th><th>Email</th><th>Nationality</th><th>Bookings</th><th>Outstanding</th><th></th></tr></thead><tbody>${customers.length ? customers.map(customer => { const metrics = customerMetrics(customer); return `<tr><td class="id-cell">${escapeMarkup(customer.id)}</td><td><strong>${escapeMarkup(customer.fullName || '—')}</strong><small class="table-subtext">${escapeMarkup(customer.company || '')}</small></td><td>${escapeMarkup(customer.phone || '—')}</td><td>${escapeMarkup(customer.email || '—')}</td><td>${escapeMarkup(customer.nationality || '—')}</td><td>${metrics.bookings}</td><td>RM ${metrics.balance.toFixed(2)}</td><td><button class="ghost-btn customer-open" data-open-customer="${encodeURIComponent(JSON.stringify(customer))}">Open</button></td></tr>`; }).join('') : '<tr><td colspan="8" class="empty-cell">Tiada customer. Tekan + New Customer untuk menambah rekod.</td></tr>'}</tbody></table></div></article>`;
}
function countryOptions(selected = '') {
  const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW XK'.split(' ');
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const codes = countryCodes;
  const options = codes.map(code => ({ code, name: names.of(code) || code })).filter(item => item.name).sort((a, b) => a.name.localeCompare(b.name));
  return `<option value="">Select nationality</option>${options.map(item => `<option value="${escapeMarkup(item.name)}" ${item.name === selected ? 'selected' : ''}>${escapeMarkup(item.name)}</option>`).join('')}`;
}
function nationalityFieldMarkup(value = '', required = false, label = 'Nationality') {
  return `<label>${label}<select name="nationality" ${required ? 'required' : ''}>${countryOptions(value)}</select></label>`;
}
function customerEditor(record = {}) {
  const customer = {...record};
  if (!customer.id) customer.id = nextCustomerId(storedCustomers());
  const storedPhone = String(customer.phone || '');
  const storedCode = customer.phoneCountryCode || Object.values(countryDialCodes).sort((a, b) => b.length - a.length).find(code => storedPhone.replace(/[^+0-9]/g, '').startsWith(code)) || '+60';
  const localPhone = storedPhone.replace(/[^0-9]/g, '').replace(new RegExp('^' + storedCode.replace('+', '')), '');
  const phoneField = `<label>Phone number<div class="phone-input-group"><select name="phoneCountryCode" aria-label="Country calling code">${Object.entries(countryDialCodes).map(([, dial]) => `<option value="${dial}" ${dial === storedCode ? 'selected' : ''}>${escapeMarkup(dial)}</option>`).join('')}</select><input name="phone" type="tel" value="${escapeMarkup(localPhone)}" placeholder="12-345 6789" pattern="[0-9][0-9\\s().-]{5,17}" title="Masukkan nombor telefon tanpa kod negara" required /></div></label>`;
  const input = ([key, label, type, required]) => key === 'nationality' ? `<label>${label}<select name="${key}">${countryOptions(customer[key] || '')}</select></label>` : key === 'phone' ? phoneField : key === 'emergencyPhone' ? phoneFieldMarkup('emergencyPhone', label, customer.emergencyPhone) : `<label>${label}<input name="${key}" type="${type}" value="${escapeMarkup(customer[key] || '')}" ${required ? 'required' : ''} /></label>`;
  return `<div class="modal-backdrop" id="customerModal"><form class="booking-modal customer-modal" id="customerForm"><div class="modal-head"><div><span class="eyebrow">CRM / Customers</span><h2>${record.id ? 'Edit customer' : 'New customer'}</h2><p>Simpan profil lengkap customer untuk kegunaan quotation, invoice dan booking.</p></div><button type="button" class="modal-close" data-close-customer>×</button></div><div class="customer-form-content"><div class="send-section-title">CUSTOMER PROFILE</div><div class="editor-grid"><label>Customer ID<input name="id" value="${escapeMarkup(customer.id)}" readonly /></label>${customerFields.slice(0, 6).map(input).join('')}</div><div class="send-section-title">IDENTITY & CONTACT DETAILS</div><div class="editor-grid">${customerFields.slice(6).map(input).join('')}</div><label class="full-width">Notes<textarea name="notes" rows="4">${escapeMarkup(customer.notes || '')}</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-customer>Cancel</button><button type="submit" class="primary-btn">Save customer</button></div></form></div>`;
}
function handleCustomerSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return false;
  const data = Object.fromEntries(new FormData(form).entries());
  combinePhoneField(data, 'phone');
  combinePhoneField(data, 'emergencyPhone');
  const customers = storedCustomers();
  const originalId = form.dataset.originalCustomerId || data.id;
  const index = customers.findIndex(customer => customer.id === originalId);
  const previous = index >= 0 ? customers[index] : {};
  const customer = {...previous, ...data, updatedAt: new Date().toISOString()};
  if (!customer.createdAt) customer.createdAt = customer.updatedAt;
  if (index >= 0) customers[index] = customer; else customers.unshift(customer);
  localStorage.setItem('milas-customers', JSON.stringify(customers));
  document.querySelector('#customerModal')?.remove();
  state.active = 'customers';
  state.toast = 'Customer berjaya disimpan.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
  return false;
}

function genericView(key) {
  if (key === 'leads') return leadsView();
  if (key === 'customers') return customerView();
  if (key === 'products') return tourPackagesViewGrouped();
  if (key === 'bookings') return allBookingsViewV4();
  if (key === 'pipeline') return pipelineView();
  if (key === 'quotations') return quotationsView();
  if (key === 'invoices') return invoicesView();
  if (key === 'calendar') return calendarView();
  if (key === 'upcoming') return upcomingView();
  if (key === 'reports') return reportsView();
  if (key === 'suppliers') return suppliersViewActive();
  if (key === 'payments') { syncPaymentRecordsView(); return tableView(key); }
  if (key === 'outstanding') return outstandingView();
  return tableView(key);
}

function settingsView() { return `<section class="settings-grid"><article class="panel settings-nav"><h2>Configuration</h2><button class="setting-active">General settings <span>→</span></button><button>Lead sources <span>→</span></button><button>Package categories <span>→</span></button><button>Supplier types <span>→</span></button><button>Payment methods <span>→</span></button></article><article class="panel settings-content"><div class="panel-head"><div><h2>Users, roles & permissions</h2><p>Permission architecture berpusat — bukan hardcoded di UI.</p></div><button class="primary-btn">+ Invite user</button></div><div class="role-list"><div class="role-row"><div class="avatar teal">AM</div><section><strong>Afiq Milas</strong><small>Super Admin · Last active now</small></section><span class="role-pill">Super Admin</span><button class="icon-btn">•••</button></div><div class="role-row"><div class="avatar blue">SA</div><section><strong>Sarah Ahmad</strong><small>Sales Manager · Last active 12 min ago</small></section><span class="role-pill">Sales Manager</span><button class="icon-btn">•••</button></div><div class="role-row"><div class="avatar purple">RK</div><section><strong>Rizal Karim</strong><small>Operations · Last active yesterday</small></section><span class="role-pill">Operations</span><button class="icon-btn">•••</button></div></div><div class="permission-box"><strong>Permission matrix</strong><p>Roles inherit granular permissions seperti View Lead, Create Quotation, Record Payment dan View Reports.</p><div class="permission-chips"><span>View leads</span><span>Create quotation</span><span>Create booking</span><span>Record payment</span><span>View operations</span><span>View reports</span></div></div></article></section>`; }

function render() { const v=views[state.active], todayCount=upcomingTodayCount(), pendingNewOrders=newOrderCount(), pendingNewLeads=newLeadCount(), dueFollowUps=followUpsDueCount(); document.querySelector('#app').innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">M</span><span><strong>Milas Travel</strong><small>Unified CRM</small></span></div><div class="workspace-select"><span class="workspace-dot"></span><span>Milas Travel & Tours</span><b>⌄</b></div><nav>${navGroups.map(g=>`<div class="nav-group"><small>${g.label}</small>${g.items.map(([id,label,icon])=>`<button class="nav-item ${state.active===id?'active':''}" data-nav="${id}"><i>${icon}</i>${label}${id==='leads'&&pendingNewLeads?`<em class="nav-count">${pendingNewLeads}</em>`:''}${id==='followups'&&dueFollowUps?`<em class="nav-count">${dueFollowUps}</em>`:''}${id==='outstanding'?'<em>3</em>':''}${id==='bookings'&&pendingNewOrders?`<em class="nav-count">${pendingNewOrders}</em>`:''}${id==='upcoming'&&todayCount?`<em class="nav-count">${todayCount}</em>`:''}</button>`).join('')}</div>`).join('')}</nav><div class="sidebar-footer"><button class="help-link">? <span>Help centre</span></button><div class="user-chip"><div class="avatar teal">AM</div><span><strong>Afiq Milas</strong><small>Super Admin</small></span><b>•••</b></div></div></aside><main class="main"><header class="topbar"><div class="breadcrumbs"><span>${v.eyebrow}</span><b>/</b><strong>${v.title}</strong></div><div class="top-actions"><div class="global-search">⌕ <input id="globalSearch" placeholder="Search anything..." /><kbd>⌘ K</kbd></div><button class="icon-btn notification">♧<i></i></button><button class="mobile-menu">☰</button></div></header><div class="content"><div class="page-heading"><div><h1>${v.title}</h1><p>${v.subtitle}</p></div><div class="heading-actions">${state.active==='dashboard'?`<div class="range-select"><span>◷</span><select id="range"><option ${state.range==='Today'?'selected':''}>Today</option><option ${state.range==='This Week'?'selected':''}>This Week</option><option ${state.range==='This Month'?'selected':''}>This Month</option><option ${state.range==='Custom Date'?'selected':''}>Custom Date</option></select></div>`:''}${v.action?`<button class="primary-btn" id="primaryAction">${v.action}</button>`:''}</div></div>${state.active==='dashboard'?dashboard():state.active==='settings'?settingsView():genericView(state.active)}</div></main></div><div id="toast" class="toast ${state.toast?'show':''}">${state.toast}</div>`; bind(); }

function bind(){ document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{state.active=b.dataset.nav;state.toast='';render()}); document.querySelector('#primaryAction')?.addEventListener('click',()=>{state.toast='Foundation UI ready — workflow action akan disambung pada Milestone 2.';render();setTimeout(()=>{state.toast='';render()},3500)}); document.querySelector('#range')?.addEventListener('change',e=>{state.range=e.target.value;state.toast=`Dashboard ditapis: ${state.range}`;render();setTimeout(()=>{state.toast='';render()},2200)}); document.querySelector('#upcomingMonth')?.addEventListener('change',e=>{state.upcomingMonth=e.target.value;render()}); document.querySelector('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value){state.toast=`Carian global disediakan untuk: ${e.target.value}`;render()}}); if(state.active==='bookings' && !state.bookingSearch) document.querySelectorAll('.booking-status-group').forEach(group=>{group.classList.remove('expanded'); group.querySelector('.status-caret').textContent='›';}); }

document.addEventListener('click', (event) => {
  const openCustomer = event.target.closest('[data-open-customer]');
  const newCustomer = state.active === 'customers' && event.target.closest('#primaryAction');
  if (openCustomer) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const customer = JSON.parse(decodeURIComponent(openCustomer.dataset.openCustomer));
    document.body.insertAdjacentHTML('beforeend', customerEditor(customer));
    document.querySelector('#customerForm').dataset.originalCustomerId = customer.id;
    return;
  }
  if (newCustomer) {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.body.insertAdjacentHTML('beforeend', customerEditor());
  }
}, true);

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-customer]')) document.querySelector('#customerModal')?.remove();
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'customerForm') handleCustomerSubmit(event);
}, true);
importSupplierFromQuery();
loadSharedData();

function quotationPdfFile({data, packageName, total}) {
  const product = storedTourProducts().find(item => item.productId === data.packageId || item.name === packageName || (packageName && String(packageName).includes(item.name))) || {};
  const pricing = quotationPricing(data.packageId);
  const items = value => String(value || '').split(/\r?\n/).map(item => item.trim().replace(/^(?:[•*-]|\d+[.)])\s*/, '')).filter(Boolean);
  const rows = [['Adult', data.adults, pricing.adult], ['Child', data.children, pricing.child], ['Infant', data.infants, pricing.infant], ['Single supplement', data.singleSupplement, pricing.solo]].filter(([, quantity]) => Number(quantity || 0) > 0).map(([label, quantity, price]) => `${label}: ${quantity} x RM ${Number(price || 0).toFixed(2)} = RM ${(Number(quantity) * Number(price || 0)).toFixed(2)}`);
  const lines = [`Milas Travel & Tours`, `QUOTATION ${data.id || ''}`, '', `Customer: ${data.customer || '—'}`, `Phone: ${data.phone || '—'}`, `Email: ${data.email || '—'}`, '', `Package: ${packageName || '—'}`, `Travel date: ${data.travelDate ? formatTravelDate(data.travelDate) : '—'}`, '', 'PRICING', ...rows, '', "WHAT'S INCLUDED", ...items(product.included ?? product.whatsIncluded ?? product.whatIncluded ?? product.inclusions).map(item => `• ${item}`), '', "WHAT'S EXCLUDED", ...items(product.excluded ?? product.whatsExcluded ?? product.whatExcluded ?? product.exclusions).map(item => `• ${item}`), '', `Total: RM ${Number(total || 0).toFixed(2)}`];
  const escapePdf = value => String(value).replace(/([\\()])/g, '\\$1');
  const content = `BT /F1 12 Tf 50 790 Td ${lines.map(line => `(${escapePdf(line)}) Tj 0 -18 Td`).join(' ')} ET`;
  const objects = [`<< /Type /Catalog /Pages 2 0 R >>`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], `${data.id || 'quotation'}.pdf`, {type: 'application/pdf'});
}

function markLeadContacted(leadId) {
  const leads = storedLeads();
  const lead = leads.find(item => item.id === leadId);
  if (!lead || lead.status !== 'New Lead') return false;
  lead.status = 'Contacted';
  localStorage.setItem('milas-leads', JSON.stringify(leads));
  return true;
}

document.addEventListener('click', (event) => {
  const outstandingWhatsApp = event.target.closest('[data-whatsapp-outstanding]');
  if (outstandingWhatsApp && !outstandingWhatsApp.disabled) {
    event.preventDefault();
    const payload = JSON.parse(decodeURIComponent(outstandingWhatsApp.dataset.whatsappOutstanding));
    const phone = String(payload.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return;
    const message = 'Hi ' + (payload.customer || 'there') + ', this is a follow-up regarding invoice ' + (payload.invoiceId || '') + '. Your outstanding balance is RM ' + (payload.balance || '0.00') + '. Please let us know once payment has been made. Thank you.';
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
    return;
  }
  const recordPaymentAction = event.target.closest('#primaryAction');
  if (recordPaymentAction && (state.active === 'payments' || state.active === 'outstanding')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelector('#invoicePaymentModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', recordPaymentModal());
    updateInvoicePaymentSummary(document.querySelector('#invoicePaymentForm'));
    return;
  }
  const invoicePayment = event.target.closest('[data-invoice-payment]');
  if (invoicePayment) {
    event.preventDefault();
    const invoice = JSON.parse(decodeURIComponent(invoicePayment.dataset.invoicePayment)).data;
    document.querySelector('#invoicePaymentModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', invoicePaymentModal(invoice));
    return;
  }
  const openInvoice = event.target.closest('[data-open-invoice]');
  if (openInvoice) {
    event.preventDefault();
    const invoice = JSON.parse(decodeURIComponent(openInvoice.dataset.openInvoice)).data;
    document.querySelector('#invoicePreviewModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', invoicePreview(invoice));
    return;
  }
  const convertInvoice = event.target.closest('[data-convert-invoice]');
  if (convertInvoice) {
    event.preventDefault();
    const quotation = JSON.parse(decodeURIComponent(convertInvoice.dataset.convertInvoice));
    const invoice = convertQuotationToInvoice(quotation);
    document.querySelector('#invoicePreviewModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', invoicePreview(invoice));
    return;
  }
  const printInvoice = event.target.closest('[data-print-invoice]');
  if (printInvoice) {
    event.preventDefault();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(invoicePdfMarkup(JSON.parse(decodeURIComponent(printInvoice.dataset.printInvoice))));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
    return;
  }
  const whatsappQuotation = event.target.closest('[data-whatsapp-quotation]');
  if (whatsappQuotation && !whatsappQuotation.disabled) {
    event.preventDefault();
    const payload = JSON.parse(decodeURIComponent(whatsappQuotation.dataset.whatsappQuotation));
    const phone = String(payload.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return;
    const message = `Hi ${payload.customer || 'there'}, regarding quotation ${payload.quotationId || ''}. Please let us know if you have any questions.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    return;
  }
  const printQuotation = event.target.closest('[data-print-quotation]');
  if (printQuotation) {
    event.preventDefault();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(quotationPdfMarkup(JSON.parse(decodeURIComponent(printQuotation.dataset.printQuotation))));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
    return;
  }
  const previewQuotation = event.target.closest('[data-preview-quotation]');
  if (previewQuotation) {
    event.preventDefault();
    const form = document.querySelector('#quotationForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.selectedAddons = formData.getAll('selectedAddons').map(value => { try { return JSON.parse(value); } catch { return null; } }).filter(Boolean);
    const packageName = form.querySelector('[data-quotation-package]')?.selectedOptions[0]?.textContent || '';
    document.body.insertAdjacentHTML('beforeend', quotationPreview(data, packageName, quotationTotal(form).toFixed(2)));
    return;
  }
  if (event.target.closest('[data-close-quotation-preview]')) {
    document.querySelector('#quotationPreviewModal')?.remove();
    return;
  }
  if (event.target.closest('[data-close-invoice-preview]')) {
    document.querySelector('#invoicePreviewModal')?.remove();
    return;
  }
  const openQuotation = event.target.closest('[data-open-quotation]');
  const newQuotation = event.target.closest('#primaryAction');
  if (openQuotation) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const quotation = JSON.parse(decodeURIComponent(openQuotation.dataset.openQuotation));
    document.body.insertAdjacentHTML('beforeend', quotationEditor(quotation));
    updateQuotationTotal(document.querySelector('#quotationForm'));
    return;
  }
  if (newQuotation && state.active === 'quotations') {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.body.insertAdjacentHTML('beforeend', quotationEditor());
    updateQuotationTotal(document.querySelector('#quotationForm'));
    return;
  }
  const proceedQuotation = event.target.closest('[data-proceed-quotation]');
  if (proceedQuotation) {
    event.preventDefault();
    const form = document.querySelector('#leadForm');
    if (!form || !form.reportValidity()) return;
    const formData = combinePhoneField(Object.fromEntries(new FormData(form).entries()));
    const leads = storedLeads();
    const lead = leads.find(item => item.id === proceedQuotation.dataset.proceedQuotation);
    if (lead) {
      Object.assign(lead, formData, {status: 'Quotation Sent'});
      localStorage.setItem('milas-leads', JSON.stringify(leads));
      const quotations = storedQuotations();
      const existingIndex = quotations.findIndex(item => item.leadId === lead.id);
      const existing = existingIndex >= 0 ? quotations[existingIndex] : null;
      const quotation = {
        id: existing?.id || nextQuotationNumber(quotations),
        leadId: lead.id,
        customer: lead.customer,
        phone: lead.phone,
        email: lead.email,
        nationality: lead.nationality,
        packageName: lead.packageName,
        travelDate: '',
        total: lead.value || '—',
        status: 'Draft',
        createdAt: new Date().toISOString(),
      };
      if (existingIndex >= 0) quotations[existingIndex] = {...quotations[existingIndex], ...quotation};
      else quotations.unshift(quotation);
      localStorage.setItem('milas-quotations', JSON.stringify(quotations));
      document.querySelector('#leadModal')?.remove();
      state.active = 'quotations';
      state.toast = '';
      render();
      document.body.insertAdjacentHTML('beforeend', quotationEditor(quotation));
      document.querySelector('#quotationForm')?.setAttribute('data-from-lead', 'true');
      updateQuotationTotal(document.querySelector('#quotationForm'));
    }
    return;
  }
  const contactLead = event.target.closest('[data-contact-whatsapp]');
  if (contactLead && !contactLead.disabled) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.open(`https://wa.me/${contactLead.dataset.contactWhatsapp}`, '_blank', 'noopener');
    if (markLeadContacted(contactLead.dataset.contactLeadId)) {
      state.toast = 'Lead ditukar kepada Contacted.';
      render();
      setTimeout(() => { state.toast = ''; render(); }, 2200);
    }
    return;
  }
  const openLead = event.target.closest('[data-open-lead]');
  const newLead = event.target.closest('#primaryAction');
  if (openLead) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const lead = JSON.parse(decodeURIComponent(openLead.dataset.openLead));
    document.body.insertAdjacentHTML('beforeend', leadEditor(lead));
    document.querySelector('#leadForm').dataset.originalLeadId = lead.id;
    return;
  }
  if (newLead && state.active === 'leads') {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.body.insertAdjacentHTML('beforeend', leadEditor());
  }
}, true);

document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-open-lead]')) {
    event.preventDefault();
    event.target.closest('[data-open-lead]').click();
  }
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-invoice-payment]')) document.querySelector('#invoicePaymentModal')?.remove();
  if (event.target.closest('[data-close-lead]')) document.querySelector('#leadModal')?.remove();
  if (event.target.closest('[data-close-quotation]')) document.querySelector('#quotationModal')?.remove();
  if (event.target.closest('[data-close-quotation-preview]')) document.querySelector('#quotationPreviewModal')?.remove();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('#invoicePaymentForm [data-payment-invoice]')) {
    const form = event.target.form;
    const invoice = JSON.parse(decodeURIComponent(event.target.value));
    const summary = invoicePaymentState(invoice);
    const total = Number(String(invoice.total || '0').replace(/[^0-9.-]/g, '') || 0);
    form.dataset.invoice = event.target.value;
    form.dataset.invoiceTotal = total.toFixed(2);
    form.dataset.previousOutstanding = summary.balance.toFixed(2);
    form.querySelector('[name="invoiceTotal"]').value = 'RM ' + total.toFixed(2);
    form.querySelector('[name="paymentAmount"]').value = '';
    form.querySelector('[name="paymentAmount"]').max = summary.balance.toFixed(2);
    form.querySelector('[name="previousPayment"]').value = 'RM ' + summary.paid.toFixed(2);
    form.querySelector('[name="previousOutstanding"]').value = 'RM ' + summary.balance.toFixed(2);
    form.querySelector('[name="balancePayment"]').value = 'RM ' + summary.balance.toFixed(2);
    updateInvoicePaymentSummary(form);
    return;
  }
  if (event.target.matches('#invoicePaymentForm [name="paymentType"]')) { updateInvoicePaymentSummary(event.target.form); return; }
  if (event.target.matches('[data-lead-filter]')) {
    state.leadFilter = event.target.value;
    if (state.active === 'leads') render();
  }
});

document.addEventListener('click', (event) => {
  const sendButton = event.target.closest('[data-send-booking]');
  if (sendButton) {
    const openButton = sendButton.closest('td')?.querySelector('[data-open-booking]');
    if (!openButton) return;
    const record = JSON.parse(decodeURIComponent(openButton.dataset.openBooking));
    document.body.insertAdjacentHTML('beforeend', bookingSendModal(record));
    return;
  }
  if (event.target.closest('[data-close-send]')) document.querySelector('#sendBookingModal')?.remove();
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'invoicePaymentForm') {
    event.preventDefault();
    const form = event.target;
    const invoice = JSON.parse(decodeURIComponent(form.dataset.invoice || ''));
    const paymentData = Object.fromEntries(new FormData(form).entries());
    if (recordInvoicePayment(invoice, paymentData.paymentType, paymentData.paymentAmount)) {
      form.closest('#invoicePaymentModal')?.remove();
      state.active = 'invoices';
      state.toast = 'Payment berjaya direkod. Lead ditukar kepada Won dan booking baharu dicipta.';
      render();
      setTimeout(() => { state.toast = ''; render(); }, 2800);
    } else { state.toast = 'Jumlah payment tidak sah. Sila semak jumlah bayaran.'; }
    return;
  }
  if (event.target.id !== 'sendBookingForm') return;
  event.preventDefault();
  const form = event.target, data = combinePhoneField(Object.fromEntries(new FormData(form).entries()), 'contactPhone'), contact = String(data.supplierContact || '').trim();
  saveSupplierDraft(form);
  const encodedMessage = encodeURIComponent(data.message);
  const destination = data.sendChannel === 'whatsapp'
    ? 'https://wa.me/' + contact.replace(/[^0-9]/g, '') + '?text=' + encodedMessage
    : 'mailto:' + contact + '?subject=' + encodeURIComponent('Booking request') + '&body=' + encodedMessage;
  data.sentAt = new Date().toISOString();
  saveSupplierDraft(form, {sentAt: new Date().toISOString(), sentChannel: data.sendChannel});
  markBookingSent(data.bookingId, data.sendChannel);
  window.open(destination, '_blank', 'noopener');
  form.closest('#sendBookingModal')?.remove();
  state.toast = 'Booking ditanda sebagai Already sent.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
});

document.addEventListener('change', (event) => {
  if (!event.target.matches('#productForm input[name="locations"]')) return;
  const picker = event.target.closest('.multi-select');
  const selected = [...picker.querySelectorAll('input[name="locations"]:checked')].map(input => input.value);
  picker.querySelector('summary').textContent = selected.length ? selected.join(', ') : 'Pilih lokasi tour';
});

document.addEventListener('input', (event) => {
  if (event.target.matches('#invoicePaymentForm [name="paymentAmount"]')) { updateInvoicePaymentSummary(event.target.form); return; }
  if (event.target.matches('[data-lead-received-date]')) {
    const followUp = event.target.form?.querySelector('[data-lead-follow-up]');
    if (followUp) followUp.value = leadFollowUpDate(event.target.value);
    return;
  }
  if (event.target.matches('[data-lead-search]')) {
    state.leadSearch = event.target.value;
    if (state.active === 'leads') render();
    return;
  }
  if (event.target.matches('[data-booking-search]')) {
    state.bookingSearch = event.target.value;
    if (state.active === 'bookings') render();
    return;
  }
  if (event.target.matches('#quotationForm [data-quotation-calculator]')) {
    updateQuotationTotal(event.target.form);
    return;
  }
  if (event.target.matches('#bookingForm input') && (/^(adult|children|infant|discount)$/.test(event.target.name) || /discount/i.test(event.target.closest('label')?.textContent || ''))) updateBookingSales(event.target.form);
  if (event.target.matches('#productForm [data-addon-cost], #productForm [data-addon-margin]')) {
    const row = event.target.closest('[data-addon-row]');
    const costInput = row.querySelector('[data-addon-cost]');
    const marginInput = row.querySelector('[data-addon-margin]');
    const base = row.querySelector('[data-addon-base]');
    const cost = Number(costInput.value), margin = Number(marginInput.value);
    base.value = Number.isFinite(cost) && cost >= 0 && costInput.value !== '' && Number.isFinite(margin) && margin >= 0 && margin < 100 && marginInput.value !== '' ? (cost / (1 - margin / 100)).toFixed(2) : '';
    return;
  }
  if (!event.target.matches('#productForm [data-price-cost], #productForm [data-price-margin]')) return;
  const row = event.target.parentElement;
  const costInput = row.querySelector('[data-price-cost]');
  const marginInput = row.querySelector('[data-price-margin]');
  const base = row.querySelector('[data-price-base]');
  const cost = Number(costInput.value), margin = Number(marginInput.value);
  base.value = Number.isFinite(cost) && cost >= 0 && costInput.value !== '' && Number.isFinite(margin) && margin >= 0 && margin < 100 && marginInput.value !== '' ? (cost / (1 - margin / 100)).toFixed(2) : '';
});

document.addEventListener('change', (event) => {
  if (event.target.matches('#bookingForm select[name="package"]')) updateBookingSales(event.target.form);
  if (event.target.matches('#quotationForm .quotation-addon-multi input[name="selectedAddons"]')) {
    const picker = event.target.closest('.quotation-addon-multi');
    const selected = [...picker.querySelectorAll('input[name="selectedAddons"]:checked')].map(input => input.parentElement.textContent.trim().replace(/\s+RM\s+[\d,.]+$/, ''));
    picker.querySelector('summary').textContent = selected.length ? selected.join(', ') : 'Pilih add-on';
    updateQuotationTotal(event.target.form);
  }
  if (event.target.matches('#quotationForm [data-quotation-package]')) {
    const form = event.target.form;
    const slot = form.querySelector('.quotation-extras-slot');
    if (slot) slot.innerHTML = quotationExtrasMarkup(event.target.value, {});
    updateQuotationTotal(form);
  }
  if (event.target.matches('#quotationForm [name="optionalPackage"], #quotationForm [name="selectedAddons"]')) updateQuotationTotal(event.target.form);
});

document.addEventListener('click', (event) => {
  const addAddon = event.target.closest('[data-add-addon]');
  if (addAddon) {
    const builder = document.querySelector('#addonBuilder');
    builder?.insertAdjacentHTML('beforeend', addonCard());
    builder?.lastElementChild?.querySelector('[data-addon-name]')?.focus();
    return;
  }
  if (event.target.closest('[data-remove-addon]')) {
    event.target.closest('[data-addon-row]')?.remove();
    return;
  }
  const saveOptional = event.target.closest('[data-save-optional]');
  if (saveOptional) {
    const form = saveOptional.closest('#productForm');
    persistProductForm(form);
    saveOptional.textContent = 'Saved';
    saveOptional.classList.add('is-saved');
    setTimeout(() => { saveOptional.textContent = 'Save optional package'; saveOptional.classList.remove('is-saved'); }, 1800);
    return;
  }
  const addOptional = event.target.closest('[data-add-optional]');
  if (addOptional) {
    const builder = document.querySelector('#optionalPricingBuilder');
    const optionNumber = builder.querySelectorAll('[data-pricing-option]').length + 1;
    builder.insertAdjacentHTML('beforeend', optionalPricingCard(`Optional package ${optionNumber}`));
    builder.lastElementChild.querySelector('[data-pricing-name]').focus();
    return;
  }
  const removeOptional = event.target.closest('[data-remove-optional]');
  if (removeOptional) {
    removeOptional.closest('[data-pricing-option]').remove();
    return;
  }
  const addItinerary = event.target.closest('[data-add-itinerary]');
  if (addItinerary) {
    const builder = document.querySelector('#itineraryBuilder');
    const dayNumber = builder.querySelectorAll('[data-itinerary-day]').length + 1;
    builder.insertAdjacentHTML('beforeend', itineraryDayRow(dayNumber));
    builder.lastElementChild.querySelector('textarea').focus();
    return;
  }
  const removeItinerary = event.target.closest('[data-remove-itinerary]');
  if (removeItinerary) {
    removeItinerary.closest('[data-itinerary-day]').remove();
    [...document.querySelectorAll('#itineraryBuilder [data-itinerary-day]')].forEach((day, index) => { day.querySelector('strong').textContent = `Day ${index + 1}`; });
    return;
  }
  const bulletButton = event.target.closest('[data-add-bullet]');
  if (bulletButton) {
    const editor = bulletButton.closest('.bullet-editor');
    const textarea = editor.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    textarea.value = `${before}${prefix}• ${after}`;
    textarea.focus();
    const cursor = start + prefix.length + 2;
    textarea.setSelectionRange(cursor, cursor);
    return;
  }
  const openProduct = event.target.closest('[data-open-product]');
  const newProduct = state.active === 'products' && event.target.closest('#primaryAction');
  if (openProduct) {
    const product = JSON.parse(decodeURIComponent(openProduct.dataset.openProduct));
    document.body.insertAdjacentHTML('beforeend', productEditor(product));
    document.querySelector('#productForm').dataset.originalProductId = product.productId;
  } else if (newProduct) {
    document.body.insertAdjacentHTML('beforeend', productEditor());
  }
  if (event.target.closest('[data-close-product]')) document.querySelector('#productModal')?.remove();
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'productForm') return;
  event.preventDefault();
  const form = event.target;
  persistProductForm(form);
  document.querySelector('#productModal')?.remove();
  state.toast = 'Tour package berjaya disimpan dalam database.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-booking-view]')) {
    state.bookingView = state.bookingView === 'list' ? 'cards' : 'list';
    render();
    return;
  }
  if (event.target.closest('[data-booking-group]')) {
    state.bookingGroup = state.bookingGroup === 'status' ? 'none' : 'status';
    render();
    return;
  }
  if (event.target.closest('[data-booking-filter]')) {
    document.querySelector('[data-booking-filter-menu]')?.classList.toggle('open');
    return;
  }
  const filterValue = event.target.closest('[data-booking-filter-value]');
  if (filterValue) {
    state.bookingFilter = filterValue.dataset.bookingFilterValue;
    render();
    return;
  }
  const heading = event.target.closest('.status-group-heading');
  if (!heading) return;
  const group = heading.closest('.booking-status-group');
  const wasExpanded = group.classList.contains('expanded');
  document.querySelectorAll('.booking-status-group').forEach(item => item.classList.remove('expanded'));
  group.classList.toggle('expanded', !wasExpanded);
  const caret = heading.querySelector('.status-caret');
  if (caret) caret.textContent = wasExpanded ? '›' : '⌄';
});

let draggedFieldIndex = null;
document.addEventListener('dragstart', (event) => {
  const row = event.target.closest('[data-field-row]');
  if (!row) return;
  draggedFieldIndex = Number(row.dataset.fieldIndex);
  row.classList.add('is-dragging');
  event.dataTransfer?.setData('text/plain', String(draggedFieldIndex));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
});
document.addEventListener('dragover', (event) => {
  const row = event.target.closest('[data-field-row]');
  if (!row) return;
  event.preventDefault();
  row.classList.add('drag-target');
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
});
document.addEventListener('dragleave', (event) => {
  event.target.closest('[data-field-row]')?.classList.remove('drag-target');
});
document.addEventListener('drop', (event) => {
  const target = event.target.closest('[data-field-row]');
  if (!target || draggedFieldIndex === null) return;
  event.preventDefault();
  const targetIndex = Number(target.dataset.fieldIndex), fields = getBookingFields();
  if (targetIndex !== draggedFieldIndex) {
    const [moved] = fields.splice(draggedFieldIndex, 1);
    fields.splice(targetIndex, 0, moved);
    saveBookingFields(fields);
  }
  document.querySelector('#fieldManager')?.remove();
  document.body.insertAdjacentHTML('beforeend', fieldManager());
  draggedFieldIndex = null;
});
document.addEventListener('dragend', () => {
  draggedFieldIndex = null;
  document.querySelectorAll('[data-field-row]').forEach(row => row.classList.remove('is-dragging','drag-target'));
});

document.addEventListener('click', (event) => {
  const row = event.target.closest('[data-edit-booking]');
  const newBooking = event.target.closest('#primaryAction, [data-new-booking]');
  if (row) {
    const record = JSON.parse(decodeURIComponent(row.dataset.editBooking));
    document.body.insertAdjacentHTML('beforeend', bookingEditor(record));
    document.querySelector('#bookingForm').dataset.originalOrderId = record.orderId || '';
  }
  if (newBooking && state.active === 'bookings') document.body.insertAdjacentHTML('beforeend', bookingEditor());
  if (event.target.closest('[data-close-modal]')) document.querySelector('#bookingModal')?.remove();
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'bookingForm') return;
  event.preventDefault();
  const form = event.target;
  const record = combinePhoneField(Object.fromEntries(new FormData(form).entries()));
  record.status = String(record.status || '').trim().toUpperCase();
  const phoneField = getBookingFields().find(([key, label]) => /hp|phone|telefon/i.test(key + ' ' + label));
  if (phoneField && record[phoneField[0]]) record.noHp = record[phoneField[0]];
  const records = storedBookings();
  const original = form.dataset.originalOrderId || record.orderId;
  const index = records.findIndex(item => item.orderId === original);
  if (index >= 0) records[index] = record; else records.push(record);
  persistSharedCollection('bookings', records);
  document.querySelector('#bookingModal')?.remove();
  state.toast = 'Booking berjaya disimpan.';
  render();
  setTimeout(() => { state.toast=''; render(); }, 2200);
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open-booking]');
  if (!button) return;
  const record = JSON.parse(decodeURIComponent(button.dataset.openBooking));
  document.body.insertAdjacentHTML('beforeend', bookingEditor(record));
  document.querySelector('#bookingForm').dataset.originalOrderId = record.orderId || '';
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-customize-fields]')) {
    document.body.insertAdjacentHTML('beforeend', fieldManager());
    document.querySelectorAll('.drag-handle').forEach(handle => handle.setAttribute('draggable','true'));
  }
  if (event.target.closest('[data-close-fields]')) document.querySelector('#fieldManager')?.remove();
  const toggle = event.target.closest('[data-field-toggle]');
  if (toggle) {
    const fields = getBookingFields().map(([key,label,visible]) => [key,label,key===toggle.dataset.fieldToggle ? toggle.checked : visible]);
    saveBookingFields(fields);
  }
  const move = event.target.closest('[data-field-move]');
  if (move) {
    const fields = getBookingFields(), index = Number(move.dataset.fieldIndex), next = move.dataset.fieldMove === 'up' ? index-1 : index+1;
    if (next >= 0 && next < fields.length) [fields[index],fields[next]] = [fields[next],fields[index]];
    saveBookingFields(fields); document.querySelector('#fieldManager')?.remove(); document.body.insertAdjacentHTML('beforeend', fieldManager());
  }
  if (event.target.closest('[data-add-field]')) {
    const input = document.querySelector('#newFieldName'), label = input?.value.trim();
    if (!label) return;
    const key = `custom_${Date.now()}`; saveBookingFields([...getBookingFields(),[key,label,true]]);
    document.querySelector('#fieldManager')?.remove(); document.body.insertAdjacentHTML('beforeend', fieldManager());
  }
});

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('#primaryAction, [data-open-booking]');
  if (!trigger || (trigger.id === 'primaryAction' && !trigger.textContent.includes('New Booking'))) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (trigger.matches('[data-open-booking]')) {
    const record = JSON.parse(decodeURIComponent(trigger.dataset.openBooking));
    document.body.insertAdjacentHTML('beforeend', bookingEditor(record));
    const form = document.querySelector('#bookingForm');
    form.dataset.originalOrderId = record.orderId || '';
    updateBookingSales(form);
  } else {
    document.body.insertAdjacentHTML('beforeend', bookingEditor());
    updateBookingSales(document.querySelector('#bookingForm'));
  }
}, true);

document.addEventListener('click', (event) => {
  const openSupplier = event.target.closest('[data-open-supplier]');
  const newSupplier = event.target.closest('#primaryAction');
  if (openSupplier) {
    const supplier = JSON.parse(decodeURIComponent(openSupplier.dataset.openSupplier));
    document.body.insertAdjacentHTML('beforeend', supplierEditor(supplier));
    document.querySelector('#supplierForm').dataset.originalSupplierId = supplier.id;
    return;
  }
  if (newSupplier && state.active === 'suppliers') {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.body.insertAdjacentHTML('beforeend', supplierEditor());
  }
}, true);

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-supplier]')) document.querySelector('#supplierModal')?.remove();
});

function handleSupplierSubmit(event) {
  event.preventDefault();
  const form = event.target, supplier = Object.fromEntries(new FormData(form).entries());
  const suppliers = storedSuppliers(), originalId = form.dataset.originalSupplierId || supplier.id;
  const index = suppliers.findIndex(item => item.id === originalId);
  if (index >= 0) suppliers[index] = {...suppliers[index], ...supplier}; else suppliers.push({...supplier, bookings: '0'});
  saveSuppliers(suppliers);
  clearSupplierFormDraft(supplier.id);
  document.querySelector('#supplierModal')?.remove();
  state.active = 'suppliers';
  state.toast = 'Supplier berjaya disimpan.';
  render();
  setTimeout(() => { state.toast = ''; render(); }, 2200);
  return false;
}

document.addEventListener('input', (event) => {
  if (event.target.closest('#supplierForm')) saveSupplierFormDraft(event.target.closest('#supplierForm'));
});

function bookingPhone(record) {
  const configuredPhoneField = getBookingFields().find(([key, label]) => /hp|phone|telefon/i.test(key + ' ' + label));
  return record.noHp || record.phone || record.contactPhone || record.whatsapp || (configuredPhoneField ? record[configuredPhoneField[0]] : '') || '';
}

function guestDetailsTemplate(value) {
  return value || '1. Name :\nID Passport :\nDate of birth :\nGender :\n\n2. Name :\nID Passport :\nDate of birth :\nGender :';
}

function getSupplierDraft(bookingId) {
  try {
    const drafts = JSON.parse(localStorage.getItem('milas-supplier-drafts') || '{}');
    return drafts[bookingId] || {};
  } catch { return {}; }
}

function saveSupplierDraft(form, extra = {}) {
  const data = {...Object.fromEntries(new FormData(form).entries()), ...extra};
  delete data.message;
  try {
    const drafts = JSON.parse(localStorage.getItem('milas-supplier-drafts') || '{}');
    drafts[data.bookingId] = data;
    localStorage.setItem('milas-supplier-drafts', JSON.stringify(drafts));
  } catch {}
}

function bookingRequestMessage(data) {
  return ['BOOKING REQUEST', 'Package Name : ' + (data.packageName || '—'), 'Booking ID : ' + (data.bookingId || '—'), '', 'CONTACT DATA', 'Name : ' + (data.contactName || '—'), 'No hp : ' + (data.contactPhone || '—'), '', 'BOOKING DETAILS', 'Date Travel : ' + formatTravelDate(data.travelDate), 'Nationality : ' + (data.nationality || '—'), 'No of Adults : ' + (data.adults || '0'), 'No of Kids : ' + (data.kids || '0'), 'No of Infant : ' + (data.infant || '0'), 'Single Supplement : ' + (data.singleSupplement || '—'), '', 'Pick up Location : ' + (data.pickupLocation || '—'), '', 'Guest Details : ' + (data.guestDetails || '—'), '', 'Notes : ' + (data.notes || '—')].join('\n');
}

function bookingSendModal(record) {
  const packageName = packageDisplay(record.package || record.name);
  const base = { packageName, bookingId: record.orderId || '', contactName: record.customer || '', contactPhone: bookingPhone(record), travelDate: record.startDate || '', nationality: record.nationality || '', adults: record.adult || '', kids: record.children || '', infant: record.infant || '', singleSupplement: record.singleSupplement || '', pickupLocation: record.pickupLocation || '', guestDetails: guestDetailsTemplate(record.guestDetails), notes: record.notes || '' };
  const initial = {...base, ...getSupplierDraft(base.bookingId)};
  return '<div class="modal-backdrop" id="sendBookingModal"><form class="booking-modal send-booking-modal" id="sendBookingForm"><div class="modal-head"><div><span class="eyebrow">Booking ' + initial.bookingId + '</span><h2>Send to supplier</h2><p>Lengkapkan dan semak maklumat sebelum dihantar kepada supplier.</p></div><button type="button" class="modal-close" data-close-send>×</button></div><div class="send-request-fields"><div class="send-section-title">BOOKING REQUEST</div><div class="editor-grid"><label>Package Name<input name="packageName" value="' + initial.packageName + '" /></label><label>Booking ID<input name="bookingId" value="' + initial.bookingId + '" readonly /></label></div><div class="send-section-title">CONTACT DATA</div><div class="editor-grid"><label>Name<input name="contactName" value="' + initial.contactName + '" /></label>' + phoneFieldMarkup('contactPhone', 'Phone number', initial.contactPhone, true) + '</div><div class="send-section-title">BOOKING DETAILS</div><div class="editor-grid"><label>Date Travel<input type="date" name="travelDate" value="' + (/^\d{4}-\d{2}-\d{2}$/.test(initial.travelDate) ? initial.travelDate : '') + '" min="' + todayIso() + '" required /></label><label>Nationality<input name="nationality" value="' + initial.nationality + '" /></label><label>No of Adults<input type="number" min="0" name="adults" value="' + initial.adults + '" /></label><label>No of Kids<input type="number" min="0" name="kids" value="' + initial.kids + '" /></label><label>No of Infant<input type="number" min="0" name="infant" value="' + initial.infant + '" /></label><label>Single Supplement<input name="singleSupplement" value="' + initial.singleSupplement + '" /></label><label>Pick up Location<input name="pickupLocation" value="' + initial.pickupLocation + '" /></label><label class="full-width">Guest Details<textarea name="guestDetails" rows="3">' + initial.guestDetails + '</textarea></label><label class="full-width">Notes<textarea name="notes" rows="3">' + initial.notes + '</textarea></label></div><div class="send-section-title">DELIVERY</div><div class="editor-grid"><label>Channel<select name="sendChannel"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></label><label>Supplier contact<input name="supplierContact" placeholder="No. WhatsApp atau email supplier" required /></label><label class="full-width">Message preview<textarea name="message" rows="12" readonly>' + bookingRequestMessage(initial) + '</textarea></label></div></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-send>Cancel</button><button type="submit" class="primary-btn">Save &amp; Send</button></div></form></div>';
}

document.addEventListener('input', (event) => {
  const form = event.target.closest('#sendBookingForm');
  if (!form) return;
  const data = Object.fromEntries(new FormData(form).entries());
  saveSupplierDraft(form);
  form.elements.message.value = bookingRequestMessage(data);
});

document.addEventListener('change', (event) => {
  const form = event.target.closest('#sendBookingForm');
  if (form) saveSupplierDraft(form);
});

function formFieldConfigs() {
  try { return JSON.parse(localStorage.getItem('milas-form-field-configs') || '{}'); } catch { return {}; }
}
function saveFormFieldConfigs(configs) {
  localStorage.setItem('milas-form-field-configs', JSON.stringify(configs));
}
function formFieldConfig(formId) {
  const configs = formFieldConfigs();
  const config = configs[formId] || {hidden: [], custom: [], order: []};
  return {...config, required: Array.isArray(config.required) ? config.required : []};
}
function formElementId(form) {
  return form?.getAttribute('id') || '';
}
function formFieldRecord(form) {
  const identifiers = ['id', 'orderId', 'productId', 'supplierId'];
  const values = identifiers.map(key => [key, form.elements[key]?.value]).filter(([, value]) => value);
  if (!values.length) return {};
  const collections = ['milas-leads', 'milas-quotations', 'milas-invoices', 'milas-customers', 'milas-suppliers', 'milas-bookings', 'milas-tour-products'];
  for (const collection of collections) {
    try {
      const records = JSON.parse(localStorage.getItem(collection) || 'null');
      if (!Array.isArray(records)) continue;
      const match = records.find(record => values.some(([key, value]) => String(record[key] || '') === String(value)));
      if (match) return match;
    } catch {}
  }
  return {};
}
function formFieldLabel(label) {
  const copy = label.cloneNode(true);
  copy.querySelectorAll('input,select,textarea,details,button').forEach(node => node.remove());
  copy.querySelectorAll('.required-mark').forEach(node => node.remove());
  return copy.textContent.trim().replace(/\s+/g, ' ') || 'Custom field';
}
function requiredFieldControl(label, key) {
  if (key === 'phoneCountryCode') return label.querySelector('input[type="tel"]') || label.querySelector('[name]');
  if (key === 'selectedAddons') return null;
  return label.querySelector('[name]');
}
function applyFormFieldRequirements(form, config) {
  form.querySelectorAll('label').forEach(label => {
    const fieldKey = label.querySelector('[name]')?.name;
    if (!fieldKey) return;
    if (fieldKey === 'selectedAddons' && !label.classList.contains('quotation-extra-field')) return;
    const configured = config.required.includes(fieldKey);
    if (fieldKey === 'selectedAddons' && label.classList.contains('quotation-extra-field')) {
      label.dataset.requiredField = configured ? 'true' : 'false';
    }
    const control = requiredFieldControl(label, fieldKey);
    const fixedRequired = control?.dataset.formFixedRequired === 'true' || (control && !control.dataset.formRequiredManaged && control.required);
    if (control) {
      if (fixedRequired) control.dataset.formFixedRequired = 'true';
      control.dataset.formRequiredManaged = 'true';
      control.required = Boolean(fixedRequired || configured);
    }
    const required = Boolean(fixedRequired || configured);
    let mark = label.querySelector(':scope > .required-mark');
    if (required && !mark) {
      mark = document.createElement('span');
      mark.className = 'required-mark';
      mark.setAttribute('aria-hidden', 'true');
      const directControl = [...label.children].find(child => child.matches('input,select,textarea,details,.phone-input-group'));
      label.insertBefore(mark, directControl || null);
    } else if (!required && mark) {
      mark.remove();
    }
  });
}
function applyFormFieldOrder(form, order = []) {
  const grid = form?.querySelector('.editor-grid');
  if (!grid || !Array.isArray(order) || !order.length) return;
  const extrasSlot = grid.querySelector(':scope > .quotation-extras-slot');
  extrasSlot?.querySelectorAll(':scope > .quotation-extras > .quotation-extra-field').forEach(label => grid.insertBefore(label, extrasSlot));
  const labels = [...grid.querySelectorAll(':scope > label')];
  const byKey = new Map(labels.map(label => [label.querySelector('[name]')?.name, label]));
  const orderedKeys = [...order, ...labels.map(label => label.querySelector('[name]')?.name)]
    .filter((key, index, keys) => key && keys.indexOf(key) === index);
  const currentKeys = labels.map(label => label.querySelector('[name]')?.name);
  if (currentKeys.length === orderedKeys.length && currentKeys.every((key, index) => key === orderedKeys[index])) return;
  orderedKeys.forEach(key => { const label = byKey.get(key); if (label) grid.appendChild(label); });
}
function enhanceFormFields(form) {
  // Payment records use a fixed finance form; field customization is only for
  // editable CRM forms and should not appear in the payment workflow.
  const formId = formElementId(form);
  if (!formId || formId === 'fieldManager' || formId === 'formFieldManager' || formId === 'invoicePaymentForm') return;
  const config = formFieldConfig(formId);
  const grid = form.querySelector('.editor-grid');
  if (!grid) return;
  const record = formFieldRecord(form);
  config.custom.forEach(field => {
    if (form.elements[field.key]) return;
    const value = record[field.key] ?? '';
    const escapedValue = escapeMarkup(Array.isArray(value) ? value.map(item => item.name || item).join(', ') : value);
    const control = field.type === 'textarea'
      ? `<textarea name="${escapeMarkup(field.key)}" rows="3">${escapedValue}</textarea>`
      : `<input name="${escapeMarkup(field.key)}" type="${escapeMarkup(field.type || 'text')}" value="${escapedValue}" />`;
    grid.insertAdjacentHTML('beforeend', `<label data-custom-field="${escapeMarkup(field.key)}">${escapeMarkup(field.label)}${control}</label>`);
  });
  applyFormFieldOrder(form, config.order);
  if (form.id === 'quotationForm' && form.dataset.fromLead === 'true') {
    const currentKeys = [...grid.querySelectorAll(':scope > label')].map(label => label.querySelector('[name]')?.name).filter(Boolean);
    applyFormFieldOrder(form, [...['id', 'customer', 'phone', 'email', 'nationality'], ...currentKeys]);
  }
  applyFormFieldRequirements(form, config);
  form.querySelectorAll('label').forEach(label => {
    const control = label.querySelector('[name]');
    if (!control) return;
    const hidden = config.hidden.includes(control.name);
    label.hidden = hidden;
    control.disabled = hidden;
  });
  const legacyButton = form.querySelector('[data-customize-fields]');
  if (legacyButton) { legacyButton.removeAttribute('data-customize-fields'); legacyButton.setAttribute('data-customize-form', ''); }
  form.querySelectorAll('[data-customize-fields], [data-customize-form]').forEach(button => { if (button.textContent !== '⚙ Setting') button.textContent = '⚙ Setting'; });
  if (!form.querySelector('[data-customize-form]')) {
    const header = form.querySelector('.modal-head');
    if (header) {
      const actions = header.querySelector('.modal-head-actions') || header.appendChild(document.createElement('div'));
      actions.classList.add('modal-head-actions');
      actions.insertAdjacentHTML('afterbegin', '<button type="button" class="view-control" data-customize-form>⚙ Setting</button>');
      const closeButton = header.querySelector('.modal-close');
      if (closeButton && closeButton.parentElement !== actions) actions.appendChild(closeButton);
    }
  }
}
function formFieldManager(form) {
  const formId = formElementId(form), config = formFieldConfig(formId);
  const fields = [...form.querySelectorAll('label')].map(label => {
    const control = label.querySelector('[name]');
    return control ? {key: control.name, label: formFieldLabel(label), required: config.required.includes(control.name) || Boolean(label.querySelector('[required]')), custom: Boolean(label.dataset.customField)} : null;
  }).filter(Boolean).filter((field, index, all) => all.findIndex(item => item.key === field.key) === index);
  return `<div class="modal-backdrop" id="formFieldManager" data-form-id="${escapeMarkup(formId)}"><section class="field-manager"><div class="modal-head"><div><span class="eyebrow">Form settings</span><h2>Setting</h2><p>Tarik field atau gunakan anak panah untuk ubah susunan.</p></div><button type="button" class="modal-close" data-close-form-field-manager>×</button></div><div class="field-manager-list">${fields.map((field, index) => `<div class="field-manager-row" draggable="true" data-form-field-row data-field-key="${escapeMarkup(field.key)}"><span class="drag-handle" title="Tarik untuk susun">☷</span><strong>${escapeMarkup(field.label)}${field.required ? ' <span class="required-mark" aria-hidden="true">*</span>' : ''}</strong><small>${escapeMarkup(field.key)}</small><label class="field-toggle"><input type="checkbox" data-form-field-visible="${escapeMarkup(field.key)}" ${config.hidden.includes(field.key) ? '' : 'checked'} /> <span>Show</span></label><label class="field-toggle"><input type="checkbox" data-form-field-required="${escapeMarkup(field.key)}" ${field.required ? 'checked' : ''} /> <span>Required</span></label><button type="button" class="field-move" data-form-field-move="up" ${index === 0 ? 'disabled' : ''} aria-label="Move ${escapeMarkup(field.label)} up">↑</button><button type="button" class="field-move" data-form-field-move="down" ${index === fields.length - 1 ? 'disabled' : ''} aria-label="Move ${escapeMarkup(field.label)} down">↓</button>${field.custom ? `<button type="button" class="field-move" data-delete-form-field="${escapeMarkup(field.key)}">Delete</button>` : ''}</div>`).join('')}</div><div class="add-field-row"><input data-form-field-label placeholder="Nama field baharu" /><select data-form-field-type><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="textarea">Notes / Textarea</option></select><button type="button" class="ghost-btn" data-add-form-field>＋ Add field</button></div><div class="modal-actions"><button type="button" class="primary-btn" data-close-form-field-manager>Done</button></div></section></div>`;
}
function refreshFormFieldManager(formId) {
  const form = document.getElementById(formId);
  const manager = document.querySelector('#formFieldManager');
  if (!form || !manager) return;
  const template = document.createElement('template');
  template.innerHTML = formFieldManager(form);
  const nextList = template.content.querySelector('.field-manager-list');
  const currentList = manager.querySelector('.field-manager-list');
  if (nextList && currentList) currentList.replaceWith(nextList);
}
document.addEventListener('click', event => {
  const customize = event.target.closest('[data-customize-form]');
  if (customize) {
    const form = customize.closest('form');
    if (form) { event.preventDefault(); document.querySelector('#formFieldManager')?.remove(); document.body.insertAdjacentHTML('beforeend', formFieldManager(form)); }
    return;
  }
  if (event.target.closest('[data-close-form-field-manager]')) { document.querySelector('#formFieldManager')?.remove(); return; }
  const move = event.target.closest('[data-form-field-move]');
  if (move) {
    const manager = move.closest('#formFieldManager'), formId = manager?.dataset.formId;
    const rows = [...(manager?.querySelectorAll('[data-form-field-row]') || [])];
    const row = move.closest('[data-form-field-row]'), index = rows.indexOf(row);
    const next = move.dataset.formFieldMove === 'up' ? index - 1 : index + 1;
    if (!formId || index < 0 || next < 0 || next >= rows.length) return;
    const order = rows.map(item => item.dataset.fieldKey);
    [order[index], order[next]] = [order[next], order[index]];
    const configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: []};
    config.order = order; configs[formId] = config; saveFormFieldConfigs(configs);
    withFormFieldObserverPaused(() => { enhanceFormFields(document.getElementById(formId)); refreshFormFieldManager(formId); }); return;
  }
  const add = event.target.closest('[data-add-form-field]');
  if (add) {
    const manager = add.closest('#formFieldManager'), formId = manager?.dataset.formId, label = manager?.querySelector('[data-form-field-label]')?.value.trim();
    if (!formId || !label) return;
    const configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: []};
    let key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'custom_field';
    while (config.custom.some(field => field.key === key)) key += '_1';
    config.custom.push({key, label, type: manager.querySelector('[data-form-field-type]')?.value || 'text'});
    configs[formId] = config; saveFormFieldConfigs(configs);
    enhanceFormFields(document.getElementById(formId)); refreshFormFieldManager(formId); return;
  }
  const remove = event.target.closest('[data-delete-form-field]');
  if (remove) {
    const manager = remove.closest('#formFieldManager'), formId = manager?.dataset.formId, key = remove.dataset.deleteFormField;
    const configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: []};
    config.custom = config.custom.filter(field => field.key !== key); config.hidden = config.hidden.filter(field => field !== key); config.order = (config.order || []).filter(item => item !== key);
    configs[formId] = config; saveFormFieldConfigs(configs); refreshFormFieldManager(formId);
  }
});
function formFieldDropOrder(manager, sourceKey, clientY) {
  const rows = [...manager.querySelectorAll('[data-form-field-row]')];
  const source = rows.find(row => row.dataset.fieldKey === sourceKey);
  if (!source) return null;
  const remaining = rows.filter(row => row !== source);
  const insertionIndex = remaining.findIndex(row => clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2);
  const order = remaining.map(row => row.dataset.fieldKey);
  order.splice(insertionIndex < 0 ? order.length : insertionIndex, 0, sourceKey);
  return order;
}
function highlightFormFieldDropTarget(manager, sourceKey, clientY) {
  const rows = [...manager.querySelectorAll('[data-form-field-row]')];
  const source = rows.find(row => row.dataset.fieldKey === sourceKey);
  const target = rows.filter(row => row !== source).find(row => clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2);
  manager.querySelectorAll('[data-form-field-row].drag-target').forEach(item => item.classList.remove('drag-target'));
  target?.classList.add('drag-target');
}
function saveFormFieldDrop(manager, sourceKey, clientY) {
  const order = formFieldDropOrder(manager, sourceKey, clientY);
  if (!order) return;
  const formId = manager.dataset.formId, configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: []};
  if (JSON.stringify(config.order || []) === JSON.stringify(order)) return;
  config.order = order; configs[formId] = config; saveFormFieldConfigs(configs);
  withFormFieldObserverPaused(() => { enhanceFormFields(document.getElementById(formId)); refreshFormFieldManager(formId); });
}
let pointerFormFieldDrag = null;
let mouseFormFieldDrag = null;
function beginFormFieldDrag(event) {
  const row = event.target.closest('[data-form-field-row]'), manager = row?.closest('#formFieldManager');
  if (!row || !manager || event.target.closest('button, input, select, textarea, a')) return;
  if (event.type === 'mousedown' && event.button !== 0) return;
  return {manager, row, pointerId: event.pointerId, sourceKey: row.dataset.fieldKey, startX: event.clientX, startY: event.clientY, active: false};
}
function moveFormFieldDrag(drag, event) {
  if (!drag) return;
  if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
  drag.active = true;
  event.preventDefault();
  drag.manager.dataset.dragSourceKey = drag.sourceKey;
  drag.row.classList.add('is-dragging');
  highlightFormFieldDropTarget(drag.manager, drag.sourceKey, event.clientY);
}
function finishFormFieldDrag(drag, event) {
  if (!drag) return;
  if (drag.active) saveFormFieldDrop(drag.manager, drag.sourceKey, event.clientY);
  drag.row.classList.remove('is-dragging');
  delete drag.manager.dataset.dragSourceKey;
  drag.manager.querySelectorAll('[data-form-field-row].drag-target').forEach(item => item.classList.remove('drag-target'));
}
document.addEventListener('pointerdown', event => {
  pointerFormFieldDrag = beginFormFieldDrag(event);
});
document.addEventListener('pointermove', event => {
  const drag = pointerFormFieldDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  moveFormFieldDrag(drag, event);
});
document.addEventListener('pointerup', event => {
  const drag = pointerFormFieldDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  finishFormFieldDrag(drag, event);
  pointerFormFieldDrag = null;
});
document.addEventListener('pointercancel', () => { pointerFormFieldDrag = null; });
document.addEventListener('mousedown', event => { mouseFormFieldDrag = beginFormFieldDrag(event); });
document.addEventListener('mousemove', event => { moveFormFieldDrag(mouseFormFieldDrag, event); });
document.addEventListener('mouseup', event => { finishFormFieldDrag(mouseFormFieldDrag, event); mouseFormFieldDrag = null; });
document.addEventListener('dragstart', event => {
  const row = event.target.closest('[data-form-field-row]');
  if (!row) return;
  const manager = row.closest('#formFieldManager');
  if (manager) manager.dataset.dragSourceKey = row.dataset.fieldKey;
  row.classList.add('is-dragging');
  event.dataTransfer?.setData('text/plain', row.dataset.fieldKey);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
});
document.addEventListener('dragover', event => {
  const list = event.target.closest('.field-manager-list'), manager = list?.closest('#formFieldManager');
  if (!list || !manager) return;
  event.preventDefault();
  const sourceKey = event.dataTransfer?.getData('text/plain') || manager.dataset.dragSourceKey;
  highlightFormFieldDropTarget(manager, sourceKey, event.clientY);
});
document.addEventListener('drop', event => {
  const list = event.target.closest('.field-manager-list'), manager = list?.closest('#formFieldManager');
  if (!list || !manager) return;
  event.preventDefault();
  const sourceKey = event.dataTransfer?.getData('text/plain') || manager.dataset.dragSourceKey;
  saveFormFieldDrop(manager, sourceKey, event.clientY);
});
document.addEventListener('dragend', event => {
  const row = event.target.closest('[data-form-field-row]'), manager = row?.closest('#formFieldManager');
  row?.classList.remove('is-dragging');
  if (manager) delete manager.dataset.dragSourceKey;
  document.querySelectorAll('[data-form-field-row].drag-target').forEach(item => item.classList.remove('drag-target'));
});
document.addEventListener('change', event => {
  const required = event.target.closest('[data-form-field-required]');
  if (required) {
    const manager = required.closest('#formFieldManager'), formId = manager?.dataset.formId, key = required.dataset.formFieldRequired;
    if (!formId || !key) return;
    const configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: [], order: []};
    config.required = required.checked ? [...new Set([...(config.required || []), key])] : (config.required || []).filter(item => item !== key);
    configs[formId] = config; saveFormFieldConfigs(configs);
    enhanceFormFields(document.getElementById(formId)); refreshFormFieldManager(formId); return;
  }
  const visible = event.target.closest('[data-form-field-visible]');
  if (!visible) return;
  const manager = visible.closest('#formFieldManager'), formId = manager?.dataset.formId, key = visible.dataset.formFieldVisible;
  const configs = formFieldConfigs(), config = configs[formId] || {hidden: [], custom: []};
  config.hidden = visible.checked ? config.hidden.filter(item => item !== key) : [...new Set([...config.hidden, key])];
  configs[formId] = config; saveFormFieldConfigs(configs); enhanceFormFields(document.getElementById(formId));
});
let formFieldObserverUpdating = false;
function withFormFieldObserverPaused(update) {
  formFieldObserver.disconnect();
  try {
    return update();
  } finally {
    formFieldObserver.observe(document.body, {childList: true, subtree: true});
  }
}
const formFieldObserver = new MutationObserver(records => {
  const managerOnlyMutation = records.length > 0 && records.every(record => {
    const target = record.target instanceof Element ? record.target : record.target.parentElement;
    if (target?.closest('#formFieldManager')) return true;
    return [...record.addedNodes, ...record.removedNodes].every(node => !(node instanceof Element) || node.closest('#formFieldManager'));
  });
  if (managerOnlyMutation) return;
  if (formFieldObserverUpdating) return;
  formFieldObserverUpdating = true;
  formFieldObserver.disconnect();
  try {
    document.querySelectorAll('form.booking-modal').forEach(enhanceFormFields);
  } finally {
    formFieldObserverUpdating = false;
    formFieldObserver.observe(document.body, {childList: true, subtree: true});
  }
});
formFieldObserver.observe(document.body, {childList: true, subtree: true});
document.querySelectorAll('form.booking-modal').forEach(enhanceFormFields);
