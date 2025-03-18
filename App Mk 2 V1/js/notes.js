/**
 * Système de notes pour la carte de Nexus
 * Ce fichier gère la création, l'affichage et la gestion des notes
 * Version 1.0
 */

// Variable globale pour stocker les notes en mémoire
let notes = {};

// Types de notes disponibles
const TYPES_NOTES = {
    personnelle: {
        id: 'personnelle',
        nom: 'Note personnelle',
        description: 'Visible uniquement par vous',
        icone: 'fa-sticky-note',
        couleur: '#3498db'
    },
    groupe: {
        id: 'groupe',
        nom: 'Note de groupe',
        description: 'Visible par tout le groupe',
        icone: 'fa-users',
        couleur: '#2ecc71'
    },
    indice: {
        id: 'indice',
        nom: 'Indice',
        description: 'Information importante pour l\'intrigue',
        icone: 'fa-lightbulb',
        couleur: '#f39c12'
    },
    evenement: {
        id: 'evenement',
        nom: 'Événement',
        description: 'Événement important à noter',
        icone: 'fa-calendar-alt',
        couleur: '#e74c3c'
    }
};

// Options de visibilité
const VISIBILITE_NOTES = {
    moi: { id: 'moi', nom: 'Moi uniquement', icone: 'fa-user' },
    mj: { id: 'mj', nom: 'MJ uniquement', icone: 'fa-user-shield' },
    groupe: { id: 'groupe', nom: 'Tout le groupe', icone: 'fa-users' },
    selection: { id: 'selection', nom: 'Sélection de joueurs', icone: 'fa-user-check' }
};

// Initialisation du système de notes
function initialiserSystemeNotes() {
    console.log("Initialisation du système de notes...");
    
    // Charger les notes sauvegardées
    chargerNotes();
    
    // Configurer le panneau de notes
    configureNotesSidebar();
    
    // Configurer les écouteurs d'événements
    setupEvenementsNotes();
    
    console.log("Système de notes initialisé");
}

// Charge les notes depuis le stockage local
function chargerNotes() {
    try {
        const notesSauvegardees = localStorage.getItem('nexus-notes');
        if (notesSauvegardees) {
            notes = JSON.parse(notesSauvegardees);
            console.log(`${Object.keys(notes).length} notes chargées avec succès`);
        } else {
            notes = {};
            console.log("Aucune note sauvegardée trouvée");
        }
    } catch (e) {
        console.error("Erreur lors du chargement des notes:", e);
        notes = {};
    }
}

// Sauvegarde les notes dans le stockage local
function sauvegarderNotes() {
    try {
        localStorage.setItem('nexus-notes', JSON.stringify(notes));
        console.log("Notes sauvegardées avec succès");
        return true;
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des notes:", e);
        return false;
    }
}

