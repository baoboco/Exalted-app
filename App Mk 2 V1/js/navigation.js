// Ce fichier gère la navigation entre les différents niveaux de la carte et les sous-cartes

// Noms des niveaux pour l'affichage
const NOMS_NIVEAUX = [
    "Surface",
    "Souterrains",
    "Égouts",
    "Ruines anciennes"
];

// Configuration des sous-cartes disponibles
const SOUS_CARTES = {
    "taverne-dragon": {
        nom: "Taverne du Dragon Ivre",
        chemin: "cartes/lieux/taverne-dragon.svg",
        parent: {
            niveau: 0,
            position: { x: 540, y: 400 } // Position approximative sur la carte principale
        },
        description: "Une taverne animée au cœur du quartier marchand."
    },
    "temple-lune": {
        nom: "Temple de la Lune",
        chemin: "cartes/lieux/temple-lune.svg",
        parent: {
            niveau: 0,
            position: { x: 1450, y: 400 } // Position approximative sur la carte principale
        },
        description: "Un lieu sacré dédié au culte de la Lune."
    }
    // Ajoutez d'autres sous-cartes ici au fur et à mesure
};

// Variables pour la gestion de la navigation
let etatNavigation = {
    niveauActuel: CONFIG.carte.niveauActuel,
    sousCarteActuelle: null,
    historique: [] // Pour permettre la navigation retour
};

// Initialiser le sélecteur de niveaux
function initNavigationNiveaux() {
    // Créer le conteneur de sélection de niveaux s'il n'existe pas déjà
    if (!document.getElementById('niveau-selecteur')) {
        // Créer un élément pour la sélection de niveaux
        const selecteurContainer = document.createElement('div');
        selecteurContainer.id = 'niveau-selecteur';
        selecteurContainer.className = 'niveau-selecteur';
        
        // Ajouter les boutons pour chaque niveau disponible
        for (let i = 0; i < CONFIG.carte.cheminNiveaux.length; i++) {
            const nomNiveau = NOMS_NIVEAUX[i] || `Niveau ${i}`;
            
            const boutonNiveau = document.createElement('button');
            boutonNiveau.className = 'btn-niveau' + (i === CONFIG.carte.niveauActuel ? ' actif' : '');
            boutonNiveau.dataset.niveau = i;
            boutonNiveau.title = nomNiveau;
            boutonNiveau.innerHTML = `<span class="niveau-icone">${i}</span><span class="niveau-nom">${nomNiveau}</span>`;
            
            boutonNiveau.addEventListener('click', function() {
                changerNiveau(parseInt(this.dataset.niveau));
            });
            
            selecteurContainer.appendChild(boutonNiveau);
        }
        
        // Ajouter le sélecteur à la page
        document.getElementById('map-container').appendChild(selecteurContainer);
    }
    
    // Initialiser le fil d'Ariane pour la navigation
    initFilAriane();
    
    // Mettre à jour l'apparence du sélecteur pour refléter le niveau actuel
    mettreAJourSelecteurNiveaux();
}

// Initialiser le fil d'Ariane pour la navigation
function initFilAriane() {
    if (!document.getElementById('fil-ariane')) {
        const filAriane = document.createElement('div');
        filAriane.id = 'fil-ariane';
        filAriane.className = 'fil-ariane';
        
        // Ajouter au conteneur de la carte
        document.getElementById('map-container').appendChild(filAriane);
        
        // Mise à jour initiale
        mettreAJourFilAriane();
    }
}

// Mettre à jour le fil d'Ariane
function mettreAJourFilAriane() {
    const filAriane = document.getElementById('fil-ariane');
    if (!filAriane) return;
    
    // Vider le fil d'Ariane
    filAriane.innerHTML = '';
    
    // Ajouter le lien de retour à la carte principale (Nexus)
    const lienNexus = document.createElement('span');
    lienNexus.className = 'ariane-item';
    lienNexus.textContent = 'Nexus';
    lienNexus.addEventListener('click', function() {
        // Si on est dans une sous-carte, retourner à la carte principale
        if (etatNavigation.sousCarteActuelle) {
            retourCarteNiveau();
        }
    });
    filAriane.appendChild(lienNexus);
    
    // Ajouter le niveau actuel
    if (etatNavigation.niveauActuel !== undefined) {
        filAriane.appendChild(document.createTextNode(' > '));
        
        const lienNiveau = document.createElement('span');
        lienNiveau.className = 'ariane-item';
        lienNiveau.textContent = NOMS_NIVEAUX[etatNavigation.niveauActuel] || `Niveau ${etatNavigation.niveauActuel}`;
        filAriane.appendChild(lienNiveau);
    }
    
    // Si on est dans une sous-carte, l'ajouter
    if (etatNavigation.sousCarteActuelle) {
        filAriane.appendChild(document.createTextNode(' > '));
        
        const lienSousCarte = document.createElement('span');
        lienSousCarte.className = 'ariane-item ariane-actif';
        lienSousCarte.textContent = SOUS_CARTES[etatNavigation.sousCarteActuelle].nom;
        filAriane.appendChild(lienSousCarte);
    }
}

