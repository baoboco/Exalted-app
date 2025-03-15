/**
 * Script pour le panneau d'administration de la carte de Nexus
 * Ce fichier gère les fonctionnalités d'administration pour:
 * - Types de marqueurs
 * - Cartes et niveaux
 */

// Structure de données pour les types de marqueurs
let typesMarqueurs = {};

// Structure de données pour les niveaux et sous-cartes
let niveaux = [];
let sousCartes = {};

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
    
    // Charger les types de marqueurs
    chargerTypesMarqueurs();
    
    // Charger les niveaux et sous-cartes
    chargerNiveaux();
    chargerSousCartes();
    
    // Configurer les interactions du formulaire d'icônes
    setupIconePicker();
    
    // Configurer les gestionnaires d'événements
    setupFormulaires();
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
                    icone: 'beer-mug-empty',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'temple': {
                    nom: 'Temple',
                    couleur: '#FFD700',
                    icone: 'place-of-worship',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'commerce': {
                    nom: 'Commerce',
                    couleur: '#32CD32',
                    icone: 'shop',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'residence': {
                    nom: 'Résidence',
                    couleur: '#4682B4',
                    icone: 'house',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'danger': {
                    nom: 'Zone de danger',
                    couleur: '#DC143C',
                    icone: 'skull-crossbones',
                    interaction: 'popup',
                    visibilite: 'tous'
                },
                'secret': {
                    nom: 'Lieu secret',
                    couleur: '#800080',
                    icone: 'key',
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
    if (!conteneur) return;
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Ajouter chaque type au tableau
    Object.entries(typesMarqueurs).forEach(([id, type]) => {
        const ligne = document.createElement('tr');
        ligne.innerHTML = `
            <td>
                <div class="marqueur-apercu" style="background-color: ${type.couleur}">
                    <i class="fas fa-${type.icone || 'map-marker'}"></i>
                </div>
            </td>
            <td>${type.nom}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div style="width: 24px; height: 24px; background-color: ${type.couleur}; border-radius: 4px; margin-right: 10px;"></div>
                    ${type.couleur}
                </div>
            </td>
            <td><i class="fas fa-${type.icone || 'map-marker'}"></i> ${type.icone || 'map-marker'}</td>
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
    document.getElementById('type-couleur').value = type.couleur;
    document.getElementById('type-icone').value = type.icone || 'map-marker';
    document.getElementById('type-interaction').value = type.interaction || 'popup';
    document.getElementById('type-visibilite').value = type.visibilite || 'tous';
    
    // Mettre à jour l'aperçu de l'icône
    document.getElementById('apercu-icone').className = `fas fa-${type.icone || 'map-marker'}`;
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-type').classList.remove('d-none');
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauType'));
    modal.show();
}

// Supprime un type de marqueur
function supprimerTypeMarqueur(id) {
    // Vérifier si des marqueurs utilisent ce type
    const marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
    let marqueursTrouves = false;
    
    // Parcourir tous les niveaux et marqueurs
    Object.values(marqueursSauvegardes).forEach(marqueurNiveau => {
        Object.values(marqueurNiveau).forEach(marqueur => {
            if (marqueur.type === id) {
                marqueursTrouves = true;
            }
        });
    });
    
    if (marqueursTrouves) {
        const confirmer = confirm(`Ce type est utilisé par des marqueurs existants. La suppression affectera ces marqueurs. Continuer ?`);
        if (!confirmer) return;
    }
    
    // Supprimer le type
    delete typesMarqueurs[id];
    sauvegarderTypesMarqueurs();
    
    // Mettre à jour l'affichage
    afficherTypesMarqueurs();
    
    // Fermer le modal si ouvert
    const modalElement = document.getElementById('modalNouveauType');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
    
    afficherAlerte(`Type "${id}" supprimé avec succès`, "success");
}

// ========== GESTION DES NIVEAUX ==========

// Charge les niveaux depuis la configuration
function chargerNiveaux() {
    try {
        // Récupérer les niveaux depuis localStorage ou créer un tableau vide
        const niveauxSauvegardes = localStorage.getItem('nexus-niveaux');
        
        if (niveauxSauvegardes) {
            niveaux = JSON.parse(niveauxSauvegardes);
        } else {
            // Récupérer les niveaux de la configuration
            niveaux = [];
            
            // Convertir le tableau de chemins en objets niveaux
            if (CONFIG && CONFIG.carte && CONFIG.carte.cheminNiveaux) {
                CONFIG.carte.cheminNiveaux.forEach((chemin, index) => {
                    // Extraire le nom du fichier du chemin
                    const nomFichier = chemin.split('/').pop();
                    
                    // Construire l'objet niveau
                    niveaux.push({
                        id: index,
                        nom: NOMS_NIVEAUX[index] || `Niveau ${index}`,
                        position: index,
                        chemin: chemin,
                        fichier: nomFichier
                    });
                });
            }
            
            // Sauvegarder les niveaux
            sauvegarderNiveaux();
        }
        
        // Afficher les niveaux dans l'interface
        afficherNiveaux();
        
        // Mettre à jour le sélecteur de niveaux parents pour les sous-cartes
        mettreAJourSelecteurNiveauxParents();
    } catch (e) {
        console.error("Erreur lors du chargement des niveaux:", e);
        afficherAlerte("Erreur lors du chargement des niveaux", "danger");
    }
}

// Sauvegarde les niveaux dans la configuration
function sauvegarderNiveaux() {
    try {
        // Trier les niveaux par position
        niveaux.sort((a, b) => a.position - b.position);
        
        // Mettre à jour la configuration
        if (CONFIG && CONFIG.carte) {
            CONFIG.carte.cheminNiveaux = niveaux.map(n => n.chemin);
        }
        
        // Sauvegarder dans le localStorage une version plus complète
        localStorage.setItem('nexus-niveaux', JSON.stringify(niveaux));
        
        console.log("Niveaux sauvegardés avec succès");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des niveaux:", e);
        afficherAlerte("Erreur lors de la sauvegarde des niveaux", "danger");
    }
}

// Affiche les niveaux dans l'interface
function afficherNiveaux() {
    const conteneur = document.getElementById('liste-niveaux');
    if (!conteneur) return;
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Ajouter chaque niveau à la liste
    niveaux.forEach(niveau => {
        const element = document.createElement('a');
        element.href = "#";
        element.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        element.innerHTML = `
            <div>
                <span class="niveau-indicateur">${niveau.position}</span>
                <span>${niveau.nom}</span>
            </div>
            <div class="list-group-item-actions">
                <button class="btn btn-sm btn-outline-primary btn-edit-niveau" data-id="${niveau.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-niveau" data-id="${niveau.id}" ${niveaux.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        conteneur.appendChild(element);
    });
    
    // Ajouter les gestionnaires d'événements
    setupBoutonsNiveaux();
}

// Configure les boutons d'action pour les niveaux
function setupBoutonsNiveaux() {
    // Boutons d'édition
    document.querySelectorAll('.btn-edit-niveau').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = parseInt(this.getAttribute('data-id'));
            ouvrirModalEditionNiveau(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-niveau').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = parseInt(this.getAttribute('data-id'));
            if (confirm(`Êtes-vous sûr de vouloir supprimer ce niveau ?`)) {
                supprimerNiveau(id);
            }
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
    document.getElementById('niveau-position').value = niveau.position;
    
    // Afficher l'aperçu du fichier actuel
    const apercuContainer = document.getElementById('niveau-apercu');
    apercuContainer.innerHTML = `
        <p class="text-muted">Fichier actuel: ${niveau.fichier}</p>
        <p class="text-muted">Chemin: ${niveau.chemin}</p>
    `;
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-niveau').classList.remove('d-none');
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouveauNiveau'));
    modal.show();
}

// Ajoute ou met à jour un niveau
function ajouterOuMettreAJourNiveau(formData) {
    const editId = parseInt(formData.get('niveau-edit-id')) || null;
    const nom = formData.get('niveau-nom');
    const position = parseInt(formData.get('niveau-position'));
    const fichier = formData.get('niveau-fichier');
    
    // Vérifier si c'est une édition ou un nouvel ajout
    if (editId !== null && !isNaN(editId)) {
        // C'est une édition, chercher le niveau existant
        const index = niveaux.findIndex(n => n.id === editId);
        if (index === -1) {
            console.error("Niveau non trouvé pour l'édition:", editId);
            return false;
        }
        
        // Mettre à jour les propriétés du niveau
        niveaux[index].nom = nom;
        niveaux[index].position = position;
        
        // Si un nouveau fichier est fourni, le traiter
        if (fichier && fichier.name) {
            // TODO: Implémenter l'upload de fichier réel
            // Pour l'instant, simplement mettre à jour le nom du fichier
            const nouveauChemin = `cartes/nexus-niveau-${position}.svg`;
            niveaux[index].chemin = nouveauChemin;
            niveaux[index].fichier = `nexus-niveau-${position}.svg`;
        }
    } else {
        // C'est un nouvel ajout
        const nouvelId = Math.max(0, ...niveaux.map(n => n.id)) + 1;
        
        // Créer le chemin pour le nouveau fichier
        const nouveauChemin = `cartes/nexus-niveau-${position}.svg`;
        
        // Créer le nouveau niveau
        const nouveauNiveau = {
            id: nouvelId,
            nom: nom,
            position: position,
            chemin: nouveauChemin,
            fichier: fichier && fichier.name ? fichier.name : `nexus-niveau-${position}.svg`
        };
        
        niveaux.push(nouveauNiveau);
    }
    
    // Sauvegarder et mettre à jour l'affichage
    sauvegarderNiveaux();
    afficherNiveaux();
    
    // Mettre à jour le sélecteur de niveaux parents pour les sous-cartes
    mettreAJourSelecteurNiveauxParents();
    
    return true;
}

// Supprime un niveau
function supprimerNiveau(id) {
    // Ne pas supprimer si c'est le dernier niveau
    if (niveaux.length <= 1) {
        afficherAlerte("Impossible de supprimer le dernier niveau", "warning");
        return false;
    }
    
    // Chercher le niveau à supprimer
    const index = niveaux.findIndex(n => n.id === id);
    if (index === -1) {
        console.error("Niveau non trouvé pour la suppression:", id);
        return false;
    }
    
    // Supprimer le niveau
    niveaux.splice(index, 1);
    
    // Sauvegarder et mettre à jour l'affichage
    sauvegarderNiveaux();
    afficherNiveaux();
    
    // Mettre à jour le sélecteur de niveaux parents pour les sous-cartes
    mettreAJourSelecteurNiveauxParents();
    
    afficherAlerte("Niveau supprimé avec succès", "success");
    
    return true;
}

// ========== GESTION DES SOUS-CARTES ==========

// Configuration des sous-cartes disponibles par défaut
const SOUS_CARTES_DEFAUT = {
    "taverne-dragon": {
        nom: "Taverne du Dragon Ivre",
        chemin: "cartes/lieux/taverne-dragon.svg",
        parent: {
            niveau: 0,
            position: { x: 540, y: 400 }
        },
        description: "Une taverne animée au cœur du quartier marchand."
    },
    "temple-lune": {
        nom: "Temple de la Lune",
        chemin: "cartes/lieux/temple-lune.svg",
        parent: {
            niveau: 0,
            position: { x: 1450, y: 400 }
        },
        description: "Un lieu sacré dédié au culte de la Lune."
    }
};

// Fonction pour charger les sous-cartes
function chargerSousCartes() {
    try {
        // D'abord essayer de charger depuis localStorage
        const sousSauvegardes = localStorage.getItem('nexus-sous-cartes');
        if (sousSauvegardes) {
            sousCartes = JSON.parse(sousSauvegardes);
        } else {
            // Sinon, utiliser les sous-cartes par défaut définies dans navigation.js
            if (typeof SOUS_CARTES !== 'undefined') {
                sousCartes = SOUS_CARTES;
            } else {
                // Créer quelques sous-cartes par défaut
                sousCartes = SOUS_CARTES_DEFAUT;
            }
            
            // Sauvegarder pour utilisation future
            sauvegarderSousCartes();
        }
        
        // Afficher les sous-cartes
        afficherSousCartes();
    } catch (e) {
        console.error("Erreur lors du chargement des sous-cartes:", e);
        afficherAlerte("Erreur lors du chargement des sous-cartes", "danger");
    }
}

// Fonction pour sauvegarder les sous-cartes
function sauvegarderSousCartes() {
    try {
        localStorage.setItem('nexus-sous-cartes', JSON.stringify(sousCartes));
        
        // Si la variable globale existe, la mettre à jour aussi
        if (typeof SOUS_CARTES !== 'undefined') {
            SOUS_CARTES = sousCartes;
        }
        
        console.log("Sous-cartes sauvegardées avec succès");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des sous-cartes:", e);
        afficherAlerte("Erreur lors de la sauvegarde des sous-cartes", "danger");
    }
}

// Fonction pour afficher les sous-cartes dans la liste
function afficherSousCartes() {
    const conteneur = document.getElementById('liste-sous-cartes');
    if (!conteneur) return;
    
    // Vider le conteneur
    conteneur.innerHTML = '';
    
    // Ajouter chaque sous-carte
    Object.entries(sousCartes).forEach(([id, sousCarte]) => {
        const element = document.createElement('a');
        element.href = "#";
        element.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        
        // Trouver le nom du niveau parent
        let nomNiveauParent = "Inconnu";
        if (sousCarte.parent && sousCarte.parent.niveau !== undefined) {
            const niveauParent = niveaux.find(n => n.position === sousCarte.parent.niveau);
            if (niveauParent) {
                nomNiveauParent = niveauParent.nom;
            }
        }
        
        element.innerHTML = `
            <div>
                <span>${sousCarte.nom}</span>
                <small class="d-block text-muted">Niveau parent: ${nomNiveauParent}</small>
            </div>
            <div class="list-group-item-actions">
                <button class="btn btn-sm btn-outline-primary btn-edit-sous-carte" data-id="${id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-sous-carte" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        conteneur.appendChild(element);
    });
    
    // Ajouter les gestionnaires d'événements
    setupBoutonsSousCartes();
}

// Fonction pour mettre à jour le sélecteur de niveaux parents
function mettreAJourSelecteurNiveauxParents() {
    const selecteur = document.getElementById('sous-carte-niveau-parent');
    if (!selecteur) return;
    
    // Vider le sélecteur
    selecteur.innerHTML = '';
    
    // Ajouter une option vide
    selecteur.innerHTML = '<option value="">Sélectionnez un niveau parent</option>';
    
    // Ajouter une option pour chaque niveau
    niveaux.forEach(niveau => {
        const option = document.createElement('option');
        option.value = niveau.position;
        option.textContent = niveau.nom;
        selecteur.appendChild(option);
    });
}

// Fonction pour ouvrir le modal d'édition d'une sous-carte
function ouvrirModalEditionSousCarte(id) {
    const sousCarte = sousCartes[id];
    if (!sousCarte) return;
    
    // Remplir le formulaire avec les données de la sous-carte
    document.getElementById('sous-carte-edit-id').value = id;
    document.getElementById('sous-carte-nom').value = sousCarte.nom;
    document.getElementById('sous-carte-identifiant').value = id;
    document.getElementById('sous-carte-description').value = sousCarte.description || '';
    
    // Sélectionner le niveau parent
    const selectNiveauParent = document.getElementById('sous-carte-niveau-parent');
    if (selectNiveauParent && sousCarte.parent && sousCarte.parent.niveau !== undefined) {
        selectNiveauParent.value = sousCarte.parent.niveau;
    }
    
    // Afficher l'aperçu du fichier actuel
    const apercuContainer = document.getElementById('sous-carte-apercu');
    apercuContainer.innerHTML = `
        <p class="text-muted">Fichier actuel: ${sousCarte.chemin.split('/').pop()}</p>
        <p class="text-muted">Chemin: ${sousCarte.chemin}</p>
    `;
    
    // Afficher le bouton de suppression
    document.getElementById('btn-supprimer-sous-carte').classList.remove('d-none');
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('modalNouvelleSousCarte'));
    modal.show();
}

// Fonction pour ajouter ou mettre à jour une sous-carte
function ajouterOuMettreAJourSousCarte(formData) {
    const editId = formData.get('sous-carte-edit-id');
    const nom = formData.get('sous-carte-nom');
    const identifiant = formData.get('sous-carte-identifiant');
    const description = formData.get('sous-carte-description');
    const niveauParent = parseInt(formData.get('sous-carte-niveau-parent'));
    const fichier = formData.get('sous-carte-fichier');
    
    // Vérifier les données
    if (!nom || !identifiant || isNaN(niveauParent)) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "warning");
        return false;
    }
    
    // Vérifier si l'identifiant est déjà utilisé (sauf si c'est le même en édition)
    if (sousCartes[identifiant] && (!editId || editId !== identifiant)) {
        afficherAlerte("Cet identifiant est déjà utilisé", "warning");
        return false;
    }
    
    // Créer les données de la sous-carte
    const chemin = fichier && fichier.name ? 
        `cartes/lieux/${identifiant}.svg` : 
        editId && sousCartes[editId] ? sousCartes[editId].chemin : `cartes/lieux/${identifiant}.svg`;
    
    const nouvelleSousCarte = {
        nom: nom,
        chemin: chemin,
        parent: {
            niveau: niveauParent,
            position: editId && sousCartes[editId] && sousCartes[editId].parent ? 
                sousCartes[editId].parent.position : { x: 500, y: 500 }
        },
        description: description
    };
    
    // Si édition et changement d'identifiant, supprimer l'ancien
    if (editId && editId !== identifiant) {
        delete sousCartes[editId];
    }
    
    // Ajouter/mettre à jour la sous-carte
    sousCartes[identifiant] = nouvelleSousCarte;
    
    // Sauvegarder et mettre à jour l'affichage
    sauvegarderSousCartes();
    afficherSousCartes();
    
    return true;
}

// Fonction pour supprimer une sous-carte
function supprimerSousCarte(id) {
    // Vérifier si des marqueurs utilisent cette sous-carte
    const marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
    let marqueursTrouves = false;
    
    // Parcourir tous les niveaux et marqueurs
    Object.values(marqueursSauvegardes).forEach(marqueurNiveau => {
        Object.values(marqueurNiveau).forEach(marqueur => {
            if (marqueur.interaction && 
                marqueur.interaction.type === 'sous-carte' && 
                marqueur.interaction.contenu && 
                marqueur.interaction.contenu.sousCarte === id) {
                marqueursTrouves = true;
            }
        });
    });
    
    if (marqueursTrouves) {
        const confirmer = confirm(`Cette sous-carte est référencée par des marqueurs. La suppression affectera ces marqueurs. Continuer ?`);
        if (!confirmer) return false;
    }
    
    // Supprimer la sous-carte
    delete sousCartes[id];
    
    // Sauvegarder et mettre à jour l'affichage
    sauvegarderSousCartes();
    afficherSousCartes();
    
    afficherAlerte("Sous-carte supprimée avec succès", "success");
    
    return true;
}

// Fonction pour configurer les boutons des sous-cartes
function setupBoutonsSousCartes() {
    // Boutons d'édition
    document.querySelectorAll('.btn-edit-sous-carte').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            ouvrirModalEditionSousCarte(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-sous-carte').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            if (confirm(`Êtes-vous sûr de vouloir supprimer cette sous-carte ?`)) {
                supprimerSousCarte(id);
            }
        });
    });
}

// ========== UTILITAIRES ET INTERFACE ==========

// Configure le sélecteur d'icônes avec l'aperçu en direct
function setupIconePicker() {
    const champIcone = document.getElementById('type-icone');
    const apercuIcone = document.getElementById('apercu-icone');
    
    if (champIcone && apercuIcone) {
        champIcone.addEventListener('input', function() {
            const valeur = this.value.trim();
            apercuIcone.className = valeur ? `fas fa-${valeur}` : 'fas fa-map-marker';
        });
    }
}

// Configure les gestionnaires d'événements pour les formulaires
function setupFormulaires() {
    // Sauvegarde d'un type de marqueur
    const btnSauvegarderType = document.getElementById('btn-sauvegarder-type');
    if (btnSauvegarderType) {
        btnSauvegarderType.addEventListener('click', function() {
            const form = document.getElementById('form-nouveau-type');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const editId = document.getElementById('type-edit-id').value;
            const nom = document.getElementById('type-nom').value;
            const identifiant = document.getElementById('type-identifiant').value;
            const couleur = document.getElementById('type-couleur').value;
            const icone = document.getElementById('type-icone').value;
            const interaction = document.getElementById('type-interaction').value;
            const visibilite = document.getElementById('type-visibilite').value;
            
            // Vérifier si l'identifiant est déjà utilisé (sauf si c'est le même en édition)
            if (typesMarqueurs[identifiant] && (!editId || editId !== identifiant)) {
                afficherAlerte("Cet identifiant est déjà utilisé", "warning");
                return;
            }
            
            // Si édition et changement d'identifiant, supprimer l'ancien
            if (editId && editId !== identifiant) {
                delete typesMarqueurs[editId];
            }
            
            // Ajouter/mettre à jour le type
            typesMarqueurs[identifiant] = {
                nom: nom,
                couleur: couleur,
                icone: icone,
                interaction: interaction,
                visibilite: visibilite
            };
            
            // Sauvegarder et mettre à jour l'affichage
            sauvegarderTypesMarqueurs();
            afficherTypesMarqueurs();
            
            // Fermer le modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNouveauType'));
            modal.hide();
            
            // Réinitialiser le formulaire
            form.reset();
            document.getElementById('type-edit-id').value = '';
            document.getElementById('btn-supprimer-type').classList.add('d-none');
            
            afficherAlerte(`Type "${nom}" sauvegardé avec succès`, "success");
        });
    }
    
    // Suppression d'un type de marqueur depuis le modal
    const btnSupprimerType = document.getElementById('btn-supprimer-type');
    if (btnSupprimerType) {
        btnSupprimerType.addEventListener('click', function() {
            const editId = document.getElementById('type-edit-id').value;
            if (editId) {
                if (confirm(`Êtes-vous sûr de vouloir supprimer ce type de marqueur ?`)) {
                    supprimerTypeMarqueur(editId);
                }
            }
        });
    }
    
    // Sauvegarde d'un niveau
    const btnSauvegarderNiveau = document.getElementById('btn-sauvegarder-niveau');
    if (btnSauvegarderNiveau) {
        btnSauvegarderNiveau.addEventListener('click', function() {
            const form = document.getElementById('form-nouveau-niveau');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const formData = new FormData(form);
            if (ajouterOuMettreAJourNiveau(formData)) {
                // Fermer le modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNouveauNiveau'));
                modal.hide();
                
                // Réinitialiser le formulaire
                form.reset();
                document.getElementById('niveau-edit-id').value = '';
                document.getElementById('btn-supprimer-niveau').classList.add('d-none');
                
                afficherAlerte("Niveau sauvegardé avec succès", "success");
            }
        });
    }
    
    // Suppression d'un niveau depuis le modal
    const btnSupprimerNiveau = document.getElementById('btn-supprimer-niveau');
    if (btnSupprimerNiveau) {
        btnSupprimerNiveau.addEventListener('click', function() {
            const editId = parseInt(document.getElementById('niveau-edit-id').value);
            if (!isNaN(editId)) {
                if (confirm(`Êtes-vous sûr de vouloir supprimer ce niveau ?`)) {
                    if (supprimerNiveau(editId)) {
                        // Fermer le modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNouveauNiveau'));
                        modal.hide();
                    }
                }
            }
        });
    }
    
    // Sauvegarde d'une sous-carte
    const btnSauvegarderSousCarte = document.getElementById('btn-sauvegarder-sous-carte');
    if (btnSauvegarderSousCarte) {
        btnSauvegarderSousCarte.addEventListener('click', function() {
            const form = document.getElementById('form-nouvelle-sous-carte');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const formData = new FormData(form);
            if (ajouterOuMettreAJourSousCarte(formData)) {
                // Fermer le modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNouvelleSousCarte'));
                modal.hide();
                
                // Réinitialiser le formulaire
                form.reset();
                document.getElementById('sous-carte-edit-id').value = '';
                document.getElementById('btn-supprimer-sous-carte').classList.add('d-none');
                
                afficherAlerte("Sous-carte sauvegardée avec succès", "success");
            }
        });
    }
    
    // Suppression d'une sous-carte depuis le modal
    const btnSupprimerSousCarte = document.getElementById('btn-supprimer-sous-carte');
    if (btnSupprimerSousCarte) {
        btnSupprimerSousCarte.addEventListener('click', function() {
            const editId = document.getElementById('sous-carte-edit-id').value;
            if (editId) {
                if (confirm(`Êtes-vous sûr de vouloir supprimer cette sous-carte ?`)) {
                    if (supprimerSousCarte(editId)) {
                        // Fermer le modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNouvelleSousCarte'));
                        modal.hide();
                    }
                }
            }
        });
    }
    
    // Bouton de sauvegarde globale
    const btnSaveAll = document.getElementById('btn-save-all');
    if (btnSaveAll) {
        btnSaveAll.addEventListener('click', function() {
            // Sauvegarder tous les types de données
            sauvegarderTypesMarqueurs();
            sauvegarderNiveaux();
            sauvegarderSousCartes();
            
            // Animation de sauvegarde
            this.classList.add('save-animation', 'saving');
            setTimeout(() => {
                this.classList.remove('save-animation', 'saving');
            }, 500);
            
            afficherAlerte("Toutes les modifications ont été enregistrées", "success");
        });
    }
    
    // Réinitialiser les formulaires lors de l'ouverture des modals
    document.getElementById('modalNouveauType').addEventListener('show.bs.modal', function(event) {
        // Ne pas réinitialiser si c'est une édition
        if (!event.relatedTarget || !event.relatedTarget.classList.contains('btn-edit-type')) {
            this.querySelector('form').reset();
            document.getElementById('type-edit-id').value = '';
            document.getElementById('btn-supprimer-type').classList.add('d-none');
        }
    });
    
    document.getElementById('modalNouveauNiveau').addEventListener('show.bs.modal', function(event) {
        // Ne pas réinitialiser si c'est une édition
        if (!event.relatedTarget || !event.relatedTarget.classList.contains('btn-edit-niveau')) {
            this.querySelector('form').reset();
            document.getElementById('niveau-edit-id').value = '';
            document.getElementById('btn-supprimer-niveau').classList.add('d-none');
        }
    });
    
    document.getElementById('modalNouvelleSousCarte').addEventListener('show.bs.modal', function(event) {
        // Ne pas réinitialiser si c'est une édition
        if (!event.relatedTarget || !event.relatedTarget.classList.contains('btn-edit-sous-carte')) {
            this.querySelector('form').reset();
            document.getElementById('sous-carte-edit-id').value = '';
            document.getElementById('btn-supprimer-sous-carte').classList.add('d-none');
        }
        
        // Mettre à jour le sélecteur de niveaux parents
        mettreAJourSelecteurNiveauxParents();
    });
}

// ========== FONCTIONS DE TRADUCTION ET D'AFFICHAGE ==========

// Traduit le type d'interaction en texte lisible
function traduireInteraction(interaction) {
    const traductions = {
        'popup': 'Popup d\'information',
        'sous-carte': 'Ouvre une sous-carte',
        'statique': 'Aucune interaction'
    };
    
    return traductions[interaction] || interaction;
}

// Traduit le type de visibilité en texte lisible
function traduireVisibilite(visibilite) {
    const traductions = {
        'tous': 'Tous',
        'mj': 'MJ uniquement',
        'specifique': 'Joueurs spécifiques',
        'conditionnel': 'Selon condition'
    };
    
    return traductions[visibilite] || visibilite;
}

// Retourne la classe CSS pour le badge de visibilité
function badgeClasseParVisibilite(visibilite) {
    const classes = {
        'tous': 'bg-success',
        'mj': 'bg-danger',
        'specifique': 'bg-warning text-dark',
        'conditionnel': 'bg-info text-dark'
    };
    
    return classes[visibilite] || 'bg-secondary';
}

// Affiche une alerte temporaire
function afficherAlerte(message, type) {
    // Créer le conteneur de toast s'il n'existe pas
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Créer le toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
        </div>
    `;
    
    // Ajouter le toast au conteneur
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialiser et afficher le toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Supprimer le toast après qu'il se soit caché
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}