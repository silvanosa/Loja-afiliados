// Database management using LocalStorage
const DB_KEY = 'premium_store_db';

const defaultData = {
  settings: {
    name: 'Premium Store',
    logo: '',
    primaryColor: '#F27D26',
    secondaryColor: '#141414',
    font: 'Inter',
    banner: {
      image: 'https://picsum.photos/seed/marketplace/1200/400',
      title: 'OFERTAS DO DIA',
      subtitle: 'Os melhores achadinhos com os menores preços',
      textColor: '#FFFFFF'
    },
    social: {
      instagram: '',
      whatsapp: '',
      facebook: ''
    },
    adminPassword: '123ADM'
  },
  categories: [
    'Eletrônicos', 'Casa', 'Fitness', 'Saúde e Beleza', 'Maquiagem', 'Cama Mesa e Banho', 'Tecnologia', 'Promoções'
  ],
  products: [],
  videos: [],
  stats: {
    clicks: {}
  }
};

export const db = {
  get: () => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : defaultData;
  },
  save: (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },
  reset: () => {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
};