// Configure le panneau latéral des notes
function configureNotesSidebar() {
    // Créer le contenu du panneau de notes s'il n'existe pas déjà
    if (!document.getElementById('notes-panel')) {
        const notePanel = document.createElement('div');
        notePanel.id = 'notes-panel';
        notePanel.className = 'panel hidden';
        
        notePanel.innerHTML = `
            <div class="notes-header">
                <h4>Notes</h4>
                <div class="notes-actions">
                    <button class="btn-primary btn-new-note" title="Ajouter une note">
                        <i class="fas fa-plus"></i> Nouvelle note
                    </button>
                    <div class="notes-filter-container">
                        <select id="notes-filter-type" class="notes-filter">
                            <option value="all">Tous les types</option>
                            ${Object.values(TYPES_NOTES).map(type => 
                                `<option value="${type.id}">${type.nom}</option>`
                            ).join('')}
                        </select>
                        <select id="notes-filter-visibility" class="notes-filter">
                            <option value="all">Toutes les visibilités</option>
                            ${Object.values(VISIBILITE_NOTES).map(vis => 
                                `<option value="${vis.id}">${vis.nom}</option>`
                            ).join('')}
                        </select>
                        <button id="notes-search-toggle" title="Rechercher">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div id="notes-search-container" class="notes-search-container hidden">
                <input type="text" id="notes-search" placeholder="Rechercher dans les notes...">
            </div>
            <div class="notes-list" id="notes-list">
                <!-- Les notes seront ajoutées ici dynamiquement -->
                <div class="notes-empty">
                    <p>Aucune note pour le moment</p>
                    <p>Cliquez sur "Nouvelle note" pour en créer une</p>
                </div>
            </div>
        `;
        
        // Ajouter le panneau au sidebar
        document.querySelector('.sidebar-content').appendChild(notePanel);
    }
    
    // Créer le formulaire d'ajout/édition de note s'il n'existe pas déjà
    if (!document.getElementById('note-form-panel')) {
        const noteFormPanel = document.createElement('div');
        noteFormPanel.id = 'note-form-panel';
        noteFormPanel.className = 'panel hidden';
        
        noteFormPanel.innerHTML = `
            <h4 id="note-form-title">Nouvelle note</h4>
            <form id="note-form">
                <input type="hidden" id="note-edit-id" value="">
                
                <div class="form-group">
                    <label for="note-titre">Titre:</label>
                    <input type="text" id="note-titre" required>
                </div>
                
                <div class="form-group">
                    <label for="note-type">Type de note:</label>
                    <select id="note-type">
                        ${Object.values(TYPES_NOTES).map(type => 
                            `<option value="${type.id}">${type.nom}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="note-contenu">Contenu:</label>
                    <textarea id="note-contenu" rows="5" required></textarea>
                </div>
                
                <div class="form-group" id="note-visibilite-container">
                    <label>Partager avec:</label>
                    <div class="options-visibilite">
                        <label><input type="radio" name="visibilite" value="moi" checked> Moi uniquement</label>
                        <label><input type="radio" name="visibilite" value="mj"> MJ uniquement</label>
                        <label><input type="radio" name="visibilite" value="groupe"> Tout le groupe</label>
                        <label><input type="radio" name="visibilite" value="selection"> Sélection de joueurs</label>
                    </div>
                </div>
                
                <div class="form-group visibilite-selection hidden">
                    <label for="note-joueurs">Sélectionner les joueurs:</label>
                    <div id="liste-joueurs-selection">
                        <!-- La liste des joueurs sera ajoutée dynamiquement -->
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="form-check">
                        <input type="checkbox" id="note-position" class="form-check-input">
                        <label for="note-position" class="form-check-label">
                            Associer à une position sur la carte
                        </label>
                    </div>
                </div>
                
                <div class="form-group position-options hidden">
                    <p class="text-info">Cliquez sur la carte pour choisir la position</p>
                    <div id="note-position-preview">
                        <!-- L'aperçu de la position sera affiché ici -->
                    </div>
                </div>
                
                <div class="form-group form-buttons">
                    <button type="submit" class="btn-primary">Sauvegarder</button>
                    <button type="button" class="btn-cancel">Annuler</button>
                </div>
            </form>
        `;
        
        // Ajouter le panneau au sidebar
        document.querySelector('.sidebar-content').appendChild(noteFormPanel);
    }
    
    // Créer le panneau de détail d'une note s'il n'existe pas déjà
    if (!document.getElementById('note-detail-panel')) {
        const noteDetailPanel = document.createElement('div');
        noteDetailPanel.id = 'note-detail-panel';
        noteDetailPanel.className = 'panel hidden';
        
        noteDetailPanel.innerHTML = `
            <div class="note-detail-header">
                <h4 id="note-detail-title">Détail de la note</h4>
                <div class="note-detail-actions">
                    <button class="btn-edit-note" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-note" title="Supprimer"><i class="fas fa-trash"></i></button>
                    <button class="btn-back-to-notes" title="Retour aux notes"><i class="fas fa-arrow-left"></i></button>
                </div>
            </div>
            <div class="note-detail-content">
                <div class="note-detail-meta">
                    <div class="note-detail-type">
                        <span id="note-detail-type-icon"><i class="fas fa-sticky-note"></i></span>
                        <span id="note-detail-type-text">Type de note</span>
                    </div>
                    <div class="note-detail-visibility">
                        <span id="note-detail-visibility-icon"><i class="fas fa-eye"></i></span>
                        <span id="note-detail-visibility-text">Visibilité</span>
                    </div>
                </div>
                <div class="note-detail-date">
                    Créée le <span id="note-detail-date">date</span> par <span id="note-detail-author">auteur</span>
                </div>
                <div class="note-detail-body" id="note-detail-body">
                    <!-- Le contenu de la note sera affiché ici -->
                </div>
                <div id="note-detail-position" class="note-detail-position hidden">
                    <button class="btn-goto-position">
                        <i class="fas fa-map-marker-alt"></i> Voir sur la carte
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter le panneau au sidebar
        document.querySelector('.sidebar-content').appendChild(noteDetailPanel);
    }
}

