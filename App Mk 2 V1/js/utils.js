/**
 * Fonctions utilitaires centralisées pour la carte de Nexus
 * Ce fichier centralise les fonctions communes utilisées à travers l'application
 * Version 4.0
 */

// Module pour la gestion des éléments d'interface utilisateur
const UIUtils = {
    // Affiche une alerte temporaire dans l'interface
    afficherAlerte: function(message, type = 'info', duree = 5000) {
        const alerteDiv = document.getElementById('alertes');
        if (!alerteDiv) {
            console.warn("Élément 'alertes' non trouvé dans le DOM");
            return null;
        };

// Module pour la carte et les niveaux
const CarteUtils = {
    // Charge les niveaux disponibles depuis le stockage local
    chargerNiveaux: function() {
        try {
            // Récupérer les niveaux sauvegardés
            const niveauxSauvegardes = StorageUtils.charger('nexus-niveaux', null);
            if (niveauxSauvegardes) {
                return niveauxSauvegardes;
            }
            
            // Si pas trouvé, utiliser les niveaux par défaut depuis CONFIG
            if (CONFIG && CONFIG.carte && CONFIG.carte.niveauxDisponibles) {
                return CONFIG.carte.niveauxDisponibles;
            }
            
            // Niveaux par défaut en dernier recours
            return [
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
                    visible: false
                },
                {
                    id: 'ruines',
                    nom: 'Ruines anciennes',
                    ordre: -3,
                    fichier: 'nexus-niveau-3.svg',
                    visible: false
                }
            ];
        } catch (e) {
            console.error("Erreur lors du chargement des niveaux:", e);
            return [];
        }
    },
    
    // Trie les niveaux par ordre
    trierNiveaux: function(niveaux) {
        return [...niveaux].sort((a, b) => {
            // Vérifier si les deux niveaux ont un ordre numérique
            const aOrdre = typeof a.ordre === 'number' ? a.ordre : 0;
            const bOrdre = typeof b.ordre === 'number' ? b.ordre : 0;
            return bOrdre - aOrdre; // Trier par ordre décroissant
        });
    },
    
    // Récupère le nom d'un niveau à partir de son ordre
    getNomNiveau: function(ordre) {
        // Essayer d'abord de trouver le niveau dans les niveaux sauvegardés
        const niveaux = this.chargerNiveaux();
        const niveau = niveaux.find(n => n.ordre === ordre);
        
        if (niveau && niveau.nom) {
            return niveau.nom;
        }
        
        // Sinon, utiliser les noms par défaut
        const NOMS_NIVEAUX = [
            "Surface",
            "Souterrains",
            "Égouts",
            "Ruines anciennes"
        ];
        
        return NOMS_NIVEAUX[ordre] || `Niveau ${ordre}`;
    },
    
    // Récupère le chemin d'un niveau à partir de son ordre
    getCheminNiveau: function(ordre) {
        // Essayer d'abord de trouver le niveau dans les niveaux sauvegardés
        const niveaux = this.chargerNiveaux();
        const niveau = niveaux.find(n => n.ordre === ordre);
        
        if (niveau && niveau.fichier) {
            return `${CONFIG.ressources.cartes.dossierNiveaux}${niveau.fichier}`;
        }
        
        // Sinon, utiliser les chemins par défaut
        return `${CONFIG.ressources.cartes.dossierNiveaux}nexus-niveau-${Math.abs(ordre)}.svg`;
    },
    
    // Vérifie si un niveau est visible pour l'utilisateur actuel
    estNiveauVisible: function(niveau) {
        // Les MJ voient tous les niveaux
        if (RoleUtils.estMJ()) return true;
        
        // Les joueurs ne voient que les niveaux marqués comme visibles
        return niveau.visible === true;
    },
    
    // Filtre les niveaux visibles pour l'utilisateur actuel
    getNiveauxVisibles: function() {
        const niveaux = this.chargerNiveaux();
        return niveaux.filter(niveau => this.estNiveauVisible(niveau));
    }
};

// Module pour la gestion des marqueurs
const MarqueursUtils = {
    // Vérifie si un marqueur est visible pour l'utilisateur actuel
    verifierVisibiliteMarqueur: function(marqueur) {
        if (!marqueur || !marqueur.visibilite) return false;
        
        const visibilite = marqueur.visibilite;
        
        switch (visibilite.mode) {
            case 'tous':
                return true;
            case 'mj':
                return RoleUtils.estMJ();
            case 'specifique':
                return RoleUtils.estMJ() || 
                       (visibilite.joueurs && 
                        visibilite.joueurs.includes(CONFIG.utilisateur.id));
            case 'conditionnel':
                return RoleUtils.estMJ() || this.evaluerConditionVisibilite(visibilite.condition);
            default:
                return false;
        }
    },
    
    // Évalue une condition de visibilité pour un marqueur
    evaluerConditionVisibilite: function(condition) {
        // Par défaut, retourner true pour les MJ
        if (RoleUtils.estMJ()) return true;
        
        // Condition simple pour les joueurs
        if (!condition) return false;
        
        // Pour l'instant, on vérifie juste si le joueur est explicitement mentionné
        // À améliorer avec un système d'évaluation de conditions plus élaboré
        return condition.includes(CONFIG.utilisateur.id);
    },
    
    // Charge tous les marqueurs pour un niveau spécifié
    chargerMarqueursPourNiveau: function(niveau) {
        try {
            // Récupérer tous les marqueurs sauvegardés
            const marqueursSauvegardes = StorageUtils.charger('nexus-marqueurs', {});
            
            // Récupérer les marqueurs du niveau spécifié
            return marqueursSauvegardes[niveau] || {};
        } catch (e) {
            console.error(`Erreur lors du chargement des marqueurs pour le niveau ${niveau}:`, e);
            return {};
        }
    },
    
    // Sauvegarde un marqueur
    sauvegarderMarqueur: function(marqueur) {
        if (!marqueur || !marqueur.id || marqueur.niveau === undefined) {
            console.error("Données de marqueur invalides:", marqueur);
            return false;
        }
        
        try {
            // Récupérer tous les marqueurs sauvegardés
            const marqueursSauvegardes = StorageUtils.charger('nexus-marqueurs', {});
            
            // S'assurer que le niveau existe
            if (!marqueursSauvegardes[marqueur.niveau]) {
                marqueursSauvegardes[marqueur.niveau] = {};
            }
            
            // Ajouter/mettre à jour le marqueur
            marqueursSauvegardes[marqueur.niveau][marqueur.id] = marqueur;
            
            // Sauvegarder
            return StorageUtils.sauvegarder('nexus-marqueurs', marqueursSauvegardes);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde du marqueur:", e);
            return false;
        }
    },
    
    // Supprime un marqueur
    supprimerMarqueur: function(id, niveau) {
        if (!id || niveau === undefined) {
            console.error("ID de marqueur ou niveau invalide");
            return false;
        }
        
        try {
            // Récupérer tous les marqueurs sauvegardés
            const marqueursSauvegardes = StorageUtils.charger('nexus-marqueurs', {});
            
            // Vérifier si le niveau et le marqueur existent
            if (!marqueursSauvegardes[niveau] || !marqueursSauvegardes[niveau][id]) {
                console.warn(`Marqueur ${id} du niveau ${niveau} non trouvé`);
                return false;
            }
            
            // Supprimer le marqueur
            delete marqueursSauvegardes[niveau][id];
            
            // Sauvegarder
            return StorageUtils.sauvegarder('nexus-marqueurs', marqueursSauvegardes);
        } catch (e) {
            console.error("Erreur lors de la suppression du marqueur:", e);
            return false;
        }
    },
    
    // Crée un marqueur avec des valeurs par défaut
    creerNouveauMarqueur: function(position, type = 'default', nom = 'Nouveau marqueur') {
        const id = MiscUtils.genererID('marqueur');
        const niveau = CONFIG.carte.niveauActuel;
        
        return {
            id: id,
            type: type,
            niveau: niveau,
            nom: nom,
            position: {
                x: position.x || position.lng || 0,
                y: position.y || position.lat || 0
            },
            visibilite: {
                mode: RoleUtils.estMJ() ? 'tous' : 'specifique',
                joueurs: [CONFIG.utilisateur.id]
            },
            interaction: {
                type: 'popup',
                contenu: {
                    description: '',
                    details: ''
                }
            },
            meta: {
                createur: CONFIG.utilisateur.id,
                dateCreation: new Date().toISOString(),
                derniereModification: new Date().toISOString()
            }
        };
    }
};

// Initialiser les gestionnaires d'événements globaux
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur d'événements pour les changements de rôle
    document.addEventListener('roleChange', function(event) {
        if (event.detail && event.detail.role) {
            console.log(`Rôle changé: ${event.detail.ancienRole} -> ${event.detail.role}`);
            RoleUtils.mettreAJourInterfaceRole();
            
            // Recharger les marqueurs si nécessaire
            if (typeof chargerMarqueurs === 'function') {
                // Supprimer tous les marqueurs existants
                if (window.map && window.marqueurs) {
                    Object.values(window.marqueurs).forEach(m => {
                        if (m.instance) window.map.removeLayer(m.instance);
                    });
                    window.marqueurs = {};
                }
                
                // Recharger les marqueurs appropriés
                chargerMarqueurs();
            }
        }
    });
});
        
        const alerte = document.createElement('div');
        alerte.className = `alert alert-${type} alert-dismissible fade show`;
        alerte.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
        `;
        
        alerteDiv.appendChild(alerte);
        
        // Supprimer automatiquement après la durée spécifiée
        const timeout = setTimeout(() => {
            alerte.classList.remove('show');
            setTimeout(() => {
                alerte.remove();
            }, 150);
        }, duree);
        
        return {
            element: alerte,
            timeout: timeout,
            clear: function() {
                clearTimeout(this.timeout);
                this.element.remove();
            }
        };
    },
    
    // Affiche une boîte de dialogue de confirmation personnalisée (ou utilise confirm par défaut)
    confirmer: function(message, callbackOui, callbackNon) {
        // Si Bootstrap est disponible, utiliser une modale
        if (typeof bootstrap !== 'undefined' && document.getElementById('modal-confirmation')) {
            // Utiliser une modale Bootstrap existante
            const modalElement = document.getElementById('modal-confirmation');
            const modalBody = modalElement.querySelector('.modal-body');
            if (modalBody) modalBody.textContent = message;
            
            const btnOui = modalElement.querySelector('.btn-confirmer-oui');
            const btnNon = modalElement.querySelector('.btn-confirmer-non');
            
            // Détacher les anciens gestionnaires s'ils existent
            const nouveauBtnOui = btnOui.cloneNode(true);
            const nouveauBtnNon = btnNon.cloneNode(true);
            btnOui.parentNode.replaceChild(nouveauBtnOui, btnOui);
            btnNon.parentNode.replaceChild(nouveauBtnNon, btnNon);
            
            // Attacher les nouveaux gestionnaires
            nouveauBtnOui.addEventListener('click', function() {
                if (typeof callbackOui === 'function') callbackOui();
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            });
            
            nouveauBtnNon.addEventListener('click', function() {
                if (typeof callbackNon === 'function') callbackNon();
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            });
            
            // Afficher la modale
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            return true;
        } else {
            // Fallback sur la fonction confirm native
            const resultat = confirm(message);
            if (resultat && typeof callbackOui === 'function') {
                callbackOui();
            } else if (!resultat && typeof callbackNon === 'function') {
                callbackNon();
            }
            return resultat;
        }
    },
    
    // Affiche/masque un élément par son ID
    toggleElement: function(elementId, visible) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        if (visible === undefined) {
            // Basculer l'état actuel
            element.classList.toggle('hidden');
        } else {
            // Définir un état spécifique
            if (visible) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
        
        return true;
    },
    
    // Vérifie si un élément est visible dans la fenêtre
    estElementVisible: function(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Crée un modal Bootstrap si disponible, sinon retourne null
    creerModal: function(id, titre, contenu, options = {}) {
        if (typeof bootstrap === 'undefined') {
            console.warn("Bootstrap n'est pas disponible pour créer un modal");
            return null;
        }
        
        // Vérifier si un modal avec cet ID existe déjà
        let modalElement = document.getElementById(id);
        
        if (!modalElement) {
            // Créer un nouveau modal
            modalElement = document.createElement('div');
            modalElement.id = id;
            modalElement.className = 'modal fade';
            modalElement.setAttribute('tabindex', '-1');
            modalElement.setAttribute('aria-labelledby', `${id}Label`);
            modalElement.setAttribute('aria-hidden', 'true');
            
            // Structure du modal
            modalElement.innerHTML = `
                <div class="modal-dialog ${options.taille || ''}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${id}Label">${titre}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body">
                            ${contenu}
                        </div>
                        <div class="modal-footer">
                            ${options.boutons || `
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                <button type="button" class="btn btn-primary">Sauvegarder</button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            
            // Ajouter au document
            document.body.appendChild(modalElement);
        } else {
            // Mettre à jour le modal existant
            const modalTitle = modalElement.querySelector('.modal-title');
            const modalBody = modalElement.querySelector('.modal-body');
            const modalFooter = modalElement.querySelector('.modal-footer');
            
            if (modalTitle) modalTitle.textContent = titre;
            if (modalBody) modalBody.innerHTML = contenu;
            
            if (options.boutons && modalFooter) {
                modalFooter.innerHTML = options.boutons;
            }
        }
        
        // Initialiser le modal
        const modal = new bootstrap.Modal(modalElement, options.config || {});
        
        // Stocker les callbacks pour les événements
        const callbacks = {};
        
        return {
            element: modalElement,
            instance: modal,
            // Méthodes pour manipuler le modal
            show: function() { 
                modal.show(); 
                return this;
            },
            hide: function() { 
                modal.hide(); 
                return this;
            },
            toggle: function() { 
                modal.toggle(); 
                return this;
            },
            // Méthode pour mettre à jour le contenu
            setContenu: function(nouveauContenu) {
                const modalBody = modalElement.querySelector('.modal-body');
                if (modalBody) modalBody.innerHTML = nouveauContenu;
                return this;
            },
            // Méthode pour mettre à jour le titre
            setTitre: function(nouveauTitre) {
                const modalTitle = modalElement.querySelector('.modal-title');
                if (modalTitle) modalTitle.textContent = nouveauTitre;
                return this;
            },
            // Méthode pour ajouter un écouteur d'événements
            on: function(evenement, callback) {
                if (typeof callback !== 'function') return this;
                
                // Stocker le callback
                callbacks[evenement] = callback;
                
                // Ajouter l'écouteur d'événements
                modalElement.addEventListener(`${evenement}.bs.modal`, function(event) {
                    callback(event);
                });
                
                return this;
            },
            // Méthode pour supprimer les écouteurs d'événements
            off: function(evenement) {
                if (callbacks[evenement]) {
                    modalElement.removeEventListener(`${evenement}.bs.modal`, callbacks[evenement]);
                    delete callbacks[evenement];
                }
                return this;
            }
        };
    }
};

// Module pour la gestion des ressources
const RessourcesUtils = {
    // Récupère le chemin vers une icône SVG en fonction du type
    getCheminIcone: function(type) {
        // Vérifier d'abord dans les types de marqueurs sauvegardés
        try {
            const typesSauvegardes = StorageUtils.charger('nexus-types-marqueurs', {});
            if (typesSauvegardes[type] && typesSauvegardes[type].icone) {
                const icone = typesSauvegardes[type].icone;
                
                // Si c'est une icône spéciale
                if (['bank', 'clock-tower', 'hospital', 'maze'].includes(icone)) {
                    return `${CONFIG.ressources.icones.dossierAutres}${icone}${CONFIG.ressources.icones.extension}`;
                }
                
                // Sinon c'est une icône standard
                return `${CONFIG.ressources.icones.dossierBase}${icone}${CONFIG.ressources.icones.extension}`;
            }
        } catch (e) {
            console.warn("Erreur lors de la récupération du chemin de l'icône:", e);
        }
        
        // Si le type existe, essayer de l'utiliser directement
        if (type) {
            // Pour les icônes spéciales
            if (['bank', 'clock-tower', 'hospital', 'maze'].includes(type)) {
                return `${CONFIG.ressources.icones.dossierAutres}${type}${CONFIG.ressources.icones.extension}`;
            }
            
            // Pour les icônes standards
            return `${CONFIG.ressources.icones.dossierBase}${type}${CONFIG.ressources.icones.extension}`;
        }
        
        // Icône par défaut en dernier recours
        return CONFIG.ressources.icones.fallback;
    },
    
    // Vérifie l'existence d'un fichier (asynchrone)
    verifierExistenceFichier: async function(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch(e) {
            console.warn(`Erreur lors de la vérification de l'existence du fichier ${url}:`, e);
            return false;
        }
    },
    
    // Récupère la couleur d'un type de marqueur
    getCouleurParType: function(type) {
        // Essayer d'abord de récupérer la couleur depuis les types de marqueurs sauvegardés
        try {
            const typesSauvegardes = StorageUtils.charger('nexus-types-marqueurs', {});
            if (typesSauvegardes[type] && typesSauvegardes[type].couleur) {
                return typesSauvegardes[type].couleur;
            }
        } catch(e) {
            console.warn("Erreur lors de la récupération de la couleur du type:", e);
        }
        
        // Sinon, utiliser une couleur par défaut selon le type
        const couleurs = {
            'taverne': '#8B4513',      // Brun
            'temple': '#FFD700',       // Or
            'commerce': '#32CD32',     // Vert
            'residence': '#4682B4',    // Bleu acier
            'danger': '#DC143C',       // Rouge cramoisi
            'secret': '#800080',       // Violet
            'bank': '#DAA520',         // Or foncé
            'clock-tower': '#696969',  // Gris
            'hospital': '#20B2AA',     // Vert d'eau
            'maze': '#708090'          // Gris ardoise
        };
        
        return couleurs[type] || '#3498db'; // Bleu par défaut
    },
    
    // Charge les sous-cartes disponibles
    chargerSousCartes: function() {
        try {
            // D'abord essayer de charger depuis localStorage
            const sousCartesSauvegardees = StorageUtils.charger('nexus-sous-cartes', null);
            if (sousCartesSauvegardees) {
                return sousCartesSauvegardees;
            }
            
            // Si pas trouvé, utiliser les sous-cartes par défaut depuis CONFIG ou SOUS_CARTES
            if (CONFIG && CONFIG.sousCartes) {
                return CONFIG.sousCartes;
            } else if (typeof SOUS_CARTES !== 'undefined') {
                return SOUS_CARTES;
            }
            
            // Sous-cartes par défaut en dernier recours
            return {
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
        } catch (e) {
            console.error("Erreur lors du chargement des sous-cartes:", e);
            return {};
        }
    }
};

