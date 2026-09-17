const sharedData = { suppliers: null, bookings: null };

function persistSharedCollection(collection, records) {
  sharedData[collection] = records;
  try { localStorage.setItem(`milas-${collection}`, JSON.stringify(records)); } catch {}
  fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sharedData) }).catch(() => {});
}

async function loadSharedData() {
  const stateSources = ['/api/state', './data/crm-state.json'];
  for (const source of stateSources) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Shared state request failed: ${response.status}`);
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
      console.warn(`Shared CRM state source unavailable: ${source}`, error);
    }
  }
  render();
}

const navGroups = [
  { label: 'Workspace', items: [['dashboard','Dashboard','▦']] },
  { label: 'CRM', items: [['leads','Leads','◌'],['customers','Customers','◎'],['pipeline','Sales Pipeline','⌁'],['followups','Follow-ups','◷']] },
  { label: 'Sales', items: [['quotations','Quotations','▤'],['invoices','Invoices','▧']] },
  { label: 'Bookings', items: [['bookings','All Bookings','▣'],['upcoming','Upcoming Travel','◫']] },
  { label: 'Catalogue', items: [['products','Tour Packages','◇']] },
  { label: 'Finance & Ops', items: [['payments','Payment Records','₿'],['outstanding','Outstanding Payments','!'],['operations','Operations','⌂'],['suppliers','Suppliers','⬡'],['reports','Reports','⌘']] },
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
  outstanding: { eyebrow: 'Finance', title: 'Outstanding Payments', subtitle: 'Baki bayaran yang memerlukan tindakan.', action: 'Send Reminder' },
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
  return {...lead, status, receivedDate, followUpDate: leadFollowUpDate(receivedDate)};
}
function storedLeads() {
  try {
    const saved = JSON.parse(localStorage.getItem('milas-leads') || 'null');
    return Array.isArray(saved) ? saved.map(normaliseLead) : leadSeed.map(lead => ({...lead}));
  } catch { return leadSeed.map(lead => ({...lead})); }
}
const leadStatuses = ['New Lead', 'Contacted', 'Quotation Sent', 'Follow-up', 'Won', 'Lost'];
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
  const requiredContact = record.id && lead.status === 'Contacted' ? 'required' : '';
  const quotationAction = record.id && lead.status === 'Contacted' ? `<button type="button" class="proceed-quotation" data-proceed-quotation="${lead.id}">Proceed to quotation</button>` : '';
  const editorActions = quotationAction || '<button type="button" class="ghost-btn" data-close-lead>Cancel</button><button type="submit" class="primary-btn">Save lead</button>';
  return `<div class="modal-backdrop" id="leadModal"><form class="booking-modal lead-modal" id="leadForm" onsubmit="return handleLeadSubmit(event)"><div class="modal-head"><div><span class="eyebrow">CRM / Leads</span><h2>${record.id ? 'Edit lead' : 'New lead'}</h2><p>Simpan dan urus lead baharu Milas Travel.</p></div><button type="button" class="modal-close" data-close-lead>×</button></div><div class="editor-grid">${input('id','Lead ID')}${input('customer','Customer name','text',requiredContact)}${input('phone','Phone number','tel',requiredContact)}${input('email','Email','email',requiredContact)}<label>Source<select name="source">${leadSources.map(source => `<option ${lead.source === source ? 'selected' : ''}>${source}</option>`).join('')}</select></label>${input('packageName','Interested package')}${input('value','Estimated value')}${input('receivedDate','Lead received date','date','data-lead-received-date')}${input('followUpDate','Follow-up date','date','readonly data-lead-follow-up')}<label>Status<select name="status">${leadStatuses.map(status => `<option ${lead.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Follow-up status<select name="followUpStatus"><option ${lead.followUpStatus !== 'Done' ? 'selected' : ''}>Pending</option><option ${lead.followUpStatus === 'Done' ? 'selected' : ''}>Done</option></select></label><label class="full-width">Notes<textarea name="notes" rows="4">${lead.notes || ''}</textarea></label></div><div class="modal-actions">${editorActions}</div></form></div>`;
}
function persistLeadForm(form) {
  const lead = Object.fromEntries(new FormData(form).entries()), leads = storedLeads(), originalId = form.dataset.originalLeadId || lead.id;
  lead.receivedDate = lead.receivedDate || localDateKey();
  lead.followUpDate = leadFollowUpDate(lead.receivedDate);
  const index = leads.findIndex(item => item.id === originalId);
  if (index >= 0) leads[index] = {...leads[index], ...lead}; else leads.push(lead);
  localStorage.setItem('milas-leads', JSON.stringify(leads));
}
function handleLeadSubmit(event) {
  event.preventDefault();
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
    return Array.isArray(saved) ? saved : moduleData.quotations.rows.map(([id, customer, packageName, travelDate, total, status]) => ({id, customer, phone: '', email: '', packageName, travelDate, total, status}));
  } catch { return []; }
}
function quotationDocumentSnapshot(quotation) {
  const packageName = quotation.packageName || '';
  const product = storedTourProducts().find(item => item.productId === quotation.packageId || item.name === packageName || (packageName && String(packageName).includes(item.name))) || {};
  return JSON.parse(JSON.stringify({
    ...quotation,
    documentProduct: product,
    documentPricing: quotationPricing(quotation.packageId)
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
function convertQuotationToInvoice(quotation) {
  const invoices = storedInvoices();
  const existing = invoices.find(invoice => invoice.quotationId === quotation.id);
  if (existing) return existing;
  const invoice = {...quotation, id: nextInvoiceNumber(invoices), quotationId: quotation.id, status: 'Draft', issuedAt: new Date().toISOString(), quotationSnapshot: quotationDocumentSnapshot(quotation)};
  invoices.unshift(invoice);
  localStorage.setItem('milas-invoices', JSON.stringify(invoices));
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
function quotationPricing(packageId) {
  const product = storedTourProducts().find(item => item.productId === packageId || item.name === packageId);
  const records = pricingDataFromValue(product?.pricing);
  const selected = records.find(item => !item.optional) || records[0];
  const price = key => {
    const raw = selected?.prices?.[key];
    if (raw && typeof raw === 'object') return Number(raw.basePrice || raw.supplierCost || 0);
    return Number(raw || 0);
  };
  const legacyAdult = Number(String(product?.pricing || '').match(/Adult:\s*(?:RM\s*)?([\d,\.]+)/i)?.[1]?.replaceAll(',', '') || 0);
  return {adult: price('adult') || legacyAdult, child: price('child'), infant: price('infant'), solo: price('solo')};
}
function quotationTotal(form) {
  const pricing = quotationPricing(form.querySelector('[data-quotation-package]')?.value);
  const number = key => Number(form.querySelector(`[name="${key}"]`)?.value || 0);
  const subtotal = pricing.adult * number('adults') + pricing.child * number('children') + pricing.infant * number('infants') + pricing.solo * number('singleSupplement');
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
  return `<article class="panel list-panel invoices-list"><div class="toolbar"><div class="search-field">⌕ <input placeholder="Search invoices..." /></div><button class="ghost-btn">Filter</button></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Quotation</th><th>Customer</th><th>Package</th><th>Travel date</th><th>Issued</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${invoices.length ? invoices.map(invoice => { const payload = encodeURIComponent(JSON.stringify({data: invoice})); return `<tr><td class="id-cell">${invoice.id || '—'}</td><td>${invoice.quotationId || '—'}</td><td><strong>${invoice.customer || '—'}</strong><small class="table-subtext">${invoice.email || invoice.phone || ''}</small></td><td>${invoice.packageName || '—'}</td><td>${formatTravelDate(invoice.travelDate)}</td><td>${invoice.issuedAt ? new Intl.DateTimeFormat('en-GB').format(new Date(invoice.issuedAt)) : '—'}</td><td>RM ${Number(String(invoice.total || '0').replace(/[^0-9.-]/g, '') || 0).toFixed(2)}</td><td><span class="status draft">${invoice.status || 'Draft'}</span></td><td><div class="quotation-row-actions"><button class="ghost-btn" data-open-invoice="${payload}">Open</button><button class="primary-btn quotation-pdf" data-print-invoice="${payload}">Save as PDF</button></div></td></tr>`; }).join('') : '<tr><td colspan="9" class="empty-cell">Belum ada invoice. Convert quotation untuk menjana invoice secara automatik.</td></tr>'}</tbody></table></div></article>`;
}
const quotationStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected'];
function quotationEditor(record = {}) {
  const quotation = {...record};
  if (!quotation.id) quotation.id = nextQuotationNumber(storedQuotations());
  const products = storedTourProducts();
  const selectedProduct = products.find(product => product.productId === quotation.packageId || product.name === quotation.packageName || (quotation.packageName && String(quotation.packageName).includes(product.name))) || products[0];
  const input = (key, label, type = 'text') => `<label>${label}<input name="${key}" type="${type}" value="${quotation[key] || ''}" ${key === 'id' ? 'readonly' : ''} /></label>`;
  const packageId = selectedProduct?.productId || quotation.packageId || '';
  return `<div class="modal-backdrop" id="quotationModal"><form class="booking-modal quotation-modal" id="quotationForm" onsubmit="return handleQuotationSubmit(event)"><div class="modal-head"><div><span class="eyebrow">Sales / Quotations</span><h2>${record.id ? 'Edit quotation' : 'New quotation'}</h2><p>Lengkapkan dan simpan quotation customer.</p></div><button type="button" class="modal-close" data-close-quotation>×</button></div><div class="editor-grid">${input('id','Quotation number')}${input('leadId','Lead ID')}${input('customer','Customer name')}${input('phone','Phone number','tel')}${input('email','Email','email')}<label class="full-width">Package<select name="packageId" data-quotation-package>${products.length ? products.map(product => `<option value="${product.productId}" ${product.productId === packageId ? 'selected' : ''}>${product.productId} — ${product.name || 'Unnamed package'}</option>`).join('') : '<option value="">Tiada package dalam database</option>'}</select></label>${input('travelDate','Travel date','date')}<label>No of adults<input name="adults" type="number" min="0" step="1" value="${quotation.adults || 0}" data-quotation-calculator /></label><label>No of children<input name="children" type="number" min="0" step="1" value="${quotation.children || 0}" data-quotation-calculator /></label><label>No of infants<input name="infants" type="number" min="0" step="1" value="${quotation.infants || 0}" data-quotation-calculator /></label><label>Single supplement<input name="singleSupplement" type="number" min="0" step="1" value="${quotation.singleSupplement || 0}" data-quotation-calculator /></label><label>Discount (%)<input name="discount" type="number" min="0" max="100" step="0.01" value="${quotation.discount || 0}" data-quotation-calculator /></label><label>Total<input name="total" type="text" value="${quotation.total || '0.00'}" data-quotation-total readonly /></label><label>Status<select name="status">${quotationStatuses.map(status => `<option ${quotation.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label class="full-width">Notes<textarea name="notes" rows="4">${quotation.notes || ''}</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-preview-quotation>Preview quotation</button><button type="submit" class="primary-btn">Save</button></div></form></div>`;
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
  const pricing = data.documentPricing || quotationPricing(data.packageId);
  const line = (label, count, unit) => {
    const quantity = Number(count || 0);
    if (quantity <= 0) return '';
    return `<tr><td>${label}</td><td>${quantity}</td><td>RM ${Number(unit || 0).toFixed(2)}</td><td>RM ${(quantity * Number(unit || 0)).toFixed(2)}</td></tr>`;
  };
  const hasParticipants = [data.adults, data.children, data.infants, data.singleSupplement].some(value => Number(value || 0) > 0);
  const subtotal = hasParticipants
    ? pricing.adult * Number(data.adults || 0) + pricing.child * Number(data.children || 0) + pricing.infant * Number(data.infants || 0) + pricing.solo * Number(data.singleSupplement || 0)
    : (Number(data.discount || 0) < 100 ? total / (1 - Number(data.discount || 0) / 100) : total);
  const issueDate = new Date(documentDate || Date.now());
  const displayedDate = Number.isNaN(issueDate.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB').format(issueDate);
  const discountAmount = Math.max(0, subtotal - Number(total || 0));
  const bankDetailsMarkup = documentType === 'INVOICE' && bankDetails?.bankName && bankDetails?.accountName && bankDetails?.accountNumber
    ? `<section class="bank-details" aria-label="Bank details"><div class="section-title">Bank details</div><dl><dt>Bank</dt><dd>${escapeDocumentText(bankDetails.bankName)}</dd><dt>Account name</dt><dd>${escapeDocumentText(bankDetails.accountName)}</dd><dt>Account no.</dt><dd class="bank-account-number">${escapeDocumentText(bankDetails.accountNumber)}</dd></dl></section>`
    : '';

  return `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeDocumentText(data.id || documentType)}</title><style>@page{size:210mm 297mm;margin:14mm}*{box-sizing:border-box}body{margin:0;padding:14mm;font-family:Arial,sans-serif;color:#24364a;font-size:12px}@media print{body{padding:0}}.sheet{width:100%;min-height:267mm}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #18a889;padding-bottom:18px}.brand{display:flex;gap:10px;align-items:center}.logo{width:42px;height:42px;border-radius:12px;background:#18a889;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800}.company h1{margin:0;font-size:21px;color:#122238}.company p{margin:4px 0 0;color:#718096}.quote-meta{text-align:right}.quote-meta h2{margin:0 0 6px;color:#18a889;font-size:22px}.quote-meta p{margin:3px 0;color:#718096}.section{margin-top:24px}.section-title{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#18a889;margin-bottom:8px}.recipient{background:#f4faf8;border:1px solid #d9eee8;border-radius:8px;padding:13px;display:grid;grid-template-columns:120px 1fr;gap:6px}.recipient strong{color:#718096}.package{border:1px solid #dce5eb;border-radius:8px;padding:15px}.package h3{margin:0 0 5px;font-size:17px}.package p{margin:0;color:#718096}.package-notes{display:grid;grid-template-columns:1fr;gap:8px;margin-top:72px;width:65%;text-align:left}.package-note{padding:0}.package-note strong{display:block;color:#477466;margin-bottom:5px}.package-note ul{margin:0;padding-left:18px}.package-note li{margin:3px 0}.pricing{width:100%;border-collapse:collapse;margin-top:12px}.pricing th{background:#edf8f5;color:#477466;text-align:left;font-size:11px}.pricing th,.pricing td{padding:10px;border-bottom:1px solid #e7edf0}.pricing td:nth-child(2),.pricing td:nth-child(3),.pricing td:nth-child(4),.pricing th:nth-child(2),.pricing th:nth-child(3),.pricing th:nth-child(4){text-align:right}.totals{margin:72px 0 0 auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:5px 0}.totals .grand{border-top:2px solid #18a889;margin-top:5px;padding-top:10px;font-size:17px;font-weight:800;color:#18a889}.bank-details{width:58%;margin:58px 0 0 auto;padding:14px;border:1px solid #d9eee8;border-left:3px solid #18a889;border-radius:8px;background:#f4faf8;text-align:left;break-inside:avoid;page-break-inside:avoid}.bank-details dl{display:grid;grid-template-columns:88px minmax(0,1fr);gap:7px 10px;margin:0;line-height:1.5}.bank-details dt{color:#718096}.bank-details dd{margin:0;font-weight:700;overflow-wrap:anywhere}.bank-account-number{font-variant-numeric:tabular-nums;letter-spacing:.03em}.footer{border-top:1px solid #dce5eb;margin-top:34px;padding-top:12px;color:#8492a3;text-align:center;font-size:10px}</style></head><body><main class="sheet"><header class="header"><div class="brand"><div class="logo">M</div><div class="company"><h1>Milas Travel &amp; Tours</h1><p>Sabah, Malaysia</p></div></div><div class="quote-meta"><h2>${documentType}</h2><p><strong>${escapeDocumentText(data.id || '—')}</strong></p><p>${displayedDate}</p>${quotationReference ? `<p>Quotation: ${escapeDocumentText(quotationReference)}</p>` : ''} </div></header><section class="section"><div class="section-title">Bill to</div><div class="recipient"><strong>Name</strong><span>${escapeDocumentText(data.customer || '—')}</span><strong>Phone</strong><span>${escapeDocumentText(data.phone || '—')}</span><strong>Email</strong><span>${escapeDocumentText(data.email || '—')}</span></div></section><section class="section"><div class="section-title">Package details</div><div class="package"><h3>${escapeDocumentText(packageName || '—')}</h3><p>Travel date: ${data.travelDate ? formatTravelDate(data.travelDate) : '—'}</p></div><table class="pricing"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${line('Adult',data.adults,pricing.adult)}${line('Child',data.children,pricing.child)}${line('Infant',data.infants,pricing.infant)}${line('Single supplement',data.singleSupplement,pricing.solo)}${!hasParticipants ? `<tr><td>${escapeDocumentText(packageName || 'Package')}</td><td>1</td><td>RM ${subtotal.toFixed(2)}</td><td>RM ${subtotal.toFixed(2)}</td></tr>` : ''}</tbody></table>${packageNotes ? `<div class="package-notes">${packageNotes}</div>` : ''}<div class="totals"><div><span>Subtotal</span><strong>RM ${Number(subtotal).toFixed(2)}</strong></div><div><span>Discount (${data.discount || 0}%)</span><strong>- RM ${discountAmount.toFixed(2)}</strong></div><div class="grand"><span>Total</span><span>RM ${Number(total || 0).toFixed(2)}</span></div></div>${data.notes ? `<div class="section"><div class="section-title">Notes</div><p style="white-space:pre-wrap">${escapeDocumentText(data.notes)}</p></div>` : ''} </section>${bankDetailsMarkup}<footer class="footer">Thank you for choosing Milas Travel &amp; Tours · Sabah, Malaysia</footer></main></body></html>`;
}
function handleQuotationSubmit(event) {
  event.preventDefault();
  const quotation = Object.fromEntries(new FormData(event.target).entries());
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
  const stages = ['New Lead', 'Contacted', 'Quotation Sent', 'Follow-up', 'Won', 'Lost'];
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
    if (!travelDate || travelDate > new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
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
function storedBookings() {
  if (Array.isArray(sharedData.bookings)) return syncBookingStatuses(sharedData.bookings);
  try {
    const records = JSON.parse(localStorage.getItem('milas-bookings') || 'null') || bookingSeed.map(record => ({...record}));
    return syncBookingStatuses(records);
  } catch { return syncBookingStatuses(bookingSeed.map(record => ({...record}))); }
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
  return ['Pending payment', 'Deposit paid', 'Partially paid', 'Paid', 'Overdue', 'Refunded'];
}

function bookingSupplierMessage(record) {
  return ['Booking request', 'Booking ID: ' + (record.orderId || '—'), 'Customer: ' + (record.customer || '—'), 'Package: ' + packageDisplay(record.package || record.name), 'Travel date: ' + formatTravelDate(record.startDate), 'Travellers: ' + (record.adult || '0') + ' adult, ' + (record.children || '0') + ' child', 'Sales amount: ' + (record.sales || '—'), 'Payment status: ' + (record.payment || '—')].join('\n');
}

function bookingSendModal(record) {
  const message = bookingSupplierMessage(record);
  return '<div class="modal-backdrop" id="sendBookingModal"><form class="booking-modal send-booking-modal" id="sendBookingForm"><div class="modal-head"><div><span class="eyebrow">Booking ' + (record.orderId || '') + '</span><h2>Send to supplier</h2><p>Semak maklumat sebelum buka WhatsApp atau email.</p></div><button type="button" class="modal-close" data-close-send>×</button></div><div class="editor-grid"><label>Channel<select name="sendChannel"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></label><label>Supplier contact<input name="supplierContact" placeholder="No. WhatsApp atau email supplier" required /></label><label class="full-width">Message<textarea name="message" rows="8" readonly>' + message + '</textarea></label></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-send>Cancel</button><button type="submit" class="primary-btn">Open draft</button></div></form></div>';
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

function bookingEditor(record = {}) {
  record = {...record}; const isNew = !record.orderId; if (isNew) record.orderId = nextBookingId(storedBookings());
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

const defaultBookingFields = [['orderId','Booking ID'],['name','Booking name'],['bookingDate','Booking date'],['startDate','Start date'],['assignee','Assignee'],['channel','Channel platform'],['supplier','Supplier confirmation'],['type','Type'],['customer','Customer'],['package','Package'],['adult','Adults'],['children','Children'],['infant','Infants'],['discount','Discount'],['sales','Sales amount'],['payment','Payment'],['email','Email'],['proof','Order proof / payment'],['invoice','Invoice'],['commission','Commission 5%']];
function getBookingFields() { try { const fields = JSON.parse(localStorage.getItem('milas-booking-fields') || 'null') || defaultBookingFields.map(field => [...field]); const salesIndex = fields.findIndex(([key]) => key === 'sales'); if (!fields.some(([key]) => key === 'infant')) fields.splice(salesIndex >= 0 ? salesIndex : fields.length, 0, ['infant', 'Infants', true]); if (!fields.some(([key]) => key === 'discount') && !fields.some(([, label]) => /discount/i.test(label))) fields.splice(salesIndex >= 0 ? salesIndex : fields.length, 0, ['discount', 'Discount', true]); return fields; } catch { return defaultBookingFields.map(field => [...field]); } }
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
  return `<div class="booking-grid-wrap"><table class="booking-summary-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="booking-id"><strong>${r.orderId||'—'}</strong></td><td>${r.customer||'—'}</td><td>${r.package||r.name}</td><td>${r.startDate||'—'}</td><td><span class="booking-status-cell ${r.status.toLowerCase().replaceAll(' ','-')}">${r.status}</span></td><td>${r.sales||'—'}</td><td><span class="payment-cell">${r.payment||'—'}</span></td><td><button class="open-booking" data-open-booking="${encodeURIComponent(JSON.stringify(r))}">Open <span>→</span></button></td></tr>`).join(''):`<tr><td colspan="8" class="empty-cell">Tiada booking dalam status ini.</td></tr>`}</tbody></table><button class="add-task">＋ Add Task</button></div>`;
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
  return `<div class="booking-grid-wrap"><table class="booking-summary-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="booking-id"><strong>${r.orderId||'—'}</strong></td><td>${r.customer||'—'}</td><td>${packageDisplay(r.package||r.name)}</td><td>${formatTravelDate(r.startDate)}</td><td><span class="booking-status-cell ${r.status.toLowerCase().replaceAll(' ','-')}">${r.status}</span></td><td>${r.sales||'—'}</td><td><span class="payment-cell">${r.payment||'—'}</span></td><td><button class="open-booking" data-open-booking="${encodeURIComponent(JSON.stringify(r))}">Open <span>→</span></button></td></tr>`).join(''):`<tr><td colspan="8" class="empty-cell">Tiada booking dalam status ini.</td></tr>`}</tbody></table><button class="add-task">＋ Add Task</button></div>`;
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

function genericView(key) {
  if (key === 'leads') return leadsView();
  if (key === 'products') return tourPackagesViewGrouped();
  if (key === 'bookings') return allBookingsViewV4();
  if (key === 'pipeline') return pipelineView();
  if (key === 'quotations') return quotationsView();
  if (key === 'invoices') return invoicesView();
  if (key === 'calendar') return calendarView();
  if (key === 'upcoming') return upcomingView();
  if (key === 'reports') return reportsView();
  if (key === 'suppliers') return suppliersViewActive();
  return tableView(key);
}

function settingsView() { return `<section class="settings-grid"><article class="panel settings-nav"><h2>Configuration</h2><button class="setting-active">General settings <span>→</span></button><button>Lead sources <span>→</span></button><button>Package categories <span>→</span></button><button>Supplier types <span>→</span></button><button>Payment methods <span>→</span></button></article><article class="panel settings-content"><div class="panel-head"><div><h2>Users, roles & permissions</h2><p>Permission architecture berpusat — bukan hardcoded di UI.</p></div><button class="primary-btn">+ Invite user</button></div><div class="role-list"><div class="role-row"><div class="avatar teal">AM</div><section><strong>Afiq Milas</strong><small>Super Admin · Last active now</small></section><span class="role-pill">Super Admin</span><button class="icon-btn">•••</button></div><div class="role-row"><div class="avatar blue">SA</div><section><strong>Sarah Ahmad</strong><small>Sales Manager · Last active 12 min ago</small></section><span class="role-pill">Sales Manager</span><button class="icon-btn">•••</button></div><div class="role-row"><div class="avatar purple">RK</div><section><strong>Rizal Karim</strong><small>Operations · Last active yesterday</small></section><span class="role-pill">Operations</span><button class="icon-btn">•••</button></div></div><div class="permission-box"><strong>Permission matrix</strong><p>Roles inherit granular permissions seperti View Lead, Create Quotation, Record Payment dan View Reports.</p><div class="permission-chips"><span>View leads</span><span>Create quotation</span><span>Create booking</span><span>Record payment</span><span>View operations</span><span>View reports</span></div></div></article></section>`; }

function render() { const v=views[state.active], todayCount=upcomingTodayCount(), pendingNewOrders=newOrderCount(), pendingNewLeads=newLeadCount(), dueFollowUps=followUpsDueCount(); document.querySelector('#app').innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">M</span><span><strong>Milas Travel</strong><small>Unified CRM</small></span></div><div class="workspace-select"><span class="workspace-dot"></span><span>Milas Travel & Tours</span><b>⌄</b></div><nav>${navGroups.map(g=>`<div class="nav-group"><small>${g.label}</small>${g.items.map(([id,label,icon])=>`<button class="nav-item ${state.active===id?'active':''}" data-nav="${id}"><i>${icon}</i>${label}${id==='leads'&&pendingNewLeads?`<em class="nav-count">${pendingNewLeads}</em>`:''}${id==='followups'&&dueFollowUps?`<em class="nav-count">${dueFollowUps}</em>`:''}${id==='outstanding'?'<em>3</em>':''}${id==='bookings'&&pendingNewOrders?`<em class="nav-count">${pendingNewOrders}</em>`:''}${id==='upcoming'&&todayCount?`<em class="nav-count">${todayCount}</em>`:''}</button>`).join('')}</div>`).join('')}</nav><div class="sidebar-footer"><button class="help-link">? <span>Help centre</span></button><div class="user-chip"><div class="avatar teal">AM</div><span><strong>Afiq Milas</strong><small>Super Admin</small></span><b>•••</b></div></div></aside><main class="main"><header class="topbar"><div class="breadcrumbs"><span>${v.eyebrow}</span><b>/</b><strong>${v.title}</strong></div><div class="top-actions"><div class="global-search">⌕ <input id="globalSearch" placeholder="Search anything..." /><kbd>⌘ K</kbd></div><button class="icon-btn notification">♧<i></i></button><button class="mobile-menu">☰</button></div></header><div class="content"><div class="page-heading"><div><h1>${v.title}</h1><p>${v.subtitle}</p></div><div class="heading-actions">${state.active==='dashboard'?`<div class="range-select"><span>◷</span><select id="range"><option>Today</option><option>This Week</option><option selected>This Month</option><option>Custom Date</option></select></div>`:''}${v.action?`<button class="primary-btn" id="primaryAction">${v.action}</button>`:''}</div></div>${state.active==='dashboard'?dashboard():state.active==='settings'?settingsView():genericView(state.active)}</div></main></div><div id="toast" class="toast ${state.toast?'show':''}">${state.toast}</div>`; bind(); }

function bind(){ document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{state.active=b.dataset.nav;state.toast='';render()}); document.querySelector('#primaryAction')?.addEventListener('click',()=>{state.toast='Foundation UI ready — workflow action akan disambung pada Milestone 2.';render();setTimeout(()=>{state.toast='';render()},3500)}); document.querySelector('#range')?.addEventListener('change',e=>{state.range=e.target.value;state.toast=`Dashboard ditapis: ${state.range}`;render();setTimeout(()=>{state.toast='';render()},2200)}); document.querySelector('#upcomingMonth')?.addEventListener('change',e=>{state.upcomingMonth=e.target.value;render()}); document.querySelector('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value){state.toast=`Carian global disediakan untuk: ${e.target.value}`;render()}}); if(state.active==='bookings' && !state.bookingSearch) document.querySelectorAll('.booking-status-group').forEach(group=>{group.classList.remove('expanded'); group.querySelector('.status-caret').textContent='›';}); }
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
    const data = Object.fromEntries(new FormData(form).entries());
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
    const formData = Object.fromEntries(new FormData(form).entries());
    const leads = storedLeads();
    const lead = leads.find(item => item.id === proceedQuotation.dataset.proceedQuotation);
    if (lead) {
      Object.assign(lead, formData, {status: 'Quotation Sent'});
      localStorage.setItem('milas-leads', JSON.stringify(leads));
      const quotations = storedQuotations();
      const quotation = {
        id: nextQuotationNumber(quotations),
        leadId: lead.id,
        customer: formData.customer,
        phone: formData.phone,
        email: formData.email,
        packageName: formData.packageName,
        travelDate: '',
        total: formData.value || '—',
        status: 'Draft',
        createdAt: new Date().toISOString(),
      };
      quotations.unshift(quotation);
      localStorage.setItem('milas-quotations', JSON.stringify(quotations));
      document.querySelector('#leadModal')?.remove();
      state.active = 'quotations';
      state.toast = '';
      render();
      document.body.insertAdjacentHTML('beforeend', quotationEditor(quotation));
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
  if (event.target.closest('[data-close-lead]')) document.querySelector('#leadModal')?.remove();
  if (event.target.closest('[data-close-quotation]')) document.querySelector('#quotationModal')?.remove();
  if (event.target.closest('[data-close-quotation-preview]')) document.querySelector('#quotationPreviewModal')?.remove();
});

document.addEventListener('change', (event) => {
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
  if (event.target.id !== 'sendBookingForm') return;
  event.preventDefault();
  const form = event.target, data = Object.fromEntries(new FormData(form).entries()), contact = String(data.supplierContact || '').trim();
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
  if (event.target.matches('#quotationForm [data-quotation-package]')) updateQuotationTotal(event.target.form);
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
  const record = Object.fromEntries(new FormData(form).entries());
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
  return '<div class="modal-backdrop" id="sendBookingModal"><form class="booking-modal send-booking-modal" id="sendBookingForm"><div class="modal-head"><div><span class="eyebrow">Booking ' + initial.bookingId + '</span><h2>Send to supplier</h2><p>Lengkapkan dan semak maklumat sebelum dihantar kepada supplier.</p></div><button type="button" class="modal-close" data-close-send>×</button></div><div class="send-request-fields"><div class="send-section-title">BOOKING REQUEST</div><div class="editor-grid"><label>Package Name<input name="packageName" value="' + initial.packageName + '" /></label><label>Booking ID<input name="bookingId" value="' + initial.bookingId + '" readonly /></label></div><div class="send-section-title">CONTACT DATA</div><div class="editor-grid"><label>Name<input name="contactName" value="' + initial.contactName + '" /></label><label>No hp<input name="contactPhone" value="' + initial.contactPhone + '" /></label></div><div class="send-section-title">BOOKING DETAILS</div><div class="editor-grid"><label>Date Travel<input type="date" name="travelDate" value="' + (/^\d{4}-\d{2}-\d{2}$/.test(initial.travelDate) ? initial.travelDate : '') + '" min="' + todayIso() + '" required /></label><label>Nationality<input name="nationality" value="' + initial.nationality + '" /></label><label>No of Adults<input type="number" min="0" name="adults" value="' + initial.adults + '" /></label><label>No of Kids<input type="number" min="0" name="kids" value="' + initial.kids + '" /></label><label>No of Infant<input type="number" min="0" name="infant" value="' + initial.infant + '" /></label><label>Single Supplement<input name="singleSupplement" value="' + initial.singleSupplement + '" /></label><label>Pick up Location<input name="pickupLocation" value="' + initial.pickupLocation + '" /></label><label class="full-width">Guest Details<textarea name="guestDetails" rows="3">' + initial.guestDetails + '</textarea></label><label class="full-width">Notes<textarea name="notes" rows="3">' + initial.notes + '</textarea></label></div><div class="send-section-title">DELIVERY</div><div class="editor-grid"><label>Channel<select name="sendChannel"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></label><label>Supplier contact<input name="supplierContact" placeholder="No. WhatsApp atau email supplier" required /></label><label class="full-width">Message preview<textarea name="message" rows="12" readonly>' + bookingRequestMessage(initial) + '</textarea></label></div></div><div class="modal-actions"><button type="button" class="ghost-btn" data-close-send>Cancel</button><button type="submit" class="primary-btn">Save &amp; Send</button></div></form></div>';
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
