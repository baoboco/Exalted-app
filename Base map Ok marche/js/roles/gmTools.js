/**
 * GMTools - Outils spécifiques au Maître de Jeu pour la carte interactive de Nexus
 */
class GMTools {
  /**
   * Crée une instance des outils MJ
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   * @param {LayerManager} layerManager - Instance du gestionnaire de couches
   * @param {EventManager} eventManager - Instance du gestionnaire d'événements
   */
  constructor(mapLoader, layerManager, eventManager) {
    this.mapLoader = mapLoader;
    this.layerManager = layerManager;
    this.eventManager = eventManager;
    
    // Référence aux outils
    this.tools = {};
    
    // Interface MJ
    this.setupGMInterface();
  }
  
  /**
   * Configure l'interface du MJ
   */
  setupGMInterface() {
    // Uniquement si l'utilisateur actuel est le MJ
    if (!UserManager.isGameMaster()) return;
    
    // Ajouter la classe is-gm au corps pour les styles spécifiques
    document.body.classList.add('is-gm');
    
    // Créer les outils spécifiques au MJ
    this.createGMTools();
    
    // Ajouter les contrôles d'événements au menu du MJ
    this.setupEventControls();
    
    // Ajouter les contrôles des joueurs
    this.setupPlayerControls();
  }
  
  /**
   * Crée les outils spécifiques au MJ
   */
  createGMTools() {
    // Outil de sélection (permettant de sélectionner plusieurs éléments)
    this.tools.selection = new SelectionTool(this.mapLoader);
    
    // Ajouter l'outil à l'interactionManager si disponible
    if (window.interactionManager) {
      window.interactionManager.registerTool('selection', this.tools.selection);
    }
  }
  
  /**
   * Configure les contrôles d'événements
   */
  setupEventControls() {
    const createEventBtn = document.getElementById('create-event-btn');
    if (createEventBtn) {
      createEventBtn.addEventListener('click', () => {
        this.eventManager.openEventCreationModal();
      });
    }
  }
  
  /**
   * Configure les contrôles des joueurs
   */
  setupPlayerControls() {
    const playersList = document.getElementById('players-list');
    if (!playersList) return;
    
    // Vider la liste
    playersList.innerHTML = '';
    
    // Ajouter chaque joueur
    Object.values(UserManager.users).forEach(user => {
      // Ne pas ajouter le MJ à la liste des joueurs
      if (user.role === 'gm') return;
      
      const playerItem = document.createElement('li');
      playerItem.className = 'player-item';
      playerItem.dataset.userId = user.id;
      
      playerItem.innerHTML = `
        <span class="player-name">${user.name}</span>
        <div class="player-controls">
          <button class="player-message-btn">📝</button>
          <button class="player-locate-btn">📍</button>
        </div>
      `;
      
      // Ajouter des écouteurs d'événements
      const messageBtn = playerItem.querySelector('.player-message-btn');
      const locateBtn = playerItem.querySelector('.player-locate-btn');
      
      messageBtn.addEventListener('click', () => {
        this.sendMessageToPlayer(user.id);
      });
      
      locateBtn.addEventListener('click', () => {
        this.locatePlayer(user.id);
      });
      
      playersList.appendChild(playerItem);
    });
  }
  
  /**
   * Envoie un message à un joueur
   * @param {string} userId - ID du joueur
   */
  sendMessageToPlayer(userId) {
    const user = UserManager.users[userId];
    if (!user) return;
    
    const message = prompt(`Envoyer un message à ${user.name}:`);
    if (!message) return;
    
    // Dispatcher un événement
    EventBus.publish('message:sent', {
      from: UserManager.getCurrentUser().id,
      to: userId,
      message: message,
      timestamp: new Date().toISOString()
    });
    
    alert(`Message envoyé à ${user.name}`);
  }
  
  /**
   * Localise un joueur sur la carte
   * @param {string} userId - ID du joueur
   */
  locatePlayer(userId) {
    // Cette fonction est un placeholder
    // Dans une version plus avancée, on pourrait réellement suivre la position des joueurs
    alert("Fonctionnalité de localisation non implémentée");
  }
}

