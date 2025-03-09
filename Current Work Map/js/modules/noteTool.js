/**
 * NoteTool - Outil pour ajouter des notes sur la carte
 */
class NoteTool {
  /**
   * Crée une instance de l'outil note
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before NoteTool");
    }
    
    this.mapLoader = mapLoader;
    this.active = false;
    this.notes = {};
    
    // Charger les notes existantes depuis le stockage local
    this.loadNotes();
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    console.log("NoteTool initialisé");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les événements de changement de couche
    EventBus.subscribe('map:layer:changed', (data) => {
      if (this.active) {
        this.highlightElementsWithNotes(data.layerId);
      }
    });
    
    // Écouter les événements de sélection d'élément (afin d'afficher les notes existantes)
    EventBus.subscribe('element:selected', (data) => {
      this.checkElementNotes(data.elementId, data.layerId);
    });
    
    // Écouter les événements de sauvegarde de note
    EventBus.subscribe('note:save', (data) => {
      this.saveNote(data);
    });
    
    // Écouter les événements de suppression de note
    EventBus.subscribe('note:delete', (data) => {
      this.deleteNote(data.id, data.elementId, data.layerId);
    });
  }
  
  /**
   * Active l'outil
   */
  activate() {
    this.active = true;
    document.body.classList.add('note-tool-active');
    
    // Mettre en évidence les éléments avec des notes
    const currentLayerId = this.mapLoader.getCurrentLayerId();
    if (currentLayerId) {
      this.highlightElementsWithNotes(currentLayerId);
    }
    
    console.log("NoteTool activé");
  }
  
  /**
   * Désactive l'outil
   */
  deactivate() {
    this.active = false;
    document.body.classList.remove('note-tool-active');
    
    // Supprimer la mise en évidence des éléments avec des notes
    this.removeNotesHighlighting();
    
    console.log("NoteTool désactivé");
  }
  
  /**
   * Gère le clic sur un élément
   * @param {object} data - Données de l'événement
   */
  handleElementClick(data) {
    // Ouvrir la modale pour ajouter une note
    const elementId = data.elementId;
    const layerId = data.layerId;
    
    // Vérifier si une note existe déjà pour cet élément
    const existingNote = this.getElementNote(elementId, layerId);
    
    EventBus.publish('show:modal', {
      modalId: 'note-modal',
      title: existingNote ? 'Modifier la note' : 'Ajouter une note',
      elementId,
      layerId,
      note: existingNote
    });
  }
  
  /**
   * Vérifie si un élément a des notes et les affiche si c'est le cas
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  checkElementNotes(elementId, layerId) {
    const note = this.getElementNote(elementId, layerId);
    if (note) {
      this.showNoteInfo(note, elementId, layerId);
    }
  }
  
  /**
   * Récupère la note d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @returns {object|null} - Note ou null si aucune
   */
  getElementNote(elementId, layerId) {
    if (!this.notes[layerId] || !this.notes[layerId][elementId]) {
      return null;
    }
    
    return this.notes[layerId][elementId];
  }
  
  /**
   * Sauvegarde une note
   * @param {object} data - Données de la note
   */
  saveNote(data) {
    const { elementId, layerId, content, visibility } = data;
    
    // Créer un ID unique pour la note
    const noteId = data.id || `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // S'assurer que l'objet pour cette couche existe
    if (!this.notes[layerId]) {
      this.notes[layerId] = {};
    }
    
    // Créer ou mettre à jour la note
    this.notes[layerId][elementId] = {
      id: noteId,
      content,
      visibility: visibility || 'private',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Enregistrer dans le stockage local
    this.saveNotes();
    
    // Si l'outil est actif, mettre à jour la mise en évidence
    if (this.active && layerId === this.mapLoader.getCurrentLayerId()) {
      this.highlightElementWithNote(elementId, layerId);
    }
    
    // Publier l'événement de note sauvegardée
    EventBus.publish('note:saved', {
      noteId,
      elementId,
      layerId,
      note: this.notes[layerId][elementId]
    });
    
    console.log(`Note ${noteId} sauvegardée pour l'élément ${elementId}`);
  }
  
  /**
   * Supprime une note
   * @param {string} noteId - ID de la note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @returns {boolean} - true si la note a été supprimée, false sinon
   */
  deleteNote(noteId, elementId, layerId) {
    // Vérifier si la note existe
    if (!this.notes[layerId] || !this.notes[layerId][elementId]) {
      console.warn(`Note pour l'élément ${elementId} non trouvée sur la couche ${layerId}`);
      return false;
    }
    
    // Supprimer la mise en évidence si l'outil est actif
    if (this.active && layerId === this.mapLoader.getCurrentLayerId()) {
      this.removeNoteHighlighting(elementId, layerId);
    }
    
    // Supprimer la note des données
    delete this.notes[layerId][elementId];
    
    // Nettoyer les couches vides
    if (Object.keys(this.notes[layerId]).length === 0) {
      delete this.notes[layerId];
    }
    
    // Enregistrer dans le stockage local
    this.saveNotes();
    
    // Publier l'événement de note supprimée
    EventBus.publish('note:deleted', {
      noteId,
      elementId,
      layerId
    });
    
    console.log(`Note ${noteId} supprimée pour l'élément ${elementId}`);
    return true;
  }
  
