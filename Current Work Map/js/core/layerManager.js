/**
 * LayerManager - Gestionnaire de couches pour la carte interactive de Nexus
 * Permet de gérer différentes couches (étages, souterrains, etc.)
 */
class LayerManager {
  /**
   * Crée une instance du gestionnaire de couches
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.layers = {};
    this.activeLayerId = null;
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les changements de sélection de couche dans l'interface
    const layerSelector = document.getElementById('layer-selector');
    if (layerSelector) {
      layerSelector.addEventListener('change', (e) => {
        this.activateLayer(e.target.value);
      });
    }
  }
  
  /**
   * Ajoute une nouvelle couche
   * @param {string} id - Identifiant de la couche
   * @param {string} name - Nom de la couche
   * @param {string} svgUrl - URL du fichier SVG
   * @param {object} options - Options supplémentaires
   * @returns {string} - Identifiant de la couche
   */
  async addLayer(id, name, svgUrl, options = {}) {
    this.layers[id] = {
      id,
      name,
      svgUrl,
      options,
      loaded: false
    };
    
    // Créer l'interface pour le sélecteur de couche
    this.updateLayerUI();
    
    return id;
  }
  
  /**
   * Active une couche
   * @param {string} layerId - Identifiant de la couche
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async activateLayer(layerId) {
    if (!this.layers[layerId]) return false;
    
    // Charger la couche si elle n'est pas déjà chargée
    if (!this.layers[layerId].loaded) {
      const success = await this.mapLoader.loadMap(this.layers[layerId].svgUrl, layerId);
      if (success) {
        this.layers[layerId].loaded = true;
      } else {
        return false;
      }
    } else {
      // Si la couche est déjà chargée, l'activer simplement
      this.mapLoader.activateLayer(layerId);
    }
    
    this.activeLayerId = layerId;
    
    // Mettre à jour l'interface
    this.updateLayerUI();
    
    // Dispatcher un événement
    EventBus.publish('layer:changed', {
      layerId: layerId,
      layer: this.layers[layerId]
    });
    
    return true;
  }
  
  /**
   * Met à jour l'interface du sélecteur de couches
   */
  updateLayerUI() {
    const layerSelector = document.getElementById('layer-selector');
    if (!layerSelector) return;
    
    // Vider le sélecteur
    layerSelector.innerHTML = '';
    
    // Ajouter les couches au sélecteur
    Object.values(this.layers).forEach(layer => {
      const option = document.createElement('option');
      option.value = layer.id;
      option.textContent = layer.name;
      option.selected = layer.id === this.activeLayerId;
      layerSelector.appendChild(option);
    });
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.LayerManager = LayerManager;
