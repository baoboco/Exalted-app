/**
 * Système d'export/import pour la carte de Nexus
 * Ce fichier gère l'exportation et l'importation des données de la carte,
 * des marqueurs, des notes, et des effets environnementaux.
 */

// Types de données qui peuvent être exportés/importés
const TYPES_DONNEES = {
    CONFIG: { id: 'config', nom: 'Configuration générale', stockage: 'nexus-config' },
    TYPES_MARQUEURS: { id: 'typesMarqueurs', nom: 'Types de marqueurs', stockage: 'nexus-types-marqueurs' },
    NIVEAUX: { id: 'niveaux', nom: 'Niveaux et cartes', stockage: 'nexus-niveaux' },
    SOUS_CARTES: { id: 'sousCartes', nom: 'Sous-cartes', stockage: 'nexus-sous-cartes' },
    MARQUEURS: { id: 'marqueurs', nom: 'Marqueurs', stockage: 'nexus-marqueurs' },
    NOTES: { id: 'notes', nom: 'Notes', stockage: 'nexus-notes' },
    EFFETS: { id: 'effets', nom: 'Effets environnementaux', stockage: 'nexus-effets' }
};

// Exporte toutes les données ou une sélection spécifique
function exporterDonnees(types = Object.values(TYPES_DONNEES).map(t => t.id)) {
    try {
        // Préparer l'objet d'export
        const donnees = {
            version: '1.0',
            date: new Date().toISOString(),
            createur: CONFIG.utilisateur.nom || CONFIG.utilisateur.id,
            donnees: {}
        };
        
        // Récupérer chaque type de données demandé
        types.forEach(typeId => {
            const typeInfo = Object.values(TYPES_DONNEES).find(t => t.id === typeId);
            if (!typeInfo) return;
            
            const donneesBrutes = localStorage.getItem(typeInfo.stockage);
            if (donneesBrutes) {
                try {
                    donnees.donnees[typeId] = JSON.parse(donneesBrutes);
                } catch (e) {
                    console.error(`Erreur lors du parsing des données "${typeId}":`, e);
                    donnees.donnees[typeId] = null;
                }
            }
        });
        
        // Convertir en chaîne JSON
        const jsonData = JSON.stringify(donnees, null, 2);
        
        // Créer un blob pour le téléchargement
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const date = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const filename = `nexus-export-${date}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return {
            success: true,
            message: "Export réussi",
            filename: filename
        };
    } catch (e) {
        console.error("Erreur lors de l'export des données:", e);
        return {
            success: false,
            message: "Erreur lors de l'export: " + e.message
        };
    }
}

// Importe des données précédemment exportées
async function importerDonnees(fichier, options = {}) {
    // Options par défaut
    const opt = {
        types: Object.values(TYPES_DONNEES).map(t => t.id), // Types à importer
        mode: 'fusion', // 'fusion' ou 'remplacement'
        confirmation: true, // Demander confirmation avant d'écraser
        ...options
    };
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Analyser le contenu JSON
                const contenu = JSON.parse(e.target.result);
                
                // Vérifier la validité du fichier
                if (!contenu.version || !contenu.donnees) {
                    throw new Error("Format de fichier d'import invalide");
                }
                
                // Pour chaque type de données à importer
                const resultats = {};
                let success = true;
                
                // Demander confirmation si nécessaire
                if (opt.confirmation) {
                    const typesNoms = opt.types
                        .map(typeId => Object.values(TYPES_DONNEES).find(t => t.id === typeId)?.nom || typeId)
                        .join(", ");
                        
                    if (!confirm(`Cette action remplacera les données suivantes : ${typesNoms}. Êtes-vous sûr de vouloir continuer ?`)) {
                        resolve({
                            success: false,
                            message: "Import annulé par l'utilisateur"
                        });
                        return;
                    }
                }
                
                // Traiter chaque type de données
                for (const typeId of opt.types) {
                    // Vérifier si ce type existe dans les données importées
                    if (!contenu.donnees[typeId]) {
                        resultats[typeId] = {
                            success: false,
                            message: `Type de données "${typeId}" non trouvé dans le fichier d'import`
                        };
                        continue;
                    }
                    
                    const typeInfo = Object.values(TYPES_DONNEES).find(t => t.id === typeId);
                    if (!typeInfo) continue;
                    
                    try {
                        // Récupérer les données actuelles
                        let donneesCourantes = {};
                        const donneesStockage = localStorage.getItem(typeInfo.stockage);
                        
                        if (donneesStockage && opt.mode === 'fusion') {
                            donneesCourantes = JSON.parse(donneesStockage);
                        }
                        
                        // Fusionner ou remplacer selon le mode
                        let nouvellesDonnees;
                        
                        if (opt.mode === 'fusion') {
                            // Mode fusion - combiner les données existantes et importées
                            nouvellesDonnees = await fusionnerDonnees(typeId, donneesCourantes, contenu.donnees[typeId]);
                        } else {
                            // Mode remplacement - utiliser uniquement les données importées
                            nouvellesDonnees = contenu.donnees[typeId];
                        }
                        
                        // Sauvegarder dans le stockage local
                        localStorage.setItem(typeInfo.stockage, JSON.stringify(nouvellesDonnees));
                        
                        resultats[typeId] = {
                            success: true,
                            message: `Import des données "${typeInfo.nom}" réussi`
                        };
                    } catch (err) {
                        resultats[typeId] = {
                            success: false,
                            message: `Erreur lors de l'import des données "${typeInfo.nom}": ${err.message}`
                        };
                        success = false;
                    }
                }
                
                // Si on est dans l'interface d'administration, rafraîchir les affichages
                if (window.location.pathname.includes('admin.html')) {
                    if (resultats.typesMarqueurs?.success) {
                        afficherTypesMarqueurs();
                    }
                    if (resultats.niveaux?.success) {
                        afficherNiveaux();
                    }
                    if (resultats.sousCartes?.success) {
                        afficherSousCartes();
                    }
                }
                
                resolve({
                    success: success,
                    message: success ? "Import réussi" : "Des erreurs sont survenues lors de l'import",
                    detailsResultats: resultats
                });
            } catch (err) {
                reject({
                    success: false,
                    message: "Erreur lors du traitement du fichier d'import: " + err.message
                });
            }
        };
        
        reader.onerror = function() {
            reject({
                success: false,
                message: "Erreur lors de la lecture du fichier"
            });
        };
        
        reader.readAsText(fichier);
    });
}