  /**
   * Met en évidence les éléments avec des notes
   * @param {string} layerId - ID de la couche
   */
  highlightElementsWithNotes(layerId) {
    // Supprimer d'abord toutes les mises en évidence
    this.removeNotesHighlighting();
    
    // Vérifier si la couche a des notes
    if (!this.notes[layerId]) return;
    
    // Mettre en évidence chaque élément avec une note
    Object.keys(this.notes[layerId]).forEach(elementId => {
      this.highlightElementWithNote(elementId, layerId);
    });
  }
  
  /**
   * Met en évidence un élément avec une note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  highlightElementWithNote(elementId, layerId) {
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Ajouter une classe pour indiquer la présence d'une note
    element.classList.add('has-note');
    
    // Si l'élément est lié à un quartier, mettre également le quartier en évidence
    if (element.dataset.linkedQuartier) {
      const quartier = this.mapLoader.getElementById(element.dataset.linkedQuartier, layerId);
      if (quartier) {
        quartier.classList.add('has-note-parent');
      }
    }
  }
  
  /**
   * Supprime la mise en évidence d'un élément avec une note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  removeNoteHighlighting(elementId, layerId) {
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Supprimer la classe
    element.classList.remove('has-note');
    
    // Si l'élément est lié à un quartier, supprimer également la mise en évidence du quartier
    if (element.dataset.linkedQuartier) {
      const quartier = this.mapLoader.getElementById(element.dataset.linkedQuartier, layerId);
      if (quartier) {
        quartier.classList.remove('has-note-parent');
      }
    }
  }
  
  /**
   * Supprime toutes les mises en évidence de notes
   */
  removeNotesHighlighting() {
    const currentLayerId = this.mapLoader.getCurrentLayerId();
    if (!currentLayerId) return;
    
    const svgLayer = this.mapLoader.getActiveLayer();
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    // Supprimer toutes les classes de note
    const elementsWithNotes = svgElement.querySelectorAll('.has-note, .has-note-parent');
    elementsWithNotes.forEach(element => {
      element.classList.remove('has-note', 'has-note-parent');
    });
  }
  
  /**
   * Affiche les informations d'une note
   * @param {object} note - Données de la note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  showNoteInfo(note, elementId, layerId) {
    // Créer le contenu HTML
    const content = `
      <div class="note-info">
        <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
        <div class="note-meta">
          <span class="note-date">Dernière modification: ${new Date(note.updatedAt).toLocaleString()}</span>
        </div>
        <div class="note-actions">
          <button id="edit-note-btn" class="btn btn-small">Modifier</button>
          <button id="delete-note-btn" class="btn btn-small btn-danger">Supprimer</button>
        </div>
      </div>
    `;
    
    // Récupérer le nom de l'élément
    let title = 'Note';
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (element) {
      title = `Note: ${element.id.replace('inv_', '')}`;
    }
    
    // Afficher dans le panneau d'informations
    EventBus.publish('show:element:info', {
      elementId,
      layerId,
      title,
      content
    });
    
    // Ajouter les écouteurs d'événements pour les boutons
    setTimeout(() => {
      const editBtn = document.getElementById('edit-note-btn');
      const deleteBtn = document.getElementById('delete-note-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          // Ouvrir la modale d'édition
          EventBus.publish('show:modal', {
            modalId: 'note-modal',
            title: 'Modifier la note',
            elementId,
            layerId,
            note
          });
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
            this.deleteNote(note.id, elementId, layerId);
            
            // Fermer le panneau d'informations
            const infoPanel = document.getElementById('info-panel');
            if (infoPanel) {
              infoPanel.classList.remove('visible');
            }
          }
        });
      }
    }, 100);
  }
  
  /**
   * Charge les notes depuis le stockage local
   */
  loadNotes() {
    try {
      const storedNotes = localStorage.getItem('nexus-notes');
      if (storedNotes) {
        this.notes = JSON.parse(storedNotes);
        console.log("Notes chargées depuis le stockage local");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
      this.notes = {};
    }
  }
  
  /**
   * Enregistre les notes dans le stockage local
   */
  saveNotes() {
    try {
      localStorage.setItem('nexus-notes', JSON.stringify(this.notes));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des notes:", error);
    }
  }
}

// Exporter la classe
window.NoteTool = NoteTool;