// Configure les écouteurs d'événements pour les notes
function setupEvenementsNotes() {
    // Écouteur pour le bouton de notes
    document.getElementById('btn-notes').removeEventListener('click', function() {
        alert("Le système de notes sera disponible dans une version future.");
    });
    
    document.getElementById('btn-notes').addEventListener('click', function() {
        // Afficher le panneau latéral
        document.getElementById('sidebar').classList.remove('hidden');
        
        // Masquer tous les panneaux
        document.querySelectorAll('#sidebar .panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        
        // Afficher le panneau des notes
        document.getElementById('notes-panel').classList.remove('hidden');
        
        // Afficher les notes
        afficherNotes();
    });
    
    // Bouton nouvelle note
    document.querySelector('.btn-new-note').addEventListener('click', function() {
        ouvrirFormulaireNouvelleNote();
    });
    
    // Formulaire de note
    document.getElementById('note-form').addEventListener('submit', function(e) {
        e.preventDefault();
        sauvegarderFormNote();
    });
    
    // Bouton annuler du formulaire
    document.querySelector('#note-form .btn-cancel').addEventListener('click', function() {
        // Masquer le formulaire et revenir à la liste des notes
        document.getElementById('note-form-panel').classList.add('hidden');
        document.getElementById('notes-panel').classList.remove('hidden');
    });
    
    // Gestion du choix de visibilité
    document.querySelectorAll('input[name="visibilite"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const selectionContainer = document.querySelector('.visibilite-selection');
            if (this.value === 'selection') {
                selectionContainer.classList.remove('hidden');
                chargerListeJoueurs();
            } else {
                selectionContainer.classList.add('hidden');
            }
        });
    });
    
    // Gestion de l'option "Associer à une position"
    document.getElementById('note-position').addEventListener('change', function() {
        const positionOptions = document.querySelector('.position-options');
        if (this.checked) {
            positionOptions.classList.remove('hidden');
            
            // Activer le mode sélection de position sur la carte
            activerSelectionPositionNote();
        } else {
            positionOptions.classList.add('hidden');
            
            // Désactiver le mode sélection
            desactiverSelectionPositionNote();
        }
    });
    
    // Filtres des notes
    document.getElementById('notes-filter-type').addEventListener('change', function() {
        afficherNotes();
    });
    
    document.getElementById('notes-filter-visibility').addEventListener('change', function() {
        afficherNotes();
    });
    
    // Recherche
    document.getElementById('notes-search-toggle').addEventListener('click', function() {
        const searchContainer = document.getElementById('notes-search-container');
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            document.getElementById('notes-search').focus();
        }
    });
    
    document.getElementById('notes-search').addEventListener('input', function() {
        afficherNotes();
    });
    
    // Retour aux notes depuis le détail
    document.querySelector('.btn-back-to-notes').addEventListener('click', function() {
        document.getElementById('note-detail-panel').classList.add('hidden');
        document.getElementById('notes-panel').classList.remove('hidden');
    });
    
    // Bouton modifier note depuis le détail
    document.querySelector('.btn-edit-note').addEventListener('click', function() {
        const noteId = document.querySelector('.note-detail-content').dataset.noteId;
        if (noteId) {
            ouvrirFormulaireEditionNote(noteId);
        }
    });
    
    // Bouton supprimer note depuis le détail
    document.querySelector('.btn-delete-note').addEventListener('click', function() {
        const noteId = document.querySelector('.note-detail-content').dataset.noteId;
        if (noteId && confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
            supprimerNote(noteId);
        }
    });
    
    // Bouton aller à la position
    document.querySelector('.btn-goto-position').addEventListener('click', function() {
        const noteId = document.querySelector('.note-detail-content').dataset.noteId;
        if (noteId && notes[noteId] && notes[noteId].lieuAssocie) {
            allerALaPositionNote(notes[noteId]);
        }
    });
}

