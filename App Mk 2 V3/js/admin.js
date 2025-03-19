// Configuration des onglets et leur changement
function setupOnglets() {
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(onglet => {
        onglet.addEventListener('shown.bs.tab', function(e) {
            // Enregistrer l'onglet actif
            etatInterface.ongletActif = e.target.id;
            sauvegarderEtatInterface();
        });
    });
}

// ========== EXPORT/IMPORT DES CONFIGURATIONS ==========

// Configure les boutons d'export/import
function setupBoutonsExportImport() {
    // Bouton d'export/import dans le menu latéral
    const btnExportImport = document.getElementById('btn-export-import');
    if (btnExportImport) {
        btnExportImport.addEventListener('click', function() {
            afficherInterfaceExportImport();
        });
    }
    
    // Bouton de sauvegarde globale
    const btnSaveAll = document.getElementById('btn-save-all');
    if (btnSaveAll) {
        btnSaveAll.addEventListener('click', function() {
            // Ajouter une animation de sauvegarde
            this.classList.add('save-animation', 'saving');
            
            // Sauvegarder toutes les données
            sauvegarderTypesMarqueurs();
            sauvegarderNiveaux();
            sauvegarderSousCartes();
            
            // Afficher un message de confirmation
            afficherAlerte("Toutes les données ont été sauvegardées avec succès", "success");
            
            // Retirer l'animation après un court délai
            setTimeout(() => {
                this.classList.remove('save-animation', 'saving');
            }, 500);
        });
    }
}

// Affiche l'interface d'export/import
function afficherInterfaceExportImport() {
    // Si cette fonction est définie dans export-import.js, l'utiliser
    if (typeof window.afficherInterfaceExportImport === 'function') {
        window.afficherInterfaceExportImport();
        return;
    }
    
    // Implémentation de secours si la fonction n'est pas définie ailleurs
    // Vérifier si un modal existe déjà
    let modalExportImport = document.getElementById('modalExportImport');
    
    if (!modalExportImport) {
        // Créer le modal
        modalExportImport = document.createElement('div');
        modalExportImport.id = 'modalExportImport';
        modalExportImport.className = 'modal fade';
        modalExportImport.setAttribute('tabindex', '-1');
        modalExportImport.setAttribute('aria-labelledby', 'modalExportImportLabel');
        modalExportImport.setAttribute('aria-hidden', 'true');
        
        modalExportImport.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalExportImportLabel">Export / Import des données</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <p><i class="fas fa-info-circle"></i> Utilisez ces fonctions pour exporter vos configurations et les importer ultérieurement.</p>
                            <p>Cela vous permet de sauvegarder votre travail ou de partager vos configurations avec d'autres utilisateurs.</p>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-primary text-white">
                                        <h5 class="mb-0"><i class="fas fa-download"></i> Exporter les données</h5>
                                    </div>
                                    <div class="card-body">
                                        <p>Exportez vos données de configuration actuelles vers un fichier JSON.</p>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-primary" id="btn-export-all">
                                                <i class="fas fa-download"></i> Exporter toutes les données
                                            </button>
                                            <button class="btn btn-outline-primary" id="btn-export-selected">
                                                <i class="fas fa-list-check"></i> Exporter données sélectionnées
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-success text-white">
                                        <h5 class="mb-0"><i class="fas fa-upload"></i> Importer des données</h5>
                                    </div>
                                    <div class="card-body">
                                        <p>Importez des données à partir d'un fichier JSON exporté précédemment.</p>
                                        <div class="mb-3">
                                            <label for="import-file" class="form-label">Sélectionner un fichier:</label>
                                            <input class="form-control" type="file" id="import-file" accept=".json">
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-success" id="btn-import" disabled>
                                                <i class="fas fa-upload"></i> Importer les données
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalExportImport);
        
        // Ajouter les gestionnaires d'événements
        
        // Activer/désactiver le bouton d'import selon si un fichier est sélectionné
        document.getElementById('import-file').addEventListener('change', function() {
            document.getElementById('btn-import').disabled = !this.files || !this.files[0];
        });
        
        // Bouton d'export complet
        document.getElementById('btn-export-all').addEventListener('click', function() {
            exporterDonnees();
        });
        
        // Bouton d'export sélectif
        document.getElementById('btn-export-selected').addEventListener('click', function() {
            afficherModalSelectionExport();
        });
        
        // Bouton d'import
        document.getElementById('btn-import').addEventListener('click', function() {
            const fileInput = document.getElementById('import-file');
            if (fileInput.files && fileInput.files[0]) {
                importerDonnees(fileInput.files[0]);
            }
        });
    }
    
    // Afficher le modal
    const modal = new bootstrap.Modal(modalExportImport);
    modal.show();
}

// Affiche un modal pour sélectionner les types de données à exporter
function afficherModalSelectionExport() {
    // Créer le modal s'il n'existe pas
    let modalSelection = document.getElementById('modalSelectionExport');
    
    if (!modalSelection) {
        modalSelection = document.createElement('div');
        modalSelection.id = 'modalSelectionExport';
        modalSelection.className = 'modal fade';
        modalSelection.setAttribute('tabindex', '-1');
        modalSelection.setAttribute('aria-labelledby', 'modalSelectionExportLabel');
        modalSelection.setAttribute('aria-hidden', 'true');
        
        modalSelection.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalSelectionExportLabel">Sélectionner les données à exporter</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <p>Cochez les types de données que vous souhaitez exporter:</p>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="export-types" checked>
                            <label class="form-check-label" for="export-types">Types de marqueurs</label>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="export-niveaux" checked>
                            <label class="form-check-label" for="export-niveaux">Niveaux</label>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="export-sous-cartes" checked>
                            <label class="form-check-label" for="export-sous-cartes">Sous-cartes</label>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="export-marqueurs" checked>
                            <label class="form-check-label" for="export-marqueurs">Marqueurs</label>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="export-notes" checked>
                            <label class="form-check-label" for="export-notes">Notes</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="btn-confirmer-export">Exporter</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalSelection);
        
        // Ajouter le gestionnaire pour le bouton de confirmation
        document.getElementById('btn-confirmer-export').addEventListener('click', function() {
            // Récupérer les types sélectionnés
            const types = [];
            if (document.getElementById('export-types').checked) types.push('typesMarqueurs');
            if (document.getElementById('export-niveaux').checked) types.push('niveaux');
            if (document.getElementById('export-sous-cartes').checked) types.push('sousCartes');
            if (document.getElementById('export-marqueurs').checked) types.push('marqueurs');
            if (document.getElementById('export-notes').checked) types.push('notes');
            
            // Fermer le modal de sélection
            bootstrap.Modal.getInstance(modalSelection).hide();
            
            // Exporter les données
            exporterDonnees(types);
        });
    }
    
    // Afficher le modal
    const modal = new bootstrap.Modal(modalSelection);
    modal.show();
}

