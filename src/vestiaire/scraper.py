#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Scraper pour Vestiaire Collective

Ce module contient la logique principale pour extraire les données
des articles de maroquinerie de luxe depuis Vestiaire Collective.
"""

import time
import random
import logging
from typing import Dict, List, Optional, Union

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VestiaireScraper:
    """
    Scraper pour Vestiaire Collective
    """
    
    BASE_URL = "https://www.vestiairecollective.com"
    SEARCH_URL = f"{BASE_URL}/search"
    
    def __init__(self, use_playwright: bool = True, headless: bool = True):
        """
        Initialise le scraper
        
        Args:
            use_playwright: Utiliser Playwright au lieu de requests (recommandé)
            headless: Mode headless pour Playwright
        """
        self.use_playwright = use_playwright
        self.headless = headless
        self.browser = None
        self.page = None
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        })
        
        if use_playwright:
            self._init_playwright()
    
    def _init_playwright(self):
        """Initialise le navigateur Playwright"""
        playwright = sync_playwright().start()
        self.browser = playwright.chromium.launch(headless=self.headless)
        self.page = self.browser.new_page()
        # Configuration des en-têtes et autres options
        self.page.set_extra_http_headers({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        })
    
    def __del__(self):
        """Nettoyage des ressources"""
        if self.browser:
            self.browser.close()
    
    def search(self, brand: str = None, category: str = None, 
               subcategory: str = None, max_pages: int = 1) -> List[Dict]:
        """
        Recherche des articles selon les critères spécifiés
        
        Args:
            brand: Marque (e.g. "Louis Vuitton")
            category: Catégorie (e.g. "Bags")
            subcategory: Sous-catégorie (e.g. "Handbags")
            max_pages: Nombre maximum de pages à scraper
            
        Returns:
            Liste de dictionnaires contenant les informations des articles
        """
        if not brand and not category:
            raise ValueError("Au moins un critère de recherche (marque ou catégorie) doit être spécifié")
        
        # Construction de l'URL de recherche
        query_params = []
        if brand:
            query_params.append(f"designer={brand.replace(' ', '+')}")
        if category:
            query_params.append(f"category={category.lower()}")
        if subcategory:
            query_params.append(f"subcategory={subcategory.lower()}")
        
        search_url = f"{self.SEARCH_URL}?{'&'.join(query_params)}"
        logger.info(f"URL de recherche: {search_url}")
        
        all_items = []
        
        if self.use_playwright:
            all_items = self._search_with_playwright(search_url, max_pages)
        else:
            all_items = self._search_with_requests(search_url, max_pages)
        
        return all_items
    
    def _search_with_playwright(self, url: str, max_pages: int) -> List[Dict]:
        """
        Recherche avec Playwright (recommandé pour sites dynamiques)
        
        Args:
            url: URL de recherche
            max_pages: Nombre maximum de pages
            
        Returns:
            Liste d'articles
        """
        items = []
        self.page.goto(url)
        # Attendre que la page soit chargée
        self.page.wait_for_selector(".product-card")
        
        for page_num in range(1, max_pages + 1):
            logger.info(f"Scraping page {page_num}")
            # Attendre un délai aléatoire pour éviter la détection
            time.sleep(random.uniform(1, 3))
            
            # Extraction des articles de la page
            product_cards = self.page.query_selector_all(".product-card")
            
            for card in product_cards:
                try:
                    item = self._extract_item_data_playwright(card)
                    items.append(item)
                except Exception as e:
                    logger.error(f"Erreur lors de l'extraction des données: {e}")
            
            # Passer à la page suivante si pas encore à la dernière page
            if page_num < max_pages:
                try:
                    next_button = self.page.query_selector("a.next-page")
                    if next_button:
                        next_button.click()
                        self.page.wait_for_selector(".product-card")
                    else:
                        logger.info("Dernière page atteinte")
                        break
                except Exception as e:
                    logger.error(f"Erreur lors du passage à la page suivante: {e}")
                    break
        
        return items
    
    def _search_with_requests(self, url: str, max_pages: int) -> List[Dict]:
        """
        Recherche avec requests (pour les tests simples)
        
        Args:
            url: URL de recherche
            max_pages: Nombre maximum de pages
            
        Returns:
            Liste d'articles
        """
        items = []
        
        for page_num in range(1, max_pages + 1):
            logger.info(f"Scraping page {page_num}")
            # Ajouter le numéro de page à l'URL
            page_url = f"{url}&page={page_num}"
            
            # Attendre un délai aléatoire pour éviter la détection
            time.sleep(random.uniform(1, 3))
            
            response = self.session.get(page_url)
            if response.status_code != 200:
                logger.error(f"Erreur lors de la récupération de la page {page_num}: {response.status_code}")
                break
            
            soup = BeautifulSoup(response.text, "html.parser")
            product_cards = soup.select(".product-card")
            
            if not product_cards:
                logger.info("Aucun article trouvé ou dernière page atteinte")
                break
            
            for card in product_cards:
                try:
                    item = self._extract_item_data_bs4(card)
                    items.append(item)
                except Exception as e:
                    logger.error(f"Erreur lors de l'extraction des données: {e}")
            
        return items
    
    def _extract_item_data_playwright(self, card) -> Dict:
        """
        Extrait les données d'un article à partir d'un élément Playwright
        
        Args:
            card: Élément du DOM représentant un article
            
        Returns:
            Dictionnaire contenant les informations de l'article
        """
        try:
            # Exemple d'extraction, à adapter selon la structure du site
            title_elem = card.query_selector(".product-card__title")
            brand_elem = card.query_selector(".product-card__brand")
            price_elem = card.query_selector(".product-card__price")
            link_elem = card.query_selector("a.product-card__link")
            
            title = title_elem.text_content() if title_elem else "N/A"
            brand = brand_elem.text_content() if brand_elem else "N/A"
            price_text = price_elem.text_content() if price_elem else "0"
            link = link_elem.get_attribute("href") if link_elem else None
            
            # Nettoyage du prix
            price = price_text.replace("€", "").replace("$", "").strip()
            try:
                price = float(price.replace(",", ""))
            except ValueError:
                price = 0.0
            
            return {
                "title": title.strip(),
                "brand": brand.strip(),
                "price": price,
                "currency": "EUR" if "€" in price_text else "USD",
                "link": f"{self.BASE_URL}{link}" if link and not link.startswith('http') else link,
                "source": "Vestiaire Collective",
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des données Playwright: {e}")
            return {}
    
    def _extract_item_data_bs4(self, card) -> Dict:
        """
        Extrait les données d'un article à partir d'un élément BeautifulSoup
        
        Args:
            card: Élément BS4 représentant un article
            
        Returns:
            Dictionnaire contenant les informations de l'article
        """
        try:
            # Exemple d'extraction, à adapter selon la structure du site
            title_elem = card.select_one(".product-card__title")
            brand_elem = card.select_one(".product-card__brand")
            price_elem = card.select_one(".product-card__price")
            link_elem = card.select_one("a.product-card__link")
            
            title = title_elem.text if title_elem else "N/A"
            brand = brand_elem.text if brand_elem else "N/A"
            price_text = price_elem.text if price_elem else "0"
            link = link_elem.get("href") if link_elem else None
            
            # Nettoyage du prix
            price = price_text.replace("€", "").replace("$", "").strip()
            try:
                price = float(price.replace(",", ""))
            except ValueError:
                price = 0.0
            
            return {
                "title": title.strip(),
                "brand": brand.strip(),
                "price": price,
                "currency": "EUR" if "€" in price_text else "USD",
                "link": f"{self.BASE_URL}{link}" if link and not link.startswith('http') else link,
                "source": "Vestiaire Collective",
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des données BS4: {e}")
            return {}
    
    def get_item_details(self, url: str) -> Dict:
        """
        Récupère les détails d'un article à partir de son URL
        
        Args:
            url: URL de l'article
            
        Returns:
            Dictionnaire contenant les détails de l'article
        """
        # À implémenter
        pass
    
    def save_to_database(self, items: List[Dict]):
        """
        Sauvegarde les articles dans la base de données
        
        Args:
            items: Liste d'articles à sauvegarder
        """
        # À implémenter - connexion à la base de données
        pass


# Exemple d'utilisation
if __name__ == "__main__":
    scraper = VestiaireScraper(use_playwright=True)
    results = scraper.search(brand="Louis Vuitton", category="Bags", max_pages=1)
    print(f"Nombre d'articles trouvés: {len(results)}")
    for i, item in enumerate(results[:3]):  # Afficher seulement les 3 premiers
        print(f"Article {i+1}:")
        print(f"  Titre: {item.get('title')}")
        print(f"  Marque: {item.get('brand')}")
        print(f"  Prix: {item.get('price')} {item.get('currency')}")
        print(f"  Lien: {item.get('link')}")
        print("---")
