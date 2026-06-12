/*
 * GEL BLASTERS PT — Express Backend
 * Deploy: Railway (node server.js)
 * Env vars: see .env.example
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'orders.json');
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'gelblasters2025';
const JWT_SECRET  = process.env.JWT_SECRET  || crypto.randomBytes(32).toString('hex');

// Easypay credentials (https://easypay.pt)
const EASYPAY_ID  = process.env.EASYPAY_ACCOUNT_ID  || '';
const EASYPAY_KEY = process.env.EASYPAY_API_KEY || '';
const EASYPAY_URL = 'https://api.prod.easypay.pt/2.0';

// Ensure data dir
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));

/* ---- Middleware ---- */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ---- Helpers ---- */
function readOrders() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeOrders(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

function genOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2,5).toUpperCase();
  return `GBP-${ts}${rand}`;
}

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg:'HS256', typ:'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig    = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [h, b, s] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(b, 'base64url').toString());
  } catch { return null; }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
  req.admin = payload;
  next();
}

/* ---- Email ---- */
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth:   {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

async function sendConfirmationEmail(order) {
  if (!process.env.SMTP_USER) return; // skip if not configured

  const itemsHtml = (order.items || []).map(i =>
    `<tr>
       <td style="padding:8px 0; border-bottom:1px solid #eee;">${i.productId?.toUpperCase()} ${i.colorCode}</td>
       <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:center;">${i.qty}</td>
       <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">€${(i.price * i.qty).toFixed(2)}</td>
     </tr>`
  ).join('');

  const html = `
  <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto; color:#1a1a2e;">
    <div style="background:#09090F; padding:24px; text-align:center; border-radius:8px 8px 0 0;">
      <h1 style="color:#00E5FF; margin:0; font-size:22px;">GELBLASTERS.PT</h1>
    </div>
    <div style="background:#fff; padding:32px; border:1px solid #eee; border-top:none;">
      <h2 style="color:#09090F; margin-top:0;">Encomenda Confirmada! 🎉</h2>
      <p>Olá <strong>${order.customer?.nome}</strong>,</p>
      <p>Recebemos a tua encomenda <strong style="color:#00E5FF;">#${order.orderId}</strong>. Obrigado!</p>

      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px; text-align:left;">Produto</th>
            <th style="padding:8px; text-align:center;">Qtd</th>
            <th style="padding:8px; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px; font-weight:bold;">Total</td>
            <td style="padding:12px 8px; text-align:right; font-weight:bold; color:#00E5FF; font-size:18px;">€${parseFloat(order.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#f9f9f9; padding:16px; border-radius:6px; margin:20px 0;">
        <strong>Morada de entrega:</strong><br>
        ${order.customer?.nome}<br>
        ${order.customer?.morada}<br>
        ${order.customer?.cp} ${order.customer?.cidade}
      </div>

      <p style="color:#666; font-size:14px;">A entrega demora entre 5 a 10 dias úteis. Receberás outro email quando o teu pedido for enviado.</p>
      <p style="color:#666; font-size:14px;">Dúvidas? Fala connosco pelo WhatsApp ou email.</p>
    </div>
    <div style="background:#f5f5f5; padding:16px; text-align:center; font-size:12px; color:#999; border-radius:0 0 8px 8px;">
      GelBlasters.PT · ${new Date().getFullYear()}
    </div>
  </div>`;

  await mailer.sendMail({
    from: `"GelBlasters.PT" <${process.env.SMTP_USER}>`,
    to:   order.customer.email,
    subject: `Encomenda #${order.orderId} confirmada — GelBlasters.PT`,
    html,
  });
}

/* ---- Easypay helpers ---- */
async function createEasypayPayment(method, order) {
  if (!EASYPAY_ID || !EASYPAY_KEY) {
    // Dev mode: simulate payment ref
    if (method === 'multibanco') return { entity: '11249', reference: '123 456 789', expiresAt: null };
    return { status: 'pending' };
  }

  const headers = {
    'AccountId': EASYPAY_ID,
    'ApiKey':    EASYPAY_KEY,
    'Content-Type': 'application/json',
  };

  if (method === 'multibanco') {
    const res = await fetch(`${EASYPAY_URL}/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: ['mb'],
        payment: { amount: { value: parseFloat(order.total), currency: 'EUR' } },
        customer: { name: order.customer.nome, email: order.customer.email },
      }),
    });
    const data = await res.json();
    const mb = data.method?.mb;
    return { entity: mb?.entity, reference: mb?.reference, expiresAt: mb?.last_at };
  }

  if (method === 'mbway') {
    const phone = order.customer.telef.replace(/\D/g, '').replace(/^351/, '');
    const res = await fetch(`${EASYPAY_URL}/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: ['mbw'],
        payment: { amount: { value: parseFloat(order.total), currency: 'EUR' } },
        customer: { name: order.customer.nome, email: order.customer.email, phone: `351#${phone}` },
      }),
    });
    const data = await res.json();
    return { status: data.status, transactionKey: data.id };
  }

  return {};
}

