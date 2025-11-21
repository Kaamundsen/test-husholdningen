(function(){
  function $(sel,root){ return (root||document).querySelector(sel); }
  function $all(sel,root){ return Array.from((root||document).querySelectorAll(sel)); }

  async function add(variantId, qty){
    const r = await fetch('/cart/add.js', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: variantId, quantity: qty || 1 })
    });
    if(!r.ok) throw new Error('add failed');
    return r.json();
  }
  async function change(variantId, qty){
    const r = await fetch('/cart/change.js', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: variantId, quantity: qty })
    });
    if(!r.ok) throw new Error('change failed');
    return r.json();
  }

  function initCard(card){
    const variantId = parseInt(card.getAttribute('data-variant-id'),10);
    const btnAdd = $('[data-add]', card);
    const qtyUI  = $('.bf-qty', card);
    const input  = $('.bf-qty__input', card);
    const plus   = $('[data-plus]', card);
    const minus  = $('[data-minus]', card);

    if(!variantId || !btnAdd || !qtyUI || !input) return;

    // Starttilstand: "Legg i"
    btnAdd.addEventListener('click', async () => {
      btnAdd.disabled = true;
      try{
        await add(variantId, 1);
        input.value = 1;
        qtyUI.hidden = false;
        btnAdd.style.display = 'none';
      }catch(e){ console.error(e); }
      btnAdd.disabled = false;
    });

    plus && plus.addEventListener('click', async () => {
      const n = Math.max(0, parseInt(input.value||'0',10)+1);
      input.value = n;
      try{ await change(variantId, n); }catch(e){ console.error(e); }
    });

    minus && minus.addEventListener('click', async () => {
      const n = Math.max(0, parseInt(input.value||'0',10)-1);
      input.value = n;
      try{ await change(variantId, n); }catch(e){ console.error(e); }
      if(n <= 0){
        qtyUI.hidden = true;
        btnAdd.style.display = 'inline-flex';
      }
    });

    input.addEventListener('change', async () => {
      let n = parseInt(input.value||'0',10); if(isNaN(n)) n = 0;
      input.value = n;
      try{ await change(variantId, n); }catch(e){ console.error(e); }
      if(n <= 0){
        qtyUI.hidden = true;
        btnAdd.style.display = 'inline-flex';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $all('.bf-card').forEach(initCard);
  });

  // Hvis seksjoner byttes i editoren
  document.addEventListener('shopify:section:load', e => {
    $all('.bf-card', e.target).forEach(initCard);
  });
})();