// Affiche les notes dans le panneau latéral
function afficherNotes() {
    const notesContainer = document.getElementById('notes-list');
    
    // Vider le conteneur
    notesContainer.innerHTML = '';
    
    // Récupérer les filtres
    const filtreType = document.getElementById('notes-filter-type').value;
    const filtreVisibilite = document.getElementById('notes-filter-visibility').value;
    const recherche = document.getElementById('notes-search').value.toLowerCase();
    
    // Filtrer les notes
    const notesFiltrees = Object.values(notes).filter(note => {
        // Vérifier si la note est visible pour l'utilisateur actuel
        if (!estNoteVisible(note)) return false;
        
        // Appliquer le filtre de type
        if (filtreType !== 'all' && note.type !== filtreType) return false;
        
        // Appliquer le filtre de visibilité
        if (filtreVisibilite !== 'all' && note.visibilite.mode !== filtreVisibilite) return false;
        
        // Appliquer la recherche
        if (recherche && !(
            note.titre.toLowerCase().includes(recherche) || 
            note.contenu.toLowerCase().includes(recherche)
        )) return false;
        
        return true;
    });
    
    // Trier les notes (plus récentes en premier)
    notesFiltrees.sort((a, b) => {
        return new Date(b.meta.derniereModification) - new Date(a.meta.derniereModification);
    });
    
    // Si aucune note, afficher un message
    if (notesFiltrees.length === 0) {
        notesContainer.innerHTML = `
            <div class="notes-empty">
                <p>Aucune note ne correspond à vos critères</p>
            </div>
        `;
        return;
    }
    
    // Ajouter chaque note
    notesFiltrees.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.dataset.id = note.id;
        
        // Déterminer l'icône et la couleur du type
        const typeInfo = TYPES_NOTES[note.type] || TYPES_NOTES.personnelle;
        
        // Créer le contenu de l'élément
        noteElement.innerHTML = `
            <div class="note-icon" style="background-color: ${typeInfo.couleur}">
                <i class="fas ${typeInfo.icone}"></i>
            </div>
            <div class="note-content">
                <div class="note-title">${note.titre}</div>
                <div class="note-preview">${tronquerTexte(note.contenu, 50)}</div>
                <div class="note-meta">
                    <span class="note-date">${formatDate(note.meta.derniereModification)}</span>
                    <span class="note-visibility">
                        <i class="fas ${VISIBILITE_NOTES[note.visibilite.mode].icone}" 
                           title="${VISIBILITE_NOTES[note.visibilite.mode].nom}"></i>
                    </span>
                    ${note.lieuAssocie ? '<span class="note-has-position" title="Position sur la carte"><i class="fas fa-map-marker-alt"></i></span>' : ''}
                </div>
            </div>
        `;
        
        // Ajouter un écouteur d'événements pour afficher la note
        noteElement.addEventListener('click', function() {
            afficherDetailNote(note.id);
        });
        
        notesContainer.appendChild(noteElement);
    });
}

