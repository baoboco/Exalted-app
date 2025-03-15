// Variables globales
let map; // Référence à la carte Leaflet
let marqueurs = {}; // Stockage des marqueurs par ID

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Récupérer le rôle sauvegardé si disponible
    const roleSauvegarde = localStorage.getItem('nexus-role');
    if (roleSauvegarde) {
        CONFIG.utilisateur.role = roleSauvegarde;
    }
    
    // Récupérer le niveau sauvegardé si disponible
    const niveauSauvegarde = localStorage.getItem('nexus-niveau');
    if (niveauSauvegarde) {
        const niveau = parseInt(niveauSauvegarde);
        if (!isNaN(niveau) && niveau >= 0 && niveau < CONFIG.carte.cheminNiveaux.length) {
            CONFIG.carte.niveauActuel = niveau;
        }
    }
    
    // Mettre à jour l'interface en fonction du rôle
    mettreAJourInterfaceRole();
    
    // Initialiser la carte
    initCarte();
    
    // Initialiser le sélecteur de niveaux
    initNavigationNiveaux();
    
    // Charger les marqueurs sauvegardés
    chargerMarqueurs();
    
    // Configurer les écouteurs d'événements pour l'interface
    configurerEvenements();
});

// Met à jour l'interface en fonction du rôle actuel de l'utilisateur
function mettreAJourInterfaceRole() {
    if (CONFIG.utilisateur.role === "mj") {
        document.getElementById('user-role').textContent = "Maître de Jeu";
        document.getElementById('user-role').classList.add('mj');
    } else {
        document.getElementById('user-role').textContent = "Joueur";
        document.getElementById('user-role').classList.remove('mj');
    }
}

// Change le rôle de l'utilisateur et met à jour l'interface
function changerRole(nouveauRole) {
    if (nouveauRole === CONFIG.utilisateur.role) return;
    
    CONFIG.utilisateur.role = nouveauRole;
    mettreAJourInterfaceRole();
    
    // Sauvegarder le rôle dans le stockage local
    localStorage.setItem('nexus-role', nouveauRole);
    
    // Recharger les marqueurs pour tenir compte des nouvelles permissions
    // Supprimer tous les marqueurs de la carte
    Object.values(marqueurs).forEach(m => {
        map.removeLayer(m.instance);
    });
    
    // Vider l'objet des marqueurs
    marqueurs = {};
    
    // Recharger les marqueurs
    chargerMarqueurs();
}

// Initialise la carte Leaflet avec l'image SVG
function initCarte() {
    // Créer un conteneur pour la carte
    map = L.map('map', {
        crs: L.CRS.Simple, // Utiliser un système de coordonnées simple
        minZoom: CONFIG.carte.zoom.min,
        maxZoom: CONFIG.carte.zoom.max,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        attributionControl: false // Pas besoin d'attribution pour notre carte
    });
    
    // Charger l'image SVG comme couche de base
    const cheminImage = CONFIG.carte.cheminNiveaux[CONFIG.carte.niveauActuel];
    const limites = [[0, 0], [2000, 2000]]; // Dimensions de votre SVG
    
    L.imageOverlay(cheminImage, limites).addTo(map);
    
    // Définir les limites de la vue
    map.fitBounds(limites);
    
    // Ajouter une échelle
    L.control.scale({imperial: false}).addTo(map);
    
    console.log("Carte initialisée avec succès !");
}