// Module pour la gestion du stockage local
const StorageUtils = {
    // Sauvegarde des données dans le stockage local
    sauvegarder: function(cle, donnees) {
        try {
            localStorage.setItem(cle, JSON.stringify(donnees));
            return true;
        } catch(e) {
            console.error(`Erreur lors de la sauvegarde des données pour la clé ${cle}:`, e);
            return false;
        }
    },
    
    // Récupère des données du stockage local
    charger: function(cle, defaut = null) {
        try {
            const donnees = localStorage.getItem(cle);
            if (donnees === null) return defaut;
            return JSON.parse(donnees);
        } catch(e) {
            console.error(`Erreur lors du chargement des données pour la clé ${cle}:`, e);
            return defaut;
        }
    },
    
    // Supprime des données du stockage local
    supprimer: function(cle) {
        try {
            localStorage.removeItem(cle);
            return true;
        } catch(e) {
            console.error(`Erreur lors de la suppression des données pour la clé ${cle}:`, e);
            return false;
        }
    },
    
    // Vérifie si une clé existe dans le stockage local
    existe: function(cle) {
        return localStorage.getItem(cle) !== null;
    },
    
    // Récupère toutes les clés correspondant à un préfixe
    getClesParPrefixe: function(prefixe) {
        const resultat = [];
        for (let i = 0; i < localStorage.length; i++) {
            const cle = localStorage.key(i);
            if (cle.startsWith(prefixe)) {
                resultat.push(cle);
            }
        }
        return resultat;
    },
    
    // Export de toutes les données de l'application
    exporterTout: function() {
        try {
            const export_data = {
                version: CONFIG.version,
                date: new Date().toISOString(),
                donnees: {}
            };
            
            // Liste des clés à exporter
            const cles = [
                'nexus-config',
                'nexus-types-marqueurs',
                'nexus-niveaux',
                'nexus-sous-cartes',
                'nexus-marqueurs',
                'nexus-notes',
                'nexus-effets',
                'nexus-utilisateurs'
            ];
            
            cles.forEach(cle => {
                const donnees = localStorage.getItem(cle);
                if (donnees) {
                    export_data.donnees[cle] = JSON.parse(donnees);
                }
            });
            
            return export_data;
        } catch(e) {
            console.error("Erreur lors de l'export des données:", e);
            return null;
        }
    }
};