// Ouvre le formulaire pour créer une nouvelle note
function ouvrirFormulaireNouvelleNote() {
    // Masquer la liste des notes et afficher le formulaire
    document.getElementById('notes-panel').classList.add('hidden');
    document.getElementById('note-detail-panel').classList.add('hidden');
    document.getElementById('note-form-panel').classList.remove('hidden');
    
    // Réinitialiser le formulaire
    document.getElementById('note-form').reset();
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-form-title').textContent = 'Nouvelle note';
    
    // Cacher les options de sélection de joueurs
    document.querySelector('.visibilite-selection').classList.add('hidden');
    
    // Cacher les options de position
    document.querySelector('.position-options').classList.add('hidden');
    
    // Vider l'aperçu de position
    document.getElementById('note-position-preview').innerHTML = '';
    
    // Désactiver le mode sélection de position
    desactiverSelectionPositionNote();
}

// Ouvre le formulaire pour éditer une note existante
function ouvrirFormulaireEditionNote(noteId) {
    // Vérifier que la note existe
    if (!notes[noteId]) return;
    
    const note = notes[noteId];
    
    // Masquer les autres panneaux et afficher le formulaire
    document.getElementById('notes-panel').classList.add('hidden');
    document.getElementById('note-detail-panel').classList.add('hidden');
    document.getElementById('note-form-panel').classList.remove('hidden');
    
    // Mettre à jour le titre du formulaire
    document.getElementById('note-form-title').textContent = 'Modifier la note';
    
    // Remplir le formulaire avec les données de la note
    document.getElementById('note-edit-id').value = noteId;
    document.getElementById('note-titre').value = note.titre;
    document.getElementById('note-type').value = note.type;
    document.getElementById('note-contenu').value = note.contenu;
    
    // Sélectionner la visibilité
    document.querySelector(`input[name="visibilite"][value="${note.visibilite.mode}"]`).checked = true;
    
    // Gestion de la sélection de joueurs
    if (note.visibilite.mode === 'selection') {
        document.querySelector('.visibilite-selection').classList.remove('hidden');
        chargerListeJoueurs(note.visibilite.joueurs);
    } else {
        document.querySelector('.visibilite-selection').classList.add('hidden');
    }
    
    // Gestion de la position
    const positionCheckbox = document.getElementById('note-position');
    if (note.lieuAssocie) {
        positionCheckbox.checked = true;
        document.querySelector('.position-options').classList.remove('hidden');
        
        // Afficher un aperçu de la position
        const positionPreview = document.getElementById('note-position-preview');
        positionPreview.innerHTML = `
            <div class="position-preview">
                <i class="fas fa-map-marker-alt"></i>
                <span>Niveau ${note.lieuAssocie.niveau}, X: ${Math.round(note.lieuAssocie.position.x)}, Y: ${Math.round(note.lieuAssocie.position.y)}</span>
            </div>
        `;
        
        // Activer le mode sélection de position
        activerSelectionPositionNote(note.lieuAssocie);
    } else {
        positionCheckbox.checked = false;
        document.querySelector('.position-options').classList.add('hidden');
        
        // Désactiver le mode sélection de position
        desactiverSelectionPositionNote();
    }
}

