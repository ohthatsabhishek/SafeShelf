/* Simple CSV shopping-list import via the authenticated Express/Multer endpoint. */
(function(){
  const button=document.getElementById('importShoppingCsvBtn'), input=document.getElementById('shoppingCsvFile');
  if(!button||!input) return;
  button.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0]; if(!file)return;
    const token = localStorage.getItem('safeshelf_auth_token');
    if (!token) {
      if (typeof showNotification === 'function') showNotification('Please sign in before importing a CSV.', 'warning');
      else alert('Please sign in before importing a CSV.');
      input.value = '';
      return;
    }
    button.disabled = true; button.textContent = 'Checking CSV…';
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/shopping-import/preview', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'CSV import failed.');
      const items = payload.items || [];
      if (!items.length) throw new Error('No valid items were found in this CSV.');
      const invalidNote = payload.invalid && payload.invalid.length ? ` (${payload.invalid.length} invalid row(s) will be skipped)` : '';
      
      const proceedImport = () => {
        const current = StorageModule.loadShoppingList();
        const norm = s => String(s || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const existing = new Set(current.map(x => norm(x.name || x.productName || x.itemName || x.product)));
        let added = 0;
        items.forEach(item => {
          const key = norm(item.name);
          if (!key || existing.has(key)) return;
          existing.add(key);
          current.push({
            id: 'import_' + Date.now().toString(36) + '_' + added,
            name: item.name,
            productName: item.name,
            quantity: item.quantity || '1',
            category: item.category || 'Other',
            source: 'manual',
            purchased: false
          });
          added++;
        });
        StorageModule.saveShoppingList(AuthModule.currentUser && AuthModule.currentUser.id, current);
        if (typeof ShoppingListModule !== 'undefined' && ShoppingListModule.renderShoppingList) ShoppingListModule.renderShoppingList();
        else if (typeof ShoppingListModule !== 'undefined' && ShoppingListModule.render) ShoppingListModule.render();
        if (typeof showNotification === 'function') {
          showNotification(`Import complete. Added ${added} item(s); ${items.length - added} duplicate(s) skipped.`, 'success');
        } else {
          alert(`Import complete. Added ${added} item(s); ${items.length - added} duplicate(s) skipped.`);
        }
      };

      if (typeof showConfirm === 'function') {
        showConfirm('Import Shopping List?', `Import ${items.length} shopping-list item(s)?${invalidNote}\nExisting item names will not be duplicated.`, proceedImport, 'Import');
      } else {
        if (confirm(`Import ${items.length} shopping-list item(s)?${invalidNote}\nExisting item names will not be duplicated.`)) proceedImport();
      }
    } catch (e) {
      if (typeof showNotification === 'function') showNotification(e.message || 'Unable to import CSV.', 'error');
      else alert(e.message || 'Unable to import CSV.');
    } finally {
      button.disabled = false; button.textContent = 'Import CSV'; input.value = '';
    }
  });
})();