// Mettre à jour l'apparence du sélecteur de niveaux
function mettreAJourSelecteurNiveaux() {
    const boutons = document.querySelectorAll('#niveau-selecteur .btn-niveau');
    boutons.forEach(btn => {
        const niveau = parseInt(btn.dataset.niveau);
        if (niveau === etatNavigation.niveauActuel) {
            btn.classList.add('actif');
        } else {
            btn.classList.remove('actif');
        }
    });
}

// Fonction pour changer de niveau
function changerNiveau(niveau) {
    // Vérifier que le niveau demandé existe
    if (niveau < 0 || niveau >= CONFIG.carte.cheminNiveaux.length) {
        console.error("Niveau inexistant:", niveau);
        return false;
    }
    
    // Si on est dans une sous-carte, revenir d'abord à la carte principale
    if (etatNavigation.sousCarteActuelle) {
        retourCarteNiveau();
    }
    
    // Sauvegarder le niveau actuel
    const ancienNiveau = etatNavigation.niveauActuel;
    
    // Mettre à jour le niveau actuel
    etatNavigation.niveauActuel = niveau;
    CONFIG.carte.niveauActuel = niveau;
    
    // Sauvegarder le niveau dans le stockage local
    localStorage.setItem('nexus-niveau', niveau);
    
    // Si le niveau est différent, recharger la carte
    if (ancienNiveau !== niveau) {
        // Supprimer tous les marqueurs de la carte
        Object.values(marqueurs).forEach(m => {
            map.removeLayer(m.instance);
        });
        
        // Vider l'objet des marqueurs
        marqueurs = {};
        
        // Supprimer la couche d'image actuelle
        map.eachLayer(function (layer) {
            if (layer instanceof L.ImageOverlay) {
                map.removeLayer(layer);
            }
        });
        
        // Charger la nouvelle image de carte
        const cheminImage = CONFIG.carte.cheminNiveaux[niveau];
        const limites = [[0, 0], [2000, 2000]]; // Dimensions de votre SVG
        L.imageOverlay(cheminImage, limites).addTo(map);
        
        // Charger les marqueurs du nouveau niveau
        chargerMarqueurs();
        
        // Mettre à jour l'apparence du sélecteur de niveaux
        mettreAJourSelecteurNiveaux();
        
        // Mettre à jour le fil d'Ariane
        mettreAJourFilAriane();
        
        console.log("Changement vers le niveau", niveau, NOMS_NIVEAUX[niveau]);
        return true;
    }
    
    return false;
}

// Ouvrir une sous-carte
function ouvrirSousCarte(id) {
    // Vérifier que la sous-carte existe
    if (!SOUS_CARTES[id]) {
        console.error("Sous-carte inexistante:", id);
        return false;
    }
    
    // Sauvegarder l'état actuel dans l'historique pour pouvoir revenir en arrière
    etatNavigation.historique.push({
        type: 'niveau',
        niveau: etatNavigation.niveauActuel,
        position: map.getCenter(),
        zoom: map.getZoom()
    });
    
    // Mettre à jour l'état de navigation
    etatNavigation.sousCarteActuelle = id;
    
    // Supprimer tous les marqueurs de la carte
    Object.values(marqueurs).forEach(m => {
        map.removeLayer(m.instance);
    });
    
    // Vider l'objet des marqueurs
    marqueurs = {};
    
    // Supprimer la couche d'image actuelle
    map.eachLayer(function (layer) {
        if (layer instanceof L.ImageOverlay) {
            map.removeLayer(layer);
        }
    });
    
    // Charger l'image de la sous-carte
    const sousCarte = SOUS_CARTES[id];
    const cheminImage = sousCarte.chemin;
    
    // Dimensions de la sous-carte (peut varier selon la sous-carte)
    const limites = [[0, 0], [1000, 800]];
    
    // Ajouter la sous-carte comme image overlay
    L.imageOverlay(cheminImage, limites).addTo(map);
    
    // Définir les limites de la vue
    map.fitBounds(limites);
    
    // Masquer le sélecteur de niveaux pendant qu'on est dans une sous-carte
    const selecteur = document.getElementById('niveau-selecteur');
    if (selecteur) {
        selecteur.classList.add('hidden');
    }
    
    // Ajouter le bouton de retour si ce n'est pas déjà fait
    ajouterBoutonRetour();
    
    // Mettre à jour le fil d'Ariane
    mettreAJourFilAriane();
    
    console.log("Ouverture de la sous-carte:", sousCarte.nom);
    return true;
}