// Sauvegarde une note à partir du formulaire
function sauvegarderFormNote() {
    // Récupérer les données du formulaire
    const noteId = document.getElementById('note-edit-id').value || `note-${Date.now()}`;
    const titre = document.getElementById('note-titre').value;
    const type = document.getElementById('note-type').value;
    const contenu = document.getElementById('note-contenu').value;
    const modeVisibilite = document.querySelector('input[name="visibilite"]:checked').value;
    
    // Créer la structure de la note
    const noteData = {
        id: noteId,
        titre: titre,
        contenu: contenu,
        type: type,
        visibilite: {
            mode: modeVisibilite,
            joueurs: []
        },
        meta: {
            createur: CONFIG.utilisateur.id,
            dateCreation: notes[noteId] ? notes[noteId].meta.dateCreation : new Date().toISOString(),
            derniereModification: new Date().toISOString()
        }
    };
    
    // Si le mode de visibilité est "selection", récupérer les joueurs sélectionnés
    if (modeVisibilite === 'selection') {
        const joueursSelectionnes = document.querySelectorAll('#liste-joueurs-selection input:checked');
        noteData.visibilite.joueurs = Array.from(joueursSelectionnes).map(input => input.value);
    }
    
    // Si la note est associée à une position
    if (document.getElementById('note-position').checked && positionNoteTemporaire) {
        noteData.lieuAssocie = {
            niveau: CONFIG.carte.niveauActuel,
            position: positionNoteTemporaire
        };
    }
    
    // Sauvegarder la note
    notes[noteId] = noteData;
    sauvegarderNotes();
    
    // Afficher un message de confirmation
    afficherAlerte(`Note "${titre}" ${noteId.includes('note-') ? 'créée' : 'mise à jour'} avec succès`, "success");
    
    // Fermer le formulaire et afficher la liste des notes
    document.getElementById('note-form-panel').classList.add('hidden');
    document.getElementById('notes-panel').classList.remove('hidden');
    
    // Désactiver le mode sélection de position
    desactiverSelectionPositionNote();
    
    // Rafraîchir la liste des notes
    afficherNotes();
}

// Supprime une note
function supprimerNote(noteId) {
    if (!notes[noteId]) return false;
    
    const titre = notes[noteId].titre;
    
    // Supprimer la note
    delete notes[noteId];
    sauvegarderNotes();
    
    // Afficher un message de confirmation
    afficherAlerte(`Note "${titre}" supprimée avec succès`, "success");
    
    // Fermer le panneau de détail et afficher la liste des notes
    document.getElementById('note-detail-panel').classList.add('hidden');
    document.getElementById('notes-panel').classList.remove('hidden');
    
    // Rafraîchir la liste des notes
    afficherNotes();
    
    return true;
}

// Affiche les détails d'une note
function afficherDetailNote(noteId) {
    if (!notes[noteId]) return false;
    
    const note = notes[noteId];
    
    // Masquer la liste des notes et afficher le panneau de détail
    document.getElementById('notes-panel').classList.add('hidden');
    document.getElementById('note-form-panel').classList.add('hidden');
    document.getElementById('note-detail-panel').classList.remove('hidden');
    
    // Mettre à jour le contenu du panneau de détail
    document.getElementById('note-detail-title').textContent = note.titre;
    document.querySelector('.note-detail-content').dataset.noteId = noteId;
    
    // Mettre à jour l'icône et le texte du type
    const typeInfo = TYPES_NOTES[note.type] || TYPES_NOTES.personnelle;
    document.getElementById('note-detail-type-icon').innerHTML = `<i class="fas ${typeInfo.icone}" style="color: ${typeInfo.couleur}"></i>`;
    document.getElementById('note-detail-type-text').textContent = typeInfo.nom;
    
    // Mettre à jour l'icône et le texte de la visibilité
    const visibiliteInfo = VISIBILITE_NOTES[note.visibilite.mode];
    document.getElementById('note-detail-visibility-icon').innerHTML = `<i class="fas ${visibiliteInfo.icone}"></i>`;
    document.getElementById('note-detail-visibility-text').textContent = visibiliteInfo.nom;
    
    // Mettre à jour les informations de date et d'auteur
    document.getElementById('note-detail-date').textContent = formatDate(note.meta.dateCreation);
    document.getElementById('note-detail-author').textContent = note.meta.createur;
    
    // Mettre à jour le corps de la note (en convertissant les sauts de ligne)
    const contenuFormate = note.contenu.replace(/\n/g, '<br>');
    document.getElementById('note-detail-body').innerHTML = contenuFormate;
    
    // Afficher le bouton de position si la note est associée à une position
    const positionContainer = document.getElementById('note-detail-position');
    if (note.lieuAssocie) {
        positionContainer.classList.remove('hidden');
    } else {
        positionContainer.classList.add('hidden');
    }
    
    return true;
}

