/**
 * Script principal pour la carte interactive de Nexus
 * Ce fichier gère l'initialisation de la carte et les fonctionnalités principales
 */

// Variables globales
let map; // Référence à la carte Leaflet
let marqueurs = {}; // Stockage des marqueurs par ID

// Variable pour stocker temporairement la position d'un nouveau marqueur
let positionMarqueurTemp = null;
let marqueurTemporaire = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation de l'application...");
    
    // Mettre à jour l'interface en fonction du rôle
    mettreAJourInterfaceRole();
    
    // Initialiser la carte
    initCarte();
    
    // Initialiser le sélecteur de niveaux
    initNavigationNiveaux();
    
    // Charger les marqueurs sauvegardés
    chargerMarqueurs();
    
    // Charger les types de marqueurs pour le formulaire
    chargerTypesMarqueursPourFormulaire();
    
    // Charger les sous-cartes disponibles pour le formulaire
    chargerSousCartesPourFormulaire();
    
    // Configurer les écouteurs d'événements pour l'interface
    configurerEvenements();
    
    console.log("Initialisation terminée");
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
    
    // Mettre à jour les permissions en fonction du rôle
    if (nouveauRole === 'mj') {
        CONFIG.utilisateur.permissions.voirTout = true;
        CONFIG.utilisateur.permissions.modifierCartes = true;
        CONFIG.utilisateur.permissions.creerMarqueursOfficiels = true;
    } else {
        CONFIG.utilisateur.permissions.voirTout = false;
        CONFIG.utilisateur.permissions.modifierCartes = false;
        CONFIG.utilisateur.permissions.creerMarqueursOfficiels = false;
    }
    
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
    console.log("Initialisation de la carte...");
    
    // Créer un conteneur pour la carte
    map = L.map('map', {
        crs: L.CRS.Simple, // Utiliser un système de coordonnées simple
        minZoom: CONFIG.carte.zoom.min,
        maxZoom: CONFIG.carte.zoom.max,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        attributionControl: false, // Pas besoin d'attribution pour notre carte
        preferCanvas: CONFIG.performance.optimisationZoom // Utiliser Canvas pour optimiser les performances
    });
    
    // Charger l'image SVG comme couche de base
    const cheminImage = CONFIG.carte.cheminNiveaux[CONFIG.carte.niveauActuel];
    const limites = [[0, 0], [CONFIG.carte.dimensions.hauteur, CONFIG.carte.dimensions.largeur]];
    
    L.imageOverlay(cheminImage, limites).addTo(map);
    
    // Définir les limites de la vue
    map.fitBounds(limites);
    
    // Ajouter une échelle
    L.control.scale({imperial: false}).addTo(map);
    
    // Ajouter le comportement de débogage si activé
    if (CONFIG.debug.actif && CONFIG.debug.afficherCoordonees) {
        map.on('mousemove', function(e) {
            const coord = e.latlng;
            document.getElementById('coords-debug').textContent = 
                `X: ${Math.round(coord.lng)}, Y: ${Math.round(coord.lat)}`;
        });
    }
    
    console.log("Carte initialisée avec succès !");
}

