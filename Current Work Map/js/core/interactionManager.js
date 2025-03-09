/**
 * InteractionManager - Gestionnaire d'interactions pour la carte interactive de Nexus
 * Permet de gérer les outils et les interactions utilisateur
 */
class InteractionManager {
  /**
   * Crée une instance du gestionnaire d'interactions
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.activeToolId = null;
    this.tools = {};
    
    // Mettre en place les écouteurs d'événements
    this.setupEventListeners();
  }
  
  /**
   * Enregistre un nouvel outil
   * @param {string} id - Identifiant de l'outil
   * @param {object} tool - Instance de l'outil
   * @returns {string} - Identifiant de l'outil
   */
  registerTool(id, tool) {
    this.tools[id] = tool;
    
    // Mettre à jour l'interface
    this.updateToolsUI();
    
    return id;
  }
  
  /**
   * Active un outil
   * @param {string} toolId - Identifiant de l'outil
   * @returns {boolean} - Succès ou échec
   */
  activateTool(toolId) {
    if (!this.tools[toolId]) return false;
    
    // Désactiver l'outil actuel
    if (this.activeToolId && this.tools[this.activeToolId]) {
      this.tools[this.activeToolId].deactivate();
    }
    
    // Activer le nouvel outil
    this.tools[toolId].activate();
    this.activeToolId = toolId;
    
    // Mettre à jour l'interface
    this.updateToolsUI();
    
    // Dispatcher un événement
    EventBus.publish('tool:changed', {
      toolId: toolId,
      tool: this.tools[toolId]
    });
    
    return true;
  }
  
  /**
   * Désactive l'outil actuel
   * @returns {boolean} - Succès ou échec
   */
  deactivateCurrentTool() {
    if (!this.activeToolId) return false;
    
    // Désactiver l'outil actuel
    if (this.tools[this.activeToolId]) {
      this.tools[this.activeToolId].deactivate();
    }
    
    // Réinitialiser l'outil actif
    const previousToolId = this.activeToolId;
    this.activeToolId = null;
    
    // Mettre à jour l'interface
    this.updateToolsUI();
    
    // Dispatcher un événement
    EventBus.publish('tool:changed', {
      toolId: null,
      tool: null,
      previousToolId: previousToolId
    });
    
    return true;
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Écouter les événements de clic sur les éléments de la carte
    document.addEventListener('element:click', (e) => {
      const { elementId, layerId, originalEvent } = e.detail;
      
      // Si un outil est actif, lui déléguer l'événement
      if (this.activeToolId && this.tools[this.activeToolId]) {
        this.tools[this.activeToolId].handleElementClick(elementId, layerId, originalEvent);
      }
    });
    
    // Écouteurs pour les boutons d'outils dans l'interface
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        const toolId = button.dataset.tool;
        if (toolId) {
          // Si l'outil est déjà actif, le désactiver
          if (this.activeToolId === toolId) {
            this.deactivateCurrentTool();
          } else {
            // Sinon, activer le nouvel outil
            this.activateTool(toolId);
          }
        }
      });
    });
  }
  
  /**
   * Met à jour l'interface des outils
   */
  updateToolsUI() {
    const toolButtons = document.querySelectorAll('.tool-btn');
    
    // Mettre à jour les classes actives
    toolButtons.forEach(button => {
      const toolId = button.dataset.tool;
      button.classList.toggle('active', toolId === this.activeToolId);
    });
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.InteractionManager = InteractionManager;