// Module pour la gestion des formulaires
const FormUtils = {
    // Remplit un formulaire avec des données
    remplirFormulaire: function(formId, donnees, prefixe = '') {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Parcourir tous les champs du formulaire
        for (let key in donnees) {
            const value = donnees[key];
            const fieldId = prefixe + key;
            const field = document.getElementById(fieldId);
            
            if (field) {
                // Gérer différents types de champs
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else if (field.tagName === 'SELECT') {
                    field.value = value || '';
                } else if (field.type !== 'file') {
                    field.value = value || '';
                }
                
                // Déclencher un événement change pour les champs qui ont des comportements dépendants
                const changeEvent = new Event('change', { bubbles: true });
                field.dispatchEvent(changeEvent);
            } else if (typeof value === 'object' && value !== null) {
                // Récursion pour les objets imbriqués
                FormUtils.remplirFormulaire(formId, value, prefixe + key + '-');
            }
        }
        
        return true;
    },
    
    // Récupère les données d'un formulaire
    extraireFormulaire: function(formId, prefixe = '') {
        const form = document.getElementById(formId);
        if (!form) return null;
        
        const donnees = {};
        const elements = form.elements;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (!element.name && !element.id) continue;
            
            // Identifier par name ou id
            let key = element.name || element.id;
            
            // Retirer le préfixe si nécessaire
            if (prefixe && key.startsWith(prefixe)) {
                key = key.substring(prefixe.length);
            }
            
            // Ignorer les boutons et les champs sans nom/id
            if (element.type === 'submit' || element.type === 'button' || !key) continue;
            
            // Récupérer la valeur selon le type
            if (element.type === 'checkbox') {
                donnees[key] = element.checked;
            } else if (element.type === 'radio') {
                if (element.checked) {
                    donnees[key] = element.value;
                }
            } else if (element.type === 'number') {
                donnees[key] = element.value ? parseFloat(element.value) : null;
            } else {
                donnees[key] = element.value;
            }
        }
        
        return donnees;
    },
    
    // Valide les données d'un formulaire selon des règles spécifiées
    validerFormulaire: function(formId, regles) {
        const form = document.getElementById(formId);
        if (!form) return { valide: false, erreurs: ['Formulaire non trouvé'] };
        
        const erreurs = [];
        
        // Parcourir toutes les règles
        for (const champId in regles) {
            const champ = document.getElementById(champId);
            if (!champ) continue;
            
            const regle = regles[champId];
            const valeur = champ.type === 'checkbox' ? champ.checked : champ.value;
            
            // Vérifier si le champ est requis
            if (regle.requis && (!valeur || valeur.trim() === '')) {
                erreurs.push(`Le champ ${regle.nom || champId} est requis`);
                champ.classList.add('is-invalid');
                continue;
            }
            
            // Si le champ n'est pas requis et est vide, passer aux règles suivantes
            if (!regle.requis && (!valeur || valeur.trim() === '')) {
                champ.classList.remove('is-invalid');
                champ.classList.add('is-valid');
                continue;
            }
            
            // Vérifier le pattern si spécifié
            if (regle.pattern && !new RegExp(regle.pattern).test(valeur)) {
                erreurs.push(`Le champ ${regle.nom || champId} ne respecte pas le format attendu`);
                champ.classList.add('is-invalid');
                continue;
            }
            
            // Vérifier la longueur minimale
            if (regle.minLength && valeur.length < regle.minLength) {
                erreurs.push(`Le champ ${regle.nom || champId} doit contenir au moins ${regle.minLength} caractères`);
                champ.classList.add('is-invalid');
                continue;
            }
            
            // Vérifier la longueur maximale
            if (regle.maxLength && valeur.length > regle.maxLength) {
                erreurs.push(`Le champ ${regle.nom || champId} ne doit pas dépasser ${regle.maxLength} caractères`);
                champ.classList.add('is-invalid');
                continue;
            }
            
            // Vérifier les valeurs min/max pour les nombres
            if (champ.type === 'number') {
                const nombreValeur = parseFloat(valeur);
                
                if (regle.min !== undefined && nombreValeur < regle.min) {
                    erreurs.push(`Le champ ${regle.nom || champId} doit être supérieur ou égal à ${regle.min}`);
                    champ.classList.add('is-invalid');
                    continue;
                }
                
                if (regle.max !== undefined && nombreValeur > regle.max) {
                    erreurs.push(`Le champ ${regle.nom || champId} doit être inférieur ou égal à ${regle.max}`);
                    champ.classList.add('is-invalid');
                    continue;
                }
            }
            
            // Vérifier une fonction de validation personnalisée
            if (regle.validateur && typeof regle.validateur === 'function') {
                const resultatValidation = regle.validateur(valeur, form);
                if (resultatValidation !== true) {
                    erreurs.push(resultatValidation || `Le champ ${regle.nom || champId} est invalide`);
                    champ.classList.add('is-invalid');
                    continue;
                }
            }
            
            // Si toutes les règles sont respectées, marquer comme valide
            champ.classList.remove('is-invalid');
            champ.classList.add('is-valid');
        }
        
        return {
            valide: erreurs.length === 0,
            erreurs: erreurs
        };
    },
    
    // Réinitialise un formulaire
    reinitialiserFormulaire: function(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        form.reset();
        
        // Réinitialiser aussi les classes de validation
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('is-invalid', 'is-valid');
        }
        
        return true;
    },
    
    // Ajoute un gestionnaire d'événement de soumission à un formulaire
    ajouterGestionnaireFormulaire: function(formId, callback, validerAvantSoumission = true) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Supprimer les anciens gestionnaires
        const clone = form.cloneNode(true);
        form.parentNode.replaceChild(clone, form);
        
        // Ajouter le nouveau gestionnaire
        clone.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Si on doit valider avant soumission et que le formulaire est invalide, ne pas continuer
            if (validerAvantSoumission && !this.checkValidity()) {
                this.reportValidity();
                return;
            }
            
            if (typeof callback === 'function') {
                callback(e);
            }
        });
        
        return true;
    }
};

