/**
 * Script pour le panneau d'administration de la carte de Nexus
 * Ce fichier gère les fonctionnalités d'administration pour:
 * - Types de marqueurs
 * - Cartes et niveaux
 * - Configuration des interfaces MJ/Joueurs
 */

// Configuration globale
let CONFIG = {
    utilisateur: {
        role: 'mj',
        id: 'admin',
        nom: 'Maître de Jeu'
    },
    version: '1.0.0',
    debug: true
};

// Structure de données pour les types de marqueurs
let typesMarqueurs = {};

// Structure de données pour les niveaux et sous-cartes
let niveaux = [];
let sousCartes = {};

// Structure pour stocker les icônes SVG disponibles
let iconesSVG = {};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Définir explicitement le rôle MJ pour la page d'administration
    localStorage.setItem('nexus-role', 'mj');
    
    // Vérifier que l'utilisateur est MJ
    if (!estMJ()) {
        alert("Vous devez être Maître de Jeu pour accéder au panneau d'administration.");
        window.location.href = "index.html";
        return;
    }
    
    // Configuration de CONFIG pour cette page
    if (CONFIG && CONFIG.utilisateur) {
        CONFIG.utilisateur.role = 'mj';
    }
    
    // Vérifier si Bootstrap est disponible
    verifierBootstrap();
    
    // Charger les icônes SVG disponibles
    chargerIconesSVG().then(() => {
        // Charger les types de marqueurs après avoir chargé les icônes
        chargerTypesMarqueurs();
    });
    
    // Charger les niveaux et sous-cartes
    chargerNiveaux();
    chargerSousCartes();
    
    // Configurer les gestionnaires d'événements
    setupFormulaires();
    
    // Log d'initialisation
    console.log("Panneau d'administration initialisé");
});

// Vérifie si l'utilisateur actuel est MJ
function estMJ() {
    // Vérifier d'abord dans le localStorage (qui est plus fiable que CONFIG)
    const roleSauvegarde = localStorage.getItem('nexus-role');
    if (roleSauvegarde === 'mj') {
        return true;
    }
    
    // Sinon vérifier dans la configuration
    return CONFIG && CONFIG.utilisateur && CONFIG.utilisateur.role === "mj";
}

// Vérifier si Bootstrap est disponible
function verifierBootstrap() {
    if (typeof bootstrap === 'undefined') {
        console.error("Bootstrap n'est pas chargé. Certaines fonctionnalités peuvent ne pas fonctionner correctement.");
        afficherAlerte("Attention: Bootstrap n'est pas correctement chargé. L'interface pourrait ne pas fonctionner correctement.", "warning");
        return false;
    }
    return true;
}
// Charge la liste des icônes SVG disponibles
async function chargerIconesSVG() {
    // Définir la liste des icônes disponibles
    const listeIcones = [
        { id: 'taverne', chemin: 'assets/icons/taverne.svg', nom: 'Taverne' },
        { id: 'temple', chemin: 'assets/icons/temple.svg', nom: 'Temple' },
        { id: 'commerce', chemin: 'assets/icons/commerce.svg', nom: 'Commerce' },
        { id: 'residence', chemin: 'assets/icons/residence.svg', nom: 'Résidence' },
        { id: 'danger', chemin: 'assets/icons/danger.svg', nom: 'Danger' },
        { id: 'secret', chemin: 'assets/icons/secret.svg', nom: 'Secret' },
        { id: 'pnj', chemin: 'assets/icons/pnj.svg', nom: 'PNJ' },
        { id: 'quete', chemin: 'assets/icons/quete.svg', nom: 'Quête' },
        { id: 'tresor', chemin: 'assets/icons/tresor.svg', nom: 'Trésor' }
        // Vous pouvez ajouter d'autres icônes ici
    ];
    
    // Stocker les icônes dans l'objet
    listeIcones.forEach(icone => {
        iconesSVG[icone.id] = {
            nom: icone.nom,
            chemin: icone.chemin
        };
    });
    
    // Remplir la grille de sélection d'icônes
    const grille = document.getElementById('icone-grid');
    if (grille) {
        grille.innerHTML = '';
        
        listeIcones.forEach(icone => {
            const item = document.createElement('div');
            item.className = 'icone-svg-item';
            item.dataset.id = icone.id;
            
            item.innerHTML = `
                <div class="icone-svg-preview">
                    <img src="${icone.chemin}" alt="${icone.nom}">
                </div>
                <div class="icone-svg-nom">${icone.nom}</div>
            `;
            
            // Gérer le clic sur une icône
            item.addEventListener('click', function() {
                // Retirer la classe selected de tous les items
                document.querySelectorAll('.icone-svg-item').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Ajouter la classe selected à l'item cliqué
                this.classList.add('selected');
                
                // Mettre à jour la valeur cachée
                document.getElementById('type-icone').value = this.dataset.id;
                
                // Mettre à jour l'aperçu
                document.getElementById('icone-preview').innerHTML = `<img src="${icone.chemin}" alt="${icone.nom}" style="width:100%;height:100%;">`;
                document.getElementById('icone-nom-preview').textContent = icone.nom;
            });
            
            grille.appendChild(item);
        });
    }
    
    console.log("Icônes SVG chargées:", Object.keys(iconesSVG).length);
    return true;
}

// Affiche une alerte dans l'interface
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

