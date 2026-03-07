import { db } from './database.js';

let currentData = db.get();

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupTabs();
  renderAdmin();
  setupForms();
});

function checkAuth() {
  const isAuth = sessionStorage.getItem('admin_auth');
  if (!isAuth) {
    const password = prompt('Digite a senha do administrador:');
    if (password === currentData.settings.adminPassword) {
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      alert('Senha incorreta!');
      window.location.href = 'index.html';
    }
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('bg-primary', 'text-white'));
      tab.classList.add('bg-primary', 'text-white');
      
      const target = tab.dataset.tab;
      contents.forEach(c => {
        if (c.id === `${target}-tab`) {
          c.classList.remove('hidden');
        } else {
          c.classList.add('hidden');
        }
      });
    });
  });
}

function renderAdmin() {
  renderSettings();
  renderCategories();
  renderProductsList();
  renderVideosList();
}

function renderSettings() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  const s = currentData.settings;
  form.elements.name.value = s.name;
  form.elements.primaryColor.value = s.primaryColor;
  form.elements.bannerImage.value = s.banner.image;
  form.elements.bannerTitle.value = s.banner.title;
  form.elements.bannerSubtitle.value = s.banner.subtitle;
  form.elements.bannerTextColor.value = s.banner.textColor;
  form.elements.instagram.value = s.social.instagram;
  form.elements.whatsapp.value = s.social.whatsapp;
  form.elements.facebook.value = s.social.facebook;
}

function renderCategories() {
  const list = document.getElementById('admin-categories-list');
  if (!list) return;

  list.innerHTML = currentData.categories.map((cat, index) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span>${cat}</span>
      <button onclick="deleteCategory(${index})" class="text-red-500 hover:text-red-700">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function renderProductsList() {
  const list = document.getElementById('admin-products-list');
  if (!list) return;

  list.innerHTML = currentData.products.map((p, index) => `
    <div class="bg-white p-4 rounded-xl border border-gray-200 flex gap-4">
      <img src="${p.image}" class="w-20 h-20 object-cover rounded-lg">
      <div class="flex-1">
        <h4 class="font-bold text-gray-900">${p.name}</h4>
        <p class="text-sm text-gray-500">R$ ${p.price}</p>
        <div class="mt-2 flex gap-2">
          <input type="text" placeholder="Link Afiliado" value="${p.affiliateLink || ''}" 
            onchange="updateAffiliateLink(${index}, this.value)"
            class="flex-1 text-sm border border-gray-300 rounded px-2 py-1">
          <button onclick="deleteProduct(${index})" class="text-red-500">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderVideosList() {
  const list = document.getElementById('admin-videos-list');
  if (!list) return;

  list.innerHTML = currentData.videos.map((v, index) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p class="font-bold">${v.title}</p>
        <p class="text-xs text-gray-500">${v.link}</p>
      </div>
      <button onclick="deleteVideo(${index})" class="text-red-500">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function setupForms() {
  // Settings Form
  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    currentData.settings.name = fd.get('name');
    currentData.settings.primaryColor = fd.get('primaryColor');
    currentData.settings.banner.image = fd.get('bannerImage');
    currentData.settings.banner.title = fd.get('bannerTitle');
    currentData.settings.banner.subtitle = fd.get('bannerSubtitle');
    currentData.settings.banner.textColor = fd.get('bannerTextColor');
    currentData.settings.social.instagram = fd.get('instagram');
    currentData.settings.social.whatsapp = fd.get('whatsapp');
    currentData.settings.social.facebook = fd.get('facebook');
    
    if (fd.get('newPassword')) {
      currentData.settings.adminPassword = fd.get('newPassword');
    }

    db.save(currentData);
    alert('Configurações salvas!');
  });

  // Category Form
  document.getElementById('category-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target.elements.catName.value;
    if (name) {
      currentData.categories.push(name);
      db.save(currentData);
      renderCategories();
      e.target.reset();
    }
  });

  // Video Form
  document.getElementById('video-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = e.target.elements.videoTitle.value;
    const link = e.target.elements.videoLink.value;
    const description = e.target.elements.videoDesc.value;
    
    if (title && link) {
      currentData.videos.push({ title, link, description });
      db.save(currentData);
      renderVideosList();
      e.target.reset();
    }
  });

  // Import Form
  document.getElementById('import-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = e.target.elements.importQuery.value;
    const btn = e.target.querySelector('button');
    
    if (!query) return;

    btn.disabled = true;
    btn.textContent = 'Importando...';

    try {
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app') 
        ? `/api/importar-produtos?q=${encodeURIComponent(query)}`
        : `/.netlify/functions/importar-produtos?q=${encodeURIComponent(query)}`;
        
      const response = await fetch(apiUrl);
      const products = await response.json();
      
      products.forEach(p => {
        // Avoid duplicates
        if (!currentData.products.find(existing => existing.id === p.id)) {
          currentData.products.push({
            ...p,
            affiliateLink: ''
          });
        }
      });

      db.save(currentData);
      renderProductsList();
      alert(`${products.length} produtos importados!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao importar produtos.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'IMPORTAR PRODUTOS';
    }
  });
}

window.deleteCategory = (index) => {
  currentData.categories.splice(index, 1);
  db.save(currentData);
  renderCategories();
};

window.deleteProduct = (index) => {
  currentData.products.splice(index, 1);
  db.save(currentData);
  renderProductsList();
};

window.deleteVideo = (index) => {
  currentData.videos.splice(index, 1);
  db.save(currentData);
  renderVideosList();
};

window.updateAffiliateLink = (index, value) => {
  currentData.products[index].affiliateLink = value;
  db.save(currentData);
};