// Fonction pour fusionner intelligemment deux ensembles de données selon leur type
async function fusionnerDonnees(typeId, donneesCourantes, donneesImportees) {
    // Stratégie de fusion dépend du type de données
    switch (typeId) {
        case 'config':
            // Pour la config, utiliser les valeurs importées mais conserver l'utilisateur actuel
            return {
                ...donneesImportees,
                utilisateur: donneesCourantes.utilisateur
            };
            
        case 'typesMarqueurs':
        case 'sousCartes':
            // Pour les types de marqueurs et les sous-cartes, fusion simple des objets
            return { ...donneesCourantes, ...donneesImportees };
            
        case 'niveaux':
            // Pour les niveaux, fusion en préservant l'ordre
            return fusionnerTableauxParId(donneesCourantes, donneesImportees, 'id');
            
        case 'marqueurs':
            // Pour les marqueurs, fusion par niveau
            const niveauxFusionnes = {};
            
            // Récupérer tous les niveaux des deux ensembles
            const niveaux = new Set([
                ...Object.keys(donneesCourantes),
                ...Object.keys(donneesImportees)
            ]);
            
            // Pour chaque niveau, fusionner les marqueurs
            for (const niveau of niveaux) {
                niveauxFusionnes[niveau] = {
                    ...(donneesCourantes[niveau] || {}),
                    ...(donneesImportees[niveau] || {})
                };
            }
            
            return niveauxFusionnes;
            
        case 'notes':
        case 'effets':
            // Pour les notes et effets, fusion simple des objets
            return { ...donneesCourantes, ...donneesImportees };
            
        default:
            // Par défaut, remplacement simple
            return donneesImportees;
    }
}