/* ============================================================
   ROUTES
   ============================================================ */

/* POST /api/orders — create order */
app.post('/api/orders', async (req, res) => {
  const { customer, items, total, payment } = req.body;

  // Basic validation
  if (!customer?.nome || !customer?.email || !items?.length || !payment) {
    return res.status(400).json({ success: false, message: 'Dados incompletos' });
  }

  const orderId = genOrderId();
  const order = {
    _id:       orderId,
    orderId,
    customer,
    items,
    total:     parseFloat(total),
    payment,
    status:    'pending',
    createdAt: new Date().toISOString(),
    paymentRef: null,
  };

  let responseExtra = {};

  try {
    // Create payment
    const payData = await createEasypayPayment(payment, order);
    if (payment === 'multibanco') {
      order.paymentRef = payData.reference;
      responseExtra = { mbEntity: payData.entity, mbRef: payData.reference };
    } else if (payment === 'mbway') {
      responseExtra = { mbwayPhone: customer.telef };
    }
  } catch (err) {
    console.error('Payment error:', err.message);
  }

  // Persist order
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);

  // Send confirmation email (non-blocking)
  sendConfirmationEmail(order).catch(err => console.error('Email error:', err.message));

  res.json({ success: true, orderId, ...responseExtra });
});

/* GET /api/orders — public order lookup by ID */
app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order  = orders.find(o => o.orderId === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { customer, ...safe } = order;
  res.json(safe);
});

/* POST /api/contact — contact form */
app.post('/api/contact', async (req, res) => {
  const { nome, email, assunto, msg } = req.body;
  if (!nome || !email || !msg) return res.status(400).json({ error: 'Missing fields' });

  try {
    if (process.env.SMTP_USER) {
      await mailer.sendMail({
        from:    `"GelBlasters.PT" <${process.env.SMTP_USER}>`,
        to:      process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `[Contacto] ${assunto || 'Nova mensagem'} — ${nome}`,
        text:    `De: ${nome} <${email}>\n\n${msg}`,
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send' });
  }
});

/* POST /api/admin/login */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = signToken({ role: 'admin', iat: Date.now() });
  res.json({ token });
});

/* GET /api/admin/orders */
app.get('/api/admin/orders', authMiddleware, (req, res) => {
  const { status, format } = req.query;
  let orders = readOrders();

  if (status) orders = orders.filter(o => o.status === status);

  const stats = {
    total:    orders.length,
    paid:     orders.filter(o => o.status === 'paid').length,
    shipped:  orders.filter(o => o.status === 'shipped').length,
    revenue:  orders.filter(o => ['paid','shipped'].includes(o.status))
                    .reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
  };

  if (format === 'csv') {
    const rows = [
      ['ID', 'Data', 'Nome', 'Email', 'Telef', 'Cidade', 'CP', 'Produtos', 'Total', 'Pagamento', 'Estado'].join(','),
      ...orders.map(o => [
        o.orderId,
        new Date(o.createdAt).toLocaleDateString('pt-PT'),
        `"${o.customer?.nome || ''}"`,
        o.customer?.email || '',
        o.customer?.telef || '',
        o.customer?.cidade || '',
        o.customer?.cp || '',
        `"${(o.items || []).map(i => `${i.sku}x${i.qty}`).join(';')}"`,
        o.total,
        o.payment,
        o.status,
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
    return res.send('﻿' + rows); // BOM for Excel
  }

  res.json({ orders, stats });
});

/* PATCH /api/admin/orders/:id — update status */
app.patch('/api/admin/orders/:id', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const orders = readOrders();
  const idx = orders.findIndex(o => o._id === req.params.id || o.orderId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  writeOrders(orders);

  res.json({ success: true, order: orders[idx] });
});

/* Easypay webhook for payment confirmation */
app.post('/api/webhooks/easypay', (req, res) => {
  const { id, status, type } = req.body;
  res.json({ status: 'ok' }); // acknowledge immediately

  if (status !== 'success') return;

  const orders = readOrders();
  const idx = orders.findIndex(o =>
    o.paymentRef === id || o._id === id || o.orderId === id
  );
  if (idx === -1) return;

  orders[idx].status = 'paid';
  orders[idx].paidAt = new Date().toISOString();
  writeOrders(orders);
  console.log(`Payment confirmed for order ${orders[idx].orderId}`);
});

/* SPA fallback — serve HTML pages */
app.get('*', (req, res) => {
  const page = req.path.replace(/^\//, '') || 'index.html';
  const file = path.join(__dirname, page);
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`✓ GelBlasters.PT running on port ${PORT}`);
  console.log(`  Admin: http://localhost:${PORT}/admin.html`);
});