// Charge les types de marqueurs pour le formulaire d'ajout
function chargerTypesMarqueursPourFormulaire() {
    const selectType = document.getElementById('marker-type');
    if (!selectType) return;
    
    // Vider le sélecteur
    selectType.innerHTML = '';
    
    try {
        // Récupérer les types de marqueurs sauvegardés
        const typesSauvegardes = localStorage.getItem('nexus-types-marqueurs');
        if (typesSauvegardes) {
            const types = JSON.parse(typesSauvegardes);
            
            // Ajouter chaque type comme option
            Object.entries(types).forEach(([id, type]) => {
                // Ne pas ajouter les types réservés au MJ si on est joueur
                if (type.visibilite === 'mj' && !estMJ()) return;
                
                const option = document.createElement('option');
                option.value = id;
                option.textContent = type.nom;
                selectType.appendChild(option);
            });
        } else {
            // Types par défaut si aucun n'est sauvegardé
            const typesParDefaut = {
                'taverne': 'Taverne',
                'temple': 'Temple',
                'commerce': 'Commerce',
                'residence': 'Résidence',
                'danger': 'Zone de danger'
            };
            
            Object.entries(typesParDefaut).forEach(([id, nom]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nom;
                selectType.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Erreur lors du chargement des types de marqueurs:", e);
        
        // Ajouter des options par défaut en cas d'erreur
        const typesSecours = ['taverne', 'temple', 'commerce', 'residence', 'danger'];
        typesSecours.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            selectType.appendChild(option);
        });
    }
}

// Charge les sous-cartes disponibles pour le formulaire d'ajout
function chargerSousCartesPourFormulaire() {
    const selectSousCarte = document.getElementById('marker-sous-carte');
    if (!selectSousCarte) return;
    
    // Vider le sélecteur sauf l'option vide
    selectSousCarte.innerHTML = '<option value="">Sélectionnez une sous-carte</option>';
    
    try {
        // Récupérer les sous-cartes sauvegardées
        const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
        if (sousCartesSauvegardees) {
            const sousCartes = JSON.parse(sousCartesSauvegardees);
            
            // Ajouter chaque sous-carte comme option
            Object.entries(sousCartes).forEach(([id, sousCarte]) => {
                // Ne pas ajouter les sous-cartes invisibles ou non disponibles pour les joueurs
                if (!sousCarte.visible && !estMJ()) return;
                
                const option = document.createElement('option');
                option.value = id;
                option.textContent = sousCarte.nom;
                selectSousCarte.appendChild(option);
            });
        } else if (typeof SOUS_CARTES !== 'undefined') {
            // Utiliser les sous-cartes définies dans navigation.js
            Object.entries(SOUS_CARTES).forEach(([id, sousCarte]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = sousCarte.nom;
                selectSousCarte.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Erreur lors du chargement des sous-cartes:", e);
    }
}

// Charge les niveaux disponibles pour le formulaire d'ajout de connecteurs
function chargerNiveauxPourFormulaire() {
    const selectNiveau = document.getElementById('connecteur-niveau');
    if (!selectNiveau) return;
    
    // Vider le sélecteur
    selectNiveau.innerHTML = '';
    
    try {
        // Récupérer les niveaux sauvegardés
        const niveauxSauvegardes = localStorage.getItem('nexus-niveaux');
        if (niveauxSauvegardes) {
            const niveaux = JSON.parse(niveauxSauvegardes);
            
            // Ajouter chaque niveau visible comme option
            niveaux
                .filter(niveau => niveau.visible || estMJ())
                .sort((a, b) => b.ordre - a.ordre) // Trier par ordre décroissant
                .forEach(niveau => {
                    const option = document.createElement('option');
                    option.value = niveau.ordre;
                    option.textContent = niveau.nom;
                    selectNiveau.appendChild(option);
                });
        } else {
            // Niveaux par défaut
            const niveauxParDefaut = [
                { ordre: 0, nom: "Surface" },
                { ordre: -1, nom: "Souterrains" },
                { ordre: -2, nom: "Égouts" },
                { ordre: -3, nom: "Ruines anciennes" }
            ];
            
            niveauxParDefaut.forEach(niveau => {
                const option = document.createElement('option');
                option.value = niveau.ordre;
                option.textContent = niveau.nom;
                selectNiveau.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Erreur lors du chargement des niveaux:", e);
        
        // Ajouter des options par défaut en cas d'erreur
        const niveauxSecours = [
            { ordre: 0, nom: "Surface" },
            { ordre: 1, nom: "Souterrains" }
        ];
        
        niveauxSecours.forEach(niveau => {
            const option = document.createElement('option');
            option.value = niveau.ordre;
            option.textContent = niveau.nom;
            selectNiveau.appendChild(option);
        });
    }
}

// Configure les écouteurs d'événements pour l'interface utilisateur
function configurerEvenements() {
    // Ouvrir/fermer le panneau latéral
    document.getElementById('btn-add-marker').addEventListener('click', function() {
        // Vérifier si l'utilisateur peut ajouter des marqueurs
        if (!estMJ() && !CONFIG.utilisateur.permissions.creerMarqueursOfficiels) {
            // Permettre aux joueurs d'ajouter uniquement des marqueurs personnels
            alert("En tant que joueur, vous pouvez uniquement ajouter des marqueurs personnels.");
        }
        
        // Afficher le formulaire d'ajout de marqueur
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('location-info').classList.add('hidden');
        document.getElementById('marker-form').classList.remove('hidden');
        
        // Charger dynamiquement les options
        chargerSousCartesPourFormulaire();
        chargerNiveauxPourFormulaire();
    });
    
    document.getElementById('btn-close-sidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('hidden');
        
        // Supprimer le marqueur temporaire s'il existe
        if (marqueurTemporaire) {
            map.removeLayer(marqueurTemporaire);
            marqueurTemporaire = null;
            positionMarqueurTemp = null;
        }
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
                chargerSousCartesPourFormulaire();
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
                chargerNiveauxPourFormulaire();
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
        
        // Log pour le débogage
        if (CONFIG.debug.actif && CONFIG.debug.loggerEvenements) {
            console.log("Clic sur la carte:", e.latlng);
        }
    });
    
    // Configuration du menu utilisateur et du changement de rôle
    document.getElementById('btn-settings').addEventListener('click', function() {
        // Afficher un dialogue simple pour changer le rôle
        const isCurrentlyMJ = CONFIG.utilisateur.role === 'mj';
        
        if (confirm(`Vous êtes actuellement en mode ${isCurrentlyMJ ? 'Maître de Jeu' : 'Joueur'}. Voulez-vous passer en mode ${isCurrentlyMJ ? 'Joueur' : 'Maître de Jeu'}?`)) {
            changerRole(isCurrentlyMJ ? 'joueur' : 'mj');
            
            // Mettre à jour les boutons d'administration et d'export/import
            if (typeof mettreAJourBoutonAdmin === 'function') {
                mettreAJourBoutonAdmin();
            }
        }
    });
    
    // Initialisation du système de notes (à implémenter plus tard)
    document.getElementById('btn-notes').addEventListener('click', function() {
        alert("Le système de notes sera disponible dans une version future.");
    });
    
    // Aide et documentation
    document.getElementById('btn-help').addEventListener('click', function() {
        alert(`Bienvenue sur la carte interactive de Nexus!\n\n` +
              `• Utilisez la souris pour naviguer sur la carte\n` +
              `• Cliquez sur le bouton en haut à gauche pour changer de niveau\n` +
              `• Cliquez sur les marqueurs pour voir plus d'informations\n` +
              `• Certains lieux peuvent être explorés en détail (sous-cartes)\n` +
              `• Les Maîtres de Jeu peuvent ajouter et modifier des marqueurs\n\n` +
              `Version: ${CONFIG.version}`);
    });
}

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
    if (CONFIG.debug.actif && CONFIG.debug.loggerEvenements) {
        console.log("Création du marqueur:", marqueurData);
    }
    
    const nouveauMarqueur = creerMarqueur(marqueurData);
    
    if (nouveauMarqueur) {
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
    } else {
        alert("Erreur lors de la création du marqueur.");
    }
}

// Fonctions de stockage local des marqueurs
function sauvegarderMarqueur(marqueur) {
    try {
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
        
        if (CONFIG.debug.actif && CONFIG.debug.loggerEvenements) {
            console.log("Marqueur sauvegardé:", marqueur.id);
        }
        
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde du marqueur:", e);
        return false;
    }
}

// Charge les marqueurs sauvegardés dans la carte
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
        let compteur = 0;
        Object.values(marqueursNiveau).forEach(m => {
            if (creerMarqueur(m)) {
                compteur++;
            }
        });
        
        if (CONFIG.debug.actif) {
            console.log(`${compteur} marqueurs chargés avec succès pour le niveau ${CONFIG.carte.niveauActuel}`);
        }
    } catch (e) {
        console.error("Erreur lors du chargement des marqueurs:", e);
    }
}

// Fonction pour afficher une alerte temporaire
function afficherAlerte(message, type = 'info') {
    const alerteDiv = document.getElementById('alertes');
    if (!alerteDiv) {
        console.warn("Élément 'alertes' non trouvé dans le DOM");
        return;
    }
    
    const alerte = document.createElement('div');
    alerte.className = `alert alert-${type} alert-dismissible fade show`;
    alerte.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    `;
    
    alerteDiv.appendChild(alerte);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        alerte.classList.remove('show');
        setTimeout(() => {
            alerte.remove();
        }, 150);
    }, 5000);
}