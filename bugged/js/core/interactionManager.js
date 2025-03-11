/**
 * InteractionManager - Gestionnaire d'interaction pour la carte interactive
 * Gère les différents outils et modes d'interaction avec la carte
 */
class InteractionManager {
  /**
   * Crée une instance du gestionnaire d'interaction
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before InteractionManager");
    }
    
    this.mapLoader = mapLoader;
    this.tools = {};
    this.activeTool = null;
    this.modes = {
      select: true,
      edit: false,
      view: true
    };
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    console.log("InteractionManager initialisé");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les clics sur les éléments de la carte
    EventBus.subscribe('map:element:click', (data) => {
      this.handleElementClick(data);
    });
    
    // Écouter les événements de survol
    EventBus.subscribe('map:element:hover', (data) => {
      this.handleElementHover(data);
    });
    
    // Écouter les changements de mode
    EventBus.subscribe('mode:changed', (data) => {
      this.setMode(data.mode, data.active);
    });
    
    // Configurer les boutons d'outils dans l'interface
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        const toolId = button.dataset.tool;
        
        // Mettre à jour l'interface
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Activer l'outil
        this.activateTool(toolId);
      });
    });
  }
  
  /**
   * Enregistre un outil
   * @param {string} id - ID unique pour l'outil
   * @param {object} tool - Instance de l'outil
   */
  registerTool(id, tool) {
    if (this.tools[id]) {
      console.warn(`L'outil ${id} existe déjà, il sera remplacé`);
    }
    
    this.tools[id] = tool;
    console.log(`Outil ${id} enregistré`);
    
    // Publier l'événement d'enregistrement d'outil
    EventBus.publish('tool:registered', {
      toolId: id,
      tool
    });
  }
  
  /**
   * Active un outil
   * @param {string} id - ID de l'outil à activer
   * @returns {boolean} - true si l'outil a été activé, false sinon
   */
  activateTool(id) {
    // Cas spécial pour l'outil de sélection
    if (id === 'select') {
      if (this.activeTool) {
        this.deactivateCurrentTool();
      }
      
      this.activeTool = 'select';
      this.setMode('select', true);
      
      // Publier l'événement d'activation d'outil
      EventBus.publish('tool:activated', {
        toolId: 'select',
        tool: null
      });
      
      console.log("Mode sélection activé");
      return true;
    }
    
    // Vérifier si l'outil existe
    if (!this.tools[id]) {
      console.error(`L'outil ${id} n'existe pas`);
      return false;
    }
    
    // Désactiver l'outil actuel
    this.deactivateCurrentTool();
    
    // Activer le nouvel outil
    const tool = this.tools[id];
    if (typeof tool.activate === 'function') {
      tool.activate();
    }
    
    this.activeTool = id;
    
    // Mettre à jour les modes
    this.setMode('select', false);
    
    // Publier l'événement d'activation d'outil
    EventBus.publish('tool:activated', {
      toolId: id,
      tool
    });
    
    console.log(`Outil ${id} activé`);
    return true;
  }
  
  /**
   * Désactive l'outil actuel
   */
  deactivateCurrentTool() {
    if (!this.activeTool || this.activeTool === 'select') {
      return;
    }
    
    const tool = this.tools[this.activeTool];
    if (tool && typeof tool.deactivate === 'function') {
      tool.deactivate();
    }
    
    // Publier l'événement de désactivation d'outil
    EventBus.publish('tool:deactivated', {
      toolId: this.activeTool,
      tool
    });
    
    console.log(`Outil ${this.activeTool} désactivé`);
    this.activeTool = null;
  }
  
  /**
   * Définit un mode
   * @param {string} mode - Nom du mode
   * @param {boolean} active - État du mode
   */
  setMode(mode, active) {
    if (this.modes[mode] === undefined) {
      console.warn(`Mode ${mode} inconnu`);
      return;
    }
    
    this.modes[mode] = active;
    
    // Mettre à jour les classes CSS pour l'interface
    if (active) {
      document.body.classList.add(`${mode}-mode`);
    } else {
      document.body.classList.remove(`${mode}-mode`);
    }
    
    console.log(`Mode ${mode} ${active ? 'activé' : 'désactivé'}`);
    
    // Publier l'événement de changement de mode
    EventBus.publish('mode:changed', {
      mode,
      active
    });
  }
  
  /**
   * Gère le clic sur un élément de la carte
   * @param {object} data - Données de l'événement
   */
  handleElementClick(data) {
    console.log(`Clic sur élément: ${data.elementId} (couche: ${data.layerId})`);
    
    // Si un outil est actif, lui déléguer l'événement
    if (this.activeTool && this.activeTool !== 'select') {
      const tool = this.tools[this.activeTool];
      if (tool && typeof tool.handleElementClick === 'function') {
        tool.handleElementClick(data);
        return;
      }
    }
    
    // Mode édition
    if (this.modes.edit) {
      this.handleEditModeClick(data);
      return;
    }
    
    // Mode sélection (par défaut)
    if (this.modes.select) {
      this.handleSelectModeClick(data);
      return;
    }
  }
  
  /**
   * Gère le clic en mode édition
   * @param {object} data - Données de l'événement
   */
  handleEditModeClick(data) {
    // Publier un événement pour ouvrir l'éditeur d'élément
    EventBus.publish('edit:element', {
      elementId: data.elementId,
      layerId: data.layerId
    });
  }
  
  /**
   * Gère le clic en mode sélection
   * @param {object} data - Données de l'événement
   */
  handleSelectModeClick(data) {
    // Récupérer les informations de l'élément
    const elementId = data.elementId;
    const layerId = data.layerId;
    
    // Vérifier si l'élément a des notes ou des marqueurs
    // Pour simplifier, on lance un événement pour que les gestionnaires concernés traitent cela
    EventBus.publish('element:selected', {
      elementId,
      layerId,
      originalEvent: data.originalEvent
    });
    
    // Ajouter une classe de sélection temporaire
    const element = this.mapLoader.getElementById(elementId, layerId);
    if (element) {
      element.classList.add('selected');
      setTimeout(() => {
        element.classList.remove('selected');
      }, 500);
    }
  }
  
  /**
   * Gère le survol d'un élément
   * @param {object} data - Données de l'événement
   */
  handleElementHover(data) {
    // Si un outil est actif, lui déléguer l'événement
    if (this.activeTool && this.activeTool !== 'select') {
      const tool = this.tools[this.activeTool];
      if (tool && typeof tool.handleElementHover === 'function') {
        tool.handleElementHover(data);
        return;
      }
    }
    
    // Mode édition
    if (this.modes.edit) {
      this.handleEditModeHover(data);
      return;
    }
    
    // Par défaut, pas de comportement spécifique pour le survol
  }
  
  /**
   * Gère le survol en mode édition
   * @param {object} data - Données de l'événement
   */
  handleEditModeHover(data) {
    // Ajouter une classe d'édition pour indiquer que l'élément est éditable
    const element = this.mapLoader.getElementById(data.elementId, data.layerId);
    if (element) {
      element.classList.add('editable');
    }
  }
  
  /**
   * Récupère l'outil actif
   * @returns {object|null} - Outil actif ou null si aucun
   */
  getActiveTool() {
    if (!this.activeTool || this.activeTool === 'select') {
      return null;
    }
    
    return this.tools[this.activeTool];
  }
  
  /**
   * Récupère un outil par son ID
   * @param {string} id - ID de l'outil
   * @returns {object|null} - Outil ou null si non trouvé
   */
  getTool(id) {
    return this.tools[id] || null;
  }
}

// Exporter la classe
window.InteractionManager = InteractionManager;