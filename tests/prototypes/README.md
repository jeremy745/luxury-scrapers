# Scraper Prototype pour Vestiaire Collective

Ce dossier contient un prototype fonctionnel de scraper pour Vestiaire Collective.

## Contenu

- `vestiaire_scraper.js` - Script de scraping JavaScript utilisant Puppeteer

## Prérequis

Pour exécuter ce script, vous aurez besoin de :

- Node.js (v14 ou supérieur)
- npm (pour installer les dépendances)
- Puppeteer

## Installation

```bash
# Installer les dépendances
npm install puppeteer
```

## Utilisation

### En ligne de commande

Le script peut être exécuté directement en ligne de commande :

```bash
node vestiaire_scraper.js --brand "Hermès" --model "Kelly" --maxPages 2
```

Arguments disponibles :
- `--brand` - Marque à rechercher (ex: "Hermès", "Louis Vuitton")
- `--model` - Modèle à rechercher (ex: "Kelly", "Neverfull")
- `--category` - Catégorie à rechercher (ex: "sac", "veste")
- `--maxPages` - Nombre maximum de pages à scraper (défaut: 3)

### Depuis n8n

Pour utiliser ce script dans n8n, suivez ces étapes :

1. Créez un nouveau workflow dans n8n
2. Ajoutez un nœud "Execute Command"
3. Configurez la commande comme suit :

```
node /chemin/vers/vestiaire_scraper.js --brand "Hermès" --model "Kelly"
```

4. Remplacez `/chemin/vers/` par le chemin réel vers le script
5. Ajoutez un nœud "JSON Parse" pour traiter la sortie

## Structure des données extraites

Le script extrait les données suivantes pour chaque produit :

```json
{
  "title": "Sac à main Kelly 32 en Cuir Togo",
  "brand": "Hermès",
  "price": "15 500,00 €",
  "original_price": "18 000,00 €",
  "discount_percentage": "14%",
  "condition": "Très bon état",
  "link": "https://www.vestiairecollective.com/women-bags/handbags/hermes/black-leather-kelly-32-hermes-handbag-12345678.shtml",
  "image": "https://images.vestiairecollective.com/hermes-kelly-black-12345678.jpg",
  "scraped_at": "2025-03-13T10:15:30.123Z"
}
```

## Bonnes pratiques implémentées

Le script utilise plusieurs techniques pour éviter d'être bloqué :

1. Rotation des User-Agents
2. Délais aléatoires entre les actions
3. Scrolling progressif comme un humain
4. Gestion automatique des popups de cookies
5. En-têtes HTTP réalistes

## Adaptation pour n8n Cloud

Si vous utilisez n8n Cloud, vous devez :

1. Héberger ce script sur un serveur accessible (ou utiliser une fonction serverless)
2. Créer un endpoint API qui exécute le script
3. Utiliser le nœud HTTP Request dans n8n pour appeler cet endpoint

## Limitations

- Ce script est un prototype et peut nécessiter des ajustements selon l'évolution du site Vestiaire Collective
- Il n'inclut pas de système avancé de rotation de proxies (à ajouter pour un usage intensif)
- Les sélecteurs CSS peuvent nécessiter des mises à jour si le site change

## Dépannage

Si vous rencontrez des erreurs :

1. Vérifiez que Puppeteer est correctement installé
2. Essayez de réduire le nombre de pages à scraper
3. Vérifiez que les sélecteurs CSS sont toujours valides
4. Augmentez les délais si le site met du temps à charger

## Prochaines améliorations prévues

- Ajouter la rotation de proxies
- Extraire plus de détails des produits
- Implémenter la pagination avancée
- Ajouter des options de filtrage