// Ajouter un bouton de retour à la carte principale
function ajouterBoutonRetour() {
    if (!document.getElementById('btn-retour')) {
        const boutonRetour = document.createElement('button');
        boutonRetour.id = 'btn-retour';
        boutonRetour.className = 'btn-retour';
        boutonRetour.innerHTML = '<i class="fas fa-arrow-left"></i> Retour à la carte';
        boutonRetour.title = "Retourner à la carte principale";
        
        boutonRetour.addEventListener('click', function() {
            retourCarteNiveau();
        });
        
        document.getElementById('map-container').appendChild(boutonRetour);
    } else {
        document.getElementById('btn-retour').classList.remove('hidden');
    }
}

// Retourner à la carte de niveau (depuis une sous-carte)
function retourCarteNiveau() {
    // Vérifier qu'on est bien dans une sous-carte
    if (!etatNavigation.sousCarteActuelle) return false;
    
    // Récupérer l'état précédent
    const etatPrecedent = etatNavigation.historique.pop();
    if (!etatPrecedent || etatPrecedent.type !== 'niveau') {
        console.error("Impossible de revenir à l'état précédent");
        return false;
    }
    
    // Réinitialiser l'état de navigation
    etatNavigation.sousCarteActuelle = null;
    
    // Supprimer tous les marqueurs de la sous-carte
    Object.values(marqueurs).forEach(m => {
        map.removeLayer(m.instance);
    });
    
    // Vider l'objet des marqueurs
    marqueurs = {};
    
    // Supprimer la couche d'image actuelle
    map.eachLayer(function (layer) {
        if (layer instanceof L.ImageOverlay) {
            map.removeLayer(layer);
        }
    });
    
    // Recharger la carte du niveau
    const cheminImage = CONFIG.carte.cheminNiveaux[etatPrecedent.niveau];
    const limites = [[0, 0], [2000, 2000]]; // Dimensions de votre SVG
    L.imageOverlay(cheminImage, limites).addTo(map);
    
    // Recentrer la carte
    if (etatPrecedent.position) {
        map.setView(etatPrecedent.position, etatPrecedent.zoom || CONFIG.carte.zoom.defaut);
    } else {
        map.fitBounds(limites);
    }
    
    // Recharger les marqueurs du niveau
    chargerMarqueurs();
    
    // Réafficher le sélecteur de niveaux
    const selecteur = document.getElementById('niveau-selecteur');
    if (selecteur) {
        selecteur.classList.remove('hidden');
    }
    
    // Masquer le bouton de retour
    const boutonRetour = document.getElementById('btn-retour');
    if (boutonRetour) {
        boutonRetour.classList.add('hidden');
    }
    
    // Mettre à jour le fil d'Ariane
    mettreAJourFilAriane();
    
    console.log("Retour à la carte principale, niveau", etatPrecedent.niveau);
    return true;
}

// Ajouter un gestionnaire d'événement pour le bouton de changement de niveau
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-layers').addEventListener('click', function() {
        // Si on est dans une sous-carte, ne pas montrer le sélecteur de niveaux
        if (etatNavigation.sousCarteActuelle) return;
        
        // Afficher/masquer le sélecteur de niveaux
        const selecteur = document.getElementById('niveau-selecteur');
        if (selecteur) {
            selecteur.classList.toggle('visible');
        }
    });
});