// Fonctions auxiliaires pour l'affichage
function traduireInteraction(interaction) {
    const traductions = {
        'popup': 'Popup',
        'sous-carte': 'Sous-carte',
        'statique': 'Statique',
        'evenement': 'Événement'
    };
    return traductions[interaction] || interaction;
}

function traduireVisibilite(visibilite) {
    const traductions = {
        'tous': 'Visible par tous',
        'mj': 'MJ uniquement',
        'specifique': 'Joueurs spécifiques',
        'conditionnel': 'Selon condition'
    };
    return traductions[visibilite] || visibilite;
}

function badgeClasseParVisibilite(visibilite) {
    const classes = {
        'tous': 'bg-success',
        'mj': 'bg-danger',
        'specifique': 'bg-warning',
        'conditionnel': 'bg-info'
    };
    return classes[visibilite] || 'bg-secondary';
}
// ========== GESTION DES TYPES DE MARQUEURS ==========

// Charge les types de marqueurs depuis le stockage local
function chargerTypesMarqueurs() {
    try {
        const typesSauvegardes = localStorage.getItem('nexus-types-marqueurs');
        if (typesSauvegardes) {
            typesMarqueurs = JSON.parse(typesSauvegardes);
        } else {
            // Charger les types par défaut si aucun n'est enregistré
            typesMarqueurs = {
                'taverne': {
                    nom: 'Taverne',
                    couleur: '#8B4513',
                    icone: 'taverne',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'temple': {
                    nom: 'Temple',
                    couleur: '#FFD700',
                    icone: 'temple',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'commerce': {
                    nom: 'Commerce',
                    couleur: '#32CD32',
                    icone: 'commerce',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'residence': {
                    nom: 'Résidence',
                    couleur: '#4682B4',
                    icone: 'residence',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'danger': {
                    nom: 'Zone de danger',
                    couleur: '#DC143C',
                    icone: 'danger',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'secret': {
                    nom: 'Lieu secret',
                    couleur: '#800080',
                    icone: 'secret',
                    interaction: 'popup',
                    visibilite: 'mj'
                }
            };
            sauvegarderTypesMarqueurs();
        }
        
        // Afficher les types dans l'interface
        afficherTypesMarqueurs();
    } catch (e) {
        console.error("Erreur lors du chargement des types de marqueurs:", e);
        afficherAlerte("Erreur lors du chargement des types de marqueurs", "danger");
    }
}

// Sauvegarde les types de marqueurs dans le stockage local
function sauvegarderTypesMarqueurs() {
    try {
        localStorage.setItem('nexus-types-marqueurs', JSON.stringify(typesMarqueurs));
        console.log("Types de marqueurs sauvegardés avec succès");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des types de marqueurs:", e);
        afficherAlerte("Erreur lors de la sauvegarde des types de marqueurs", "danger");
    }
}

// Affiche les types de marqueurs dans la table
function afficherTypesMarqueurs() {
    const conteneur = document.getElementById('liste-types-marqueurs');
    if (!conteneur) {
        console.warn("Élément 'liste-types-marqueurs' non trouvé dans le DOM");
        return;
    }
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Ajouter chaque type au tableau
    Object.entries(typesMarqueurs).forEach(([id, type]) => {
        const ligne = document.createElement('tr');
        
        // Construire le chemin de l'icône
        const cheminIcone = type.icone ? `assets/icons/${type.icone}.svg` : '';
        
        ligne.innerHTML = `
            <td>
                <div class="marqueur-apercu" style="background-color: ${type.couleur}">
                    <img src="${cheminIcone}" alt="${type.nom}" style="width:20px;height:20px;">
                </div>
            </td>
            <td>${type.nom}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div style="width: 24px; height: 24px; background-color: ${type.couleur}; border-radius: 4px; margin-right: 10px;"></div>
                    ${type.couleur}
                </div>
            </td>
            <td><img src="${cheminIcone}" alt="${type.icone}" style="width:20px;height:20px;"> ${type.icone || 'Aucune'}</td>
            <td>${traduireInteraction(type.interaction)}</td>
            <td>
                <span class="badge ${badgeClasseParVisibilite(type.visibilite)}">
                    ${traduireVisibilite(type.visibilite)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 btn-edit-type" data-id="${id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-type" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        conteneur.appendChild(ligne);
    });
    
    // Ajouter les gestionnaires d'événements pour les boutons d'édition et de suppression
    setupBoutonsTypesMarqueurs();
}

// Configure les boutons d'action pour les types de marqueurs
function setupBoutonsTypesMarqueurs() {
    // Boutons d'édition
    document.querySelectorAll('.btn-edit-type').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            ouvrirModalEditionType(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-type').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm(`Êtes-vous sûr de vouloir supprimer le type "${typesMarqueurs[id].nom}" ?`)) {
                supprimerTypeMarqueur(id);
            }
        });
    });
}

// Ouvre le modal d'édition pour un type de marqueur
function ouvrirModalEditionType(id) {
    const type = typesMarqueurs[id];
    if (!type) return;
    
    // Remplir le formulaire avec les données du type
    document.getElementById('type-edit-id').value = id;
    document.getElementById('type-nom').value = type.nom;
    document.getElementById('type-identifiant').value = id;
    // Rendre l'identifiant en lecture seule en mode édition
    document.getElementById('type-identifiant').setAttribute('readonly', 'readonly');
    document.getElementById('type-couleur').value = type.couleur;
    document.getElementById('type-icone').value = type.icone || '';
    document.getElementById('type-interaction').value = type.interaction || 'popup';
    document.getElementById('type-visibilite').value = type.visibilite || 'tous';
    
    // Mettre à jour l'aperçu de l'icône SVG
    if (type.icone) {
        const cheminIcone = `assets/icons/${type.icone}.svg`;
        document.getElementById('icone-preview').innerHTML = `<img src="${cheminIcone}" alt="${type.icone}" style="width:100%;height:100%;">`;
        document.getElementById('icone-nom-preview').textContent = type.icone;
        
        // Sélectionner l'icône dans la grille
        document.querySelectorAll('.icone-svg-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.id === type.icone) {
                item.classList.add('selected');
            }
        });
    } else {
        document.getElementById('icone-preview').innerHTML = '';
        document.getElementById('icone-nom-preview').textContent = 'Aucune';
    }
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-type').classList.remove('d-none');
    
    // Titre du modal
    document.getElementById('modalTypeMarqueurTitre').textContent = "Modifier un type de marqueur";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauType'));
    modal.show();
}

// Ouvre le modal pour créer un nouveau type
function ouvrirModalNouveauType() {
    // Réinitialiser le formulaire
    document.getElementById('form-type-marqueur').reset();
    document.getElementById('type-edit-id').value = 'nouveau';
    document.getElementById('type-identifiant').removeAttribute('readonly');
    
    // Cacher le bouton de suppression
    document.getElementById('btn-supprimer-type').classList.add('d-none');
    
    // Réinitialiser l'aperçu de l'icône
    document.getElementById('icone-preview').innerHTML = '';
    document.getElementById('icone-nom-preview').textContent = 'Aucune';
    
    // Désélectionner toutes les icônes
    document.querySelectorAll('.icone-svg-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Titre du modal
    document.getElementById('modalTypeMarqueurTitre').textContent = "Ajouter un nouveau type de marqueur";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauType'));
    modal.show();
}

// Supprime un type de marqueur
function supprimerTypeMarqueur(id) {
    if (!typesMarqueurs[id]) return;
    
    const nom = typesMarqueurs[id].nom;
    
    try {
        // Supprimer le type
        delete typesMarqueurs[id];
        
        // Sauvegarder et rafraîchir l'affichage
        sauvegarderTypesMarqueurs();
        afficherTypesMarqueurs();
        
        afficherAlerte(`Type de marqueur "${nom}" supprimé avec succès`, "success");
    } catch (e) {
        console.error("Erreur lors de la suppression du type de marqueur:", e);
        afficherAlerte(`Erreur lors de la suppression du type "${nom}"`, "danger");
    }
}

// Fonction pour sauvegarder un type de marqueur (nouveau ou édition)
function sauvegarderTypeMarqueur() {
    const id = document.getElementById('type-edit-id').value;
    const isNew = id === 'nouveau';
    
    // Récupérer les valeurs du formulaire
    const identifiant = document.getElementById('type-identifiant').value.trim();
    const nom = document.getElementById('type-nom').value.trim();
    const couleur = document.getElementById('type-couleur').value;
    const icone = document.getElementById('type-icone').value;
    const interaction = document.getElementById('type-interaction').value;
    const visibilite = document.getElementById('type-visibilite').value;
    
    // Validation
    if (!nom || !identifiant) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "danger");
        return false;
    }
    
    // Si c'est un nouveau type, vérifier que l'identifiant n'existe pas déjà
    if (isNew && typesMarqueurs[identifiant]) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    try {
        // Créer/modifier le type
        typesMarqueurs[identifiant] = {
            nom: nom,
            couleur: couleur,
            icone: icone,
            interaction: interaction,
            visibilite: visibilite
        };
        
        // Si c'est une édition et que l'identifiant a changé, supprimer l'ancien
        if (!isNew && identifiant !== id) {
            delete typesMarqueurs[id];
        }
        
        // Sauvegarder et rafraîchir l'affichage
        sauvegarderTypesMarqueurs();
        afficherTypesMarqueurs();
        
        // Fermer le modal
        bootstrap.Modal.getInstance(document.getElementById('modalNouveauType')).hide();
        
        afficherAlerte(`Type de marqueur "${nom}" ${isNew ? 'créé' : 'modifié'} avec succès`, "success");
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde du type de marqueur:", e);
        afficherAlerte("Erreur lors de la sauvegarde du type de marqueur", "danger");
        return false;
    }
}
// ========== GESTION DES NIVEAUX ==========

// Charge les niveaux depuis le stockage local
function chargerNiveaux() {
    try {
        const niveauxSauvegardes = localStorage.getItem('nexus-niveaux');
        if (niveauxSauvegardes) {
            niveaux = JSON.parse(niveauxSauvegardes);
        } else {
            // Charger les niveaux par défaut
            niveaux = [
                {
                    id: 'surface',
                    nom: 'Surface',
                    ordre: 0,
                    fichier: 'nexus-niveau-0.svg',
                    visible: true
                },
                {
                    id: 'souterrain-1',
                    nom: 'Premier sous-sol',
                    ordre: -1,
                    fichier: 'nexus-niveau--1.svg',
                    visible: true
                },
                {
                    id: 'egouts',
                    nom: 'Égouts',
                    ordre: -2,
                    fichier: 'nexus-niveau--2.svg',
                    visible: true
                },
                {
                    id: 'ruines',
                    nom: 'Ruines',
                    ordre: -3,
                    fichier: 'nexus-niveau--3.svg',
                    visible: true
                }
            ];
            sauvegarderNiveaux();
        }
        
        // Afficher les niveaux dans l'interface
        afficherNiveaux();
    } catch (e) {
        console.error("Erreur lors du chargement des niveaux:", e);
        afficherAlerte("Erreur lors du chargement des niveaux", "danger");
    }
}

// Sauvegarde les niveaux dans le stockage local
function sauvegarderNiveaux() {
    try {
        localStorage.setItem('nexus-niveaux', JSON.stringify(niveaux));
        console.log("Niveaux sauvegardés avec succès");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des niveaux:", e);
        afficherAlerte("Erreur lors de la sauvegarde des niveaux", "danger");
    }
}

// Fonction pour afficher les niveaux dans l'interface
function afficherNiveaux() {
    const conteneur = document.getElementById('liste-niveaux');
    if (!conteneur) {
        console.warn("Élément 'liste-niveaux' non trouvé dans le DOM");
        return;
    }
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Trier les niveaux par ordre
    const niveauxTries = [...niveaux].sort((a, b) => b.ordre - a.ordre);
    
    // Ajouter chaque niveau au tableau
    niveauxTries.forEach(niveau => {
        const ligne = document.createElement('tr');
        ligne.innerHTML = `
            <td>${niveau.nom}</td>
            <td>${niveau.ordre}</td>
            <td>${niveau.fichier}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="visible-${niveau.id}" 
                        ${niveau.visible ? 'checked' : ''} data-id="${niveau.id}">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 btn-edit-niveau" data-id="${niveau.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-niveau" data-id="${niveau.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        conteneur.appendChild(ligne);
    });
    
    // Ajouter les gestionnaires d'événements
    setupBoutonsNiveaux();
}

// Configure les boutons d'action pour les niveaux
function setupBoutonsNiveaux() {
    // Boutons d'édition
    document.querySelectorAll('.btn-edit-niveau').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            ouvrirModalEditionNiveau(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-niveau').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const niveau = niveaux.find(n => n.id === id);
            if (niveau && confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${niveau.nom}" ?`)) {
                supprimerNiveau(id);
            }
        });
    });
    
    // Interrupteurs de visibilité
    document.querySelectorAll('input[id^="visible-"]').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.getAttribute('data-id');
            toggleVisibiliteNiveau(id, this.checked);
        });
    });
}

