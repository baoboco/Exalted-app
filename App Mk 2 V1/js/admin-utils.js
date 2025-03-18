// Utilitaires pour le panneau d'administration

// Noms des niveaux pour l'affichage - copié depuis navigation.js pour éviter les références croisées
const NOMS_NIVEAUX = [
    "Surface",
    "Souterrains",
    "Égouts",
    "Ruines anciennes"
];

// Configuration des sous-cartes disponibles - version simplifiée pour l'administration
const SOUS_CARTES_ADMIN = {
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
            // Sinon, utiliser les sous-cartes par défaut
            sousCartes = SOUS_CARTES_ADMIN;
            
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
