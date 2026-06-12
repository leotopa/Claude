/* ============================================
   GEL BLASTERS PT — Checkout Logic
   ============================================ */

const API_BASE = '/api'; // Express backend on Railway

/* ---- Form validation ---- */
const FIELDS = {
  nome:    { label: 'Nome completo', min: 3 },
  morada:  { label: 'Morada', min: 5 },
  cidade:  { label: 'Cidade', min: 2 },
  cp:      { label: 'Código postal', pattern: /^\d{4}-\d{3}$/, msg: 'Formato: 0000-000' },
  telef:   { label: 'Telemóvel', pattern: /^(\+351)?[29]\d{8}$/, msg: 'Número PT inválido' },
  email:   { label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email inválido' },
};

function validateField(name, value) {
  const rule = FIELDS[name];
  if (!rule) return null;
  value = value.trim();
  if (!value) return `${rule.label} é obrigatório`;
  if (rule.min && value.length < rule.min) return `${rule.label} demasiado curto`;
  if (rule.pattern && !rule.pattern.test(value)) return rule.msg || 'Formato inválido';
  return null;
}

function validateForm() {
  let valid = true;
  Object.keys(FIELDS).forEach(name => {
    const input = document.getElementById(`field-${name}`);
    const group = input?.closest('.form-group');
    if (!input || !group) return;
    const err = validateField(name, input.value);
    const errEl = group.querySelector('.form-error');
    if (err) {
      group.classList.add('has-error');
      if (errEl) errEl.textContent = err;
      valid = false;
    } else {
      group.classList.remove('has-error');
    }
  });

  const payment = document.querySelector('input[name="payment"]:checked');
  if (!payment) {
    document.getElementById('payment-error')?.style && (document.getElementById('payment-error').style.display = 'block');
    valid = false;
  }
  return valid;
}

function buildOrderPayload() {
  const getVal = id => document.getElementById(id)?.value?.trim() || '';
  const payment = document.querySelector('input[name="payment"]:checked')?.value;

  return {
    customer: {
      nome:    getVal('field-nome'),
      morada:  getVal('field-morada'),
      cidade:  getVal('field-cidade'),
      cp:      getVal('field-cp'),
      telef:   getVal('field-telef'),
      email:   getVal('field-email'),
      nif:     getVal('field-nif') || null,
    },
    items: cart.map(i => ({
      productId: i.productId,
      colorCode: i.colorCode,
      qty:       i.qty,
      price:     i.price,
      sku:       `${PRODUCTS[i.productId]?.sku}${i.colorCode}`,
    })),
    total:   getCartTotal(),
    payment: payment,
  };
}

async function submitOrder() {
  if (!validateForm()) return;

  const btn = document.getElementById('checkout-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> A processar...';

  try {
    const payload = buildOrderPayload();
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();

    if (data.success) {
      // Clear cart
      cart = [];
      saveCart();

      // Store confirmation data
      sessionStorage.setItem('gbpt_order', JSON.stringify({
        orderId:    data.orderId,
        payment:    payload.payment,
        total:      payload.total,
        email:      payload.customer.email,
        nome:       payload.customer.nome,
        paymentRef: data.paymentRef || null,
        mbEntity:   data.mbEntity || null,
        mbRef:      data.mbRef || null,
        mbwayPhone: data.mbwayPhone || null,
      }));

      window.location.href = 'confirmacao.html';
    } else {
      throw new Error(data.message || 'Erro desconhecido');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao processar. Tenta novamente ou contacta via WhatsApp.', true);
    btn.disabled = false;
    btn.innerHTML = 'Finalizar Encomenda';
  }
}

/* ---- Real-time validation ---- */
function initCheckoutValidation() {
  Object.keys(FIELDS).forEach(name => {
    const input = document.getElementById(`field-${name}`);
    if (!input) return;
    input.addEventListener('blur', () => {
      const group = input.closest('.form-group');
      const errEl = group?.querySelector('.form-error');
      const err = validateField(name, input.value);
      if (err) {
        group.classList.add('has-error');
        if (errEl) errEl.textContent = err;
      } else {
        group.classList.remove('has-error');
      }
    });
  });

  // CP formatter
  const cpField = document.getElementById('field-cp');
  if (cpField) {
    cpField.addEventListener('input', () => {
      let v = cpField.value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0,4) + '-' + v.slice(4,7);
      cpField.value = v;
    });
  }

  // Phone formatter
  const telField = document.getElementById('field-telef');
  if (telField) {
    telField.addEventListener('input', () => {
      telField.value = telField.value.replace(/[^\d+]/g, '');
    });
  }

  const submitBtn = document.getElementById('checkout-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', e => {
      e.preventDefault();
      submitOrder();
    });
  }
}

/* ---- WhatsApp fallback ---- */
function initWhatsappFallback() {
  const waLink = document.getElementById('whatsapp-order');
  if (!waLink) return;

  const WA_NUMBER = '+351XXXXXXXXX'; // substituir pelo número real
  waLink.addEventListener('click', e => {
    e.preventDefault();
    if (cart.length === 0) { showToast('O teu carrinho está vazio.', true); return; }

    let msg = '🔫 *Gel Blasters PT — Nova Encomenda*\n\n';
    cart.forEach(item => {
      const p = PRODUCTS[item.productId];
      const c = COLORS[item.colorCode];
      msg += `• ${p.name} — ${c.name} × ${item.qty} = €${(p.price * item.qty).toFixed(2)}\n`;
    });
    msg += `\n*Total: €${getCartTotal().toFixed(2)}*\n\nOlá, quero encomendar os produtos acima!`;

    window.open(`https://wa.me/${WA_NUMBER.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutValidation();
  initWhatsappFallback();
});