// Ouvre le modal d'édition pour un niveau
function ouvrirModalEditionNiveau(id) {
    const niveau = niveaux.find(n => n.id === id);
    if (!niveau) return;
    
    // Remplir le formulaire avec les données du niveau
    document.getElementById('niveau-edit-id').value = id;
    document.getElementById('niveau-nom').value = niveau.nom;
    document.getElementById('niveau-identifiant').value = id;
    document.getElementById('niveau-identifiant').setAttribute('readonly', 'readonly');
    document.getElementById('niveau-ordre').value = niveau.ordre;
    document.getElementById('niveau-fichier').value = niveau.fichier;
    document.getElementById('niveau-visible').checked = niveau.visible;
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-niveau').classList.remove('d-none');
    
    // Titre du modal
    document.getElementById('modalNiveauTitre').textContent = "Modifier un niveau";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauNiveau'));
    modal.show();
}

// Ouvre le modal pour créer un nouveau niveau
function ouvrirModalNouveauNiveau() {
    // Réinitialiser le formulaire
    document.getElementById('form-niveau').reset();
    document.getElementById('niveau-edit-id').value = 'nouveau';
    document.getElementById('niveau-identifiant').removeAttribute('readonly');
    
    // Suggérer un ordre basé sur les niveaux existants
    let ordreMin = 0;
    if (niveaux.length > 0) {
        ordreMin = Math.min(...niveaux.map(n => n.ordre)) - 1;
    }
    document.getElementById('niveau-ordre').value = ordreMin;
    
    // Cacher le bouton de suppression
    document.getElementById('btn-supprimer-niveau').classList.add('d-none');
    
    // Titre du modal
    document.getElementById('modalNiveauTitre').textContent = "Ajouter un nouveau niveau";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauNiveau'));
    modal.show();
}

