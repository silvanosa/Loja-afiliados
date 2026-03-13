import { db } from './database.js';

document.addEventListener('DOMContentLoaded', () => {
  const data = db.get();
  renderStore(data);
  setupSearch();
  setupShare();
});

function renderStore(data) {
  // Update UI based on settings
  document.title = data.settings.name;
  const logoEl = document.getElementById('store-logo');
  if (logoEl) logoEl.textContent = data.settings.name;

  // Apply colors
  document.documentElement.style.setProperty('--primary', data.settings.primaryColor);
  
  // Render Banner
  const banner = document.getElementById('main-banner');
  if (banner) {
    banner.style.backgroundImage = `url(${data.settings.banner.image})`;
    banner.querySelector('h1').textContent = data.settings.banner.title;
    banner.querySelector('p').textContent = data.settings.banner.subtitle;
    banner.querySelector('h1').style.color = data.settings.banner.textColor;
    banner.querySelector('p').style.color = data.settings.banner.textColor;
  }

  // Render Categories in Sidebar
  const categoryList = document.getElementById('category-list');
  if (categoryList) {
    categoryList.innerHTML = data.categories.map(cat => `
      <li>
        <a href="#" class="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors" data-category="${cat}">
          ${cat}
        </a>
      </li>
    `).join('');
    
    categoryList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts(link.dataset.category);
      });
    });
  }

  // Render Social Links
  const socialLinks = document.getElementById('social-links');
  if (socialLinks) {
    const { instagram, whatsapp, facebook } = data.settings.social;
    socialLinks.innerHTML = `
      ${instagram ? `<a href="${instagram}" target="_blank" class="p-2 hover:text-primary"><i class="fab fa-instagram text-xl"></i></a>` : ''}
      ${whatsapp ? `<a href="https://wa.me/${whatsapp}" target="_blank" class="p-2 hover:text-primary"><i class="fab fa-whatsapp text-xl"></i></a>` : ''}
      ${facebook ? `<a href="${facebook}" target="_blank" class="p-2 hover:text-primary"><i class="fab fa-facebook text-xl"></i></a>` : ''}
    `;
  }

  // Render Sections
  renderProducts(data.products);
  renderMostClicked(data.products, data.stats.clicks);
  renderBestOffers(data.products);
  renderVideos(data.videos);
}

function renderProducts(products, filter = null) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  let filtered = products;
  if (filter) {
    filtered = products.filter(p => p.category === filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">Nenhum produto disponível no momento.</p>';
    return;
  }

  container.innerHTML = filtered.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const hasAffiliateLink = product.affiliateLink && product.affiliateLink.trim() !== '';
  const priceNum = parseFloat(product.price);
  const priceFormatted = isNaN(priceNum) ? product.price : priceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return `
    <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-black/5">
      <div class="relative aspect-square overflow-hidden">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer">
        ${priceNum < 100 ? '<span class="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">OFERTA</span>' : ''}
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">${product.category || ''}</p>
        <h3 class="font-medium text-gray-900 mb-2 line-clamp-2 h-10">${product.name}</h3>
        ${product.description ? `<p class="text-sm text-gray-500 mb-2 line-clamp-2">${product.description}</p>` : ''}
        <div class="flex items-center justify-between mb-4">
          <span class="text-xl font-bold text-primary">R$ ${priceFormatted}</span>
        </div>
        ${hasAffiliateLink ? `
          <a href="${product.affiliateLink}" target="_blank" onclick="registerClick('${product.id}')" class="block w-full py-3 bg-primary text-white text-center rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            COMPRAR
          </a>
        ` : `
          <div class="text-center py-2 text-gray-400 text-sm italic border border-dashed border-gray-200 rounded-lg">
            Em breve link de compra
          </div>
        `}
      </div>
    </div>
  `;
}

window.registerClick = (productId) => {
  const data = db.get();
  data.stats.clicks[productId] = (data.stats.clicks[productId] || 0) + 1;
  db.save(data);
};

function renderMostClicked(products, clicks) {
  const container = document.getElementById('most-clicked-grid');
  if (!container) return;

  const sorted = [...products]
    .filter(p => clicks[p.id])
    .sort((a, b) => (clicks[b.id] || 0) - (clicks[a.id] || 0))
    .slice(0, 4);

  if (sorted.length === 0) {
    document.getElementById('most-clicked-section')?.classList.add('hidden');
    return;
  }

  document.getElementById('most-clicked-section')?.classList.remove('hidden');
  container.innerHTML = sorted.map(product => createProductCard(product)).join('');
}

function renderBestOffers(products) {
  const container = document.getElementById('best-offers-grid');
  if (!container) return;

  const sorted = [...products]
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  container.innerHTML = sorted.map(product => createProductCard(product)).join('');
}

function renderVideos(videos) {
  const container = document.getElementById('videos-scroll');
  if (!container) return;

  if (videos.length === 0) {
    document.getElementById('videos-section')?.classList.add('hidden');
    return;
  }

  document.getElementById('videos-section')?.classList.remove('hidden');
  container.innerHTML = videos.map(video => `
    <div class="min-w-[300px] bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5">
      <div class="aspect-video bg-black flex items-center justify-center">
        <iframe class="w-full h-full" src="${video.link.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>
      </div>
      <div class="p-4">
        <h4 class="font-bold text-gray-900">${video.title}</h4>
        <p class="text-sm text-gray-500 line-clamp-2">${video.description}</p>
      </div>
    </div>
  `).join('');
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const data = db.get();
      renderProducts(data.products, query);
    });
  }
}

function setupShare() {
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href
          });
        } catch (err) {
          console.log('Error sharing:', err);
        }
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    });
  }
}

function filterProducts(category) {
  const data = db.get();
  renderProducts(data.products, category);
  // Scroll to products
  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
}