// Exporte les données sélectionnées
function exporterDonnees(types = ['typesMarqueurs', 'niveaux', 'sousCartes', 'marqueurs', 'notes']) {
    // Préparer les données à exporter
    const donnees = {
        version: ADMIN_CONFIG.version,
        date: new Date().toISOString(),
        contenu: {}
    };
    
    // Récupérer chaque type de données
    if (types.includes('typesMarqueurs')) {
        donnees.contenu.typesMarqueurs = typesMarqueurs;
    }
    
    if (types.includes('niveaux')) {
        donnees.contenu.niveaux = niveaux;
    }
    
    if (types.includes('sousCartes')) {
        donnees.contenu.sousCartes = sousCartes;
    }
    
    // Pour les marqueurs et les notes, récupérer depuis le stockage local
    if (types.includes('marqueurs')) {
        const marqueursSauvegardes = localStorage.getItem('nexus-marqueurs');
        if (marqueursSauvegardes) {
            donnees.contenu.marqueurs = JSON.parse(marqueursSauvegardes);
        }
    }
    
    if (types.includes('notes')) {
        const notesSauvegardees = localStorage.getItem('nexus-notes');
        if (notesSauvegardees) {
            donnees.contenu.notes = JSON.parse(notesSauvegardees);
        }
    }
    
    // Convertir en chaîne JSON
    const json = JSON.stringify(donnees, null, 2);
    
    // Créer un Blob et un lien de téléchargement
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    // Libérer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 0);
    
    afficherAlerte("Export des données réussi", "success");
}

// Importe des données depuis un fichier
function importerDonnees(fichier) {
    // Créer un lecteur de fichier
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Analyser le contenu JSON
            const donnees = JSON.parse(e.target.result);
            
            // Vérifier si le fichier a le bon format
            if (!donnees.version || !donnees.contenu) {
                throw new Error("Format de fichier non valide");
            }
            
            // Demander confirmation avant l'import
            if (confirm("Êtes-vous sûr de vouloir importer ces données ? Les données existantes seront remplacées.")) {
                // Importer chaque type de données
                if (donnees.contenu.typesMarqueurs) {
                    typesMarqueurs = donnees.contenu.typesMarqueurs;
                    sauvegarderTypesMarqueurs();
                }
                
                if (donnees.contenu.niveaux) {
                    niveaux = donnees.contenu.niveaux;
                    sauvegarderNiveaux();
                }
                
                if (donnees.contenu.sousCartes) {
                    sousCartes = donnees.contenu.sousCartes;
                    sauvegarderSousCartes();
                }
                
                if (donnees.contenu.marqueurs) {
                    localStorage.setItem('nexus-marqueurs', JSON.stringify(donnees.contenu.marqueurs));
                }
                
                if (donnees.contenu.notes) {
                    localStorage.setItem('nexus-notes', JSON.stringify(donnees.contenu.notes));
                }
                
                // Rafraîchir les interfaces
                afficherTypesMarqueurs();
                afficherNiveaux();
                afficherSousCartes();
                
                // Fermer le modal
                const modalExportImport = document.getElementById('modalExportImport');
                if (modalExportImport) {
                    bootstrap.Modal.getInstance(modalExportImport).hide();
                }
                
                afficherAlerte("Import des données réussi", "success");
            }
        } catch (e) {
            console.error("Erreur lors de l'import des données:", e);
            afficherAlerte(`Erreur lors de l'import: ${e.message}`, "danger");
        }
    };
    
    reader.onerror = function() {
        afficherAlerte("Erreur lors de la lecture du fichier", "danger");
    };
    
    reader.readAsText(fichier);
}

// ========== GESTION DE L'ÉTAT DE L'INTERFACE ==========

// Sauvegarde l'état courant de l'interface
function sauvegarderEtatInterface() {
    try {
        const etat = {
            ongletActif: etatInterface.ongletActif,
            filtres: {
                // Ajouter ici les états des filtres si nécessaire
            }
        };
        
        localStorage.setItem('nexus-admin-etat', JSON.stringify(etat));
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde de l'état de l'interface:", e);
        return false;
    }
}

// Restaure l'état précédent de l'interface
function restaurerEtatInterface() {
    try {
        const etatSauvegarde = localStorage.getItem('nexus-admin-etat');
        if (!etatSauvegarde) return false;
        
        const etat = JSON.parse(etatSauvegarde);
        
        // Restaurer l'onglet actif
        if (etat.ongletActif) {
            etatInterface.ongletActif = etat.ongletActif;
            
            // Activer l'onglet correspondant
            const tabElement = document.getElementById(etat.ongletActif);
            if (tabElement && typeof bootstrap !== 'undefined') {
                const tab = new bootstrap.Tab(tabElement);
                tab.show();
            }
        }
        
        // Restaurer les filtres
        if (etat.filtres) {
            etatInterface.filtres = etat.filtres;
            
            // Appliquer les filtres restaurés aux éléments de l'interface
            // (à implémenter selon les besoins spécifiques)
        }
        
        return true;
    } catch (e) {
        console.error("Erreur lors de la restauration de l'état de l'interface:", e);
        return false;
    }
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

// Efface les éléments temporaires
function nettoyerElementsTemporaires() {
    // Supprimer les modals temporaires lors du chargement d'une nouvelle page
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });
    
    // Supprimer les alertes temporaires
    document.querySelectorAll('.alert').forEach(alerte => {
        alerte.remove();
    });
}

// ========== INITIALISATION AU DÉMARRAGE ==========

// Fonction appelée au chargement complet de la page
window.addEventListener('load', function() {
    console.log("Chargement complet de la page d'administration");
    
    // Nettoyer les éléments temporaires
    nettoyerElementsTemporaires();
    
    // Vérifier les mises à jour de la configuration, si nécessaire
    verifierMisesAJour();
});

// Vérifie les mises à jour de la configuration
function verifierMisesAJour() {
    // Vérifier la version actuelle par rapport à la version stockée
    const versionStockee = localStorage.getItem('nexus-version');
    
    if (versionStockee !== ADMIN_CONFIG.version) {
        console.log(`Mise à jour détectée: ${versionStockee || 'non définie'} -> ${ADMIN_CONFIG.version}`);
        
        // Effectuer des opérations de migration si nécessaire...
        
        // Sauvegarder la nouvelle version
        localStorage.setItem('nexus-version', ADMIN_CONFIG.version);
        
        // Afficher un message d'information
        afficherAlerte(`Mise à jour vers la version ${ADMIN_CONFIG.version} effectuée avec succès.`, "info");
    }
}