// Module pour la gestion des événements
const EventUtils = {
    // Ajoute un gestionnaire d'événement unique à un élément
    ajouterEvenementUnique: function(elementId, evenement, handler) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        // Supprimer l'ancien gestionnaire s'il existe (en utilisant une clé unique)
        const handlerKey = `__event_${evenement}_handler`;
        if (element[handlerKey]) {
            element.removeEventListener(evenement, element[handlerKey]);
        }
        
        // Ajouter le nouveau gestionnaire
        element.addEventListener(evenement, handler);
        
        // Stocker la référence pour pouvoir le supprimer plus tard
        element[handlerKey] = handler;
        
        return true;
    },
    
    // Ajoute des gestionnaires d'événements à plusieurs éléments
    ajouterEvenementsClasse: function(classe, evenement, handler) {
        const elements = document.getElementsByClassName(classe);
        let count = 0;
        
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener(evenement, handler);
            count++;
        }
        
        return count;
    },
    
    // Supprime un gestionnaire d'événement
    supprimerEvenement: function(elementId, evenement) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        const handlerKey = `__event_${evenement}_handler`;
        if (element[handlerKey]) {
            element.removeEventListener(evenement, element[handlerKey]);
            delete element[handlerKey];
            return true;
        }
        
        return false;
    },
    
    // Crée et dispatch un événement personnalisé
    emettreEvenement: function(nom, detail = {}, target = document) {
        const event = new CustomEvent(nom, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        
        return target.dispatchEvent(event);
    },
    
    // Crée un système d'événements simple
    creerGestionnaireEvenements: function() {
        const evenements = {};
        
        return {
            on: function(evenement, callback) {
                if (!evenements[evenement]) {
                    evenements[evenement] = [];
                }
                evenements[evenement].push(callback);
                return this;
            },
            
            off: function(evenement, callback) {
                if (!evenements[evenement]) return this;
                
                if (callback) {
                    // Supprimer un callback spécifique
                    const index = evenements[evenement].indexOf(callback);
                    if (index !== -1) {
                        evenements[evenement].splice(index, 1);
                    }
                } else {
                    // Supprimer tous les callbacks pour cet événement
                    delete evenements[evenement];
                }
                
                return this;
            },
            
            emit: function(evenement, ...args) {
                if (!evenements[evenement]) return this;
                
                // Appeler tous les callbacks avec les arguments fournis
                evenements[evenement].forEach(callback => {
                    try {
                        callback(...args);
                    } catch (e) {
                        console.error(`Erreur dans le callback pour l'événement ${evenement}:`, e);
                    }
                });
                
                return this;
            }
        };
    }
};

