/**
 * LayerManager - Gestionnaire de couches pour la carte interactive
 * Permet d'ajouter, supprimer et basculer entre différentes couches SVG
 */
class LayerManager {
  /**
   * Crée une instance du gestionnaire de couches
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before LayerManager");
    }
    
    this.mapLoader = mapLoader;
    this.layers = {};  // {id: {id, name, url, loaded}}
    this.loadPromises = {};
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    console.log("LayerManager initialisé");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les changements du sélecteur de couche dans l'interface
    const layerSelector = document.getElementById('layer-selector');
    if (layerSelector) {
      layerSelector.addEventListener('change', (e) => {
        this.activateLayer(e.target.value);
      });
    }
    
    // Écouter les événements de couche chargée
    EventBus.subscribe('map:layer:loaded', (data) => {
      if (this.layers[data.layerId]) {
        this.layers[data.layerId].loaded = true;
        console.log(`Couche ${data.layerId} marquée comme chargée`);
      }
    });
  }
  
  /**
   * Ajoute une nouvelle couche
   * @param {string} id - ID unique pour la couche
   * @param {string} name - Nom de la couche
   * @param {string} url - URL du fichier SVG
   * @returns {Promise} - Promesse résolue lorsque la couche est ajoutée
   */
  async addLayer(id, name, url) {
    // Vérifier si la couche existe déjà
    if (this.layers[id]) {
      console.warn(`La couche ${id} existe déjà`);
      return this.loadPromises[id]; // Retourner la promesse existante
    }
    
    console.log(`Ajout de la couche: ${id} (${name}) depuis ${url}`);
    
    // Enregistrer les informations de la couche
    this.layers[id] = {
      id,
      name,
      url,
      loaded: false
    };
    
    // Mettre à jour le sélecteur de couche dans l'interface
    this.updateLayerSelector();
    
    // Charger la couche
    this.loadPromises[id] = this.mapLoader.loadSvgLayer(id, url)
      .then(layer => {
        // Mettre à jour le statut de la couche
        this.layers[id].loaded = true;
        this.layers[id].layer = layer;
        
        // Publier l'événement d'ajout de couche
        EventBus.publish('layer:added', {
          layerId: id,
          layer: this.layers[id]
        });
        
        return layer;
      })
      .catch(error => {
        console.error(`Erreur lors du chargement de la couche ${id}:`, error);
        this.layers[id].error = error;
        throw error;
      });
    
    return this.loadPromises[id];
  }
  
  /**
   * Active une couche
   * @param {string} id - ID de la couche à activer
   * @returns {Promise} - Promesse résolue lorsque la couche est activée
   */
  async activateLayer(id) {
    // Vérifier si la couche existe
    if (!this.layers[id]) {
      console.error(`La couche ${id} n'existe pas`);
      return Promise.reject(new Error(`La couche ${id} n'existe pas`));
    }
    
    // Si la couche n'est pas chargée, attendre son chargement
    if (!this.layers[id].loaded) {
      console.log(`Attente du chargement de la couche ${id}`);
      try {
        await this.loadPromises[id];
      } catch (error) {
        console.error(`Erreur lors de l'activation de la couche ${id}:`, error);
        return Promise.reject(error);
      }
    }
    
    // Activer la couche via le mapLoader
    this.mapLoader.activateLayer(id);
    
    // Mettre à jour le sélecteur de couche dans l'interface
    this.updateLayerSelector(id);
    
    return Promise.resolve(this.layers[id]);
  }
  
  /**
   * Supprime une couche
   * @param {string} id - ID de la couche à supprimer
   * @returns {boolean} - true si la couche a été supprimée, false sinon
   */
  removeLayer(id) {
    // Vérifier si la couche existe
    if (!this.layers[id]) {
      console.warn(`La couche ${id} n'existe pas`);
      return false;
    }
    
    console.log(`Suppression de la couche: ${id}`);
    
    // Supprimer la couche du mapLoader
    if (this.mapLoader.svgLayers[id]) {
      this.mapLoader.svgLayers[id].remove();
      delete this.mapLoader.svgLayers[id];
      
      // Si c'était la couche active, réinitialiser currentLayerId
      if (this.mapLoader.currentLayerId === id) {
        this.mapLoader.currentLayerId = null;
      }
    }
    
    // Supprimer les promesses
    delete this.loadPromises[id];
    
    // Supprimer les informations de la couche
    delete this.layers[id];
    
    // Mettre à jour le sélecteur de couche dans l'interface
    this.updateLayerSelector();
    
    // Publier l'événement de suppression de couche
    EventBus.publish('layer:removed', {
      layerId: id
    });
    
    return true;
  }
  
  /**
   * Met à jour le sélecteur de couche dans l'interface
   * @param {string} activeId - ID de la couche active (optionnel)
   */
  updateLayerSelector(activeId = null) {
    const layerSelector = document.getElementById('layer-selector');
    if (!layerSelector) return;
    
    // Vider le sélecteur
    layerSelector.innerHTML = '';
    
    // Ajouter les options pour chaque couche
    Object.values(this.layers).forEach(layer => {
      const option = document.createElement('option');
      option.value = layer.id;
      option.textContent = layer.name;
      
      // Marquer comme sélectionné si c'est la couche active
      if (activeId === layer.id || (!activeId && this.mapLoader.currentLayerId === layer.id)) {
        option.selected = true;
      }
      
      layerSelector.appendChild(option);
    });
  }
  
  /**
   * Récupère une couche par son ID
   * @param {string} id - ID de la couche
   * @returns {object|null} - Informations de la couche ou null si non trouvée
   */
  getLayer(id) {
    return this.layers[id] || null;
  }
  
  /**
   * Récupère toutes les couches
   * @returns {object} - Objet contenant toutes les couches {id: layer}
   */
  getLayers() {
    return this.layers;
  }
  
  /**
   * Récupère la couche active
   * @returns {object|null} - Informations de la couche active ou null si aucune
   */
  getActiveLayer() {
    const activeLayerId = this.mapLoader.currentLayerId;
    return activeLayerId ? this.layers[activeLayerId] : null;
  }
}

// Exporter la classe
window.LayerManager = LayerManager;