// Fusion de deux tableaux d'objets en préservant l'ordre et en évitant les doublons
function fusionnerTableauxParId(tableau1, tableau2, idField = 'id') {
    // Créer un Map pour une recherche rapide
    const mapResultat = new Map();
    
    // Ajouter les éléments du premier tableau
    tableau1.forEach(item => {
        mapResultat.set(item[idField], item);
    });
    
    // Ajouter ou remplacer avec les éléments du second tableau
    tableau2.forEach(item => {
        mapResultat.set(item[idField], item);
    });
    
    // Convertir le Map en tableau
    return Array.from(mapResultat.values());
}

// Affiche l'interface d'export/import
function afficherInterfaceExportImport() {
    // Créer un modal pour l'interface
    const modalHtml = `
        <div class="modal fade" id="modalExportImport" tabindex="-1" aria-labelledby="modalExportImportLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalExportImportLabel">Export / Import des données</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="export-tab" data-bs-toggle="tab" data-bs-target="#export-panel" type="button" role="tab" aria-controls="export-panel" aria-selected="true">Export</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="import-tab" data-bs-toggle="tab" data-bs-target="#import-panel" type="button" role="tab" aria-controls="import-panel" aria-selected="false">Import</button>
                            </li>
                        </ul>
                        
                        <div class="tab-content pt-3">
                            <!-- Export Panel -->
                            <div class="tab-pane fade show active" id="export-panel" role="tabpanel" aria-labelledby="export-tab">
                                <p class="text-muted">Sélectionnez les données que vous souhaitez exporter :</p>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input export-option-all" type="checkbox" id="export-all" checked>
                                        <label class="form-check-label" for="export-all">
                                            <strong>Tout sélectionner</strong>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    ${Object.values(TYPES_DONNEES).map(type => `
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input export-option" type="checkbox" id="export-${type.id}" data-type="${type.id}" checked>
                                                <label class="form-check-label" for="export-${type.id}">
                                                    ${type.nom}
                                                </label>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i> Le fichier d'export contiendra toutes les données sélectionnées ci-dessus et pourra être importé ultérieurement.
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-primary" id="btn-exporter">
                                        <i class="fas fa-download"></i> Exporter les données
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Import Panel -->
                            <div class="tab-pane fade" id="import-panel" role="tabpanel" aria-labelledby="import-tab">
                                <p class="text-muted">Sélectionnez un fichier précédemment exporté :</p>
                                
                                <div class="mb-3">
                                    <input type="file" class="form-control" id="import-fichier" accept=".json">
                                </div>
                                
                                <div id="import-options" class="d-none">
                                    <p class="text-muted">Options d'import :</p>
                                    
                                    <div class="mb-3">
                                        <label class="form-label d-block">Mode d'import</label>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="import-mode" id="mode-fusion" value="fusion" checked>
                                            <label class="form-check-label" for="mode-fusion">Fusion (ajouter aux données existantes)</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="import-mode" id="mode-remplacement" value="remplacement">
                                            <label class="form-check-label" for="mode-remplacement">Remplacement (écraser les données existantes)</label>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input import-option-all" type="checkbox" id="import-all" checked>
                                            <label class="form-check-label" for="import-all">
                                                <strong>Tout sélectionner</strong>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3" id="import-type-options">
                                        <!-- Options de types d'import générées dynamiquement -->
                                    </div>
                                    
                                    <div class="alert alert-warning">
                                        <i class="fas fa-exclamation-triangle"></i> L'import remplacera ou fusionnera les données actuelles selon le mode choisi. Assurez-vous d'avoir une sauvegarde si nécessaire.
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        <button type="button" class="btn btn-primary" id="btn-importer">
                                            <i class="fas fa-upload"></i> Importer les données
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="import-preview" class="mt-3 d-none">
                                    <h6>Aperçu du fichier</h6>
                                    <div class="border rounded p-3 bg-light">
                                        <pre id="import-json-preview" style="max-height: 200px; overflow: auto;"></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter le modal au document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Initialiser le modal
    const modal = new bootstrap.Modal(document.getElementById('modalExportImport'));
    
    // Gestionnaires d'événements pour l'export
    const checkboxExportTout = document.querySelector('.export-option-all');
    const checkboxesExport = document.querySelectorAll('.export-option');
    
    // Gestion de la sélection "Tout"
    checkboxExportTout.addEventListener('change', function() {
        const checked = this.checked;
        checkboxesExport.forEach(checkbox => {
            checkbox.checked = checked;
        });
    });
    
    // Mettre à jour la sélection "Tout" en fonction des options individuelles
    checkboxesExport.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const toutCoche = Array.from(checkboxesExport).every(cb => cb.checked);
            checkboxExportTout.checked = toutCoche;
        });
    });
    
    // Bouton d'export
    document.getElementById('btn-exporter').addEventListener('click', function() {
        // Récupérer les types sélectionnés
        const typesCocheIds = Array.from(checkboxesExport)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.type);
        
        if (typesCocheIds.length === 0) {
            alert("Veuillez sélectionner au moins un type de données à exporter.");
            return;
        }
        
        // Lancer l'export
        const resultat = exporterDonnees(typesCocheIds);
        
        if (resultat.success) {
            // Afficher un message de succès
            alert(`Export réussi. Fichier: ${resultat.filename}`);
            modal.hide();
        } else {
            // Afficher un message d'erreur
            alert(`Erreur lors de l'export: ${resultat.message}`);
        }
    });
    
    // Gestionnaires d'événements pour l'import
    const inputImportFichier = document.getElementById('import-fichier');
    let donneesFichierImport = null;
    
    // Quand un fichier est sélectionné
    inputImportFichier.addEventListener('change', function() {
        const fichier = this.files[0];
        if (!fichier) {
            document.getElementById('import-options').classList.add('d-none');
            document.getElementById('import-preview').classList.add('d-none');
            return;
        }
        
        // Lire le fichier pour l'aperçu
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Analyser le JSON
                const donnees = JSON.parse(e.target.result);
                donneesFichierImport = donnees;
                
                // Afficher l'aperçu
                const previewElement = document.getElementById('import-json-preview');
                
                // Créer un aperçu simplifié
                const apercu = {
                    version: donnees.version,
                    date: donnees.date,
                    createur: donnees.createur,
                    types: Object.keys(donnees.donnees).map(typeId => {
                        const typeInfo = Object.values(TYPES_DONNEES).find(t => t.id === typeId);
                        return typeInfo ? typeInfo.nom : typeId;
                    })
                };
                
                previewElement.textContent = JSON.stringify(apercu, null, 2);
                document.getElementById('import-preview').classList.remove('d-none');
                
                // Générer les options de types d'import
                const conteneurOptions = document.getElementById('import-type-options');
                conteneurOptions.innerHTML = '';
                
                Object.keys(donnees.donnees).forEach(typeId => {
                    const typeInfo = Object.values(TYPES_DONNEES).find(t => t.id === typeId);
                    if (!typeInfo) return;
                    
                    const divCol = document.createElement('div');
                    divCol.className = 'col-md-6';
                    divCol.innerHTML = `
                        <div class="form-check">
                            <input class="form-check-input import-option" type="checkbox" id="import-${typeId}" data-type="${typeId}" checked>
                            <label class="form-check-label" for="import-${typeId}">
                                ${typeInfo.nom}
                            </label>
                        </div>
                    `;
                    
                    conteneurOptions.appendChild(divCol);
                });
                
                // Gestionnaire pour "Tout sélectionner" dans l'import
                const checkboxImportTout = document.querySelector('.import-option-all');
                const checkboxesImport = document.querySelectorAll('.import-option');
                
                checkboxImportTout.addEventListener('change', function() {
                    const checked = this.checked;
                    checkboxesImport.forEach(checkbox => {
                        checkbox.checked = checked;
                    });
                });
                
                checkboxesImport.forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const toutCoche = Array.from(checkboxesImport).every(cb => cb.checked);
                        checkboxImportTout.checked = toutCoche;
                    });
                });
                
                // Afficher les options d'import
                document.getElementById('import-options').classList.remove('d-none');
            } catch (e) {
                console.error("Erreur lors de l'analyse du fichier JSON:", e);
                alert("Le fichier sélectionné n'est pas un fichier d'export Nexus valide.");
                document.getElementById('import-options').classList.add('d-none');
                document.getElementById('import-preview').classList.add('d-none');
            }
        };
        
        reader.readAsText(fichier);
    });
    
    // Bouton d'import
    document.getElementById('btn-importer').addEventListener('click', async function() {
        const fichier = inputImportFichier.files[0];
        if (!fichier) {
            alert("Veuillez sélectionner un fichier à importer.");
            return;
        }
        
        // Récupérer les options
        const mode = document.querySelector('input[name="import-mode"]:checked').value;
        const typesCocheIds = Array.from(document.querySelectorAll('.import-option'))
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.type);
        
        if (typesCocheIds.length === 0) {
            alert("Veuillez sélectionner au moins un type de données à importer.");
            return;
        }
        
        try {
            // Lancer l'import
            const options = {
                types: typesCocheIds,
                mode: mode,
                confirmation: mode === 'remplacement' // Confirmation seulement en mode remplacement
            };
            
            const resultat = await importerDonnees(fichier, options);
            
            if (resultat.success) {
                // Afficher un message de succès
                alert("Import réussi. Les données ont été mises à jour.");
                modal.hide();
                
                // Recharger la page pour appliquer les changements
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Afficher un message d'erreur
                alert(`Erreur lors de l'import: ${resultat.message}`);
            }
        } catch (e) {
            console.error("Erreur lors de l'import:", e);
            alert(`Erreur lors de l'import: ${e.message || "Erreur inconnue"}`);
        }
    });
    
    // Afficher le modal
    modal.show();
    
    // Nettoyer lors de la fermeture du modal
    document.getElementById('modalExportImport').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Si c'est la page d'administration, configurer les boutons d'export/import
    if (window.location.pathname.includes('admin.html')) {
        // Ajouter un bouton dans le menu latéral
        const menuExport = document.createElement('li');
        menuExport.className = 'nav-item';
        menuExport.innerHTML = `
            <a class="nav-link" href="#" id="btn-export-import">
                <i class="fas fa-file-export"></i> Export / Import
            </a>
        `;
        
        // Trouver un bon emplacement dans le menu
        const optionsMenu = document.querySelector('.sidebar-heading');
        if (optionsMenu) {
            optionsMenu.parentNode.insertBefore(menuExport, optionsMenu.nextSibling);
        } else {
            // Si l'élément optionsMenu n'existe pas, chercher un autre point d'insertion
            const sidebarMenu = document.querySelector('.nav.flex-column');
            if (sidebarMenu) {
                sidebarMenu.appendChild(menuExport);
            }
        }
        
        // Ajouter le gestionnaire d'événement
        document.getElementById('btn-export-import').addEventListener('click', function(e) {
            e.preventDefault();
            afficherInterfaceExportImport();
        });
    } else {
        // Pour la page principale, ajouter une option dans le menu utilisateur si l'utilisateur est MJ
        if (estMJ()) {
            const boutonExport = document.createElement('button');
            boutonExport.id = 'btn-export-import';
            boutonExport.title = 'Export / Import';
            boutonExport.className = 'mj-only';
            boutonExport.innerHTML = '<i class="fas fa-file-export"></i>';
            
            // Ajouter le bouton à côté du bouton des paramètres
            const userInfo = document.querySelector('.user-info');
            if (userInfo) {
                userInfo.insertBefore(boutonExport, userInfo.lastChild);
                
                // Ajouter le gestionnaire d'événement
                boutonExport.addEventListener('click', function() {
                    afficherInterfaceExportImport();
                });
            }
        }
    }
});