// Bascule la visibilité d'un niveau
function toggleVisibiliteNiveau(id, estVisible) {
    const index = niveaux.findIndex(n => n.id === id);
    if (index !== -1) {
        niveaux[index].visible = estVisible;
        sauvegarderNiveaux();
        
        const message = estVisible 
            ? `Niveau "${niveaux[index].nom}" rendu visible` 
            : `Niveau "${niveaux[index].nom}" masqué`;
        afficherAlerte(message, "info");
    }
}

// Supprime un niveau
function supprimerNiveau(id) {
    const index = niveaux.findIndex(n => n.id === id);
    if (index === -1) return;
    
    const nom = niveaux[index].nom;
    
    try {
        // Vérifier si des sous-cartes sont attachées à ce niveau
        const sousCartesLiees = Object.values(sousCartes).filter(sc => sc.parent === id);
        if (sousCartesLiees.length > 0) {
            if (!confirm(`Ce niveau contient ${sousCartesLiees.length} sous-carte(s). Voulez-vous toutes les supprimer ?`)) {
                return;
            }
            
            // Supprimer les sous-cartes liées
            sousCartesLiees.forEach(sc => {
                const scId = Object.keys(sousCartes).find(key => sousCartes[key] === sc);
                if (scId) {
                    delete sousCartes[scId];
                }
            });
            sauvegarderSousCartes();
        }
        
        // Supprimer le niveau
        niveaux.splice(index, 1);
        sauvegarderNiveaux();
        afficherNiveaux();
        
        afficherAlerte(`Niveau "${nom}" supprimé avec succès`, "success");
    } catch (e) {
        console.error("Erreur lors de la suppression du niveau:", e);
        afficherAlerte(`Erreur lors de la suppression du niveau "${nom}"`, "danger");
    }
}

