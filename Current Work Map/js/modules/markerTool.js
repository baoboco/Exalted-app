/**
 * MarkerTool - Outil de création de marqueurs pour la carte interactive de Nexus
 * Permet d'ajouter des marqueurs interactifs sur la carte
 */
class MarkerTool {
  /**
   * Crée une instance de l'outil de marqueurs
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   * @param {object} options - Options de configuration
   */
  constructor(mapLoader, options = {}) {
    this.id = 'marker';
    this.name = 'Ajouter un marqueur';
    this.mapLoader = mapLoader;
    this.options = options;
    this.active = false;
    this.markers = {};
    
    // Initialiser les gestionnaires d'événements pour le modal
    this.initModalHandlers();
    
    // S'abonner aux événements de la carte
    this.setupMapEvents();
  }
  
  /**
   * Active l'outil
   */
  activate() {
    this.active = true;
    document.body.classList.add('tool-marker-active');
    console.log('Outil marqueur activé');
  }
  
  /**
   * Désactive l'outil
   */
  deactivate() {
    this.active = false;
    document.body.classList.remove('tool-marker-active');
    console.log('Outil marqueur désactivé');
  }
  
  /**
   * Configure les écouteurs d'événements de la carte
   */
  setupMapEvents() {
    // S'abonner aux clics sur la carte
    EventBus.subscribe('map:click', (data) => {
      console.log('MarkerTool: Clic sur la carte reçu', data);
      if (this.active) {
        this.handleMapClick(data);
      }
    });
  }
  
  /**
   * Gère un clic sur la carte
   * @param {object} data - Données du clic
   */
  handleMapClick(data) {
    console.log('MarkerTool: Traitement du clic sur la carte');
    // Récupérer les coordonnées du clic
    const latlng = data.latlng;
    const layerId = this.mapLoader.currentLayerId;
    
    // Ouvrir le modal pour créer un marqueur
    this.openMarkerCreationModal(null, layerId, {
      x: latlng.lng,
      y: latlng.lat
    });
  }
  
  /**
   * Gère un clic sur un élément
   * @param {string} elementId - ID de l'élément cliqué
   * @param {string} layerId - ID de la couche
   * @param {Event} event - Événement de clic original
   */
  handleElementClick(elementId, layerId, event) {
    console.log('MarkerTool: handleElementClick appelé', this.active);
    if (!this.active) return;
    
    // Position dans le SVG (coordonnées relatives)
    const svgElement = this.mapLoader.svgLayers[layerId].getElement();
    
    if (!svgElement) return;
    
    // Créer un point SVG pour convertir les coordonnées
    const svgPoint = svgElement.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    
    // Convertir les coordonnées de l'écran vers le SVG
    const CTM = svgElement.getScreenCTM();
    if (CTM) {
      const svgCoords = svgPoint.matrixTransform(CTM.inverse());
      
      // Ouvrir le modal pour créer un marqueur
      this.openMarkerCreationModal(elementId, layerId, svgCoords);
    }
  }
  
