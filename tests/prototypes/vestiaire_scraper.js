// Vestiaire Collective Scraper - Prototype
// Auteur: Assistant IA pour jeremy745
// Date: 2025-03-13

const puppeteer = require('puppeteer');

/**
 * Scraper pour Vestiaire Collective
 * Ce script permet d'extraire les informations sur les produits depuis Vestiaire Collective
 * en utilisant des techniques pour éviter d'être bloqué
 */

// Configuration du scraper
const config = {
  // Délai aléatoire entre les actions (en millisecondes)
  minDelay: 500,
  maxDelay: 2000,
  
  // Nombre maximum de pages à scraper
  maxPages: 3,
  
  // User agents à alterner (simule différents navigateurs)
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  ]
};

/**
 * Génère un délai aléatoire
 * @returns {number} Délai en millisecondes
 */
function randomDelay() {
  return Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
}

/**
 * Obtient un user agent aléatoire
 * @returns {string} User agent
 */
function getRandomUserAgent() {
  return config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
}

/**
 * Attend un délai aléatoire
 * @returns {Promise} Promise résolue après le délai
 */
async function wait() {
  const delay = randomDelay();
  console.log(`Attente de ${delay}ms...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Fonction principale pour scraper Vestiaire Collective
 * @param {Object} params Paramètres de recherche
 * @returns {Promise<Array>} Produits scrapés
 */
async function scrapeVestiaire(params) {
  // Paramètres par défaut
  const searchParams = {
    brand: params.brand || '',
    model: params.model || '',
    category: params.category || '',
    maxPages: params.maxPages || config.maxPages
  };
  
  console.log(`Démarrage du scraping pour ${searchParams.brand} ${searchParams.model}`);
  
  // Construire l'URL de recherche
  const searchTerms = [searchParams.brand, searchParams.model, searchParams.category]
    .filter(term => term)
    .join(' ');
    
  const searchUrl = `https://www.vestiairecollective.com/search/?q=${encodeURIComponent(searchTerms)}`;
  console.log(`URL de recherche: ${searchUrl}`);
  
  // Lancer le navigateur
  console.log('Lancement du navigateur...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  try {
    // Ouvrir une nouvelle page
    const page = await browser.newPage();
    
    // Configurer un user agent aléatoire
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`User agent configuré: ${userAgent}`);
    
    // Configurer d'autres en-têtes pour paraître plus humain
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Activer la navigation comme un utilisateur réel (lent et progressif)
    await page.setViewport({ width: 1280, height: 800 });
    
    // Aller à l'URL de recherche
    console.log('Navigation vers la page de recherche...');
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    await wait();
    
    // Accepter les cookies si le popup apparaît
    try {
      const cookieButton = await page.$('[data-testid="cookie-banner-accept-button"]');
      if (cookieButton) {
        console.log('Acceptation des cookies...');
        await cookieButton.click();
        await wait();
      }
    } catch (error) {
      console.log('Pas de popup de cookies détecté ou erreur lors de l\'acceptation');
    }
    
    // Collecter les produits de toutes les pages
    let allProducts = [];
    let currentPage = 1;
    
    while (currentPage <= searchParams.maxPages) {
      console.log(`Scraping de la page ${currentPage}...`);
      
      // Attendre que les produits se chargent
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
        .catch(() => console.log('Sélecteur de carte produit non trouvé, utilisation d\'un sélecteur alternatif...'));
      
      // Scroller lentement pour charger tous les produits (comme un humain)
      await autoScroll(page);
      
      // Attendre un peu pour que tout se charge
      await wait();
      
      // Extraire les produits
      console.log('Extraction des produits...');
      const productsOnPage = await extractProducts(page);
      console.log(`${productsOnPage.length} produits trouvés sur cette page`);
      
      // Ajouter les produits à la liste
      allProducts = [...allProducts, ...productsOnPage];
      
      // Passer à la page suivante si possible
      if (currentPage < searchParams.maxPages) {
        // Chercher le bouton "page suivante"
        const nextButton = await page.$('[data-testid="paginationNext"]') || 
                          await page.$('.pagination-next') ||
                          await page.$('a[rel="next"]');
                          
        if (nextButton) {
          console.log('Navigation vers la page suivante...');
          await nextButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
          await wait();
          currentPage++;
        } else {
          console.log('Pas de bouton suivant trouvé, fin du scraping');
          break;
        }
      } else {
        break;
      }
    }
    
    console.log(`Scraping terminé. ${allProducts.length} produits trouvés au total.`);
    return allProducts;
    
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    throw error;
  } finally {
    // Fermer le navigateur
    await browser.close();
    console.log('Navigateur fermé');
  }
}

