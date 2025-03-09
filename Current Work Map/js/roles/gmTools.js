/**
 * GMTools - Outils spécifiques pour le Maître de Jeu
 * Permet de gérer les éléments de la carte, les événements et les interactions avec les joueurs
 */
class GMTools {
  /**
   * Crée une instance des outils de MJ
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   * @param {LayerManager} layerManager - Instance du gestionnaire de couches
   * @param {EventManager} eventManager - Instance du gestionnaire d'événements
   */
  constructor(mapLoader, layerManager, eventManager) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before GMTools");
    }
    
    this.mapLoader = mapLoader;
    this.layerManager = layerManager;
    this.eventManager = eventManager;
    this.editMode = false;
    this.visibilityControls = {};
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    // Initialiser l'interface utilisateur
    this.initUI();
    
    console.log("Outils de MJ initialisés");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les clics sur les éléments de la carte
    EventBus.subscribe('map:element:click', (data) => {
      if (this.editMode) {
        this.handleElementClick(data);
      }
    });
    
    // Écouter les changements de couche
    EventBus.subscribe('map:layer:changed', (data) => {
      this.updateLayerControls(data.layerId);
    });
    
    // Écouter les événements des joueurs
    EventBus.subscribe('player:moved', (data) => {
      this.handlePlayerMovement(data);
    });
    
    // Écouter les événements d'édition d'événements
    document.getElementById('edit-mode-toggle')?.addEventListener('click', () => {
      this.toggleEditMode();
    });
    
    // Boutons de création d'événements
    document.getElementById('create-event-btn')?.addEventListener('click', () => {
      this.eventManager?.openEventCreationModal();
    });
    
    // Boutons de visibilité des éléments
    const visibilityToggle = document.getElementById('toggle-visibility');
    if (visibilityToggle) {
      visibilityToggle.addEventListener('change', (e) => {
        this.toggleElementsVisibility(e.target.checked);
      });
    }
  }
  
  /**
   * Initialise l'interface utilisateur pour le MJ
   */
  initUI() {
    // Ajouter la barre d'outils du MJ
    this.createGMControlPanel();
    
    // Initialiser les contrôles de visibilité
    this.initVisibilityControls();
    
    // Afficher l'interface du MJ
    document.body.classList.add('gm-view');
  }
  
  /**
   * Crée le panneau de contrôle du MJ
   */
  createGMControlPanel() {
    const panelContainer = document.createElement('div');
    panelContainer.id = 'gm-control-panel';
    panelContainer.className = 'control-panel';
    
    // Créer le contenu du panneau
    panelContainer.innerHTML = `
      <div class="panel-header">
        <h3>Outils du Maître de Jeu</h3>
        <button id="gm-panel-toggle" class="panel-toggle">▲</button>
      </div>
      <div class="panel-content">
        <div class="control-group">
          <h4>Mode d'édition</h4>
          <label class="switch">
            <input type="checkbox" id="edit-mode-toggle">
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="control-group">
          <h4>Visibilité des éléments</h4>
          <label class="switch">
            <input type="checkbox" id="toggle-visibility" checked>
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="control-group">
          <h4>Événements</h4>
          <button id="create-event-btn" class="btn">Créer un événement</button>
          <button id="manage-events-btn" class="btn">Gérer les événements</button>
        </div>
        
        <div class="control-group">
          <h4>Joueurs</h4>
          <div id="players-list" class="players-list">
            <p>Aucun joueur connecté</p>
          </div>
        </div>
      </div>
    `;
    
    // Ajouter le panneau au DOM
    document.body.appendChild(panelContainer);
    
    // Gérer le bouton de bascule du panneau
    const toggleButton = panelContainer.querySelector('#gm-panel-toggle');
    const panelContent = panelContainer.querySelector('.panel-content');
    
    if (toggleButton && panelContent) {
      toggleButton.addEventListener('click', () => {
        panelContent.classList.toggle('collapsed');
        toggleButton.textContent = panelContent.classList.contains('collapsed') ? '▼' : '▲';
      });
    }
  }
  
  /**
   * Initialise les contrôles de visibilité des éléments
   */
  initVisibilityControls() {
    // Créer les contrôles pour chaque type d'élément
    const types = ['quartiers', 'rues', 'batiments', 'points-interet'];
    const container = document.createElement('div');
    container.className = 'visibility-controls';
    
    types.forEach(type => {
      const control = document.createElement('div');
      control.className = 'visibility-control';
      control.innerHTML = `
        <label class="switch">
          <input type="checkbox" data-type="${type}" checked>
          <span class="slider"></span>
        </label>
        <span>${this.formatTypeName(type)}</span>
      `;
      
      // Ajouter le contrôle au conteneur
      container.appendChild(control);
      
      // Stocker la référence
      this.visibilityControls[type] = control.querySelector('input');
      
      // Ajouter l'écouteur d'événements
      this.visibilityControls[type].addEventListener('change', (e) => {
        this.toggleTypeVisibility(type, e.target.checked);
      });
    });
    
    // Ajouter le conteneur au panneau
    const panelContent = document.querySelector('#gm-control-panel .panel-content');
    if (panelContent) {
      const controlGroup = document.createElement('div');
      controlGroup.className = 'control-group';
      controlGroup.innerHTML = '<h4>Types d\'éléments</h4>';
      controlGroup.appendChild(container);
      
      panelContent.appendChild(controlGroup);
    }
  }
  
  /**
   * Formate le nom d'un type d'élément
   * @param {string} type - Type d'élément
   * @returns {string} - Nom formaté
   */
  formatTypeName(type) {
    const names = {
      'quartiers': 'Quartiers',
      'rues': 'Rues',
      'batiments': 'Bâtiments',
      'points-interet': 'Points d\'intérêt'
    };
    
    return names[type] || type;
  }
  
  /**
   * Active ou désactive le mode d'édition
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    
    // Mettre à jour l'interface
    document.body.classList.toggle('edit-mode', this.editMode);
    
    // Mettre à jour le bouton
    const editToggle = document.getElementById('edit-mode-toggle');
    if (editToggle) {
      editToggle.checked = this.editMode;
    }
    
    console.log(`Mode d'édition ${this.editMode ? 'activé' : 'désactivé'}`);
    
    // Publier l'événement
    EventBus.publish('gm:edit:mode', {
      active: this.editMode
    });
  }
  
  /**
   * Gère le clic sur un élément de la carte en mode édition
   * @param {object} data - Données de l'événement
   */
  handleElementClick(data) {
    console.log(`Élément cliqué en mode édition: ${data.elementId}`);
    
    // Ouvrir la modale d'édition
    this.openEditElementModal(data.elementId, data.layerId);
  }
  
  /**
   * Ouvre la modale d'édition d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  openEditElementModal(elementId, layerId) {
    // Récupérer les informations sur l'élément
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Créer la modale
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-element-modal';
    
    // Vérifier si l'élément a déjà des notes ou attributs personnalisés
    const customData = this.getElementCustomData(elementId, layerId);
    
    // Créer le contenu de la modale
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Éditer l'élément: ${elementId}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <form id="edit-element-form">
            <div class="form-group">
              <label for="element-name">Nom personnalisé:</label>
              <input type="text" id="element-name" value="${customData.name || ''}">
            </div>
            <div class="form-group">
              <label for="element-description">Description:</label>
              <textarea id="element-description" rows="4">${customData.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="element-visibility">Visibilité:</label>
              <select id="element-visibility">
                <option value="public" ${customData.visibility === 'public' ? 'selected' : ''}>Public</option>
                <option value="gm-only" ${customData.visibility === 'gm-only' ? 'selected' : ''}>MJ uniquement</option>
              </select>
            </div>
            <div class="form-group">
              <label for="element-type">Type:</label>
              <select id="element-type">
                <option value="quartier" ${customData.type === 'quartier' ? 'selected' : ''}>Quartier</option>
                <option value="batiment" ${customData.type === 'batiment' ? 'selected' : ''}>Bâtiment</option>
                <option value="point-interet" ${customData.type === 'point-interet' ? 'selected' : ''}>Point d'intérêt</option>
                <option value="rue" ${customData.type === 'rue' ? 'selected' : ''}>Rue</option>
                <option value="autre" ${customData.type === 'autre' ? 'selected' : ''}>Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label for="element-color">Couleur personnalisée:</label>
              <input type="color" id="element-color" value="${customData.color || '#ffffff'}">
            </div>
            <div class="form-group">
              <label for="element-icon">Icône:</label>
              <select id="element-icon">
                <option value="" ${!customData.icon ? 'selected' : ''}>Aucune</option>
                <option value="house" ${customData.icon === 'house' ? 'selected' : ''}>Maison</option>
                <option value="shop" ${customData.icon === 'shop' ? 'selected' : ''}>Boutique</option>
                <option value="temple" ${customData.icon === 'temple' ? 'selected' : ''}>Temple</option>
                <option value="tavern" ${customData.icon === 'tavern' ? 'selected' : ''}>Taverne</option>
                <option value="danger" ${customData.icon === 'danger' ? 'selected' : ''}>Danger</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button id="save-element-btn" class="btn btn-primary">Enregistrer</button>
          <button id="cancel-element-btn" class="btn">Annuler</button>
        </div>
      </div>
    `;
    
    // Ajouter la modale au DOM
    document.body.appendChild(modal);
    
    // Gérer les événements
    const closeButton = modal.querySelector('.close');
    const saveButton = modal.querySelector('#save-element-btn');
    const cancelButton = modal.querySelector('#cancel-element-btn');
    
    closeButton.addEventListener('click', () => {
      this.closeEditElementModal();
    });
    
    saveButton.addEventListener('click', () => {
      this.saveElementCustomData(elementId, layerId);
    });
    
    cancelButton.addEventListener('click', () => {
      this.closeEditElementModal();
    });
    
    // Ouvrir la modale
    modal.style.display = 'block';
  }
  
  /**
   * Ferme la modale d'édition d'un élément
   */
  closeEditElementModal() {
    const modal = document.getElementById('edit-element-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  /**
   * Récupère les données personnalisées d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @returns {object} - Données personnalisées
   */
  getElementCustomData(elementId, layerId) {
    // Vérifier si des données existent déjà dans le stockage local
    const key = `element-data-${layerId}-${elementId}`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      try {
        return JSON.parse(storedData);
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
   * Enregistre les données personnalisées d'un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  saveElementCustomData(elementId, layerId) {
    const modal = document.getElementById('edit-element-modal');
    if (!modal) return;
    
    // Récupérer les valeurs du formulaire
    const name = modal.querySelector('#element-name').value;
    const description = modal.querySelector('#element-description').value;
    const visibility = modal.querySelector('#element-visibility').value;
    const type = modal.querySelector('#element-type').value;
    const color = modal.querySelector('#element-color').value;
    const icon = modal.querySelector('#element-icon').value;
    
    // Créer l'objet de données
    const customData = {
      name,
      description,
      visibility,
      type,
      color,
      icon,
      lastModified: new Date().toISOString()
    };
    
    // Enregistrer dans le stockage local
    const key = `element-data-${layerId}-${elementId}`;
    localStorage.setItem(key, JSON.stringify(customData));
    
    console.log(`Données de l'élément ${elementId} enregistrées:`, customData);
    
    // Appliquer les modifications visuelles
    this.applyElementCustomization(elementId, layerId, customData);
    
    // Fermer la modale
    this.closeEditElementModal();
    
    // Publier l'événement
    EventBus.publish('element:customized', {
      elementId,
      layerId,
      customData
    });
  }
  
  /**
   * Applique les personnalisations visuelles à un élément
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @param {object} customData - Données personnalisées
   */
  applyElementCustomization(elementId, layerId, customData) {
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (!element) return;
    
    // Appliquer la couleur si définie
    if (customData.color && customData.color !== '#ffffff') {
      // Stocker la couleur originale si ce n'est pas déjà fait
      if (!element.dataset.originalFill) {
        element.dataset.originalFill = element.getAttribute('fill') || '';
      }
      
      // Appliquer la nouvelle couleur
      element.style.fill = customData.color;
    } else if (element.dataset.originalFill) {
      // Restaurer la couleur originale
      element.setAttribute('fill', element.dataset.originalFill);
      element.style.fill = '';
    }
    
    // Appliquer le type
    if (customData.type) {
      // Supprimer les classes de type existantes
      element.classList.remove('quartier', 'batiment', 'point-interet', 'rue', 'autre');
      
      // Ajouter la nouvelle classe
      element.classList.add(customData.type);
    }
    
    // Gérer la visibilité
    if (customData.visibility === 'gm-only') {
      element.classList.add('gm-only');
    } else {
      element.classList.remove('gm-only');
    }
    
    // Ajouter une icône si définie
    if (customData.icon) {
      this.addIconToElement(element, customData.icon);
    } else {
      this.removeIconFromElement(element);
    }
  }
  
  /**
   * Ajoute une icône à un élément
   * @param {SVGElement} element - Élément SVG
   * @param {string} iconName - Nom de l'icône
   */
  addIconToElement(element, iconName) {
    // Supprimer l'icône existante
    this.removeIconFromElement(element);
    
    // Créer une nouvelle icône
    const svg = element.ownerSVGElement;
    if (!svg) return;
    
    // Obtenir les coordonnées du centre de l'élément
    const bbox = element.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Créer un groupe pour l'icône
    const iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    iconGroup.classList.add('custom-icon');
    iconGroup.dataset.elementId = element.id;
    
    // Définir les attributs de l'icône selon le type
    const iconPath = this.getIconPath(iconName);
    
    // Créer le cercle de fond
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('stroke', '#000000');
    circle.setAttribute('stroke-width', '1');
    
    // Créer l'icône elle-même
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    icon.setAttribute('d', iconPath);
    icon.setAttribute('fill', '#000000');
    icon.setAttribute('transform', 'scale(0.4) translate(-12, -12)');
    
    // Ajouter les éléments au groupe
    iconGroup.appendChild(circle);
    iconGroup.appendChild(icon);
    
    // Positionner le groupe
    iconGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
    
    // Ajouter le groupe au SVG
    svg.appendChild(iconGroup);
  }
  
  /**
   * Supprime l'icône d'un élément
   * @param {SVGElement} element - Élément SVG
   */
  removeIconFromElement(element) {
    const svg = element.ownerSVGElement;
    if (!svg) return;
    
    // Rechercher l'icône existante
    const existingIcon = svg.querySelector(`.custom-icon[data-element-id="${element.id}"]`);
    if (existingIcon) {
      existingIcon.remove();
    }
  }
  
  /**
   * Obtient le chemin SVG d'une icône
   * @param {string} iconName - Nom de l'icône
   * @returns {string} - Chemin SVG
   */
  getIconPath(iconName) {
    // Définir les chemins SVG pour chaque icône
    const iconPaths = {
      'house': 'M20 40h10V30h10v10h10V25L25 10L10 25v15zm0 0',
      'shop': 'M10 20v25h30V20M10 20h30M15 15h20v5H15v-5zm0 0',
      'temple': 'M10 40h30M25 10L10 20h30L25 10zm0 0M25 40V20M15 25h20',
      'tavern': 'M15 15c0-2.8 4.5-5 10-5s10 2.2 10 5H15zm0 0v10h30V15M15 25v15h30V25M15 30h30',
      'danger': 'M25 10l15 30H10L25 10zm0 0M25 20v10M25 35v.1'
    };
    
    return iconPaths[iconName] || '';
  }
  
  /**
   * Active ou désactive la visibilité des éléments
   * @param {boolean} visible - Indique si les éléments doivent être visibles
   */
  toggleElementsVisibility(visible) {
    const activeLayer = this.mapLoader.getActiveLayer();
    if (!activeLayer) return;
    
    const svgElement = activeLayer.getElement();
    if (!svgElement) return;
    
    // Appliquer la visibilité à tous les éléments
    if (visible) {
      svgElement.classList.remove('hide-elements');
    } else {
      svgElement.classList.add('hide-elements');
    }
    
    console.log(`Visibilité des éléments ${visible ? 'activée' : 'désactivée'}`);
  }
  
  /**
   * Active ou désactive la visibilité d'un type d'élément
   * @param {string} type - Type d'élément
   * @param {boolean} visible - Indique si le type doit être visible
   */
  toggleTypeVisibility(type, visible) {
    const activeLayer = this.mapLoader.getActiveLayer();
    if (!activeLayer) return;
    
    const svgElement = activeLayer.getElement();
    if (!svgElement) return;
    
    // Appliquer la visibilité au type spécifié
    if (visible) {
      svgElement.classList.remove(`hide-${type}`);
    } else {
      svgElement.classList.add(`hide-${type}`);
    }
    
    console.log(`Visibilité des ${type} ${visible ? 'activée' : 'désactivée'}`);
    
    // Publier l'événement
    EventBus.publish('gm:visibility:changed', {
      type,
      visible
    });
  }
  
  /**
   * Met à jour les contrôles de couche
   * @param {string} layerId - ID de la couche active
   */
  updateLayerControls(layerId) {
    // Mettre à jour les contrôles de visibilité
    // pour les adapter à la couche active
    console.log(`Mise à jour des contrôles pour la couche ${layerId}`);
  }
  
  /**
   * Gère le mouvement d'un joueur
   * @param {object} data - Données du mouvement
   */
  handlePlayerMovement(data) {
    console.log(`Joueur ${data.userId} déplacé à:`, data.position);
    
    // Mettre à jour la liste des joueurs
    this.updatePlayersList();
  }
  
  /**
   * Met à jour la liste des joueurs
   */
  updatePlayersList() {
    // Vérifier si le gestionnaire d'utilisateurs est disponible
    if (typeof UserManager === 'undefined' || !UserManager.users) {
      console.warn("UserManager non disponible");
      return;
    }
    
    const playersContainer = document.getElementById('players-list');
    if (!playersContainer) return;
    
    // Vider le conteneur
    playersContainer.innerHTML = '';
    
    // Récupérer la liste des joueurs
    const players = Object.values(UserManager.users).filter(user => user.role === 'player');
    
    if (players.length === 0) {
      playersContainer.innerHTML = '<p>Aucun joueur connecté</p>';
      return;
    }
    
    // Créer la liste des joueurs
    players.forEach(player => {
      const playerItem = document.createElement('div');
      playerItem.className = 'player-item';
      playerItem.dataset.userId = player.id;
      
      playerItem.innerHTML = `
        <span class="player-name">${player.name}</span>
        <button class="btn btn-small locate-player" data-user-id="${player.id}">Localiser</button>
      `;
      
      // Ajouter le joueur à la liste
      playersContainer.appendChild(playerItem);
      
      // Ajouter un écouteur d'événements pour le bouton de localisation
      const locateButton = playerItem.querySelector('.locate-player');
      if (locateButton) {
        locateButton.addEventListener('click', () => {
          this.locatePlayer(player.id);
        });
      }
    });
  }
  
  /**
   * Localise un joueur sur la carte
   * @param {string} userId - ID du joueur
   */
  locatePlayer(userId) {
    // Vérifier si le gestionnaire d'utilisateurs est disponible
    if (typeof UserManager === 'undefined' || !UserManager.users) {
      console.warn("UserManager non disponible");
      return;
    }
    
    const user = UserManager.users[userId];
    if (!user) {
      console.warn(`Utilisateur ${userId} non trouvé`);
      return;
    }
    
    // Récupérer la position du joueur depuis une source (ex: stockage local, API)
    const playerPosition = this.getPlayerPosition(userId);
    if (!playerPosition) {
      alert(`Position de ${user.name} inconnue`);
      return;
    }
    
    // Centrer la carte sur la position du joueur
    const map = this.mapLoader.getMap();
    if (map) {
      map.setView(playerPosition, map.getZoom());
      
      // Ajouter un marqueur temporaire pour mettre en évidence la position
      const marker = L.marker(playerPosition).addTo(map);
      marker.bindPopup(`Position de ${user.name}`).openPopup();
      
      // Supprimer le marqueur après 5 secondes
      setTimeout(() => map.removeLayer(marker), 5000);
    }
    
    console.log(`Joueur ${user.name} localisé à:`, playerPosition);
  }
  
  /**
   * Récupère la position d'un joueur
   * @param {string} userId - ID du joueur
   * @returns {Array|null} - Position [x, y] ou null si non trouvée
   */
  getPlayerPosition(userId) {
    // Récupérer la position depuis le stockage local
    const key = `player-position-${userId}`;
    const storedPosition = localStorage.getItem(key);
    
    if (storedPosition) {
      try {
        return JSON.parse(storedPosition);
      } catch (error) {
        console.error(`Erreur lors de la lecture de la position de ${userId}:`, error);
      }
    }
    
    return null;
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.GMTools = GMTools;