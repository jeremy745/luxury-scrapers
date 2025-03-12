# Luxury Scrapers

Ce dépôt contient les scrapers pour la collecte de données d'articles de maroquinerie de luxe depuis Vestiaire Collective et potentiellement d'autres plateformes de revente.

## 🌟 Vue d'ensemble

Les scrapers sont conçus pour collecter des données structurées sur les articles de maroquinerie de luxe vendus sur le marché secondaire. Ces données serviront à alimenter les modèles de prédiction de prix.

## 🧩 Composants

### Vestiaire Collective Scraper
- Extraction des listings d'articles
- Collecte des prix, états, descriptions et autres métadonnées
- Suivi historique des prix
- Gestion des restrictions anti-scraping

### Base de données
- Schéma optimisé pour les données de produits de luxe
- Stockage des données historiques
- Indexation pour des requêtes performantes

### Preprocessing
- Nettoyage et normalisation des données
- Extraction d'attributs depuis les descriptions
- Détection des doublons et fusion de données

## 📂 Structure du dépôt

```
luxury-scrapers/
├── src/
│   ├── vestiaire/            # Scraper pour Vestiaire Collective
│   │   ├── scraper.py        # Logique principale de scraping
│   │   ├── parser.py         # Parseurs de pages et d'éléments
│   │   └── utils.py          # Utilitaires
│   │
│   ├── database/             # Gestion de la base de données
│   │   ├── models.py         # Modèles de données
│   │   ├── db.py             # Connecteurs et helpers
│   │   └── migrations/       # Scripts de migration
│   │
│   └── preprocessing/        # Traitement des données
│       ├── cleaner.py        # Nettoyage des données
│       ├── normalizer.py     # Normalisation
│       └── feature_extractor.py # Extraction de caractéristiques
│
├── tests/                    # Tests unitaires et d'intégration
├── config/                   # Fichiers de configuration
├── scripts/                  # Scripts utilitaires
└── notebooks/                # Jupyter notebooks pour l'exploration
```

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/jeremy745/luxury-scrapers.git
cd luxury-scrapers

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Pour Linux/Mac
# ou
venv\Scripts\activate  # Pour Windows

# Installer les dépendances
pip install -r requirements.txt
```

## 💻 Utilisation

```python
# Exemple d'utilisation (à implémenter)
from src.vestiaire.scraper import VestiaireScraper

scraper = VestiaireScraper()
results = scraper.search(brand="Louis Vuitton", category="Bags")
scraper.save_to_database(results)
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=luxury_resale
DB_USER=username
DB_PASSWORD=password

# Proxy settings (optionnel)
USE_PROXY=false
PROXY_URL=http://proxy:port
```

## 🛠️ Développement

### Ajouter un nouveau scraper

1. Créez un nouveau dossier dans `src/` pour la plateforme cible
2. Implémentez les classes nécessaires en suivant le modèle de Vestiaire
3. Ajoutez des tests dans le dossier `tests/`
4. Mettez à jour la documentation

## 📝 Best Practices

- Respectez les conditions d'utilisation des sites
- Utilisez des délais entre les requêtes
- Mettez en place une rotation d'adresses IP si nécessaire
- Sauvegardez les données brutes avant transformation