/**
 * Fait défiler lentement la page pour charger tous les contenus
 * @param {Page} page Instance de page Puppeteer
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

/**
 * Extrait les informations des produits sur la page
 * @param {Page} page Instance de page Puppeteer
 * @returns {Promise<Array>} Liste des produits
 */
async function extractProducts(page) {
  return page.evaluate(() => {
    // Sélectionner tous les cards de produits
    const productCards = document.querySelectorAll('[data-testid="product-card"]') || 
                         document.querySelectorAll('.product-card') ||
                         document.querySelectorAll('.product-item');
    
    return Array.from(productCards).map(card => {
      // Extraire les informations de base
      const titleElement = card.querySelector('[data-testid="product-card-title"]') || 
                          card.querySelector('.product-card__title') ||
                          card.querySelector('.product-card__brand') ||
                          card.querySelector('h3');
                          
      const brandElement = card.querySelector('[data-testid="product-card-brand"]') || 
                          card.querySelector('.product-card__designer') ||
                          card.querySelector('.product-card__brand');
                          
      const priceElement = card.querySelector('[data-testid="product-card-price"]') || 
                          card.querySelector('.product-card__price') ||
                          card.querySelector('.product-price');
                          
      const originalPriceElement = card.querySelector('[data-testid="product-card-strike-price"]') || 
                                  card.querySelector('.product-card__original-price') ||
                                  card.querySelector('.product-original-price');
                                  
      const conditionElement = card.querySelector('[data-testid="product-card-condition"]') || 
                              card.querySelector('.product-card__condition') ||
                              card.querySelector('.product-condition');
                              
      const linkElement = card.querySelector('a') || card.closest('a');
      
      const imageElement = card.querySelector('img');
      
      // Construire l'objet produit
      const product = {
        title: titleElement ? titleElement.textContent.trim() : 'Titre non disponible',
        brand: brandElement ? brandElement.textContent.trim() : 'Marque non disponible',
        price: priceElement ? priceElement.textContent.trim() : 'Prix non disponible',
        original_price: originalPriceElement ? originalPriceElement.textContent.trim() : null,
        condition: conditionElement ? conditionElement.textContent.trim() : 'Condition non disponible',
        link: linkElement ? linkElement.href : null,
        image: imageElement ? imageElement.src : null,
        scraped_at: new Date().toISOString()
      };
      
      // Calculer la réduction si possible
      if (product.price && product.original_price) {
        try {
          const currentPrice = parseFloat(product.price.replace(/[^\d,.]/g, '').replace(',', '.'));
          const originalPrice = parseFloat(product.original_price.replace(/[^\d,.]/g, '').replace(',', '.'));
          
          if (!isNaN(currentPrice) && !isNaN(originalPrice) && originalPrice > 0) {
            const discountPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;
            product.discount_percentage = discountPercentage.toFixed(0) + '%';
          }
        } catch (e) {
          // Ignorer les erreurs de calcul
        }
      }
      
      return product;
    });
  });
}

/**
 * Point d'entrée principal pour l'exécution via n8n ou ligne de commande
 */
async function main() {
  try {
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    const params = {};
    
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        params[args[i].substring(2)] = args[i + 1];
      }
    }
    
    // Vérifier qu'on a au moins une marque ou un modèle
    if (!params.brand && !params.model && !params.category) {
      console.error('Erreur: Veuillez spécifier au moins une marque (--brand) ou un modèle (--model) ou une catégorie (--category)');
      process.exit(1);
    }
    
    // Lancer le scraping
    const results = await scrapeVestiaire(params);
    
    // Afficher les résultats en JSON
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
} else {
  // Exporter les fonctions pour utilisation comme module
  module.exports = {
    scrapeVestiaire
  };
}