// Configure les écouteurs d'événements pour l'interface utilisateur
function configurerEvenements() {
    // Ouvrir/fermer le panneau latéral
    document.getElementById('btn-add-marker').addEventListener('click', function() {
        // Afficher le formulaire d'ajout de marqueur
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('location-info').classList.add('hidden');
        document.getElementById('marker-form').classList.remove('hidden');
    });
    
    document.getElementById('btn-close-sidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('hidden');
    });
    
    // Formulaire d'ajout de marqueur
    document.getElementById('new-marker-form').addEventListener('submit', function(e) {
        e.preventDefault();
        ajouterNouveauMarqueur();
    });
    
    document.querySelector('#marker-form .btn-cancel').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('hidden');
        // Supprimer le marqueur temporaire s'il existe
        if (marqueurTemporaire) {
            map.removeLayer(marqueurTemporaire);
            marqueurTemporaire = null;
            positionMarqueurTemp = null;
        }
    });
    
    // Gérer le changement de type d'interaction (pour les sous-cartes)
    const selectInteraction = document.getElementById('marker-interaction');
    if (selectInteraction) {
        selectInteraction.addEventListener('change', function() {
            const optionsSousCarte = document.querySelector('.sous-carte-options');
            if (this.value === 'sous-carte') {
                optionsSousCarte.classList.remove('hidden');
            } else {
                optionsSousCarte.classList.add('hidden');
            }
        });
    }
    
    // Gérer le changement d'option pour les connecteurs entre niveaux
    const checkboxConnecteur = document.getElementById('marker-connecteur');
    if (checkboxConnecteur) {
        checkboxConnecteur.addEventListener('change', function() {
            const optionsConnecteur = document.querySelector('.connecteur-options');
            if (this.checked) {
                optionsConnecteur.classList.remove('hidden');
            } else {
                optionsConnecteur.classList.add('hidden');
            }
        });
    }
    
    // Gérer le clic sur la carte (pour placer un marqueur)
    map.on('click', function(e) {
        if (document.getElementById('marker-form').classList.contains('hidden') === false) {
            // Si le formulaire d'ajout de marqueur est ouvert, on utilise la position du clic
            positionMarqueurTemp = e.latlng;
            
            // Visualiser l'emplacement du marqueur
            if (marqueurTemporaire) {
                marqueurTemporaire.setLatLng(e.latlng);
            } else {
                marqueurTemporaire = L.marker(e.latlng).addTo(map);
            }
        }
    });
    
    // Configuration du menu utilisateur et du changement de rôle
    document.getElementById('btn-settings').addEventListener('click', function() {
        // Afficher un dialogue simple pour changer le rôle
        const isCurrentlyMJ = CONFIG.utilisateur.role === 'mj';
        
        if (confirm(`Vous êtes actuellement en mode ${isCurrentlyMJ ? 'Maître de Jeu' : 'Joueur'}. Voulez-vous passer en mode ${isCurrentlyMJ ? 'Joueur' : 'Maître de Jeu'}?`)) {
            changerRole(isCurrentlyMJ ? 'joueur' : 'mj');
        }
    });
    
    // Initialisation du système de notes (à implémenter plus tard)
    document.getElementById('btn-notes').addEventListener('click', function() {
        alert("Le système de notes sera disponible dans une version future.");
    });
    
    // Aide et documentation
    document.getElementById('btn-help').addEventListener('click', function() {
        alert("Bienvenue sur la carte interactive de Nexus!\n\n" +
              "• Utilisez la souris pour naviguer sur la carte\n" +
              "• Cliquez sur le bouton en haut à gauche pour changer de niveau\n" +
              "• Cliquez sur les marqueurs pour voir plus d'informations\n" +
              "• Certains lieux peuvent être explorés en détail (sous-cartes)\n" +
              "• Les Maîtres de Jeu peuvent ajouter et modifier des marqueurs\n\n" +
              "Version: Phase 3 (Beta)");
    });
}

// Variable pour stocker temporairement la position d'un nouveau marqueur
let positionMarqueurTemp = null;
let marqueurTemporaire = null;

