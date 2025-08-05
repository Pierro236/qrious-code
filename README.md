# Qrious Code

Un générateur de QR codes personnalisés créé avec Next.js, TypeScript et Tailwind CSS.

## Fonctionnalités

- **Génération de QR codes** : Entrez une URL ou un message pour générer un QR code
- **Personnalisation des couleurs** : Choisissez la couleur du QR code et du fond
- **Intégration de logo** : Ajoutez votre logo au centre du QR code
- **Aperçu en temps réel** : Voir les modifications instantanément
- **Export PNG** : Téléchargez votre QR code en format PNG
- **Interface responsive** : Fonctionne sur tous les appareils

## Technologies utilisées

- **Next.js** : Framework React pour le développement
- **TypeScript** : Typage statique pour une meilleure qualité de code
- **Tailwind CSS** : Framework CSS utilitaire pour le style
- **qrcode.react** : Génération de QR codes
- **react-color** : Sélecteurs de couleur
- **html-to-image** : Export en PNG

## Installation

1. Clonez le repository
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Utilisation

1. Entrez une URL ou un message dans le champ texte
2. Personnalisez les couleurs du QR code et du fond
3. Optionnellement, ajoutez un logo en uploadant une image
4. Vérifiez l'aperçu en temps réel
5. Cliquez sur "Télécharger QR Code" pour sauvegarder en PNG

## Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm run start` : Lance l'application en mode production
- `npm run lint` : Vérifie le code avec ESLint

## Licence

Ce projet est sous licence MIT.
