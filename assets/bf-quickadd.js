/* bf-quickadd.js — hard DOM-control (fjerner/legger til knappen) */
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
    return (
      card.querySelector('.quick-add__quantity') ||
      card.querySelector('.product-form__quantity') ||
      card.querySelector('quantity-input.cart-quantity') ||
      card.querySelector('.quantity')
    );
  }

  function getInput(qtyWrap) {
    return qtyWrap.querySelector('.quantity__input, input[type="number"]');
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

  function setState(card, state) { card.dataset.bfState = state; } // 'cart' | 'qty'
  function setQtyOne(card, isOne) { isOne ? card.setAttribute('data-bf-qty-one', '1') : card.removeAttribute('data-bf-qty-one'); }

  function removeAllCartBtns(card) {
    card.querySelectorAll('.bf-qa-cartbtn').forEach((n) => n.remove());
  }

  function ensureCartBtn(card, qtyWrap) {
    // sørg for at knappen ligger rett før qtyWrap
    let btn = qtyWrap.previousElementSibling;
    if (!(btn && btn.classList?.contains('bf-qa-cartbtn'))) {
      btn = makeCartBtn();
      qtyWrap.parentNode.insertBefore(btn, qtyWrap);
    }
    if (!btn.dataset.bfWired) {
      btn.dataset.bfWired = '1';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const variantId = findVariantId(card);
          if (!variantId) throw new Error('variant-id mangler');
          await addToCart(variantId, 1);

          const input = getInput(qtyWrap);
          if (input) {
            input.min = '0'; input.setAttribute('min', '0');
            input.value = 1;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setQtyOne(card, true);
          showQty(card, qtyWrap);
        } catch (e) {
          console.error('[bf-quickadd]', e);
        } finally {
          btn.disabled = false;
        }
      });
    }
    return btn;
  }

  function showCart(card, qtyWrap) {
    setState(card, 'cart');
    // legg tilbake knapp (om mangler)
    ensureCartBtn(card, qtyWrap);
  }

  function showQty(card, qtyWrap) {
    setState(card, 'qty');
    // fjern ALLE kjøpsknapper fysisk
    removeAllCartBtns(card);
    // sikkerhet: nullstill min-krav
    const input = qtyWrap && getInput(qtyWrap);
    if (input) { input.min = '0'; input.setAttribute('min', '0'); }
  }

  function wireQtyLogic(card, qtyWrap) {
    let input = getInput(qtyWrap);
    if (!input) return;
    input.min = '0'; input.setAttribute('min', '0');

    const trash = ensureTrash(qtyWrap);
    if (trash && !trash.dataset.bfWired) {
      trash.dataset.bfWired = '1';
      trash.addEventListener('click', () => {
        input.value = 0;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    const sync = () => {
      input = getInput(qtyWrap) || input;
      if (!input) return;
      const v = parseInt(input.value || '0', 10) || 0;
      if (v <= 0) {
        setQtyOne(card, false);
        showCart(card, qtyWrap);
      } else {
        showQty(card, qtyWrap);
        setQtyOne(card, v === 1);
      }
    };

    // init + lyttere
    sync();
    qtyWrap.addEventListener('click', () => setTimeout(sync, 0));
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);

    // Re-render inne i qtyWrap
    const localMO = new MutationObserver(() => {
      ensureTrash(qtyWrap);
      if (card.dataset.bfState === 'qty') removeAllCartBtns(card);
      setTimeout(sync, 0);
    });
    localMO.observe(qtyWrap, { childList: true, subtree: true });
  }

  function initCard(card) {
    if (card.dataset.bfQaInit === '1') return;
    const qtyWrap = getQtyWrap(card);
    if (!qtyWrap) return;

    showCart(card, qtyWrap);
    wireQtyLogic(card, qtyWrap);

    // Re-render på card-nivå
    const cardMO = new MutationObserver(() => {
      const current = getQtyWrap(card);
      if (current && !current.dataset.bfWired) {
        current.dataset.bfWired = '1';
        showCart(card, current);
        wireQtyLogic(card, current);
      }
      // bevar state visuelt
      if (card.dataset.bfState === 'qty') removeAllCartBtns(card);
    });
    cardMO.observe(card, { childList: true, subtree: true });

    card.dataset.bfQaInit = '1';
  }

  function initAll(root) { $$('.product-grid .card', root).forEach(initCard); }

  document.addEventListener('DOMContentLoaded', () => initAll(document));
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));

  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches?.('.product-grid .card') || n.querySelector?.('.product-grid .card')) initAll(n);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