// Module pour la gestion des rôles et permissions
const RoleUtils = {
    // Vérifie si l'utilisateur actuel est MJ
    estMJ: function() {
        // Vérifier d'abord dans le localStorage (qui est plus fiable que CONFIG)
        const roleSauvegarde = localStorage.getItem('nexus-role');
        if (roleSauvegarde === 'mj') {
            return true;
        }
        
        // Vérifier dans la configuration globale
        return CONFIG && CONFIG.utilisateur && CONFIG.utilisateur.role === 'mj';
    },
    
    // Change le rôle de l'utilisateur
    changerRole: function(nouveauRole) {
        if (nouveauRole !== 'mj' && nouveauRole !== 'joueur') {
            console.error("Rôle invalide:", nouveauRole);
            return false;
        }
        
        if (nouveauRole === CONFIG.utilisateur.role) return false;
        
        // Enregistrer l'ancien rôle pour pouvoir le restaurer si nécessaire
        const ancienRole = CONFIG.utilisateur.role;
        
        // Mettre à jour le rôle dans la configuration
        CONFIG.utilisateur.role = nouveauRole;
        
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
        
        // Sauvegarder le rôle dans le stockage local
        try {
            localStorage.setItem('nexus-role', nouveauRole);
        } catch (e) {
            console.error("Erreur lors de l'enregistrement du rôle:", e);
            
            // Restaurer l'ancien rôle en cas d'erreur
            CONFIG.utilisateur.role = ancienRole;
            return false;
        }
        
        // Émettre un événement pour informer l'application du changement de rôle
        EventUtils.emettreEvenement('roleChange', { role: nouveauRole, ancienRole: ancienRole });
        
        return true;