// Ajouter la gestion des erreurs globales pour améliorer la stabilité
window.addEventListener('error', function(e) {
    if (ADMIN_CONFIG.debug) {
        console.error("Erreur globale:", e.message, e);
        
        // Afficher une alerte uniquement si c'est une erreur provenant de notre code
        if (e.filename && (e.filename.includes('admin.js') || e.filename.includes('nexus'))) {
            afficherAlerte(`Erreur détectée: ${e.message}. Veuillez rafraîchir la page si nécessaire.`, "danger");
        }
    }
});// Met à jour les références à un niveau dans les sous-cartes et marqueurs
function mettreAJourReferencesNiveau(ancienOrdre, nouvelOrdre) {
    try {
        // Mettre à jour les sous-cartes
        const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
        if (sousCartesSauvegardees) {
            try {
                const sousCartesObj = JSON.parse(sousCartesSauvegardees);
                let modifie = false;
                
                // Parcourir toutes les sous-cartes
                Object.values(sousCartesObj).forEach(sc => {
                    if (sc.parent && sc.parent.niveau === ancienOrdre) {
                        sc.parent.niveau = nouvelOrdre;
                        modifie = true;
                    }
                });
                
                // Sauvegarder si des modifications ont été faites
                if (modifie) {
                    localStorage.setItem('nexus-sous-cartes', JSON.stringify(sousCartesObj));
                }
            } catch(e) {
                console.error("Erreur lors de la mise à jour des références de sous-cartes:", e);
            }
        }
        
        // Mettre à jour les marqueurs
        const marqueursSauvegardes = localStorage.getItem('nexus-marqueurs');
        if (marqueursSauvegardes) {
            try {
                const marqueurs = JSON.parse(marqueursSauvegardes);
                
                // Vérifier s'il y a des marqueurs sur ce niveau
                if (marqueurs[ancienOrdre]) {
                    // Créer le nouvel ordre s'il n'existe pas
                    if (!marqueurs[nouvelOrdre]) {
                        marqueurs[nouvelOrdre] = {};
                    }
                    
                    // Déplacer chaque marqueur au nouveau niveau
                    Object.entries(marqueurs[ancienOrdre]).forEach(([id, marqueur]) => {
                        marqueur.niveau = nouvelOrdre;
                        marqueurs[nouvelOrdre][id] = marqueur;
                    });
                    
                    // Supprimer les marqueurs de l'ancien niveau
                    delete marqueurs[ancienOrdre];
                    
                    // Sauvegarder les modifications
                    localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueurs));
                }
            } catch(e) {
                console.error("Erreur lors de la mise à jour des références de marqueurs:", e);
            }
        }
    } catch(e) {
        console.error("Erreur lors de la mise à jour des références de niveau:", e);
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
                    chemin: 'cartes/lieux/taverne-dragon.svg',
                    parent: {
                        niveau: 0,
                        position: { x: 540, y: 400 }
                    },
                    visible: true,
                    description: 'Une taverne animée au cœur du quartier marchand.'
                },
                'temple-lune': {
                    nom: 'Temple de la Lune',
                    chemin: 'cartes/lieux/temple-lune.svg',
                    parent: {
                        niveau: 0,
                        position: { x: 1450, y: 400 }
                    },
                    visible: true,
                    description: 'Un lieu sacré dédié au culte de la Lune.'
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
        const ligne = document.createElement('a');
        ligne.href = "#";
        ligne.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        
        // Trouver le nom du niveau parent
        let nomNiveauParent = "Inconnu";
        if (sousCarte.parent && sousCarte.parent.niveau !== undefined) {
            const niveauParentObj = niveaux.find(n => n.ordre === sousCarte.parent.niveau);
            if (niveauParentObj) {
                nomNiveauParent = niveauParentObj.nom;
            }
        }
        
        ligne.innerHTML = `
            <div>
                <span>${sousCarte.nom}</span>
                <small class="d-block text-muted">Niveau parent: ${nomNiveauParent}</small>
                <small class="d-block text-muted">${sousCarte.chemin}</small>
            </div>
            <div class="d-flex align-items-center">
                <div class="form-check form-switch me-3">
                    <input class="form-check-input sous-carte-visible" type="checkbox" id="visible-sc-${id}" 
                        ${sousCarte.visible ? 'checked' : ''} data-id="${id}">
                    <label class="form-check-label" for="visible-sc-${id}">
                        Visible
                    </label>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary btn-edit-sous-carte" data-id="${id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-sous-carte" data-id="${id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        conteneur.appendChild(ligne);
    });
    
    // Ajouter les gestionnaires d'événements
    setupBoutonsSousCartes();
}

// Configure les boutons d'action pour les sous-cartes
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
            confirmerSuppressionSousCarte(id);
        });
    });
    
    // Interrupteurs de visibilité
    document.querySelectorAll('.sous-carte-visible').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.getAttribute('data-id');
            toggleVisibiliteSousCarte(id, this.checked);
        });
    });
}

// Confirmation avant suppression d'une sous-carte
function confirmerSuppressionSousCarte(id) {
    if (!sousCartes[id]) return;
    
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
    
    const nomSousCarte = sousCartes[id].nom;
    let message = `Êtes-vous sûr de vouloir supprimer la sous-carte "${nomSousCarte}" ?`;
    
    if (marqueursTrouves) {
        message = `Attention: Des marqueurs font référence à cette sous-carte "${nomSousCarte}". La suppression pourrait affecter ces marqueurs. Continuer quand même ?`;
    }
    
    if (confirm(message)) {
        supprimerSousCarte(id);
    }
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
    document.getElementById('sous-carte-fichier').value = sousCarte.chemin.split('/').pop();
    
    // Mettre à jour le sélecteur de niveau parent
    const selectNiveauParent = document.getElementById('sous-carte-parent');
    if (selectNiveauParent) {
        // Remplir le sélecteur avec les niveaux disponibles
        selectNiveauParent.innerHTML = '';
        
        // Trier les niveaux par ordre
        const niveauxTries = [...niveaux].sort((a, b) => b.ordre - a.ordre);
        
        niveauxTries.forEach(niveau => {
            const option = document.createElement('option');
            option.value = niveau.ordre;
            option.textContent = niveau.nom;
            option.selected = sousCarte.parent && sousCarte.parent.niveau === niveau.ordre;
            selectNiveauParent.appendChild(option);
        });
    }
    
    document.getElementById('sous-carte-visible').checked = sousCarte.visible || false;
    
    // Afficher l'aperçu du fichier actuel
    const apercuContainer = document.getElementById('sous-carte-apercu');
    if (apercuContainer) {
        apercuContainer.innerHTML = `
            <p class="text-muted">Fichier actuel: ${sousCarte.chemin.split('/').pop()}</p>
            <p class="text-muted">Chemin: ${sousCarte.chemin}</p>
        `;
    }
    
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
    
    // Mettre à jour le sélecteur de niveau parent
    const selectNiveauParent = document.getElementById('sous-carte-parent');
    if (selectNiveauParent) {
        // Remplir le sélecteur avec les niveaux disponibles
        selectNiveauParent.innerHTML = '';
        
        // Trier les niveaux par ordre
        const niveauxTries = [...niveaux].sort((a, b) => b.ordre - a.ordre);
        
        niveauxTries.forEach(niveau => {
            const option = document.createElement('option');
            option.value = niveau.ordre;
            option.textContent = niveau.nom;
            selectNiveauParent.appendChild(option);
        });
        
        // Sélectionner le premier niveau par défaut
        if (niveauxTries.length > 0) {
            selectNiveauParent.value = niveauxTries[0].ordre;
        }
    }
    
    // Vider l'aperçu
    const apercuContainer = document.getElementById('sous-carte-apercu');
    if (apercuContainer) {
        apercuContainer.innerHTML = '';
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
        // Mettre à jour tous les marqueurs qui référencent cette sous-carte
        const marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
        let modificationsFaites = false;
        
        // Parcourir tous les niveaux et marqueurs
        Object.values(marqueursSauvegardes).forEach(marqueurNiveau => {
            Object.values(marqueurNiveau).forEach(marqueur => {
                if (marqueur.interaction && 
                    marqueur.interaction.type === 'sous-carte' && 
                    marqueur.interaction.contenu && 
                    marqueur.interaction.contenu.sousCarte === id) {
                    
                    // Convertir en marqueur popup simple
                    marqueur.interaction.type = 'popup';
                    marqueur.interaction.contenu = {
                        description: `Référence à la sous-carte supprimée: ${nom}`,
                        details: `Cette sous-carte n'est plus disponible.`
                    };
                    
                    modificationsFaites = true;
                }
            });
        });
        
        // Sauvegarder les modifications des marqueurs si nécessaire
        if (modificationsFaites) {
            localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueursSauvegardes));
        }
        
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
    const fichierNom = document.getElementById('sous-carte-fichier').value.trim();
    const niveauParent = parseInt(document.getElementById('sous-carte-parent').value);
    const visible = document.getElementById('sous-carte-visible').checked;
    
    // Validation
    if (!nom || !identifiant || !fichierNom || isNaN(niveauParent)) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "danger");
        return false;
    }
    
    // Valider l'identifiant (lettres, chiffres, tirets et underscores uniquement)
    if (!/^[a-z0-9\-_]+$/.test(identifiant)) {
        afficherAlerte("L'identifiant ne peut contenir que des lettres minuscules, chiffres, tirets et underscores", "danger");
        return false;
    }
    
    // Si c'est une nouvelle sous-carte, vérifier que l'identifiant n'existe pas déjà
    if (isNew && sousCartes[identifiant]) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    // Vérifier que le niveau parent existe
    const niveauParentExiste = niveaux.some(n => n.ordre === niveauParent);
    if (!niveauParentExiste) {
        afficherAlerte("Le niveau parent sélectionné n'existe pas", "danger");
        return false;
    }
    
    try {
        // Construire le chemin complet du fichier
        let chemin = `cartes/lieux/${fichierNom}`;
        
        // S'assurer que le fichier a l'extension .svg
        if (!chemin.toLowerCase().endsWith('.svg')) {
            chemin += '.svg';
        }
        
        // Récupérer les coordonnées de position depuis la sous-carte existante ou utiliser des valeurs par défaut
        let position = { x: 500, y: 500 };
        if (!isNew && sousCartes[id] && sousCartes[id].parent && sousCartes[id].parent.position) {
            position = sousCartes[id].parent.position;
        }
        
        // Créer/modifier la sous-carte
        sousCartes[identifiant] = {
            nom: nom,
            chemin: chemin,
            parent: {
                niveau: niveauParent,
                position: position
            },
            visible: visible,
            description: ''
        };
        
        // Si c'est une édition et que l'identifiant a changé, mettre à jour les marqueurs et supprimer l'ancien
        if (!isNew && identifiant !== id) {
            // Mettre à jour les marqueurs qui référencent cette sous-carte
            const marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
            let modificationsFaites = false;
            
            // Parcourir tous les niveaux et marqueurs
            Object.values(marqueursSauvegardes).forEach(marqueurNiveau => {
                Object.values(marqueurNiveau).forEach(marqueur => {
                    if (marqueur.interaction && 
                        marqueur.interaction.type === 'sous-carte' && 
                        marqueur.interaction.contenu && 
                        marqueur.interaction.contenu.sousCarte === id) {
                        
                        // Mettre à jour l'identifiant de la sous-carte
                        marqueur.interaction.contenu.sousCarte = identifiant;
                        modificationsFaites = true;
                    }
                });
            });
            
            // Sauvegarder les modifications des marqueurs si nécessaire
            if (modificationsFaites) {
                localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueursSauvegardes));
            }
            
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
    
    // Bouton pour sauvegarder un type
    const btnSauvegarderType = document.getElementById('btn-sauvegarder-type');
    if (btnSauvegarderType) {
        btnSauvegarderType.addEventListener('click', function() {
            sauvegarderTypeMarqueur();
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
    
    // Bouton pour sauvegarder un niveau
    const btnSauvegarderNiveau = document.getElementById('btn-sauvegarder-niveau');
    if (btnSauvegarderNiveau) {
        btnSauvegarderNiveau.addEventListener('click', function() {
            sauvegarderNiveau();
        });
    }
    
    // Bouton pour supprimer un niveau
    const btnSupprimerNiveau = document.getElementById('btn-supprimer-niveau');
    if (btnSupprimerNiveau) {
        btnSupprimerNiveau.addEventListener('click', function() {
            const id = document.getElementById('niveau-edit-id').value;
            if (id && id !== 'nouveau') {
                confirmerSuppressionNiveau(id);
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
    
    // Bouton pour sauvegarder une sous-carte
    const btnSauvegarderSousCarte = document.getElementById('btn-sauvegarder-sous-carte');
    if (btnSauvegarderSousCarte) {
        btnSauvegarderSousCarte.addEventListener('click', function() {
            sauvegarderSousCarte();
        });
    }
    
    // Bouton pour supprimer une sous-carte
    const btnSupprimerSousCarte = document.getElementById('btn-supprimer-sous-carte');
    if (btnSupprimerSousCarte) {
        btnSupprimerSousCarte.addEventListener('click', function() {
            const id = document.getElementById('sous-carte-edit-id').value;
            if (id && id !== 'nouveau') {
                confirmerSuppressionSousCarte(id);
            }
        });
    }
    
    // === Boutons d'export/import ===
    setupBoutonsExportImport();
    
    // === Onglets du panneau d'administration ===
    setupOnglets();
}/**
 * Script pour le panneau d'administration de la carte de Nexus
 * Ce fichier gère les fonctionnalités d'administration pour:
 * - Types de marqueurs
 * - Cartes et niveaux
 * - Configuration des interfaces MJ/Joueurs
 * Version 4.1 - Avec gestionnaire d'icônes amélioré
 */

// Configuration globale
let ADMIN_CONFIG = {
    utilisateur: {
        role: 'mj',
        id: 'admin',
        nom: 'Maître de Jeu'
    },
    version: '4.1.0',
    debug: true
};

// Structure de données pour les types de marqueurs
let typesMarqueurs = {};

// Structure de données pour les niveaux et sous-cartes
let niveaux = [];
let sousCartes = {};

// Structure pour stocker les icônes SVG disponibles organisées par catégorie
let iconesSVG = {};
let iconesSVGParCategorie = {};

// Liste des catégories d'icônes avec leurs chemins
const CATEGORIES_ICONES = {
    'batiments': {
        nom: 'Bâtiments',
        dossier: 'Structure et batiments'
    },
    'personnages': {
        nom: 'Personnages',
        dossier: 'corps et personnages'
    },
    'armes': {
        nom: 'Armes',
        dossier: 'Armes'
    },
    'pieges': {
        nom: 'Pièges',
        dossier: 'Piege'
    },
    'symboles': {
        nom: 'Symboles',
        dossier: 'icone symbole'
    }
};

// Liste des fichiers SVG disponibles dans chaque dossier
// Cette information sera utilisée pour simuler un scan de dossier
const FICHIERS_ICONES = {
    'Structure et batiments': [
        { fichier: 'medieval-village-01.svg', nom: 'Taverne' },
        { fichier: 'ancient-columns.svg', nom: 'Temple' },
        { fichier: 'village.svg', nom: 'Commerce' },
        { fichier: 'house.svg', nom: 'Résidence' },
        { fichier: 'house.svg', nom: 'Banque' },
        { fichier: 'clock-tower.svg', nom: 'Tour d\'horloge' },
        { fichier: 'hospital.svg', nom: 'Hôpital' },
        { fichier: '3d-stairs.svg', nom: 'Escaliers' },
        { fichier: 'ancient-ruins.svg', nom: 'Ruines' },
        { fichier: 'barracks-tent.svg', nom: 'Tente militaire' },
        { fichier: 'damaged-house.svg', nom: 'Maison endommagée' },
        { fichier: 'elven-castle.svg', nom: 'Château elfique' },
        { fichier: 'graveyard.svg', nom: 'Cimetière' },
        { fichier: 'player-base.svg', nom: 'Base de joueur' },
        { fichier: 'treehouse.svg', nom: 'Maison dans les arbres' }
    ],
    'corps et personnages': [
        { fichier: 'blacksmith.svg', nom: 'Forgeron' },
        { fichier: 'robber.svg', nom: 'Voleur' },
        { fichier: 'hooded-assassin.svg', nom: 'Assassin' },
        { fichier: 'cavalry.svg', nom: 'Cavalier' },
        { fichier: 'caveman.svg', nom: 'Homme des cavernes' },
        { fichier: 'enrage.svg', nom: 'Enragé' },
        { fichier: 'falling.svg', nom: 'Personnage tombant' },
        { fichier: 'fat.svg', nom: 'Personnage corpulent' },
        { fichier: 'kneeling.svg', nom: 'Personnage à genoux' },
        { fichier: 'skeleton.svg', nom: 'Squelette' }
    ],
    'Armes': [
        { fichier: 'crossed-swords.svg', nom: 'Épée' },
        { fichier: 'bow-arrow.svg', nom: 'Arc' },
        { fichier: 'dagger-rose.svg', nom: 'Dague' },
        { fichier: 'backstab.svg', nom: 'Attaque sournoise' },
        { fichier: 'crossbow.svg', nom: 'Arbalète' },
        { fichier: 'drop-weapon.svg', nom: 'Arme tombée' },
        { fichier: 'kusarigama.svg', nom: 'Kusarigama' },
        { fichier: 'mace-head.svg', nom: 'Masse' },
        { fichier: 'scythe.svg', nom: 'Faux' },
        { fichier: 'sharp-axe.svg', nom: 'Hache affûtée' },
        { fichier: 'shuriken.svg', nom: 'Shuriken' },
        { fichier: 'skull-staff.svg', nom: 'Bâton crâne' },
        { fichier: 'slavery-whip.svg', nom: 'Fouet' },
        { fichier: 'spiked-mace.svg', nom: 'Masse à pointes' },
        { fichier: 'sword-clash.svg', nom: 'Épées croisées' },
        { fichier: 'war-axe.svg', nom: 'Hache de guerre' },
        { fichier: 'winged-scepter.svg', nom: 'Sceptre ailé' },
        { fichier: 'winged-sword.svg', nom: 'Épée ailée' }
    ],
    'Piege': [
        { fichier: 'spikes-full.svg', nom: 'Piège' },
        { fichier: 'cage.svg', nom: 'Cage' },
        { fichier: 'lever.svg', nom: 'Levier' },
        { fichier: 'blood-trap.svg', nom: 'Piège sanglant' },
        { fichier: 'boulder-dash.svg', nom: 'Rocher' },
        { fichier: 'door-watcher.svg', nom: 'Porte surveillée' },
        { fichier: 'handcuffs.svg', nom: 'Menottes' },
        { fichier: 'minefield.svg', nom: 'Champ de mines' },
        { fichier: 'spiked-trunk.svg', nom: 'Tronc à pointes' },
        { fichier: 'spikes-half.svg', nom: 'Demi-pointes' },
        { fichier: 'spikes-init.svg', nom: 'Pointes initiales' },
        { fichier: 'spiky-pit.svg', nom: 'Fosse à pointes' },
        { fichier: 'stakes-fence.svg', nom: 'Clôture de pieux' }
    ],
    'icone symbole': [
        { fichier: 'skull-crossed-bones.svg', nom: 'Secret' },
        { fichier: 'maze-cornea.svg', nom: 'Labyrinthe' },
        { fichier: 'help.svg', nom: 'Aide' },
        { fichier: 'conversation.svg', nom: 'Dialogue' },
        { fichier: 'biohazard.svg', nom: 'Danger biologique' },
        { fichier: 'divided-spiral.svg', nom: 'Spirale divisée' },
        { fichier: 'lambda.svg', nom: 'Lambda' },
        { fichier: 'pentagram-rose.svg', nom: 'Pentagramme rose' },
        { fichier: 'rss.svg', nom: 'RSS' },
        { fichier: 'stop-sign.svg', nom: 'Panneau stop' },
        { fichier: 'wanted-reward.svg', nom: 'Avis de recherche' },
        { fichier: 'yin-yang.svg', nom: 'Yin-Yang' }
    ]
};

// État de l'interface
let etatInterface = {
    ongletActif: 'tab-types',
    filtres: {},
    modals: {}
};

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
    
    // Restaurer l'état de l'interface
    restaurerEtatInterface();
    
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

/**
 * Charge toutes les icônes disponibles et organise l'interface pour leur sélection
 */
async function chargerIconesSVG() {
    console.log("Chargement des icônes SVG...");
    
    // Simuler le scan des dossiers en utilisant les données prédéfinies
    await scanIcones();
    
    // Configurer l'interface pour la sélection des icônes
    configurerInterfaceIcones();
    
    console.log("Icônes SVG chargées:", Object.keys(iconesSVG).length);
    return true;
}

/**
 * Simule un scan des dossiers d'icônes
 * Dans une vraie application, cela pourrait faire un appel AJAX
 * pour récupérer la liste des fichiers depuis le serveur
 */
async function scanIcones() {
    // Vider les collections d'icônes
    iconesSVG = {};
    iconesSVGParCategorie = {};
    
    // Initialiser chaque catégorie
    Object.keys(CATEGORIES_ICONES).forEach(categorie => {
        iconesSVGParCategorie[categorie] = {};
    });
    
    // Pour chaque catégorie, scanner les icônes disponibles
    Object.entries(CATEGORIES_ICONES).forEach(([cleCategorie, infoCategorie]) => {
        const dossier = infoCategorie.dossier;
        const fichiers = FICHIERS_ICONES[dossier] || [];
        
        // Traiter chaque fichier dans ce dossier
        fichiers.forEach(({ fichier, nom }) => {
            // Créer un ID unique pour cette icône
            const id = `${cleCategorie}-${fichier.replace('.svg', '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            
            // Chemin complet vers l'icône
            const chemin = `assets/icons/${dossier}/${fichier}`;
            
            // Ajouter à la collection globale
            iconesSVG[id] = {
                id: id,
                nom: nom,
                chemin: chemin,
                categorie: cleCategorie
            };
            
            // Ajouter à la collection par catégorie
            iconesSVGParCategorie[cleCategorie][id] = iconesSVG[id];
        });
    });
    
    // Simuler un délai de chargement comme le ferait une vraie requête réseau
    return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Configure l'interface utilisateur pour la sélection des icônes
 */
function configurerInterfaceIcones() {
    // Obtenir le conteneur modal pour les icônes
    const modalContent = document.querySelector('#modalNouveauType .modal-body');
    if (!modalContent) {
        console.warn("Conteneur modal pour les icônes non trouvé");
        return;
    }
    
    // Créer le conteneur principal des icônes
    const conteneurIcones = document.createElement('div');
    conteneurIcones.id = 'icones-selection-container';
    conteneurIcones.className = 'icones-selection-container mt-3 mb-3 border rounded p-3 bg-light';
    
    // Ajouter la barre de recherche
    const barreRecherche = document.createElement('div');
    barreRecherche.className = 'mb-3';
    barreRecherche.innerHTML = `
        <label for="recherche-icone" class="form-label">Rechercher une icône:</label>
        <div class="input-group">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input type="text" class="form-control" id="recherche-icone" placeholder="Nom de l'icône...">
        </div>
    `;
    conteneurIcones.appendChild(barreRecherche);
    
    // Créer les onglets pour les catégories
    const onglets = document.createElement('ul');
    onglets.className = 'nav nav-tabs mb-3';
    onglets.id = 'icones-categories-tabs';
    onglets.setAttribute('role', 'tablist');
    
    // Ajouter un onglet pour "Toutes les icônes"
    onglets.innerHTML = `
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="toutes-tab" data-bs-toggle="tab" 
                    data-bs-target="#toutes-icones" type="button" role="tab" 
                    aria-controls="toutes-icones" aria-selected="true">
                Toutes (${Object.keys(iconesSVG).length})
            </button>
        </li>
    `;
    
    // Ajouter un onglet pour chaque catégorie
    Object.entries(CATEGORIES_ICONES).forEach(([cleCategorie, infoCategorie], index) => {
        const nombreIcones = Object.keys(iconesSVGParCategorie[cleCategorie]).length;
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.setAttribute('role', 'presentation');
        
        li.innerHTML = `
            <button class="nav-link" id="${cleCategorie}-tab" data-bs-toggle="tab" 
                    data-bs-target="#${cleCategorie}-icones" type="button" role="tab" 
                    aria-controls="${cleCategorie}-icones" aria-selected="false">
                ${infoCategorie.nom} (${nombreIcones})
            </button>
        `;
        
        onglets.appendChild(li);
    });
    
    conteneurIcones.appendChild(onglets);
    
    // Créer le contenu des onglets
    const contenuOnglets = document.createElement('div');
    contenuOnglets.className = 'tab-content';
    contenuOnglets.id = 'icones-categories-content';
    
    // Contenu de l'onglet "Toutes les icônes"
    const ongletToutes = document.createElement('div');
    ongletToutes.className = 'tab-pane fade show active';
    ongletToutes.id = 'toutes-icones';
    ongletToutes.setAttribute('role', 'tabpanel');
    ongletToutes.setAttribute('aria-labelledby', 'toutes-tab');
    
    // Grille pour afficher toutes les icônes
    const grilleToutes = creerGrilleIcones(Object.values(iconesSVG));
    ongletToutes.appendChild(grilleToutes);
    contenuOnglets.appendChild(ongletToutes);
    
    // Contenu pour chaque catégorie
    Object.entries(CATEGORIES_ICONES).forEach(([cleCategorie, infoCategorie]) => {
        const ongletCategorie = document.createElement('div');
        ongletCategorie.className = 'tab-pane fade';
        ongletCategorie.id = `${cleCategorie}-icones`;
        ongletCategorie.setAttribute('role', 'tabpanel');
        ongletCategorie.setAttribute('aria-labelledby', `${cleCategorie}-tab`);
        
        // Grille pour afficher les icônes de cette catégorie
        const grilleCategorie = creerGrilleIcones(Object.values(iconesSVGParCategorie[cleCategorie]));
        ongletCategorie.appendChild(grilleCategorie);
        contenuOnglets.appendChild(ongletCategorie);
    });
    
    conteneurIcones.appendChild(contenuOnglets);
    
    // Ajouter la note explicative
    const noteExplicative = document.createElement('div');
    noteExplicative.className = 'text-muted small mt-2';
    noteExplicative.innerHTML = 'Cliquez sur une icône pour la sélectionner. Les icônes sont regroupées par catégorie.';
    conteneurIcones.appendChild(noteExplicative);
    
    // Ajouter l'aperçu de l'icône sélectionnée
    const apercu = document.createElement('div');
    apercu.className = 'mt-3 border-top pt-3';
    apercu.innerHTML = `
        <label class="form-label">Icône sélectionnée:</label>
        <div id="apercu-icone" class="d-flex align-items-center p-2 border rounded">
            <i class="fas fa-map-marker me-2"></i>
            <span id="nom-icone-selection">Aucune icône sélectionnée</span>
        </div>
    `;
    conteneurIcones.appendChild(apercu);
    
    // Trouver l'input caché pour l'icône
    const typeIconeInput = document.getElementById('type-icone');
    if (typeIconeInput) {
        // Insérer notre conteneur
        const formGroup = typeIconeInput.closest('.mb-3');
        formGroup.parentNode.insertBefore(conteneurIcones, formGroup);
        
        // Masquer le champ texte d'icône (on utilise uniquement la grille)
        typeIconeInput.type = 'hidden';
        formGroup.style.display = 'none';
    } else {
        // Fallback: ajouter à la fin du modal
        modalContent.appendChild(conteneurIcones);
    }
    
    // Configurer les gestionnaires d'événements
    configurerRechercheIcones();
}

/**
 * Crée une grille pour afficher les icônes
 * @param {Array} icones Liste des icônes à afficher
 * @returns {HTMLElement} Élément DOM contenant la grille d'icônes
 */
function creerGrilleIcones(icones) {
    const grille = document.createElement('div');
    grille.className = 'icones-grid';
    
    // Définir le style CSS pour la grille
    grille.style.display = 'grid';
    grille.style.gridTemplateColumns = 'repeat(5, 1fr)';
    grille.style.gap = '10px';
    grille.style.maxHeight = '350px';
    grille.style.overflowY = 'auto';
    
    // Ajouter chaque icône à la grille
    icones.forEach(icone => {
        const iconeElement = document.createElement('div');
        iconeElement.className = 'icone-svg-item text-center p-2 border rounded';
        iconeElement.dataset.id = icone.id;
        iconeElement.dataset.nom = icone.nom;
        iconeElement.dataset.chemin = icone.chemin;
        iconeElement.style.cursor = 'pointer';
        
        // L'aspect visuel de l'élément icône
        iconeElement.innerHTML = `
            <div class="icone-container d-flex justify-content-center align-items-center mb-2" style="height: 40px;">
                <img src="${icone.chemin}" alt="${icone.nom}" style="max-width: 30px; max-height: 30px;">
            </div>
            <div class="small">${icone.nom}</div>
        `;
        
        // Ajouter l'événement de clic pour sélectionner cette icône
        iconeElement.addEventListener('click', function() {
            // Désélectionner tous les items
            document.querySelectorAll('.icone-svg-item').forEach(item => {
                item.classList.remove('border-primary', 'bg-light');
            });
            
            // Sélectionner celui-ci
            this.classList.add('border-primary', 'bg-light');
            
            // Mettre à jour l'input caché
            document.getElementById('type-icone').value = this.dataset.id;
            
            // Mettre à jour l'aperçu
            const apercu = document.getElementById('apercu-icone');
            if (apercu) {
                apercu.innerHTML = `
                    <img src="${this.dataset.chemin}" alt="${this.dataset.nom}" style="width:20px;height:20px;" class="me-2">
                    <span id="nom-icone-selection">${this.dataset.nom}</span>
                `;
            }
        });
        
        grille.appendChild(iconeElement);
    });
    
    return grille;
}

/**
 * Configure la fonction de recherche d'icônes
 */
function configurerRechercheIcones() {
    const inputRecherche = document.getElementById('recherche-icone');
    if (!inputRecherche) return;
    
    inputRecherche.addEventListener('input', function() {
        const terme = this.value.trim().toLowerCase();
        
        // Si le terme de recherche est vide, réinitialiser l'affichage
        if (!terme) {
            document.querySelectorAll('.icone-svg-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        // Filtrer les icônes en fonction du terme de recherche
        document.querySelectorAll('.icone-svg-item').forEach(item => {
            const nom = item.dataset.nom.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            
            if (nom.includes(terme) || id.includes(terme)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
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
        let cheminIcone = '';
        let iconeId = type.icone;
        
        // Si c'est un ID spécifique de notre nouvelle structure (comme "batiments-medieval-village-01")
        if (iconeId && iconesSVG[iconeId]) {
            cheminIcone = iconesSVG[iconeId].chemin;
        } 
        // Si c'est un ancien ID simple (comme "taverne")
        else if (iconeId) {
            // Chercher une correspondance dans les icônes par nom
            const icone = Object.values(iconesSVG).find(i => 
                i.nom.toLowerCase() === iconeId.toLowerCase() || 
                i.id.includes(iconeId.toLowerCase())
            );
            
            if (icone) {
                cheminIcone = icone.chemin;
            } else {
                // Essayer de construire le chemin à partir des dossiers connus
                const dossiers = [
                    "Structure et batiments",
                    "Armes",
                    "corps et personnages",
                    "icone symbole",
                    "Piege"
                ];
                
                for (const dossier of dossiers) {
                    const fichiers = FICHIERS_ICONES[dossier];
                    if (fichiers) {
                        const fichier = fichiers.find(f => 
                            f.nom.toLowerCase() === iconeId.toLowerCase() || 
                            f.fichier.includes(iconeId.toLowerCase())
                        );
                        
                        if (fichier) {
                            cheminIcone = `assets/icons/${dossier}/${fichier.fichier}`;
                            break;
                        }
                    }
                }
                
                // Si toujours pas trouvé, utiliser un chemin par défaut
                if (!cheminIcone) {
                    cheminIcone = 'assets/icons/Structure et batiments/house.svg'; // Icône par défaut
                }
            }
        }
        
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
            <td>
                <div class="d-flex align-items-center">
                    <img src="${cheminIcone}" alt="${type.icone}" style="width:20px;height:20px;margin-right:8px;"> 
                    ${type.icone || 'Aucune'}
                </div>
            </td>
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

// Vérifie si un fichier existe (synchrone - simplifié pour l'exemple)
function verifierExistenceFichier(chemin) {
    // Cette fonction est une simplification, dans un cas réel il faudrait faire une requête AJAX
    // Pour l'exemple, on suppose que les fichiers standard existent
    return true;
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
            confirmerSuppressionType(id);
        });
    });
}

// Confirmation avant suppression d'un type de marqueur
function confirmerSuppressionType(id) {
    if (!typesMarqueurs[id]) return;
    
    // Vérifier d'abord si des marqueurs utilisent ce type
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
    
    const nomType = typesMarqueurs[id].nom;
    let message = `Êtes-vous sûr de vouloir supprimer le type "${nomType}" ?`;
    
    if (marqueursTrouves) {
        message = `Attention: Des marqueurs utilisent ce type "${nomType}". La suppression pourrait affecter ces marqueurs. Continuer quand même ?`;
    }
    
    if (confirm(message)) {
        supprimerTypeMarqueur(id);
    }
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
    
    // Trouver l'icône dans la nouvelle structure
    let iconeInfo = null;
    
    // Chercher d'abord par ID exact
    if (iconesSVG[type.icone]) {
        iconeInfo = iconesSVG[type.icone];
    } else {
        // Chercher par nom ou id partiel
        iconeInfo = Object.values(iconesSVG).find(i => 
            i.nom.toLowerCase() === type.icone.toLowerCase() || 
            i.id.includes(type.icone.toLowerCase())
        );
    }
    
    // Mettre à jour l'aperçu de l'icône SVG
    let cheminIcone = '';
    if (iconeInfo) {
        cheminIcone = iconeInfo.chemin;
    } else {
        // Construire un chemin par défaut ou utiliser le fallback
        cheminIcone = 'assets/icons/Structure et batiments/house.svg';
    }
    
    const apercuIcone = document.getElementById('apercu-icone');
    if (apercuIcone) {
        apercuIcone.innerHTML = cheminIcone ? 
            `<img src="${cheminIcone}" alt="${type.icone}" style="width:20px;height:20px;" class="me-2">
             <span id="nom-icone-selection">${type.icone}</span>` :
            '<i class="fas fa-map-marker me-2"></i><span id="nom-icone-selection">Aucune icône sélectionnée</span>';
    }
    
    // Sélectionner l'icône dans la grille
    document.querySelectorAll('.icone-svg-item').forEach(item => {
        item.classList.remove('border-primary', 'bg-light');
        
        if (iconeInfo && item.dataset.id === iconeInfo.id) {
            item.classList.add('border-primary', 'bg-light');
        } else if (item.dataset.id === type.icone || item.dataset.nom.toLowerCase() === type.icone.toLowerCase()) {
            item.classList.add('border-primary', 'bg-light');
        }
    });
    
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
    const apercuIcone = document.getElementById('apercu-icone');
    if (apercuIcone) {
        apercuIcone.innerHTML = '<i class="fas fa-map-marker me-2"></i><span id="nom-icone-selection">Aucune icône sélectionnée</span>';
    }
    
    // Désélectionner toutes les icônes
    document.querySelectorAll('.icone-svg-item').forEach(item => {
        item.classList.remove('border-primary', 'bg-light');
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
    
    // Valider l'identifiant (lettres, chiffres, tirets et underscores uniquement)
    if (!/^[a-z0-9\-_]+$/.test(identifiant)) {
        afficherAlerte("L'identifiant ne peut contenir que des lettres minuscules, chiffres, tirets et underscores", "danger");
        return false;
    }
    
    // Si c'est un nouveau type, vérifier que l'identifiant n'existe pas déjà
    if (isNew && typesMarqueurs[identifiant]) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    // Valider la couleur (format hexadécimal)
    if (!/^#[0-9A-F]{6}$/i.test(couleur)) {
        afficherAlerte("La couleur doit être au format hexadécimal (#RRGGBB)", "danger");
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
                    fichier: 'nexus-niveau-1.svg',
                    visible: true
                },
                {
                    id: 'egouts',
                    nom: 'Égouts',
                    ordre: -2,
                    fichier: 'nexus-niveau-2.svg',
                    visible: true
                },
                {
                    id: 'ruines',
                    nom: 'Ruines anciennes',
                    ordre: -3,
                    fichier: 'nexus-niveau-3.svg',
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
        const ligne = document.createElement('a');
        ligne.href = "#";
        ligne.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        
        ligne.innerHTML = `
            <div>
                <div class="niveau-indicateur">${niveau.ordre}</div>
                <span>${niveau.nom}</span>
                <small class="d-block text-muted">Fichier: ${niveau.fichier}</small>
            </div>
            <div class="d-flex align-items-center">
                <div class="form-check form-switch me-3">
                    <input class="form-check-input niveau-visible" type="checkbox" id="visible-${niveau.id}" 
                        ${niveau.visible ? 'checked' : ''} data-id="${niveau.id}">
                    <label class="form-check-label" for="visible-${niveau.id}">
                        Visible
                    </label>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary btn-edit-niveau" data-id="${niveau.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-niveau" data-id="${niveau.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
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
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            ouvrirModalEditionNiveau(id);
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete-niveau').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            confirmerSuppressionNiveau(id);
        });
    });
    
    // Interrupteurs de visibilité
    document.querySelectorAll('.niveau-visible').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.getAttribute('data-id');
            toggleVisibiliteNiveau(id, this.checked);
        });
    });
}

// Confirmation avant suppression d'un niveau
function confirmerSuppressionNiveau(id) {
    const niveau = niveaux.find(n => n.id === id);
    if (!niveau) return;
    
    // Vérifier d'abord si des sous-cartes sont attachées à ce niveau
    const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
    let sousCartesLiees = [];
    
    if (sousCartesSauvegardees) {
        try {
            const sousCartesObj = JSON.parse(sousCartesSauvegardees);
            sousCartesLiees = Object.values(sousCartesObj).filter(sc => 
                sc.parent && sc.parent.niveau === niveau.ordre
            );
        } catch(e) {
            console.error("Erreur lors de la vérification des sous-cartes:", e);
        }
    }
    
    // Vérifier si des marqueurs sont sur ce niveau
    const marqueursSauvegardes = localStorage.getItem('nexus-marqueurs');
    let marqueursSurNiveau = false;
    
    if (marqueursSauvegardes) {
        try {
            const marqueurs = JSON.parse(marqueursSauvegardes);
            if (marqueurs[niveau.ordre] && Object.keys(marqueurs[niveau.ordre]).length > 0) {
                marqueursSurNiveau = true;
            }
        } catch(e) {
            console.error("Erreur lors de la vérification des marqueurs:", e);
        }
    }
    
    let message = `Êtes-vous sûr de vouloir supprimer le niveau "${niveau.nom}" ?`;
    
    if (sousCartesLiees.length > 0 || marqueursSurNiveau) {
        message = `Attention: `;
        
        if (sousCartesLiees.length > 0) {
            message += `Ce niveau contient ${sousCartesLiees.length} sous-carte(s). `;
        }
        
        if (marqueursSurNiveau) {
            message += `Des marqueurs sont placés sur ce niveau. `;
        }
        
        message += `La suppression pourrait affecter ces éléments. Continuer quand même ?`;
    }
    
    if (confirm(message)) {
        supprimerNiveau(id);
    }
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
    
    const niveau = niveaux[index];
    const nom = niveau.nom;
    
    try {
        // Vérifier si des sous-cartes sont attachées à ce niveau
        const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
        if (sousCartesSauvegardees) {
            try {
                const sousCartesObj = JSON.parse(sousCartesSauvegardees);
                const sousCartesLiees = Object.entries(sousCartesObj).filter(([_, sc]) => 
                    sc.parent && sc.parent.niveau === niveau.ordre
                );
                
                // Mettre à jour ou supprimer les sous-cartes liées
                if (sousCartesLiees.length > 0) {
                    if (confirm(`Ce niveau contient ${sousCartesLiees.length} sous-carte(s). Voulez-vous toutes les supprimer ? Cliquez sur Annuler pour les conserver et les associer au niveau Surface.`)) {
                        // Supprimer les sous-cartes
                        sousCartesLiees.forEach(([id, _]) => {
                            delete sousCartesObj[id];
                        });
                    } else {
                        // Réassigner les sous-cartes au niveau 0 (Surface)
                        sousCartesLiees.forEach(([id, sc]) => {
                            sousCartesObj[id].parent.niveau = 0;
                        });
                    }
                    
                    // Sauvegarder les modifications
                    localStorage.setItem('nexus-sous-cartes', JSON.stringify(sousCartesObj));
                }
            } catch(e) {
                console.error("Erreur lors de la gestion des sous-cartes:", e);
            }
        }
        
        // Gérer les marqueurs sur ce niveau
        const marqueursSauvegardes = localStorage.getItem('nexus-marqueurs');
        if (marqueursSauvegardes) {
            try {
                const marqueurs = JSON.parse(marqueursSauvegardes);
                
                // Vérifier s'il y a des marqueurs sur ce niveau
                if (marqueurs[niveau.ordre] && Object.keys(marqueurs[niveau.ordre]).length > 0) {
                    if (confirm(`Des marqueurs sont placés sur ce niveau. Voulez-vous tous les supprimer ? Cliquez sur Annuler pour les conserver et les déplacer au niveau Surface.`)) {
                        // Supprimer les marqueurs de ce niveau
                        delete marqueurs[niveau.ordre];
                    } else {
                        // Déplacer les marqueurs au niveau 0 (Surface)
                        if (!marqueurs[0]) marqueurs[0] = {};
                        
                        // Copier chaque marqueur au niveau 0 et mettre à jour son niveau
                        Object.entries(marqueurs[niveau.ordre]).forEach(([id, marqueur]) => {
                            marqueur.niveau = 0;
                            marqueurs[0][id] = marqueur;
                        });
                        
                        // Supprimer les marqueurs de l'ancien niveau
                        delete marqueurs[niveau.ordre];
                    }
                    
                    // Sauvegarder les modifications
                    localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueurs));
                }
            } catch(e) {
                console.error("Erreur lors de la gestion des marqueurs:", e);
            }
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
    if (!nom || !identifiant || !fichier || isNaN(ordre)) {
        afficherAlerte("Veuillez remplir tous les champs obligatoires", "danger");
        return false;
    }
    
    // Valider l'identifiant (lettres, chiffres, tirets et underscores uniquement)
    if (!/^[a-z0-9\-_]+$/.test(identifiant)) {
        afficherAlerte("L'identifiant ne peut contenir que des lettres minuscules, chiffres, tirets et underscores", "danger");
        return false;
    }
    
    // Si c'est un nouveau niveau, vérifier que l'identifiant n'existe pas déjà
    if (isNew && niveaux.some(n => n.id === identifiant)) {
        afficherAlerte("Cet identifiant existe déjà", "danger");
        return false;
    }
    
    // Vérifier qu'il n'y a pas déjà un niveau avec le même ordre
    const niveauMemOrdre = niveaux.find(n => n.ordre === ordre && n.id !== id);
    if (niveauMemOrdre) {
        if (!confirm(`Le niveau "${niveauMemOrdre.nom}" utilise déjà l'ordre ${ordre}. Voulez-vous utiliser cet ordre quand même ?`)) {
            return false;
        }
    }
    
    try {
        // Structure du niveau à sauvegarder
        const nouveauNiveau = {
            id: identifiant,
            nom: nom,
            ordre: ordre,
            fichier: fichier,
            visible: visible
        };
        
        if (isNew) {
            // Ajouter le nouveau niveau
            niveaux.push(nouveauNiveau);
        } else {
            // Modifier le niveau existant
            const index = niveaux.findIndex(n => n.id === id);
            if (index !== -1) {
                // Si l'ordre a changé, mettre à jour les sous-cartes et marqueurs associés
                if (niveaux[index].ordre !== ordre) {
                    // Mettre à jour les sous-cartes
                    const ancienOrdre = niveaux[index].ordre;
                    mettreAJourReferencesNiveau(ancienOrdre, ordre);
                }
                
                niveaux[index] = nouveauNiveau;
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

// Met à jour les références à un niveau dans les sous-cartes et marqueurs
function mettreAJourReferencesNiveau(ancienOrdre, nouvelOrdre) {
    try {
        // Mettre à jour les sous-cartes
        const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
        if (sousCartesSauvegardees) {
            try {
                const sousCartesObj = JSON.parse(sousCartesSauvegardees);
                let modifie = false;
                
                // Parcourir toutes les sous-cartes
                Object.values(sousCartesObj).forEach(sc => {
                    if (sc.parent && sc.parent.niveau === ancienOrdre) {
                        sc.parent.niveau = nouvelOrdre;
                        modifie = true;
                    }
                });
                
                // Sauvegarder si des modifications ont été faites
                if (modifie) {
                    localStorage.setItem('nexus-sous-cartes', JSON.stringify(sousCartesObj));
                }
            } catch(e) {
                console.error("Erreur lors de la mise à jour des références de sous-cartes:", e);
            }
        }
        
        // Mettre à jour les marqueurs
        const marqueursSauvegardes = localStorage.getItem('nexus-marqueurs');
        if (marqueursSauvegardes) {
            try {
                const marqueurs = JSON.parse(marqueursSauvegardes);
                
                // Vérifier s'il y a des marqueurs sur ce niveau
                if (marqueurs[ancienOrdre]) {
                    // Créer le nouvel ordre s'il n'existe pas
                    if (!marqueurs[nouvelOrdre]) {
                        marqueurs[nouvelOrdre] = {};
                    }
                    
                    // Déplacer chaque marqueur au nouveau niveau
                    Object.entries(marqueurs[ancienOrdre]).forEach(([id, marqueur]) => {
                        marqueur.niveau = nouvelOrdre;
                        marqueurs[nouvelOrdre][id] = marqueur;
                    });
                    
                    // Supprimer les marqueurs de l'ancien niveau
                    delete marqueurs[ancienOrdre];
                    
                    // Sauvegarder les modifications
                    localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueurs));
                }
            } catch(e) {
                console.error("Erreur lors de la mise à jour des références de marqueurs:", e);
            }
        }
    } catch(e) {
        console.error("Erreur lors de la mise à jour des références de niveau:", e);
    }
}