/**
 * SelectionTool - Outil de sélection pour le MJ
 */
class SelectionTool {
  /**
   * Crée une instance de l'outil de sélection
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    this.id = 'selection';
    this.name = 'Sélection';
    this.mapLoader = mapLoader;
    this.active = false;
    this.selectedElements = [];
    
    // Référence à l'élément qui affiche les éléments sélectionnés
    this.selectedAreasContainer = document.getElementById('selected-areas');
  }
  
  /**
   * Active l'outil
   */
  activate() {
    this.active = true;
    document.body.classList.add('tool-selection-active');
    this.clearSelection();
  }
  
  /**
   * Désactive l'outil
   */
  deactivate() {
    this.active = false;
    document.body.classList.remove('tool-selection-active');
    this.clearSelection();
  }
  
  /**
   * Gère un clic sur un élément
   * @param {string} elementId - ID de l'élément cliqué
   * @param {string} layerId - ID de la couche
   * @param {Event} event - Événement de clic original
   */
  handleElementClick(elementId, layerId, event) {
    if (!this.active) return;
    
    // Récupérer l'élément
    const svgLayer = this.mapLoader.svgLayers[layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    const element = svgElement.getElementById(elementId);
    if (!element) return;
    
    // Ajouter ou supprimer de la sélection
    if (this.isElementSelected(elementId)) {
      this.removeFromSelection(elementId);
      element.classList.remove('selected');
    } else {
      this.addToSelection(elementId, layerId, element);
      element.classList.add('selected');
    }
  }
  
  /**
   * Vérifie si un élément est sélectionné
   * @param {string} elementId - ID de l'élément
   * @returns {boolean} - Vrai si l'élément est sélectionné
   */
  isElementSelected(elementId) {
    return this.selectedElements.some(el => el.id === elementId);
  }
  
  /**
   * Ajoute un élément à la sélection
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @param {SVGElement} element - Élément SVG
   */
  addToSelection(elementId, layerId, element) {
    // Ajouter à la liste
    this.selectedElements.push({
      id: elementId,
      layerId: layerId,
      element: element
    });
    
    // Mettre à jour l'interface
    this.updateSelectedUI();
  }
  
  /**
   * Supprime un élément de la sélection
   * @param {string} elementId - ID de l'élément
   */
  removeFromSelection(elementId) {
    // Trouver l'index de l'élément
    const index = this.selectedElements.findIndex(el => el.id === elementId);
    if (index === -1) return;
    
    // Supprimer de la liste
    const removed = this.selectedElements.splice(index, 1)[0];
    
     // Supprimer la classe selected
    if (removed.element) {
      removed.element.classList.remove('selected');
    }
    
    // Mettre à jour l'interface
    this.updateSelectedUI();
  }
  
  /**
   * Efface la sélection
   */
  clearSelection() {
    // Supprimer la classe selected de tous les éléments
    this.selectedElements.forEach(el => {
      if (el.element) {
        el.element.classList.remove('selected');
      }
    });
    
    // Vider la liste
    this.selectedElements = [];
    
    // Mettre à jour l'interface
    this.updateSelectedUI();
  }
  
  /**
   * Met à jour l'interface de sélection
   */
  updateSelectedUI() {
    if (!this.selectedAreasContainer) return;
    
    // Vider le conteneur
    this.selectedAreasContainer.innerHTML = '';
    
    // Ajouter chaque élément sélectionné
    this.selectedElements.forEach(el => {
      const item = document.createElement('div');
      item.className = 'item';
      item.dataset.elementId = el.id;
      
      item.innerHTML = `
        ${el.id}
        <span class="remove" data-element-id="${el.id}">×</span>
      `;
      
      // Ajouter un écouteur pour la suppression
      const removeBtn = item.querySelector('.remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFromSelection(el.id);
      });
      
      this.selectedAreasContainer.appendChild(item);
    });
  }
}

// Exporter les classes pour une utilisation dans d'autres modules
window.GMTools = GMTools;
window.SelectionTool = SelectionTool;