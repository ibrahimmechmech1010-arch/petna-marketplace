(() => {
  const storageKey = 'petna-admin-demo-v1';
  const sections = {
    animals: { label: 'Adoptions', heading: 'Fiches d’adoption', description: 'Gérez les profils des compagnons présentés par les refuges.', columns: ['COMPAGNON', 'REFUGE', 'VILLE', 'STATUT'], fields: [['name','Nom du compagnon','text'],['species','Espèce','select','Chien|Chat|Lapin'],['age','Âge','text'],['city','Ville','text'],['shelter','Refuge ou association','text'],['image','Adresse de l’image','text'],['short','Description courte','textarea']] },
    products: { label: 'Produits', heading: 'Catalogue produits', description: 'Consultez et gérez les articles proposés dans la boutique.', columns: ['PRODUIT', 'CATÉGORIE', 'VENDEUR', 'PRIX', 'STATUT'], fields: [['name','Nom du produit','text'],['category','Catégorie','select','Alimentation|Jouets|Accessoires|Hygiène|Soins'],['price','Prix (TND)','number'],['seller','Vendeur','text'],['image','Adresse de l’image','text'],['desc','Description','textarea']] },
    providers: { label: 'Professionnels', heading: 'Annuaire des professionnels', description: 'Gérez les profils des professionnels présentés sur le site.', columns: ['PROFESSIONNEL', 'TYPE', 'VILLE', 'CONTACT', 'STATUT'], fields: [['name','Nom du professionnel','text'],['type','Activité','select','Vétérinaire|Animalerie|Toilettage'],['city','Ville','text'],['contact','Téléphone','tel'],['image','Adresse de l’image','text'],['desc','Présentation','textarea']] }
  };
  const demoOrders = [
    { id:'CMD-2026-024', customer:'Amira B.', items:'Harnais promenade, Friandises', total:'76,50 TND', date:'Aujourd’hui · 10:42', status:'À traiter' },
    { id:'CMD-2026-023', customer:'Yassine M.', items:'Duo de bols en céramique', total:'27,00 TND', date:'Aujourd’hui · 09:18', status:'Confirmée' },
    { id:'CMD-2026-022', customer:'Salma K.', items:'Croquettes poulet & riz, Balle corde', total:'46,50 TND', date:'Hier · 17:05', status:'Expédiée' },
    { id:'CMD-2026-021', customer:'Nour E.', items:'Sac de transport pliable', total:'58,00 TND', date:'Hier · 14:32', status:'Confirmée' },
    { id:'CMD-2026-020', customer:'Mehdi R.', items:'Baume coussinets, Gourde', total:'41,00 TND', date:'24 oct. · 11:12', status:'Livrée' }
  ];
  const copy = value => JSON.parse(JSON.stringify(value || []));
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { stored = {}; }
  const deleted = stored.deleted || {};
  const data = Object.fromEntries(Object.keys(sections).map(kind => [kind,
    copy(DEMO_DATA[kind]).filter(item => !(deleted[kind] || []).includes(item.id)).map(item => ({...item, ...(stored.overrides?.[kind]?.[item.id] || {})})).concat(copy(stored.added?.[kind]))
  ]));
  const statuses = stored.statuses || {};
  let current = 'overview';
  let editingId = null;
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeStatus = (kind, item) => statuses[`${kind}:${item.id}`] || 'Publié';
  const persist = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      added: Object.fromEntries(Object.keys(sections).map(kind => [kind, data[kind].filter(item => String(item.id).startsWith('admin-'))])),
      overrides: Object.fromEntries(Object.keys(sections).map(kind => [kind, Object.fromEntries(data[kind].filter(item => !String(item.id).startsWith('admin-')).map(item => [item.id, item]))])),
      statuses,
      deleted
    }));
  };
  function showToast(message) {
    const toast = $('#admin-toast'); toast.textContent = message; toast.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
  function refreshCounts() {
    for (const [kind, id] of [['animals','animal'],['products','product'],['providers','provider']]) {
      const count = data[kind].filter(item => safeStatus(kind,item)==='Publié').length;
      $(`#${id}-total`).textContent = count;
      $(`#${id}-nav-count`).textContent = count;
    }
  }
  function imageThumb(item) {
    return `<span class="admin-row-thumb">${item.image ? `<img src="${escape(item.image)}" alt="" loading="lazy" onerror="this.hidden=true">` : '♡'}</span>`;
  }
  function statusPill(kind,item) {
    const status=safeStatus(kind,item);
    return `<button type="button" class="admin-status ${status==='Publié'?'published':'draft'}" data-toggle-status="${escape(item.id)}" data-kind="${kind}" title="Cliquer pour changer le statut"><i></i>${status}</button>`;
  }
  function rowActions(kind,item) {
    return `<div class="admin-row-actions"><button type="button" data-edit="${escape(item.id)}" data-kind="${kind}" aria-label="Modifier ${escape(item.name)}" title="Modifier">✎</button><button type="button" data-delete="${escape(item.id)}" data-kind="${kind}" aria-label="Supprimer ${escape(item.name)}" title="Supprimer">⌫</button></div>`;
  }
  function tableRow(kind,item) {
    const status=statusPill(kind,item), actions=rowActions(kind,item);
    if(kind==='animals') return `<tr><td><div class="admin-name-cell">${imageThumb(item)}<span><b>${escape(item.name)}</b><small>${escape(item.species)} · ${escape(item.age)}</small></span></div></td><td>${escape(item.shelter)}</td><td>${escape(item.city)}</td><td>${status}</td><td>${actions}</td></tr>`;
    if(kind==='products') return `<tr><td><div class="admin-name-cell">${imageThumb(item)}<span><b>${escape(item.name)}</b><small>${escape(item.desc)}</small></span></div></td><td>${escape(item.category)}</td><td>${escape(item.seller)}</td><td><b>${Number(item.price||0).toFixed(2).replace('.',',')} TND</b></td><td>${status}</td><td>${actions}</td></tr>`;
    return `<tr><td><div class="admin-name-cell">${imageThumb(item)}<span><b>${escape(item.name)}</b><small>${escape(item.type)}</small></span></div></td><td>${escape(item.type)}</td><td>${escape(item.city)}</td><td>${escape(item.contact||'—')}</td><td>${status}</td><td>${actions}</td></tr>`;
  }
  function orderRows(filter) {
    const rows=demoOrders.filter(order=>`${order.id} ${order.customer} ${order.items} ${order.status}`.toLocaleLowerCase('fr').includes(filter));
    $('#manage-table-head').innerHTML='<tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>ARTICLES</th><th>DATE</th><th>TOTAL</th><th>STATUT</th></tr>';
    $('#manage-table-body').innerHTML=rows.map(order=>`<tr><td><b class="order-reference">${order.id}</b></td><td>${order.customer}</td><td>${order.items}</td><td>${order.date}</td><td><b>${order.total}</b></td><td><span class="admin-status ${order.status==='À traiter'?'draft':'published'}"><i></i>${order.status}</span></td></tr>`).join('')||'<tr><td colspan="6" class="admin-empty">Aucune commande ne correspond à votre recherche.</td></tr>';
    $('#manage-count').textContent=`${rows.length} commande${rows.length>1?'s':''} affichée${rows.length>1?'s':''}`;
  }
  function renderManage() {
    if(current==='orders') { orderRows(($('#admin-search').value||'').trim().toLocaleLowerCase('fr')); return; }
    const kind=current, config=sections[kind];
    $('#manage-table-head').innerHTML=`<tr>${config.columns.map(col=>`<th>${col}</th>`).join('')}<th>ACTIONS</th></tr>`;
    const search=($('#admin-search').value||'').trim().toLocaleLowerCase('fr'), filter=$('#admin-filter').value;
    const rows=data[kind].filter(item=>{
      const matchesSearch=Object.values(item).some(value=>String(value??'').toLocaleLowerCase('fr').includes(search));
      return matchesSearch&&(!filter||safeStatus(kind,item)===filter);
    });
    $('#manage-table-body').innerHTML=rows.map(item=>tableRow(kind,item)).join('')||`<tr><td colspan="${config.columns.length+1}" class="admin-empty">Aucun résultat. Essayez une autre recherche.</td></tr>`;
    $('#manage-count').textContent=`${rows.length} élément${rows.length>1?'s':''} affiché${rows.length>1?'s':''} sur ${data[kind].length}`;
  }
  function renderRecent() {
    $('#recent-animal-rows').innerHTML=data.animals.slice(0,5).map(item=>tableRow('animals',item)).join('');
  }
  function setView(view) {
    current=view;
    document.querySelectorAll('.admin-nav [data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
    document.querySelectorAll('[data-view]').forEach(button=>{ if(!button.closest('.admin-nav')) button.classList.toggle('active',button.dataset.view===view); });
    const overview=view==='overview';
    $('#overview-view').hidden=!overview; $('#manage-view').hidden=overview;
    const label=sections[view]?.label || (view==='orders'?'Commandes démo':'Vue d’ensemble');
    $('#admin-current-label').textContent=label;
    $('#admin-title').innerHTML=overview?'Bonjour, admin <span>👋</span>':escape(sections[view]?.heading||'Commandes de démonstration');
    $('#admin-subtitle').textContent=overview?'Voici ce qui se passe sur votre marketplace aujourd’hui.':(sections[view]?.description||'Consultez un aperçu des commandes fictives de la boutique.');
    $('#manage-heading').textContent=sections[view]?.heading||'Commandes de démonstration';
    $('#manage-description').textContent=sections[view]?.description||'Exemples de commandes, sans paiement ni livraison réelle.';
    $('#admin-filter').hidden=view==='orders';
    $('#admin-create').hidden=view==='orders';
    $('#admin-create').innerHTML=view==='overview'?'<span>＋</span> Ajouter un compagnon':'<span>＋</span> Ajouter un élément';
    $('#admin-search').value=''; $('#admin-filter').value='';
    refreshCounts(); renderRecent();
    if(!overview) renderManage();
  }
  function openForm(kind,id=null) {
    editingId=id; const item=id?data[kind].find(entry=>String(entry.id)===String(id)):null;
    const config=sections[kind]; if(!config) return;
    $('#admin-dialog-title').textContent=item?'Modifier la fiche':'Ajouter un élément';
    $('#admin-dialog-intro').textContent=item?'Mettez à jour les informations de cette fiche.':'Les informations sont enregistrées dans ce navigateur pour cette démonstration.';
    $('#admin-form-fields').innerHTML=config.fields.map(([name,label,type,options])=>{
      const value=item?.[name]??'';
      if(type==='select') return `<label>${label}<select name="${name}" required>${options.split('|').map(option=>`<option ${option===value?'selected':''}>${option}</option>`).join('')}</select></label>`;
      if(type==='textarea') return `<label class="full">${label}<textarea name="${name}" rows="3" required>${escape(value)}</textarea></label>`;
      return `<label class="${name==='image'?'full':''}">${label}<input name="${name}" type="${type}" value="${escape(value)}" ${type==='number'?'min="0" step="0.01"':''} ${name==='image'?'placeholder="assets/... ou https://…"':''} required></label>`;
    }).join('');
    $('#admin-save').innerHTML=item?'Enregistrer les changements <span>→</span>':'Enregistrer l’élément <span>→</span>';
    $('#admin-dialog').showModal();
  }
  function saveForm(event) {
    if(event.submitter?.value==='cancel') return;
    event.preventDefault();
    if(!event.currentTarget.reportValidity()) return;
    const kind=current==='overview'?'animals':current, formData=new FormData(event.currentTarget), values=Object.fromEntries(formData.entries());
    if(kind==='products') values.price=Number(values.price);
    if(editingId){const entry=data[kind].find(item=>String(item.id)===String(editingId));Object.assign(entry,values);}
    else {data[kind].unshift({id:`admin-${Date.now()}`,...values});}
    persist(); $('#admin-dialog').close(); showToast(editingId?'Fiche mise à jour dans cette démonstration.':'Élément ajouté dans cette démonstration.');
    refreshCounts();renderRecent();if(current!=='overview')renderManage();
  }
  function removeItem(kind,id) {
    const item=data[kind]?.find(entry=>String(entry.id)===String(id)); if(!item)return;
    if(!window.confirm(`Supprimer « ${item.name} » de cette démonstration ?`))return;
    data[kind]=data[kind].filter(entry=>String(entry.id)!==String(id));
    if(!String(id).startsWith('admin-')){deleted[kind]=deleted[kind]||[];if(!deleted[kind].includes(id))deleted[kind].push(id);}
    delete statuses[`${kind}:${id}`];persist();refreshCounts();renderRecent();if(current!=='overview')renderManage();showToast('Élément supprimé de cette démonstration.');
  }
  function init() {
    refreshCounts();renderRecent();
    document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
    $('#admin-search').addEventListener('input',renderManage);$('#admin-filter').addEventListener('change',renderManage);
    $('#admin-create').addEventListener('click',()=>openForm(current==='overview'?'animals':current));
    $('#admin-form').addEventListener('submit',saveForm);
    $('#admin-dialog').addEventListener('click',event=>{if(event.target===$('#admin-dialog'))$('#admin-dialog').close();});
    document.addEventListener('click',event=>{
      const edit=event.target.closest('[data-edit]'), remove=event.target.closest('[data-delete]');
      if(edit) openForm(edit.dataset.kind,edit.dataset.id);
      if(remove) removeItem(remove.dataset.kind,remove.dataset.id);
      const toggle=event.target.closest('[data-toggle-status]');
      if(toggle){const kind=toggle.dataset.kind,id=toggle.dataset.toggleStatus;statuses[`${kind}:${id}`]=safeStatus(kind,{id})==='Publié'?'Brouillon':'Publié';persist();refreshCounts();renderRecent();if(current!=='overview')renderManage();showToast('Statut mis à jour pour cette démonstration.');}
    });
    setView('overview');
  }
  init();
})();