// Fonction pour sauvegarder un niveau (nouveau ou édition)
function sauvegarderNiveau() {
    const id = document.getElementById('niveau-edit-id').value;
    const isNew = id === 'nouveau';
    
    // Récupérer les valeurs du formulaire
    const identifiant = document.getElementById('niveau-identifiant').value.trim();
    const nom = document.getElementById('niveau-nom').value.trim();
    const ordre = parseInt(document.getElementById('niveau-ordre').value);
    const fichier = document.getElementById('niveau-fichier').value.trim();
    const visible = document.getElementById('niveau-visible').checked;
    
    // Validation
    if (!nom || !identifiant || !fichier) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "danger");
        return false;
    }
    
    // Si c'est un nouveau niveau, vérifier que l'identifiant n'existe pas déjà
    if (isNew && niveaux.some(n => n.id === identifiant)) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    try {
        if (isNew) {
            // Ajouter le nouveau niveau
            niveaux.push({
                id: identifiant,
                nom: nom,
                ordre: ordre,
                fichier: fichier,
                visible: visible
            });
        } else {
            // Modifier le niveau existant
            const index = niveaux.findIndex(n => n.id === id);
            if (index !== -1) {
                niveaux[index] = {
                    id: identifiant, // normalement inchangé en édition
                    nom: nom,
                    ordre: ordre,
                    fichier: fichier,
                    visible: visible
                };
            }
        }
        
        // Sauvegarder et rafraîchir l'affichage
        sauvegarderNiveaux();
        afficherNiveaux();
        
        // Fermer le modal
        bootstrap.Modal.getInstance(document.getElementById('modalNouveauNiveau')).hide();
        
        afficherAlerte(`Niveau "${nom}" ${isNew ? 'créé' : 'modifié'} avec succès`, "success");
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde du niveau:", e);
        afficherAlerte("Erreur lors de la sauvegarde du niveau", "danger");
        return false;
    }
}
// ========== GESTION DES SOUS-CARTES ==========

// Charge les sous-cartes depuis le stockage local
function chargerSousCartes() {
    try {
        const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
        if (sousCartesSauvegardees) {
            sousCartes = JSON.parse(sousCartesSauvegardees);
        } else {
            // Charger des sous-cartes par défaut
            sousCartes = {
                'taverne-dragon': {
                    nom: 'Taverne du Dragon Ivre',
                    fichier: 'taverne-dragon.svg',
                    parent: 'surface',
                    visible: true
                },
                'temple-lune': {
                    nom: 'Temple de la Lune',
                    fichier: 'temple-lune.svg',
                    parent: 'surface',
                    visible: true
                }
            };
            sauvegarderSousCartes();
        }
        
        // Afficher les sous-cartes dans l'interface
        afficherSousCartes();
    } catch (e) {
        console.error("Erreur lors du chargement des sous-cartes:", e);
        afficherAlerte("Erreur lors du chargement des sous-cartes", "danger");
    }
}

// Sauvegarde les sous-cartes dans le stockage local
function sauvegarderSousCartes() {
    try {
        localStorage.setItem('nexus-sous-cartes', JSON.stringify(sousCartes));
        console.log("Sous-cartes sauvegardées avec succès");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des sous-cartes:", e);
        afficherAlerte("Erreur lors de la sauvegarde des sous-cartes", "danger");
    }
}

