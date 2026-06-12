/* ============================================
   GEL BLASTERS PT — Core App (Cart + UI)
   ============================================ */

const CART_KEY = 'gbpt_cart_v1';

const PRODUCTS = {
  ak47: {
    id: 'ak47',
    name: 'AK47 Gel Blaster',
    model: 'Modelo AK47',
    sku: 'JD-23',
    price: 29.99,
    priceOld: 39.99,
    img: 'assets/ak47.jpg',
    desc: 'O clássico que toda a gente quer. Motor 7.4V com modo automático e semi-automático.',
    specs: ['Motor 7.4V', '55×30cm', 'Semi/Auto'],
    includes: ['Bateria 7.4V', 'Cabo carregador', 'Funil', 'Landmine bottle', 'Carregador/magazine'],
    colors: ['A','B','C','D'],
  },
  m416: {
    id: 'm416',
    name: 'M416 Gel Blaster',
    model: 'Modelo M416',
    sku: 'JD-25',
    price: 29.99,
    priceOld: 39.99,
    img: 'assets/m416.jpg',
    desc: 'Design tático com silenciador incluído. Alta cadência de disparo, perfeito para partidas em grupo.',
    specs: ['Motor 7.4V', '55×30cm', 'c/ Silenciador'],
    includes: ['Silenciador', 'Bateria 7.4V', 'Cabo carregador', 'Funil', 'Landmine bottle', 'Magazine'],
    colors: ['A','B','C','D'],
  },
  mp5: {
    id: 'mp5',
    name: 'MP5 Gel Blaster',
    model: 'Modelo MP5',
    sku: 'JD-24',
    price: 29.99,
    priceOld: 39.99,
    img: 'assets/mp5.jpg',
    desc: 'Compacto e ágil. Ideal para espaços fechados. O favorito dos jogadores rápidos.',
    specs: ['Motor 7.4V', '55×30cm', 'c/ Silenciador'],
    includes: ['Silenciador', 'Bateria 7.4V', 'Cabo carregador', 'Funil', 'Landmine bottle', 'Magazine'],
    colors: ['A','B','C','D'],
  }
};

const COLORS = {
  A: { name: 'Vermelho', hex: '#E53935' },
  B: { name: 'Azul',     hex: '#1E88E5' },
  C: { name: 'Verde',    hex: '#43A047' },
  D: { name: 'Amarelo',  hex: '#FDD835' },
};

/* ---- Cart ---- */
let cart = [];

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId, colorCode, qty) {
  qty = parseInt(qty) || 1;
  const product = PRODUCTS[productId];
  if (!product) return;

  const existing = cart.find(i => i.productId === productId && i.colorCode === colorCode);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, colorCode, qty, price: product.price });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} adicionado ao carrinho! 🛒`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateCartQty(index, delta) {
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count > 9 ? '9+' : count;
    el.classList.toggle('show', count > 0);
  });
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <div class="empty-title">O teu carrinho está vazio</div>
        <div class="empty-sub">Ainda não adicionaste nenhum produto.</div>
        <a href="index.html" class="btn btn-primary">Ver Produtos</a>
      </div>`;
    updateSummary();
    return;
  }

  container.innerHTML = cart.map((item, i) => {
    const p = PRODUCTS[item.productId];
    const c = COLORS[item.colorCode];
    if (!p || !c) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-meta">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.hex};margin-right:4px;vertical-align:middle;"></span>
            ${c.name} · SKU: ${p.sku}${item.colorCode}
          </div>
          <div class="cart-item-price">€${(p.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="cart-item-right">
          <button class="remove-btn" onclick="removeFromCart(${i})" aria-label="Remover">✕</button>
          <div class="qty-control" style="transform:scale(.85);transform-origin:right center;">
            <button class="qty-btn" onclick="updateCartQty(${i}, -1)">−</button>
            <div class="qty-num">${item.qty}</div>
            <button class="qty-btn" onclick="updateCartQty(${i}, +1)">+</button>
          </div>
        </div>
      </div>`;
  }).join('');

  updateSummary();
}

function updateSummary() {
  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  const el = id => document.getElementById(id);
  if (el('summary-subtotal')) el('summary-subtotal').textContent = `€${subtotal.toFixed(2)}`;
  if (el('summary-shipping')) el('summary-shipping').textContent = shipping === 0 && subtotal > 0 ? 'Grátis' : `€${shipping.toFixed(2)}`;
  if (el('summary-total')) el('summary-total').textContent = `€${total.toFixed(2)}`;

  const checkoutBtn = el('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
    checkoutBtn.style.opacity = cart.length === 0 ? '.5' : '1';
  }
}

/* ---- Toast ---- */
let toastTimer;
function showToast(msg, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.style.borderColor = isError ? 'var(--secondary)' : 'var(--primary)';
  toast.style.boxShadow = isError ? '0 0 28px rgba(255,61,0,.35)' : 'var(--primary-glow)';
  toast.innerHTML = `<span class="toast-icon">${isError ? '⚠️' : '✓'}</span> ${msg}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ---- FAQ accordion ---- */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ---- Mobile menu ---- */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ---- Product card color dots (index) ---- */
function initProductColorDots() {
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const dotsGroup = dot.closest('.color-dots');
      dotsGroup.querySelectorAll('.color-dot').forEach(d => d.style.borderColor = 'rgba(255,255,255,.2)');
      dot.style.borderColor = 'var(--primary)';
    });
  });
}

/* ---- Init on DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateCartUI();
  initFAQ();
  initMobileMenu();
  initProductColorDots();
  renderCartItems();

  // Cart button links to cart page
  document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', () => { window.location.href = 'carrinho.html'; });
  });
});
