/**
   * Initialise le panneau de notes
   */
  initNotesPanel() {
    const notesPanel = document.createElement('div');
    notesPanel.id = 'notes-panel';
    notesPanel.className = 'side-panel';
    
    // Créer le contenu du panneau
    notesPanel.innerHTML = `
      <div class="panel-header">
        <h3>Mes Notes</h3>
        <button id="notes-panel-close" class="panel-close">×</button>
      </div>
      <div class="panel-content">
        <div id="notes-list" class="notes-list"></div>
      </div>
    `;
    
    // Ajouter le panneau au DOM
    document.body.appendChild(notesPanel);
    
    // Gérer le bouton de fermeture
    const closeButton = notesPanel.querySelector('#notes-panel-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notesPanel.classList.remove('visible');
      });
    }
    
    // Écouteur pour afficher les notes
    document.getElementById('show-notes-btn')?.addEventListener('click', () => {
      this.showNotesPanel();
    });
  }
  
  /**
   * Affiche le panneau de notes
   */
  showNotesPanel() {
    const notesPanel = document.getElementById('notes-panel');
    if (notesPanel) {
      // Mettre à jour la liste des notes
      this.updateNotesList();
      
      // Afficher le panneau
      notesPanel.classList.add('visible');
    }
  }
  
  /**
   * Met à jour la liste des notes
   */
  updateNotesList() {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    
    // Vider la liste
    notesList.innerHTML = '';
    
    // Récupérer les notes pour la couche active
    const layerId = this.mapLoader.getCurrentLayerId();
    const layerNotes = this.notes[layerId] || {};
    
    if (Object.keys(layerNotes).length === 0) {
      notesList.innerHTML = '<p>Aucune note pour cette zone</p>';
      return;
    }
    
    // Créer la liste des notes
    Object.entries(layerNotes).forEach(([elementId, note]) => {
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      
      noteItem.innerHTML = `
        <div class="note-header">
          <h4>${note.title || elementId}</h4>
          <span class="note-actions">
            <button class="btn-small btn-edit" data-element-id="${elementId}">Éditer</button>
            <button class="btn-small btn-delete" data-element-id="${elementId}">Supprimer</button>
          </span>
        </div>
        <div class="note-content">${note.content}</div>
        <div class="note-footer">
          <span class="note-date">${new Date(note.date).toLocaleString()}</span>
        </div>
      `;
      
      // Ajouter la note à la liste
      notesList.appendChild(noteItem);
      
      // Ajouter les écouteurs d'événements
      const editButton = noteItem.querySelector(`.btn-edit[data-element-id="${elementId}"]`);
      if (editButton) {
        editButton.addEventListener('click', () => {
          this.editNote(elementId, layerId);
        });
      }
      
      const deleteButton = noteItem.querySelector(`.btn-delete[data-element-id="${elementId}"]`);
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          this.deleteNote(elementId, layerId);
        });
      }
    });
  }
  
  /**
   * Gère le clic sur un élément de la carte
   * @param {object} data - Données de l'événement
   */
  handleElementClick(data) {
    // Si le mode de placement de marqueur est actif
    if (this.markerPlacementMode) {
      this.placeMarker(data.elementId, data.layerId);
      return;
    }
    
    // Si le mode de note est actif
    if (this.noteMode) {
      this.openNoteEditor(data.elementId, data.layerId);
      return;
    }
    
    // Si le mode de position est actif
    if (this.positionMode) {
      this.setPlayerPosition(data.elementId, data.layerId);
      return;
    }
    
    // Afficher les informations de l'élément
    this.showElementInfo(data.elementId, data.layerId);
  }
  
  /**
   * Affiche les informations d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  showElementInfo(elementId, layerId) {
    console.log(`Affichage des informations de l'élément ${elementId}`);
    
    // Récupérer les informations personnalisées de l'élément
    const customData = this.getElementCustomData(elementId, layerId);
    
    // Récupérer les notes du joueur pour cet élément
    const layerNotes = this.notes[layerId] || {};
    const playerNote = layerNotes[elementId];
    
    // Créer la modale d'informations
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'element-info-modal';
    
    // Créer le contenu de la modale
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${customData.name || `Élément: ${elementId}`}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          ${customData.description ? `<div class="element-description">${customData.description}</div>` : ''}
          
          ${playerNote ? `
            <div class="player-note">
              <h4>Ma Note:</h4>
              <div class="note-content">${playerNote.content}</div>
              <div class="note-footer">
                <span class="note-date">${new Date(playerNote.date).toLocaleString()}</span>
                <button id="edit-note-btn" class="btn btn-small">Éditer</button>
              </div>
            </div>
          ` : `
            <div class="no-note">
              <p>Vous n'avez pas de note pour cet élément.</p>
              <button id="add-note-btn-modal" class="btn">Ajouter une note</button>
            </div>
          `}
        </div>
      </div>
    `;
    
    // Ajouter la modale au DOM
    document.body.appendChild(modal);
    
    // Gérer le bouton de fermeture
    const closeButton = modal.querySelector('.close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // Gérer le bouton d'édition de note
    const editNoteBtn = modal.querySelector('#edit-note-btn');
    if (editNoteBtn) {
      editNoteBtn.addEventListener('click', () => {
        modal.remove();
        this.editNote(elementId, layerId);
      });
    }
    
    // Gérer le bouton d'ajout de note
    const addNoteBtn = modal.querySelector('#add-note-btn-modal');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        modal.remove();
        this.openNoteEditor(elementId, layerId);
      });
    }
    
    // Afficher la modale
    modal.style.display = 'block';
  }
  
  /**
   * Récupère les données personnalisées d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @returns {object} - Données personnalisées
   */
  getElementCustomData(elementId, layerId) {
    // Vérifier si des données existent dans le stockage local
    const key = `element-data-${layerId}-${elementId}`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        // Vérifier si les données sont publiques ou accessibles au joueur
        if (data.visibility === 'public') {
          return data;
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture des données pour ${elementId}:`, error);
      }
    }
    
    // Données par défaut
    return {
      name: '',
      description: '',
      visibility: 'public',
      type: '',
      color: '#ffffff',
      icon: ''
    };
  }
  
  /**
   * Active le mode de placement de marqueur
   */
  activateMarkerPlacementMode() {
    this.markerPlacementMode = true;
    this.noteMode = false;
    this.positionMode = false;
    
    // Mettre à jour l'interface
    document.body.classList.add('marker-placement-mode');
    
    console.log("Mode de placement de marqueur activé");
    
    // Afficher un message d'aide
    alert("Cliquez sur un élément de la carte pour y placer un marqueur");
  }
  
  /**
   * Place un marqueur sur un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  placeMarker(elementId, layerId) {
    // Désactiver le mode de placement
    this.markerPlacementMode = false;
    document.body.classList.remove('marker-placement-mode');
    
    // Ouvrir la modale de configuration du marqueur
    this.openMarkerConfigModal(elementId, layerId);
  }
  
  /**
   * Ouvre la modale de configuration du marqueur
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  openMarkerConfigModal(elementId, layerId) {
    // Récupérer un marqueur existant
    const layerMarkers = this.markers[layerId] || {};
    const existingMarker = layerMarkers[elementId];
    
    // Créer la modale
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'marker-config-modal';
    
    // Créer le contenu de la modale
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${existingMarker ? 'Modifier le marqueur' : 'Nouveau marqueur'}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <form id="marker-config-form">
            <div class="form-group">
              <label for="marker-title">Titre:</label>
              <input type="text" id="marker-title" value="${existingMarker?.title || ''}">
            </div>
            <div class="form-group">
              <label for="marker-type">Type:</label>
              <select id="marker-type">
                <option value="default" ${existingMarker?.type === 'default' ? 'selected' : ''}>Par défaut</option>
                <option value="quest" ${existingMarker?.type === 'quest' ? 'selected' : ''}>Quête</option>
                <option value="vendor" ${existingMarker?.type === 'vendor' ? 'selected' : ''}>Marchand</option>
                <option value="danger" ${existingMarker?.type === 'danger' ? 'selected' : ''}>Danger</option>
                <option value="interest" ${existingMarker?.type === 'interest' ? 'selected' : ''}>Point d'intérêt</option>
              </select>
            </div>
            <div class="form-group">
              <label for="marker-color">Couleur:</label>
              <input type="color" id="marker-color" value="${existingMarker?.color || this.personalSettings.color}">
            </div>
            <div class="form-group">
              <label for="marker-visibility">Visibilité:</label>
              <select id="marker-visibility">
                <option value="private" ${(existingMarker?.visibility === 'private' || !existingMarker) ? 'selected' : ''}>Privé (uniquement moi)</option>
                <option value="public" ${existingMarker?.visibility === 'public' ? 'selected' : ''}>Public (tous les joueurs)</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button id="save-marker-btn" class="btn btn-primary">Enregistrer</button>
          <button id="cancel-marker-btn" class="btn">Annuler</button>
          ${existingMarker ? '<button id="delete-marker-btn" class="btn btn-danger">Supprimer</button>' : ''}
        </div>
      </div>
    `;
    
    // Ajouter la modale au DOM
    document.body.appendChild(modal);
    
    // Gérer les événements
    const closeButton = modal.querySelector('.close');
    const saveButton = modal.querySelector('#save-marker-btn');
    const cancelButton = modal.querySelector('#cancel-marker-btn');
    const deleteButton = modal.querySelector('#delete-marker-btn');
    
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    
    saveButton.addEventListener('click', () => {
      this.saveMarker(elementId, layerId);
    });
    
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
    
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        this.deleteMarker(elementId, layerId);
        modal.remove();
      });
    }
    
    // Afficher la modale
    modal.style.display = 'block';
  }
  
  /**
   * Enregistre un marqueur
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  saveMarker(elementId, layerId) {
    const modal = document.getElementById('marker-config-modal');
    if (!modal) return;
    
    // Récupérer les valeurs du formulaire
    const title = modal.querySelector('#marker-title').value;
    const type = modal.querySelector('#marker-type').value;
    const color = modal.querySelector('#marker-color').value;
    const visibility = modal.querySelector('#marker-visibility').value;
    
    // Créer ou mettre à jour le marqueur
    if (!this.markers[layerId]) {
      this.markers[layerId] = {};
    }
    
    this.markers[layerId][elementId] = {
      title: title || `Marqueur ${elementId}`,
      type,
      color,
      visibility,
      date: Date.now()
    };
    
    // Enregistrer les marqueurs
    this.savePlayerData();
    
    // Fermer la modale
    modal.remove();
    
    // Rendre le marqueur
    this.renderMarker(elementId, layerId);
    
    console.log(`Marqueur enregistré pour l'élément ${elementId}`);
  }
  
  /**
   * Supprime un marqueur
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  deleteMarker(elementId, layerId) {
    // Vérifier si le marqueur existe
    if (!this.markers[layerId] || !this.markers[layerId][elementId]) return;
    
    // Supprimer le marqueur du DOM
    this.removeMarkerFromDOM(elementId, layerId);
    
    // Supprimer le marqueur des données
    delete this.markers[layerId][elementId];
    
    // Si la couche n'a plus de marqueurs, supprimer l'entrée
    if (Object.keys(this.markers[layerId]).length === 0) {
      delete this.markers[layerId];
    }
    
    // Enregistrer les marqueurs
    this.savePlayerData();
    
    console.log(`Marqueur supprimé pour l'élément ${elementId}`);
  }
  
  /**
   * Rend un marqueur sur la carte
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  renderMarker(elementId, layerId) {
    // Vérifier si le marqueur existe
    if (!this.markers[layerId] || !this.markers[layerId][elementId]) return;
    
    // Récupérer le marqueur
    const marker = this.markers[layerId][elementId];
    
    // Récupérer l'élément SVG
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Supprimer un marqueur existant
    this.removeMarkerFromDOM(elementId, layerId);
    
    // Créer le marqueur
    const svg = element.ownerSVGElement;
    if (!svg) return;
    
    // Obtenir les coordonnées du centre de l'élément
    const bbox = element.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Créer un groupe pour le marqueur
    const markerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markerGroup.classList.add('player-marker');
    markerGroup.dataset.elementId = elementId;
    markerGroup.dataset.markerId = `marker-${layerId}-${elementId}`;
    
    // Créer le cercle de fond
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', marker.color);
    circle.setAttribute('stroke', '#FFFFFF');
    circle.setAttribute('stroke-width', '2');
    
    // Ajouter le cercle au groupe
    markerGroup.appendChild(circle);
    
    // Ajouter une icône selon le type
    if (marker.type !== 'default') {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "path");
      icon.setAttribute('d', this.getMarkerIconPath(marker.type));
      icon.setAttribute('fill', '#FFFFFF');
      icon.setAttribute('transform', 'scale(0.4) translate(-12, -12)');
      
      markerGroup.appendChild(icon);
    }
    
    // Positionner le groupe
    markerGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
    
    // Ajouter une info-bulle
    markerGroup.addEventListener('mouseenter', (e) => {
      this.showMarkerTooltip(marker, e.clientX, e.clientY);
    });
    
    markerGroup.addEventListener('mouseleave', () => {
      this.hideMarkerTooltip();
    });
    
    // Ajouter le marqueur au SVG
    svg.appendChild(markerGroup);
  }
  
  /**
   * Supprime un marqueur du DOM
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  removeMarkerFromDOM(elementId, layerId) {
    const markerId = `marker-${layerId}-${elementId}`;
    const activeLayer = this.mapLoader.getActiveLayer();
    
    if (!activeLayer) return;
    
    const svgElement = activeLayer.getElement();
    if (!svgElement) return;
    
    const existingMarker = svgElement.querySelector(`[data-marker-id="${markerId}"]`);
    if (existingMarker) {
      existingMarker.remove();
    }
  }
  
  /**
   * Affiche une info-bulle pour un marqueur
   * @param {object} marker - Informations du marqueur
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  showMarkerTooltip(marker, x, y) {
    // Supprimer une info-bulle existante
    this.hideMarkerTooltip();
    
    // Créer l'info-bulle
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    
    // Ajouter le contenu
    tooltip.innerHTML = `
      <h4>${marker.title}</h4>
      <p>Type: ${this.formatMarkerType(marker.type)}</p>
    `;
    
    // Ajouter l'info-bulle au DOM
    document.body.appendChild(tooltip);
  }
  
  /**
   * Masque l'info-bulle du marqueur
   */
  hideMarkerTooltip() {
    const tooltip = document.querySelector('.marker-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
  
  /**
   * Formate le type de marqueur
   * @param {string} type - Type de marqueur
   * @returns {string} - Type formaté
   */
  formatMarkerType(type) {
    const types = {
      'default': 'Standard',
      'quest': 'Quête',
      'vendor': 'Marchand',
      'danger': 'Danger',
      'interest': 'Point d\'intérêt'
    };
    
    return types[type] || type;
  }
  
  /**
   * Obtient le chemin SVG pour une icône de marqueur
   * @param {string} type - Type de marqueur
   * @returns {string} - Chemin SVG
   */
  getMarkerIconPath(type) {
    const iconPaths = {
      'quest': 'M15 5l-5 5 5 5 5-5-5-5zM15 19l-5-5-5 5 5 5 5-5zM19 15l5-5-5-5-5 5 5 5z',
      'vendor': 'M4 20h16v-8H4v8zm2-6h12v4H6v-4zm11-8H7l-2 4h14l-2-4z',
      'danger': 'M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'interest': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'
    };
    
    return iconPaths[type] || '';
  }
  
  /**
   * Active le mode de note
   */
  activateNoteMode() {
    this.noteMode = true;
    this.markerPlacementMode = false;
    this.positionMode = false;
    
    // Mettre à jour l'interface
    document.body.classList.add('note-mode');
    
    console.log("Mode de note activé");
    
    // Afficher un message d'aide
    alert("Cliquez sur un élément de la carte pour y ajouter une note");
  }
  
  /**
   * Ouvre l'éditeur de note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  openNoteEditor(elementId, layerId) {
    // Désactiver le mode de note
    this.noteMode = false;
    document.body.classList.remove('note-mode');
    
    // Récupérer une note existante
    const layerNotes = this.notes[layerId] || {};
    const existingNote = layerNotes[elementId];
    
    // Créer la modale
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'note-editor-modal';
    
    // Créer le contenu de la modale
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${existingNote ? 'Modifier la note' : 'Nouvelle note'}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <form id="note-editor-form">
            <div class="form-group">
              <label for="note-title">Titre:</label>
              <input type="text" id="note-title" value="${existingNote?.title || ''}">
            </div>
            <div class="form-group">
              <label for="note-content">Contenu:</label>
              <textarea id="note-content" rows="6">${existingNote?.content || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="note-visibility">Visibilité:</label>
              <select id="note-visibility">
                <option value="private" ${(existingNote?.visibility === 'private' || !existingNote) ? 'selected' : ''}>Privée (uniquement moi)</option>
                <option value="public" ${existingNote?.visibility === 'public' ? 'selected' : ''}>Publique (tous les joueurs)</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button id="save-note-btn" class="btn btn-primary">Enregistrer</button>
          <button id="cancel-note-btn" class="btn">Annuler</button>
          ${existingNote ? '<button id="delete-note-btn" class="btn btn-danger">Supprimer</button>' : ''}
        </div>
      </div>
    `;
    
    // Ajouter la modale au DOM
    document.body.appendChild(modal);
    
    // Gérer les événements
    const closeButton = modal.querySelector('.close');
    const saveButton = modal.querySelector('#save-note-btn');
    const cancelButton = modal.querySelector('#cancel-note-btn');
    const deleteButton = modal.querySelector('#delete-note-btn');
    
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    
    saveButton.addEventListener('click', () => {
      this.saveNote(elementId, layerId);
    });
    
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
    
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        this.deleteNote(elementId, layerId);
        modal.remove();
      });
    }
    
    // Afficher la modale
    modal.style.display = 'block';
  }
  
  /**
   * Enregistre une note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  saveNote(elementId, layerId) {
    const modal = document.getElementById('note-editor-modal');
    if (!modal) return;
    
    // Récupérer les valeurs du formulaire
    const title = modal.querySelector('#note-title').value;
    const content = modal.querySelector('#note-content').value;
    const visibility = modal.querySelector('#note-visibility').value;
    
    // Créer ou mettre à jour la note
    if (!this.notes[layerId]) {
      this.notes[layerId] = {};
    }
    
    this.notes[layerId][elementId] = {
      title: title || `Note sur ${elementId}`,
      content: content || '',
      visibility,
      date: Date.now()
    };
    
    // Enregistrer les notes
    this.savePlayerData();
    
    // Fermer la modale
    modal.remove();
    
    console.log(`Note enregistrée pour l'élément ${elementId}`);
    
    // Mettre à jour la liste des notes si visible
    if (document.getElementById('notes-panel').classList.contains('visible')) {
      this.updateNotesList();
    }
  }
  
  /**
   * Édite une note existante
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  editNote(elementId, layerId) {
    this.openNoteEditor(elementId, layerId);
  }
  
  /**
   * Supprime une note
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  deleteNote(elementId, layerId) {
    // Vérifier si la note existe
    if (!this.notes[layerId] || !this.notes[layerId][elementId]) return;
    
    // Supprimer la note
    delete this.notes[layerId][elementId];
    
    // Si la couche n'a plus de notes, supprimer l'entrée
    if (Object.keys(this.notes[layerId]).length === 0) {
      delete this.notes[layerId];
    }
    
    // Enregistrer les notes
    this.savePlayerData();
    
    console.log(`Note supprimée pour l'élément ${elementId}`);
    
    // Mettre à jour la liste des notes si visible
    if (document.getElementById('notes-panel').classList.contains('visible')) {
      this.updateNotesList();
    }
  }
  
  /**
   * Active le mode de position
   */
  activatePositionMode() {
    this.positionMode = true;
    this.noteMode = false;
    this.markerPlacementMode = false;
    
    // Mettre à jour l'interface
    document.body.classList.add('position-mode');
    
    console.log("Mode de position activé");
    
    // Afficher un message d'aide
    alert("Cliquez sur un élément de la carte pour définir votre position");
  }
  
  /**
   * Définit la position du joueur
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  setPlayerPosition(elementId, layerId) {
    // Désactiver le mode de position
    this.positionMode = false;
    document.body.classList.remove('position-mode');
    
    // Récupérer l'élément
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Calculer la position
    const bbox = element.getBBox();
    const position = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
      elementId: elementId,
      layerId: layerId
    };
    
    // Stocker la position
    this.currentPosition = position;
    
    // Enregistrer la position dans le stockage local
    const userId = this.getUserId();
    localStorage.setItem(`player-position-${userId}`, JSON.stringify([position.x, position.y]));
    
    // Rendre le marqueur de position
    this.renderPlayerMarker();
    
    console.log(`Position définie à l'élément ${elementId}`);
    
    // Publier l'événement
    EventBus.publish('player:moved', {
      userId: userId,
      position: position
    });
  }
  
  /**
   * Rend le marqueur de position du joueur
   */
  renderPlayerMarker() {
    if (!this.currentPosition) return;
    
    const activeSvgLayer = this.mapLoader.svgLayers[this.mapLoader.currentLayerId];
    if (!activeSvgLayer) return;
    
    const svgElement = activeSvgLayer.getElement();
    if (!svgElement) return;
    
    // Supprimer le marqueur existant
    const existingMarker = svgElement.querySelector('.player-position-marker');
    if (existingMarker) {
      existingMarker.remove();
    }
    
    // Récupérer les infos du joueur
    const userId = this.getUserId();
    const playerName = this.getUserName();
    
    // Créer le nouveau marqueur
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
    marker.classList.add('player-position-marker');
    
    // Utiliser l'icône personnalisée ou l'avatar par défaut
    if (this.personalSettings.icon) {
      const iconPath = this.getPlayerIconPath(this.personalSettings.icon);
      
      // Cercle de fond
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '12');
      circle.setAttribute('fill', this.personalSettings.color);
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '2');
      marker.appendChild(circle);
      
      // Icône
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "path");
      icon.setAttribute('d', iconPath);
      icon.setAttribute('fill', '#FFFFFF');
      icon.setAttribute('transform', 'scale(0.5) translate(-12, -12)');
      marker.appendChild(icon);
    } else {
      // Cercle de fond avec couleur personnalisée
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '12');
      circle.setAttribute('fill', this.personalSettings.color);
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '2');
      marker.appendChild(circle);
      
      // Initiales du joueur
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#FFFFFF');
      
      const initials = playerName.charAt(0).toUpperCase();
      text.textContent = initials;
      
      marker.appendChild(text);
    }
    
    // Positionner le marqueur
    marker.setAttribute('transform', `translate(${this.currentPosition.x}, ${this.currentPosition.y})`);
    
    // Ajouter au SVG
    svgElement.appendChild(marker);
    
    // Ajouter l'interaction de survol
    marker.addEventListener('mouseenter', (e) => {
      this.showPlayerTooltip(playerName, e.clientX, e.clientY);
    });
    
    marker.addEventListener('mouseleave', () => {
      this.hidePlayerTooltip();
    });
  }
  
  /**
   * Affiche une info-bulle pour le joueur
   * @param {string} playerName - Nom du joueur
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  showPlayerTooltip(playerName, x, y) {
    // Supprimer une info-bulle existante
    this.hidePlayerTooltip();
    
    // Créer l'info-bulle
    const tooltip = document.createElement('div');
    tooltip.className = 'player-tooltip';
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    
    // Ajouter le contenu
    tooltip.textContent = playerName;
    
    // Ajouter l'info-bulle au DOM
    document.body.appendChild(tooltip);
  }
  
  /**
   * Masque l'info-bulle du joueur
   */
  hidePlayerTooltip() {
    const tooltip = document.querySelector('.player-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
  
  /**
   * Obtient le chemin SVG pour une icône de joueur
   * @param {string} icon - Type d'icône
   * @returns {string} - Chemin SVG
   */
  getPlayerIconPath(icon) {
    const iconPaths = {
      'warrior': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
      'mage': 'M17.66 8L12 2.35 6.34 8C4.78 9.56 4 11.64 4 13.64s.78 4.11 2.34 5.67 3.61 2.35 5.66 2.35 4.1-.78 5.66-2.35S20 15.64 20 13.64 19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z',
      'rogue': 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z',
      'healer': 'M10.8 4.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v5.1H22v3.1h-5.1V22h-3.1v-8.8H8.9v-3.1h5.1V4.9z'
    };
    
    return iconPaths[icon] || '';
  }
  
  /**
   * Gère les changements de couche
   * @param {string} layerId - ID de la nouvelle couche
   */
  handleLayerChange(layerId) {
    console.log(`Couche changée: ${layerId}`);
    
    // Rendre les marqueurs de la nouvelle couche
    this.renderLayerMarkers(layerId);
    
    // Mettre à jour la position du joueur
    this.renderPlayerMarker();
  }
  
  /**
   * Rend les marqueurs d'une couche
   * @param {string} layerId - ID de la couche
   */
  renderLayerMarkers(layerId) {
    // Vérifier si la couche a des marqueurs
    if (!this.markers[layerId]) return;
    
    // Rendre chaque marqueur
    Object.keys(this.markers[layerId]).forEach(elementId => {
      this.renderMarker(elementId, layerId);
    });
  }
  
  /**
   * Charge les données du joueur depuis le stockage local
   */
  loadPlayerData() {
    const userId = this.getUserId();
    
    // Charger les notes
    const storedNotes = localStorage.getItem(`player-notes-${userId}`);
    if (storedNotes) {
      try {
        this.notes = JSON.parse(storedNotes);
        console.log("Notes chargées depuis le stockage local");
      } catch (error) {
        console.error("Erreur lors du chargement des notes:", error);
        this.notes = {};
      }
    }
    
    // Charger les marqueurs
    const storedMarkers = localStorage.getItem(`player-markers-${userId}`);
    if (storedMarkers) {
      try {
        this.markers = JSON.parse(storedMarkers);
        console.log("Marqueurs chargés depuis le stockage local");
      } catch (error) {
        console.error("Erreur lors du chargement des marqueurs:", error);
        this.markers = {};
      }
    }
    
    // Charger la position
    const storedPosition = localStorage.getItem(`player-position-${userId}`);
    if (storedPosition) {
      try {
        const position = JSON.parse(storedPosition);
        // Convertir l'ancienne position en objet si nécessaire
        if (Array.isArray(position)) {
          this.currentPosition = {
            x: position[0],
            y: position[1]
          };
        } else {
          this.currentPosition = position;
        }
        console.log("Position chargée depuis le stockage local");
      } catch (error) {
        console.error("Erreur lors du chargement de la position:", error);
        this.currentPosition = null;
      }
    }
    
    // Charger les paramètres personnels
    const storedSettings = localStorage.getItem(`player-settings-${userId}`);
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        this.personalSettings = {
          ...this.personalSettings,
          ...settings
        };
        console.log("Paramètres personnels chargés depuis le stockage local");
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres personnels:", error);
      }
    }
  }
  
  /**
   * Enregistre les données du joueur dans le stockage local
   */
  savePlayerData() {
    const userId = this.getUserId();
    
    // Enregistrer les notes
    localStorage.setItem(`player-notes-${userId}`, JSON.stringify(this.notes));
    
    // Enregistrer les marqueurs
    localStorage.setItem(`player-markers-${userId}`, JSON.stringify(this.markers));
    
    console.log("Données du joueur enregistrées");
  }
  
  /**
   * Enregistre les paramètres personnels du joueur
   */
  savePlayerSettings() {
    const userId = this.getUserId();
    localStorage.setItem(`player-settings-${userId}`, JSON.stringify(this.personalSettings));
    console.log("Paramètres personnels enregistrés");
  }
  
  /**
   * Récupère l'ID du joueur actuel
   * @returns {string} - ID du joueur
   */
  getUserId() {
    // Vérifier si le gestionnaire d'authentification est disponible
    if (typeof UserManager !== 'undefined' && UserManager.getCurrentUser()) {
      return UserManager.getCurrentUser().id;
    }
    
    // Utiliser un ID par défaut
    return 'default-player';
  }
  
  /**
   * Récupère le nom du joueur actuel
   * @returns {string} - Nom du joueur
   */
  getUserName() {
    // Vérifier si le gestionnaire d'authentification est disponible
    if (typeof UserManager !== 'undefined' && UserManager.getCurrentUser()) {
      return UserManager.getCurrentUser().name;
    }
    
    // Utiliser un nom par défaut
    return 'Joueur';
  }
  
  /**
   * Récupère la couleur du joueur
   * @returns {string} - Code couleur hexadécimal
   */
  getPlayerColor() {
    // Liste de couleurs prédéfinies
    const colors = [
      '#4CAF50', // Vert
      '#2196F3', // Bleu
      '#FFC107', // Jaune
      '#FF5722', // Orange
      '#E91E63', // Rose
      '#9C27B0', // Violet
      '#00BCD4', // Cyan
      '#795548'  // Marron
    ];
    
    // Utiliser l'ID du joueur pour choisir une couleur
    const userId = this.getUserId();
    const colorIndex = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    
    return colors[colorIndex];
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.PlayerTools = PlayerTools;
/**
 * PlayerTools - Outils spécifiques pour les joueurs
 * Permet aux joueurs d'interagir avec la carte, d'ajouter des notes et de suivre leur progression
 */
class PlayerTools {
  /**
   * Crée une instance des outils de joueur
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before PlayerTools");
    }
    
    this.mapLoader = mapLoader;
    this.currentPosition = null;
    this.notes = {};
    this.markers = {};
    this.personalSettings = {
      color: this.getPlayerColor(),
      icon: null
    };
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    // Initialiser l'interface utilisateur
    this.initUI();
    
    // Charger les notes et marqueurs existants
    this.loadPlayerData();
    
    console.log("Outils de joueur initialisés");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les clics sur les éléments de la carte
    EventBus.subscribe('map:element:click', (data) => {
      this.handleElementClick(data);
    });
    
    // Écouter les changements de couche
    EventBus.subscribe('map:layer:changed', (data) => {
      this.handleLayerChange(data.layerId);
    });
    
    // Écouteur pour le mode de placement de marqueur
    document.getElementById('add-marker-btn')?.addEventListener('click', () => {
      this.activateMarkerPlacementMode();
    });
    
    // Écouteur pour le mode de note
    document.getElementById('add-note-btn')?.addEventListener('click', () => {
      this.activateNoteMode();
    });
    
    // Écouteur pour la position du joueur
    document.getElementById('set-position-btn')?.addEventListener('click', () => {
      this.activatePositionMode();
    });
  }
  
  /**
   * Initialise l'interface utilisateur pour le joueur
   */
  initUI() {
    // Ajouter la barre d'outils du joueur
    this.createPlayerControlPanel();
    
    // Initialiser le panneau de notes
    this.initNotesPanel();
    
    // Afficher l'interface du joueur
    document.body.classList.add('player-view');
  }
  
  /**
   * Crée le panneau de contrôle du joueur
   */
  createPlayerControlPanel() {
    const panelContainer = document.createElement('div');
    panelContainer.id = 'player-control-panel';
    panelContainer.className = 'control-panel player-panel';
    
    // Créer le contenu du panneau
    panelContainer.innerHTML = `
      <div class="panel-header">
        <h3>Outils du Joueur</h3>
        <button id="player-panel-toggle" class="panel-toggle">▲</button>
      </div>
      <div class="panel-content">
        <div class="control-group">
          <h4>Marqueurs</h4>
          <button id="add-marker-btn" class="btn">Ajouter un marqueur</button>
          <button id="manage-markers-btn" class="btn">Gérer les marqueurs</button>
        </div>
        
        <div class="control-group">
          <h4>Notes</h4>
          <button id="add-note-btn" class="btn">Ajouter une note</button>
          <button id="show-notes-btn" class="btn">Afficher les notes</button>
        </div>
        
        <div class="control-group">
          <h4>Position</h4>
          <button id="set-position-btn" class="btn">Définir ma position</button>
        </div>
        
        <div class="control-group">
          <h4>Personnalisation</h4>
          <label for="player-color">Couleur:</label>
          <input type="color" id="player-color" value="${this.personalSettings.color}">
          
          <label for="player-icon">Icône:</label>
          <select id="player-icon">
            <option value="" ${!this.personalSettings.icon ? 'selected' : ''}>Par défaut</option>
            <option value="warrior" ${this.personalSettings.icon === 'warrior' ? 'selected' : ''}>Guerrier</option>
            <option value="mage" ${this.personalSettings.icon === 'mage' ? 'selected' : ''}>Mage</option>
            <option value="rogue" ${this.personalSettings.icon === 'rogue' ? 'selected' : ''}>Voleur</option>
            <option value="healer" ${this.personalSettings.icon === 'healer' ? 'selected' : ''}>Guérisseur</option>
          </select>
        </div>
      </div>
    `;
    
    // Ajouter le panneau au DOM
    document.body.appendChild(panelContainer);
    
    // Gérer le bouton de bascule du panneau
    const toggleButton = panelContainer.querySelector('#player-panel-toggle');
    const panelContent = panelContainer.querySelector('.panel-content');
    
    if (toggleButton && panelContent) {
      toggleButton.addEventListener('click', () => {
        panelContent.classList.toggle('collapsed');
        toggleButton.textContent = panelContent.classList.contains('collapsed') ? '▼' : '▲';
      });
    }
    
    // Gérer les changements de couleur et d'icône
    const colorInput = panelContainer.querySelector('#player-color');
    if (colorInput) {
      colorInput.addEventListener('change', (e) => {
        this.personalSettings.color = e.target.value;
        this.savePlayerSettings();
        this.renderPlayerMarker();
      });
    }
    
    const iconSelect = panelContainer.querySelector('#player-icon');
    if (iconSelect) {
      iconSelect.addEventListener('change', (e) => {
        this.personalSettings.icon = e.target.value;
        this.savePlayerSettings();
        this.renderPlayerMarker();
      });
    }
  }
  
  /**
   * Initialise le panneau de notes
   */