// Charge la liste des joueurs pour la sélection
function chargerListeJoueurs(joueursSélectionnés = []) {
    const container = document.getElementById('liste-joueurs-selection');
    
    // Pour l'instant, simuler une liste de joueurs
    // TODO: Récupérer la liste réelle des joueurs depuis une source centralisée
    const joueursDisponibles = [
        { id: 'user-1', nom: 'Joueur 1' },
        { id: 'user-2', nom: 'Joueur 2' },
        { id: 'user-3', nom: 'Joueur 3' }
    ];
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter chaque joueur
    joueursDisponibles.forEach(joueur => {
        const joueursItem = document.createElement('div');
        joueursItem.className = 'form-check';
        
        const isChecked = joueursSélectionnés.includes(joueur.id);
        
        joueursItem.innerHTML = `
            <input type="checkbox" id="joueur-${joueur.id}" value="${joueur.id}" class="form-check-input" ${isChecked ? 'checked' : ''}>
            <label for="joueur-${joueur.id}" class="form-check-label">${joueur.nom}</label>
        `;
        
        container.appendChild(joueursItem);
    });
}

// Variables pour la sélection de position
let positionNoteTemporaire = null;
let marqueurNoteTemporaire = null;
let modeSelectionPosition = false;

// Active le mode de sélection de position pour une note
function activerSelectionPositionNote(positionInitiale = null) {
    // Désactiver d'abord si actif
    desactiverSelectionPositionNote();
    
    // Activer le mode sélection
    modeSelectionPosition = true;
    
    // Si une position initiale est fournie, créer un marqueur à cette position
    if (positionInitiale) {
        positionNoteTemporaire = {
            x: positionInitiale.position.x,
            y: positionInitiale.position.y
        };
        
        marqueurNoteTemporaire = L.marker([positionInitiale.position.y, positionInitiale.position.x], {
            icon: L.divIcon({
                className: 'marqueur-note-temp',
                html: '<div style="background-color:#e74c3c;color:white;border-radius:50%;width:30px;height:30px;display:flex;justify-content:center;align-items:center;"><i class="fas fa-thumbtack"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            }),
            draggable: true
        }).addTo(map);
        
        // Gestionnaire d'événement pour le drag and drop
        marqueurNoteTemporaire.on('dragend', function() {
            const position = marqueurNoteTemporaire.getLatLng();
            positionNoteTemporaire = {
                x: position.lng,
                y: position.lat
            };
            mettreAJourApercuPosition();
        });
    }
    
    // Ajouter un gestionnaire d'événement pour le clic sur la carte
    map.on('click', onMapClickNote);
    
    // Informer l'utilisateur
    afficherAlerte("Cliquez sur la carte pour choisir la position de la note", "info");
}

// Désactive le mode de sélection de position
function desactiverSelectionPositionNote() {
    // Supprimer le marqueur temporaire
    if (marqueurNoteTemporaire) {
        map.removeLayer(marqueurNoteTemporaire);
        marqueurNoteTemporaire = null;
    }
    
    // Réinitialiser la position temporaire
    positionNoteTemporaire = null;
    
    // Désactiver le mode sélection
    modeSelectionPosition = false;
    
    // Supprimer le gestionnaire d'événement pour le clic sur la carte
    map.off('click', onMapClickNote);
}

// Gestionnaire d'événement pour le clic sur la carte en mode sélection de position
function onMapClickNote(e) {
    if (!modeSelectionPosition) return;
    
    // Enregistrer la position
    positionNoteTemporaire = {
        x: e.latlng.lng,
        y: e.latlng.lat
    };
    
    // Supprimer l'ancien marqueur s'il existe
    if (marqueurNoteTemporaire) {
        map.removeLayer(marqueurNoteTemporaire);
    }
    
    // Créer un nouveau marqueur
    marqueurNoteTemporaire = L.marker(e.latlng, {
        icon: L.divIcon({
            className: 'marqueur-note-temp',
            html: '<div style="background-color:#e74c3c;color:white;border-radius:50%;width:30px;height:30px;display:flex;justify-content:center;align-items:center;"><i class="fas fa-thumbtack"></i></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        }),
        draggable: true
    }).addTo(map);
    
    // Gestionnaire d'événement pour le drag and drop
    marqueurNoteTemporaire.on('dragend', function() {
        const position = marqueurNoteTemporaire.getLatLng();
        positionNoteTemporaire = {
            x: position.lng,
            y: position.lat
        };
        mettreAJourApercuPosition();
    });
    
    // Mettre à jour l'aperçu
    mettreAJourApercuPosition();
}

// Met à jour l'aperçu de la position
function mettreAJourApercuPosition() {
    if (!positionNoteTemporaire) return;
    
    const positionPreview = document.getElementById('note-position-preview');
    positionPreview.innerHTML = `
        <div class="position-preview">
            <i class="fas fa-map-marker-alt"></i>
            <span>Niveau ${CONFIG.carte.niveauActuel}, X: ${Math.round(positionNoteTemporaire.x)}, Y: ${Math.round(positionNoteTemporaire.y)}</span>
        </div>
    `;
}

// Vérifie si une note est visible pour l'utilisateur actuel
function estNoteVisible(note) {
    // Le créateur de la note peut toujours la voir
    if (note.meta.createur === CONFIG.utilisateur.id) return true;
    
    // Le MJ peut tout voir
    if (estMJ()) return true;
    
    // Vérifier selon le mode de visibilité
    switch (note.visibilite.mode) {
        case 'moi':
            // Visible uniquement par le créateur (déjà vérifié plus haut)
            return false;
        case 'mj':
            // Visible uniquement par le MJ
            return estMJ();
        case 'groupe':
            // Visible par tout le groupe
            return true;
        case 'selection':
            // Visible par une sélection de joueurs
            return note.visibilite.joueurs.includes(CONFIG.utilisateur.id);
        default:
            return false;
    }
}

// Centre la carte sur la position d'une note
function allerALaPositionNote(note) {
    if (!note.lieuAssocie) return false;
    
    // Si le niveau est différent, changer de niveau d'abord
    if (note.lieuAssocie.niveau !== CONFIG.carte.niveauActuel) {
        changerNiveau(note.lieuAssocie.niveau);
    }
    
    // Centrer la carte sur la position de la note
    map.setView([note.lieuAssocie.position.y, note.lieuAssocie.position.x], CONFIG.carte.zoom.max);
    
    // Créer un marqueur temporaire pour indiquer la position
    const marqueurPosition = L.marker([note.lieuAssocie.position.y, note.lieuAssocie.position.x], {
        icon: L.divIcon({
            className: 'marqueur-note-indication',
            html: '<div style="background-color:#e74c3c;color:white;border-radius:50%;width:40px;height:40px;display:flex;justify-content:center;align-items:center;animation:pulse 1.5s infinite;"><i class="fas fa-thumbtack"></i></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(map);
    
    // Ajouter un popup
    marqueurPosition.bindPopup(`
        <div class="note-position-popup">
            <h3>${note.titre}</h3>
            <p>${tronquerTexte(note.contenu, 100)}</p>
        </div>
    `).openPopup();
    
    // Supprimer le marqueur après 5 secondes
    setTimeout(() => {
        map.removeLayer(marqueurPosition);
    }, 5000);
    
    // Fermer le panneau latéral
    document.getElementById('sidebar').classList.add('hidden');
    
    return true;
}

// Fonctions utilitaires

// Tronque un texte à une longueur maximale
function tronquerTexte(texte, longueurMax = 50) {
    if (!texte || texte.length <= longueurMax) return texte;
    return texte.substring(0, longueurMax) + '...';
}

// Formate une date en format lisible
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// Initialiser le système de notes au chargement
document.addEventListener('DOMContentLoaded', initialiserSystemeNotes);