// Fonction pour afficher les sous-cartes dans l'interface
function afficherSousCartes() {
    const conteneur = document.getElementById('liste-sous-cartes');
    if (!conteneur) {
        console.warn("Élément 'liste-sous-cartes' non trouvé dans le DOM");
        return;
    }
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Ajouter chaque sous-carte au tableau
    Object.entries(sousCartes).forEach(([id, sousCarte]) => {
        const ligne = document.createElement('tr');
        ligne.innerHTML = `
            <td>${sousCarte.nom}</td>
            <td>${sousCarte.fichier}</td>
            <td>${getNomNiveau(sousCarte.parent)}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="visible-sc-${id}" 
                        ${sousCarte.visible ? 'checked' : ''} data-id="${id}">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 btn-edit-sous-carte" data-id="${id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-sous-carte" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        conteneur.appendChild(ligne);
    });
    
    // Ajouter les gestionnaires d'événements
    setupBoutonsSousCartes();
}

// Récupère le nom d'un niveau à partir de son ID
function getNomNiveau(id) {
    const niveau = niveaux.find(n => n.id === id);
    return niveau ? niveau.nom : 'Inconnu';
}

// Configure les boutons d'action pour les sous-cartes
function setupBoutonsSousCartes() {
    // Boutons d'édition
    document.querySelectorAll('.btn-edit-sous-carte').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            ouvrirModalEditionSousCarte(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-sous-carte').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm(`Êtes-vous sûr de vouloir supprimer la sous-carte "${sousCartes[id].nom}" ?`)) {
                supprimerSousCarte(id);
            }
        });
    });
    
    // Interrupteurs de visibilité
    document.querySelectorAll('input[id^="visible-sc-"]').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.getAttribute('data-id');
            toggleVisibiliteSousCarte(id, this.checked);
        });
    });
}

// Ouvre le modal d'édition pour une sous-carte
function ouvrirModalEditionSousCarte(id) {
    const sousCarte = sousCartes[id];
    if (!sousCarte) return;
    
    // Remplir le formulaire avec les données de la sous-carte
    document.getElementById('sous-carte-edit-id').value = id;
    document.getElementById('sous-carte-nom').value = sousCarte.nom;
    document.getElementById('sous-carte-identifiant').value = id;
    document.getElementById('sous-carte-identifiant').setAttribute('readonly', 'readonly');
    document.getElementById('sous-carte-fichier').value = sousCarte.fichier;
    document.getElementById('sous-carte-parent').value = sousCarte.parent;
    document.getElementById('sous-carte-visible').checked = sousCarte.visible;
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-sous-carte').classList.remove('d-none');
    
    // Titre du modal
    document.getElementById('modalSousCarteTitre').textContent = "Modifier une sous-carte";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouvelleSousCarte'));
    modal.show();
}

// Ouvre le modal pour créer une nouvelle sous-carte
function ouvrirModalNouvelleSousCarte() {
    // Réinitialiser le formulaire
    document.getElementById('form-sous-carte').reset();
    document.getElementById('sous-carte-edit-id').value = 'nouveau';
    document.getElementById('sous-carte-identifiant').removeAttribute('readonly');
    
    // Pré-remplir avec le premier niveau disponible
    if (niveaux.length > 0) {
        document.getElementById('sous-carte-parent').value = niveaux[0].id;
    }
    
    // Cacher le bouton de suppression
    document.getElementById('btn-supprimer-sous-carte').classList.add('d-none');
    
    // Titre du modal
    document.getElementById('modalSousCarteTitre').textContent = "Ajouter une nouvelle sous-carte";
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouvelleSousCarte'));
    modal.show();
}

// Bascule la visibilité d'une sous-carte
function toggleVisibiliteSousCarte(id, estVisible) {
    if (sousCartes[id]) {
        sousCartes[id].visible = estVisible;
        sauvegarderSousCartes();
        
        const message = estVisible 
            ? `Sous-carte "${sousCartes[id].nom}" rendue visible` 
            : `Sous-carte "${sousCartes[id].nom}" masquée`;
        afficherAlerte(message, "info");
    }
}

// Supprime une sous-carte
function supprimerSousCarte(id) {
    if (!sousCartes[id]) return;
    
    const nom = sousCartes[id].nom;
    
    try {
        // Supprimer la sous-carte
        delete sousCartes[id];
        
        // Sauvegarder et rafraîchir l'affichage
        sauvegarderSousCartes();
        afficherSousCartes();
        
        afficherAlerte(`Sous-carte "${nom}" supprimée avec succès`, "success");
    } catch (e) {
        console.error("Erreur lors de la suppression de la sous-carte:", e);
        afficherAlerte(`Erreur lors de la suppression de la sous-carte "${nom}"`, "danger");
    }
}

// Fonction pour sauvegarder une sous-carte (nouvelle ou édition)
function sauvegarderSousCarte() {
    const id = document.getElementById('sous-carte-edit-id').value;
    const isNew = id === 'nouveau';
    
    // Récupérer les valeurs du formulaire
    const identifiant = document.getElementById('sous-carte-identifiant').value.trim();
    const nom = document.getElementById('sous-carte-nom').value.trim();
    const fichier = document.getElementById('sous-carte-fichier').value.trim();
    const parent = document.getElementById('sous-carte-parent').value;
    const visible = document.getElementById('sous-carte-visible').checked;
    
    // Validation
    if (!nom || !identifiant || !fichier || !parent) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "danger");
        return false;
    }
    
    // Si c'est une nouvelle sous-carte, vérifier que l'identifiant n'existe pas déjà
    if (isNew && sousCartes[identifiant]) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    try {
        // Créer/modifier la sous-carte
        sousCartes[identifiant] = {
            nom: nom,
            fichier: fichier,
            parent: parent,
            visible: visible
        };
        
        // Si c'est une édition et que l'identifiant a changé, supprimer l'ancien
        if (!isNew && identifiant !== id) {
            delete sousCartes[id];
        }
        
        // Sauvegarder et rafraîchir l'affichage
        sauvegarderSousCartes();
        afficherSousCartes();
        
        // Fermer le modal
        bootstrap.Modal.getInstance(document.getElementById('modalNouvelleSousCarte')).hide();
        
        afficherAlerte(`Sous-carte "${nom}" ${isNew ? 'créée' : 'modifiée'} avec succès`, "success");
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde de la sous-carte:", e);
        afficherAlerte("Erreur lors de la sauvegarde de la sous-carte", "danger");
        return false;
    }
}
// ========== CONFIGURATION DES FORMULAIRES ==========

// Configurer les formulaires et leurs gestionnaires d'événements
function setupFormulaires() {
    // === Formulaire de type de marqueur ===
    const formTypeMarqueur = document.getElementById('form-type-marqueur');
    if (formTypeMarqueur) {
        formTypeMarqueur.addEventListener('submit', function(e) {
            e.preventDefault();
            sauvegarderTypeMarqueur();
        });
    }
    
    // Bouton pour ouvrir le formulaire de nouveau type
    const btnNouveauType = document.getElementById('btn-nouveau-type');
    if (btnNouveauType) {
        btnNouveauType.addEventListener('click', function() {
            ouvrirModalNouveauType();
        });
    }
    
    // Bouton pour supprimer un type
    const btnSupprimerType = document.getElementById('btn-supprimer-type');
    if (btnSupprimerType) {
        btnSupprimerType.addEventListener('click', function() {
            const id = document.getElementById('type-edit-id').value;
            if (id && id !== 'nouveau' && confirm(`Êtes-vous sûr de vouloir supprimer ce type de marqueur ?`)) {
                supprimerTypeMarqueur(id);
                bootstrap.Modal.getInstance(document.getElementById('modalNouveauType')).hide();
            }
        });
    }
    
    // === Formulaire de niveau ===
    const formNiveau = document.getElementById('form-niveau');
    if (formNiveau) {
        formNiveau.addEventListener('submit', function(e) {
            e.preventDefault();
            sauvegarderNiveau();
        });
    }
    
    // Bouton pour ouvrir le formulaire de nouveau niveau
    const btnNouveauNiveau = document.getElementById('btn-nouveau-niveau');
    if (btnNouveauNiveau) {
        btnNouveauNiveau.addEventListener('click', function() {
            ouvrirModalNouveauNiveau();
        });
    }
    
    // Bouton pour supprimer un niveau
    const btnSupprimerNiveau = document.getElementById('btn-supprimer-niveau');
    if (btnSupprimerNiveau) {
        btnSupprimerNiveau.addEventListener('click', function() {
            const id = document.getElementById('niveau-edit-id').value;
            if (id && id !== 'nouveau' && confirm(`Êtes-vous sûr de vouloir supprimer ce niveau ?`)) {
                supprimerNiveau(id);
                bootstrap.Modal.getInstance(document.getElementById('modalNouveauNiveau')).hide();
            }
        });
    }
    
    // === Formulaire de sous-carte ===
    const formSousCarte = document.getElementById('form-sous-carte');
    if (formSousCarte) {
        formSousCarte.addEventListener('submit', function(e) {
            e.preventDefault();
            sauvegarderSousCarte();
        });
    }
    
    // Bouton pour ouvrir le formulaire de nouvelle sous-carte
    const btnNouvelleSousCarte = document.getElementById('btn-nouvelle-sous-carte');
    if (btnNouvelleSousCarte) {
        btnNouvelleSousCarte.addEventListener('click', function() {
            ouvrirModalNouvelleSousCarte();
        });
    }
    
    // Bouton pour supprimer une sous-carte
    const btnSupprimerSousCarte = document.getElementById('btn-supprimer-sous-carte');
    if (btnSupprimerSousCarte) {
        btnSupprimerSousCarte.addEventListener('click', function() {
            const id = document.getElementById('sous-carte-edit-id').value;
            if (id && id !== 'nouveau' && confirm(`Êtes-vous sûr de vouloir supprimer cette sous-carte ?`)) {
                supprimerSousCarte(id);
                bootstrap.Modal.getInstance(document.getElementById('modalNouvelleSousCarte')).hide();
            }
        });
    }
    
    // === Remplir les sélecteurs de niveaux parents ===
    // Pour le formulaire de sous-carte
    const selectParent = document.getElementById('sous-carte-parent');
    if (selectParent) {
        // Vider d'abord le sélecteur
        selectParent.innerHTML = '';
        
        // Ajouter une option pour chaque niveau
        niveaux.forEach(niveau => {
            const option = document.createElement('option');
            option.value = niveau.id;
            option.textContent = niveau.nom;
            selectParent.appendChild(option);
        });
    }
    
    // === Boutons d'export/import ===
    setupBoutonsExportImport();
}

// ========== EXPORT/IMPORT DES CONFIGURATIONS ==========

// Configure les boutons d'export/import
function setupBoutonsExportImport() {
    // Bouton d'export de tous les paramètres
    const btnExportTout = document.getElementById('btn-export-tout');
    if (btnExportTout) {
        btnExportTout.addEventListener('click', function() {
            exporterConfiguration();
        });
    }
    
    // Bouton d'import
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
        btnImport.addEventListener('click', function() {
            // Déclencher le clic sur l'input de fichier
            document.getElementById('import-fichier').click();
        });
    }
    
    // Input de fichier pour l'import
    const inputImport = document.getElementById('import-fichier');
    if (inputImport) {
        inputImport.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                importerConfiguration(file);
            }
        });
    }
}

// Exporte la configuration complète
function exporterConfiguration() {
    try {
        // Préparer les données à exporter
        const configuration = {
            version: CONFIG.version,
            date: new Date().toISOString(),
            typesMarqueurs: typesMarqueurs,
            niveaux: niveaux,
            sousCartes: sousCartes
        };
        
        // Convertir en JSON
        const jsonConfig = JSON.stringify(configuration, null, 2);
        
        // Créer un blob et un lien de téléchargement
        const blob = new Blob([jsonConfig], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus-config-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        afficherAlerte("Configuration exportée avec succès", "success");
    } catch (e) {
        console.error("Erreur lors de l'export de la configuration:", e);
        afficherAlerte("Erreur lors de l'export de la configuration", "danger");
    }
}

// Importe une configuration depuis un fichier
function importerConfiguration(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            // Vérifier la validité de la configuration
            if (!config.typesMarqueurs || !config.niveaux || !config.sousCartes) {
                throw new Error("Format de configuration invalide");
            }
            
            // Demander confirmation
            if (confirm("Cette action remplacera toute votre configuration actuelle. Êtes-vous sûr de vouloir continuer ?")) {
                // Appliquer la configuration
                typesMarqueurs = config.typesMarqueurs;
                niveaux = config.niveaux;
                sousCartes = config.sousCartes;
                
                // Sauvegarder les données
                sauvegarderTypesMarqueurs();
                sauvegarderNiveaux();
                sauvegarderSousCartes();
                
                // Rafraîchir l'interface
                afficherTypesMarqueurs();
                afficherNiveaux();
                afficherSousCartes();
                
                afficherAlerte("Configuration importée avec succès", "success");
            }
        } catch (e) {
            console.error("Erreur lors de l'import de la configuration:", e);
            afficherAlerte("Erreur lors de l'import de la configuration: " + e.message, "danger");
        }
    };
    
    reader.onerror = function() {
        afficherAlerte("Erreur lors de la lecture du fichier", "danger");
    };
    
    reader.readAsText(file);
}
// ========== FONCTIONS UTILITAIRES ==========

// Génère un ID unique
function genererID(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Formatte une date pour l'affichage
function formatterDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    return d.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Tronque un texte à une longueur maximale
function tronquerTexte(texte, longueurMax = 50) {
    if (!texte || texte.length <= longueurMax) return texte;
    return texte.substring(0, longueurMax) + '...';
}

// Vérifie si un élément est visible dans la fenêtre
function estElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ========== GESTION DE L'ÉTAT ET DES SESSIONS ==========

// Sauvegarde l'état courant de l'interface
function sauvegarderEtatInterface() {
    try {
        const etat = {
            ongletActif: document.querySelector('.nav-link.active')?.id || 'tab-types',
            filtres: {
                typesMarqueurs: document.getElementById('filtre-types')?.value || '',
                niveaux: document.getElementById('filtre-niveaux')?.value || '',
                sousCartes: document.getElementById('filtre-sous-cartes')?.value || ''
            }
        };
        
        localStorage.setItem('nexus-admin-etat', JSON.stringify(etat));
    } catch (e) {
        console.error("Erreur lors de la sauvegarde de l'état de l'interface:", e);
    }
}

// Restaure l'état de l'interface
function restaurerEtatInterface() {
    try {
        const etatSauvegarde = localStorage.getItem('nexus-admin-etat');
        if (!etatSauvegarde) return;
        
        const etat = JSON.parse(etatSauvegarde);
        
        // Activer l'onglet sauvegardé
        if (etat.ongletActif) {
            const onglet = document.getElementById(etat.ongletActif);
            if (onglet) {
                const tabElem = new bootstrap.Tab(onglet);
                tabElem.show();
            }
        }
        
        // Restaurer les filtres
        if (etat.filtres) {
            if (etat.filtres.typesMarqueurs) {
                const filtre = document.getElementById('filtre-types');
                if (filtre) filtre.value = etat.filtres.typesMarqueurs;
            }
            if (etat.filtres.niveaux) {
                const filtre = document.getElementById('filtre-niveaux');
                if (filtre) filtre.value = etat.filtres.niveaux;
            }
            if (etat.filtres.sousCartes) {
                const filtre = document.getElementById('filtre-sous-cartes');
                if (filtre) filtre.value = etat.filtres.sousCartes;
            }
        }
    } catch (e) {
        console.error("Erreur lors de la restauration de l'état de l'interface:", e);
    }
}

// Ajoute un événement pour sauvegarder l'état avant de quitter la page
window.addEventListener('beforeunload', sauvegarderEtatInterface);

// ========== INITIALISATION AU CHARGEMENT COMPLET DE LA PAGE ==========

// Exécuté une fois que le DOM est complètement chargé
window.addEventListener('load', function() {
    // Restaurer l'état de l'interface
    restaurerEtatInterface();
    
    // Ajouter des gestionnaires pour les onglets
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            sauvegarderEtatInterface();
        });
    });
    
    // Initialiser les filtres de recherche
    initialisationFiltres();
    
    console.log("Initialisation complète du panneau d'administration");
});

// Initialise les filtres de recherche
function initialisationFiltres() {
    // Filtre des types de marqueurs
    const filtreTypes = document.getElementById('filtre-types');
    if (filtreTypes) {
        filtreTypes.addEventListener('input', function() {
            filtrerTableau('liste-types-marqueurs', this.value);
        });
    }
    
    // Filtre des niveaux
    const filtreNiveaux = document.getElementById('filtre-niveaux');
    if (filtreNiveaux) {
        filtreNiveaux.addEventListener('input', function() {
            filtrerTableau('liste-niveaux', this.value);
        });
    }
    
    // Filtre des sous-cartes
    const filtreSousCartes = document.getElementById('filtre-sous-cartes');
    if (filtreSousCartes) {
        filtreSousCartes.addEventListener('input', function() {
            filtrerTableau('liste-sous-cartes', this.value);
        });
    }
}

// Filtre un tableau HTML en fonction d'un terme de recherche
function filtrerTableau(idTableau, terme) {
    const tableau = document.getElementById(idTableau);
    if (!tableau) return;
    
    const lignes = tableau.getElementsByTagName('tr');
    
    for (let i = 0; i < lignes.length; i++) {
        const texte = lignes[i].textContent.toLowerCase();
        if (texte.includes(terme.toLowerCase())) {
            lignes[i].style.display = '';
        } else {
            lignes[i].style.display = 'none';
        }
    }
}