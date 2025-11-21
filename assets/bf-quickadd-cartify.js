/* bf-quickadd-cartify.js — robust, stateful, no flicker */
(function () {
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  async function addToCart(variantId, qty) {
    const r = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(variantId), quantity: qty || 1 })
    });
    if (!r.ok) throw new Error('add failed');
    return r.json();
  }

  function findVariantId(scope) {
    const idInput = scope.querySelector('form[action="/cart/add"] input[name="id"], form[action="/cart/add"] select[name="id"]');
    if (idInput && idInput.value) return idInput.value;
    const qtyInput = scope.querySelector('.quantity__input,[data-quantity-variant-id]');
    if (qtyInput && qtyInput.dataset.quantityVariantId) return qtyInput.dataset.quantityVariantId;
    return null;
  }

  function makeCartBtn() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bf-qa-cartbtn';
    btn.setAttribute('aria-label', 'Legg i handlekurv');
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM7.16 14h9.53c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.16 5H6.21L5.27 3H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 18h11v-2H8.42l1-2Z"/>
      </svg>`;
    return btn;
  }

  function getQtyWrap(card) {
    return card.querySelector('.quick-add__quantity, .product-form__quantity, quantity-input.cart-quantity, .quantity');
  }

  function ensureTrash(qtyWrap) {
    const minus = qtyWrap.querySelector('button[name="minus"], .quantity__button[name="minus"]');
    if (!minus) return null;
    let trash = qtyWrap.querySelector('.bf-trashbtn');
    if (trash) return trash;

    trash = document.createElement('button');
    trash.type = 'button';
    trash.className = 'bf-trashbtn';
    trash.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6m-9 4h12m-1 0-.8 13.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 7m4 4v7m4-7v7"
              fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    minus.insertAdjacentElement('beforebegin', trash);
    return trash;
  }

  function setState(card, state /* 'cart' | 'qty' */) {
    card.dataset.bfState = state;
  }

  function setQtyOneFlag(card, isOne) {
    if (isOne) {
      card.dataset.bfQtyOne = '1';
    } else {
      delete card.dataset.bfQtyOne;
    }
  }

  function showCart(card, qtyWrap) {
    setState(card, 'cart');
    if (!qtyWrap) return;

    // ensure a cart button exists right before qtyWrap
    let btn = qtyWrap.previousElementSibling;
    if (!(btn && btn.classList?.contains('bf-qa-cartbtn'))) {
      btn = makeCartBtn();
      qtyWrap.parentNode.insertBefore(btn, qtyWrap);
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const variantId = findVariantId(card);
          if (!variantId) throw new Error('variant-id mangler');
          await addToCart(variantId, 1);
          const input = qtyWrap.querySelector('.quantity__input, input[type="number"]');
          if (input) {
            input.value = 1;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setQtyOneFlag(card, true);   // mark qty=1 instantly (so minus is hidden, trash visible)
          setState(card, 'qty');       // reveal qty
        } catch (e) {
          console.error('[bf-quickadd-cartify]', e);
        } finally {
          btn.disabled = false;
        }
      });
    }
  }

  function showQty(card) {
    setState(card, 'qty');
  }

  function wireQtyLogic(card, qtyWrap) {
    const input = qtyWrap.querySelector('.quantity__input, input[type="number"]');
    if (!input) return;

    // create trash once
    const trash = ensureTrash(qtyWrap);
    if (trash) {
      trash.addEventListener('click', () => {
        input.value = 0;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    // keep UI in sync with value
    const sync = () => {
      const v = parseInt(input.value || '0', 10) || 0;
      if (v <= 0) {
        setQtyOneFlag(card, false);
        showCart(card, qtyWrap);  // go back to cart button
      } else {
        showQty(card);
        setQtyOneFlag(card, v === 1);
      }
    };

    // initial sync
    sync();

    // live sync
    qtyWrap.addEventListener('click', () => setTimeout(sync, 0));
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
  }

  function initCard(card) {
    if (card.dataset.bfQaInit === '1') return;
    const qtyWrap = getQtyWrap(card);
    if (!qtyWrap) return;

    // Start in 'cart' state (prevents flash thanks to CSS)
    showCart(card, qtyWrap);

    // Wire qty behavior
    wireQtyLogic(card, qtyWrap);

    card.dataset.bfQaInit = '1';
  }

  function initAll(root) {
    const sel = '.product-grid .card';
    $$(sel, root).forEach(initCard);
  }

  document.addEventListener('DOMContentLoaded', () => initAll(document));
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));

  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches?.('.product-grid .card') || n.querySelector?.('.product-grid .card')) {
          initAll(n);
        }
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();