  /**
   * Initialise les gestionnaires d'événements pour le modal
   */
  initModalHandlers() {
    const markerModal = document.getElementById('marker-modal');
    const markerForm = document.getElementById('marker-form');
    
    if (!markerModal || !markerForm) {
      console.error('Modal de marqueur non trouvé');
      return;
    }
    
    const closeButtons = markerModal.querySelectorAll('.close-modal-btn, .cancel-btn');
    
    // Fermer le modal
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        markerModal.classList.remove('active');
      });
    });
    
    // Soumettre le formulaire
    if (markerForm) {
      markerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Récupérer les valeurs du formulaire
        const name = document.getElementById('marker-name').value;
        const icon = document.getElementById('marker-icon').value;
        const description = document.getElementById('marker-description').value;
        const visibility = document.getElementById('marker-visibility').value;
        
        // Créer le marqueur avec les données du formulaire
        const markerData = markerForm.dataset;
        const markerId = `marker-${Date.now()}`;
        
        const marker = {
          id: markerId,
          name,
          icon,
          description,
          visibility,
          layerId: markerData.layerId,
          elementId: markerData.elementId,
          position: {
            x: parseFloat(markerData.x),
            y: parseFloat(markerData.y)
          },
          createdBy: UserManager.getCurrentUser()?.id || 'guest',
          createdAt: new Date().toISOString()
        };
        
        // Ajouter le marqueur
        this.addMarker(marker);
        
        // Fermer le modal
        markerModal.classList.remove('active');
      });
    }
  }
  
  /**
   * Ouvre le modal de création de marqueur
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   * @param {object} position - Position {x, y} dans le SVG
   */
  openMarkerCreationModal(elementId, layerId, position) {
    const markerModal = document.getElementById('marker-modal');
    const markerForm = document.getElementById('marker-form');
    
    if (!markerModal || !markerForm) {
      console.error('Modal ou formulaire non trouvé');
      return;
    }
    
    // Stocker les informations dans les datasets du formulaire
    markerForm.dataset.elementId = elementId || '';
    markerForm.dataset.layerId = layerId;
    markerForm.dataset.x = position.x;
    markerForm.dataset.y = position.y;
    
    // Réinitialiser le formulaire
    markerForm.reset();
    
    // Afficher le modal
    markerModal.classList.add('active');
    console.log('Modal de création de marqueur ouvert');
  }
  
  /**
   * Ajoute un marqueur à la carte
   * @param {object} marker - Données du marqueur
   */
  addMarker(marker) {
    // Stocker le marqueur
    this.markers[marker.id] = marker;
    
    // Créer l'élément visuel du marqueur
    this.renderMarker(marker);
    
    // Dispatcher un événement
    EventBus.publish('marker:created', {
      marker: marker
    });
    
    console.log('Marqueur ajouté:', marker.id);
  }
  
  /**
   * Rend visuellement un marqueur sur la carte
   * @param {object} marker - Données du marqueur
   */
  renderMarker(marker) {
    // Trouver l'élément SVG parent
    const svgLayer = this.mapLoader.svgLayers[marker.layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    // Créer l'élément de marqueur
    const markerElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markerElement.id = marker.id;
    markerElement.classList.add('marker');
    markerElement.dataset.visibility = marker.visibility;
    markerElement.dataset.createdBy = marker.createdBy;
    
    // Créer l'icône du marqueur
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute('href', `#icon-${marker.icon}`);
    markerElement.appendChild(icon);
    
    // Créer le texte du marqueur si nécessaire
    if (marker.name) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', '0');
      text.setAttribute('y', '24');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.textContent = marker.name;
      markerElement.appendChild(text);
    }
    
    // Positionner le marqueur
    markerElement.setAttribute('transform', `translate(${marker.position.x}, ${marker.position.y})`);
    
    // Ajouter le marqueur au SVG
    svgElement.appendChild(markerElement);
    
    // Ajouter des événements
    markerElement.addEventListener('click', (e) => {
      // Ouvrir la fenêtre d'édition du marqueur
      this.openMarkerEditor(marker.id);
      e.stopPropagation();
    });
    
    console.log('Marqueur rendu:', marker.id);
  }
  
  /**
   * Ouvre l'éditeur de marqueur
   * @param {string} markerId - ID du marqueur
   */
  openMarkerEditor(markerId) {
    const marker = this.markers[markerId];
    if (!marker) return;
    
    // Implémenter l'ouverture du modal d'édition
    console.log('Édition du marqueur:', marker);
    
    // Dispatcher un événement
    EventBus.publish('marker:edit', {
      marker: marker
    });
  }
  
  /**
   * Récupère les marqueurs avec des filtres optionnels
   * @param {object} filters - Filtres (visibility, layerId, createdBy)
   * @returns {Array} - Liste des marqueurs filtrés
   */
  getMarkers(filters = {}) {
    return Object.values(this.markers).filter(marker => {
      // Filtrer par visibilité
      if (filters.visibility && marker.visibility !== filters.visibility) {
        return false;
      }
      
      // Filtrer par couche
      if (filters.layerId && marker.layerId !== filters.layerId) {
        return false;
      }
      
      // Filtrer par créateur
      if (filters.createdBy && marker.createdBy !== filters.createdBy) {
        return false;
      }
      
      return true;
    });
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.MarkerTool = MarkerTool;