// Fonction pour ajouter un nouveau marqueur à partir du formulaire
function ajouterNouveauMarqueur() {
    // Récupérer les données du formulaire
    const nom = document.getElementById('marker-name').value;
    const type = document.getElementById('marker-type').value;
    const description = document.getElementById('marker-desc').value;
    
    if (!positionMarqueurTemp) {
        alert("Veuillez cliquer sur la carte pour choisir l'emplacement du marqueur.");
        return;
    }
    
    // Créer les données du marqueur
    const marqueurData = {
        id: 'marqueur-' + Date.now(),
        type: type,
        niveau: CONFIG.carte.niveauActuel,
        nom: nom,
        position: {
            x: positionMarqueurTemp.lng,
            y: positionMarqueurTemp.lat
        },
        visibilite: {
            mode: CONFIG.utilisateur.role === 'mj' ? 'tous' : 'specifique',
            joueurs: [CONFIG.utilisateur.id]
        },
        interaction: {
            type: 'popup', // Par défaut
            contenu: {
                description: description,
                details: ''
            }
        },
        meta: {
            createur: CONFIG.utilisateur.id,
            dateCreation: new Date().toISOString(),
            derniereModification: new Date().toISOString()
        }
    };
    
    // Récupérer le type d'interaction si disponible
    const selectInteraction = document.getElementById('marker-interaction');
    if (selectInteraction) {
        marqueurData.interaction.type = selectInteraction.value;
        
        // Si c'est une sous-carte, récupérer l'ID de la sous-carte
        if (marqueurData.interaction.type === 'sous-carte') {
            const selectSousCarte = document.getElementById('marker-sous-carte');
            if (selectSousCarte && selectSousCarte.value) {
                marqueurData.interaction.contenu.sousCarte = selectSousCarte.value;
            } else {
                alert("Veuillez sélectionner une sous-carte.");
                return;
            }
        }
    }
    
    // Vérifier si c'est un connecteur entre niveaux
    const estConnecteur = document.getElementById('marker-connecteur').checked;
    if (estConnecteur) {
        const niveauCible = parseInt(document.getElementById('connecteur-niveau').value);
        marqueurData.connecteur = {
            niveauCible: niveauCible
        };
    }
    
    // Ajouter le marqueur à la carte
    console.log("Création du marqueur:", marqueurData);
    creerMarqueur(marqueurData);
    
    // Enregistrer le marqueur dans le stockage
    sauvegarderMarqueur(marqueurData);
    
    // Réinitialiser le formulaire et fermer le panneau
    document.getElementById('new-marker-form').reset();
    document.getElementById('sidebar').classList.add('hidden');
    
    // Supprimer le marqueur temporaire
    if (marqueurTemporaire) {
        map.removeLayer(marqueurTemporaire);
        marqueurTemporaire = null;
    }
    positionMarqueurTemp = null;
}

// Fonction pour récupérer le chemin vers l'icône SVG selon le type de marqueur
function getCheminIconeSVG(type) {
    return `assets/icons/${type}.svg`;
}

// Fonction pour récupérer la couleur selon le type de marqueur (pour fallback ou personnalisation)
function getCouleurParType(type) {
    const couleurs = {
        'taverne': '#8B4513',
        'temple': '#FFD700',
        'commerce': '#32CD32',
        'residence': '#4682B4',
        'danger': '#DC143C',
        'secret': '#800080'
    };
    
    return couleurs[type] || '#3498db';
}

// Fonctions de stockage local
function sauvegarderMarqueur(marqueur) {
    // Récupérer les marqueurs existants
    let marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
    
    // S'assurer que le niveau existe
    if (!marqueursSauvegardes[marqueur.niveau]) {
        marqueursSauvegardes[marqueur.niveau] = {};
    }
    
    // Ajouter/mettre à jour le marqueur
    marqueursSauvegardes[marqueur.niveau][marqueur.id] = marqueur;
    
    // Sauvegarder
    localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueursSauvegardes));
    console.log("Marqueur sauvegardé:", marqueur.id);
}

function chargerMarqueurs() {
    try {
        // Récupérer les marqueurs sauvegardés
        const marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
        
        // Vérifier si nous sommes dans une sous-carte
        if (etatNavigation && etatNavigation.sousCarteActuelle) {
            console.log("Dans une sous-carte, pas de chargement des marqueurs de niveau");
            return;
        }
        
        // Charger les marqueurs du niveau actuel
        const marqueursNiveau = marqueursSauvegardes[CONFIG.carte.niveauActuel] || {};
        
        // Ajouter chaque marqueur à la carte
        Object.values(marqueursNiveau).forEach(m => {
            creerMarqueur(m);
        });
        
        console.log("Marqueurs chargés avec succès");
    } catch (e) {
        console.error("Erreur lors du chargement des marqueurs:", e);
    }
}