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
  populateCategoryDropdown();
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

  if (currentData.products.length === 0) {
    list.innerHTML = '<p class="text-gray-500 text-sm italic">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  list.innerHTML = currentData.products.map((p, index) => `
    <div class="bg-white p-4 rounded-xl border border-gray-200 flex gap-4">
      <img src="${p.image}" alt="${p.name}" class="w-20 h-20 object-cover rounded-lg" referrerPolicy="no-referrer">
      <div class="flex-1">
        <h4 class="font-bold text-gray-900">${p.name}</h4>
        <p class="text-sm text-gray-500">R$ ${parseFloat(p.price).toFixed(2)}</p>
        <p class="text-xs text-gray-400 mt-1">${p.description || ''}</p>
        <div class="mt-2 flex gap-2">
          <button onclick="deleteProduct(${index})" class="text-red-500 hover:text-red-700 text-sm">
            <i class="fas fa-trash mr-1"></i> Remover
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

function populateCategoryDropdown() {
  const select = document.querySelector('select[name="productCategory"]');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione uma Categoria</option>' +
    currentData.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
      populateCategoryDropdown();
      e.target.reset();
    }
  });

  // Product Form
  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('productName');
    const price = fd.get('productPrice');
    const image = fd.get('productImage');
    const affiliateLink = fd.get('productLink');
    const description = fd.get('productDescription') || '';
    const category = fd.get('productCategory') || '';

    if (!name || !price || !image || !affiliateLink) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const newProduct = {
      id: 'prod_' + Date.now(),
      name,
      price: parseFloat(price.replace(',', '.')) || 0,
      image,
      affiliateLink,
      description,
      category
    };

    currentData.products.push(newProduct);
    db.save(currentData);
    renderProductsList();
    e.target.reset();
    alert('Produto adicionado com sucesso!');
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
