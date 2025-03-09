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
    
    // S'abonner aux événements de zoom pour ajuster la taille des marqueurs
    this.setupZoomEvents();
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
      if (this.active) {
        this.handleMapClick(data);
      }
    });
  }
  
  /**
   * Configure les écouteurs d'événements de zoom
   */
  setupZoomEvents() {
    EventBus.subscribe('map:zoom', (data) => {
      this.updateMarkerScaleBasedOnZoom(data.zoom);
    });
  }
  
  /**
   * Met à jour l'échelle des marqueurs en fonction du niveau de zoom
   * @param {number} zoom - Niveau de zoom actuel
   */
  updateMarkerScaleBasedOnZoom(zoom) {
    // Supprimer toutes les classes de zoom existantes
    document.body.classList.remove('zoom-level-0', 'zoom-level-1', 'zoom-level-2', 'zoom-level-3', 'zoom-level-4');
    
    // Ajouter la classe correspondant au niveau de zoom actuel
    // Adapter ces valeurs selon vos propres niveaux de zoom
    const zoomLevel = Math.max(0, Math.min(4, Math.floor(zoom + 2)));
    document.body.classList.add(`zoom-level-${zoomLevel}`);
  }
  
  /**
   * Gère un clic sur la carte
   * @param {object} data - Données du clic
   */
  handleMapClick(data) {
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
    
    // Initialiser le gestionnaire d'aperçu d'icône
    this.initIconPreview();
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
    
    // Réinitialiser l'aperçu de l'icône
    this.updateIconPreview();
    
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
   * Rend visuellement un marqueur sur la carte avec une taille très réduite
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
    // Pas besoin de définir la taille ici, elle est gérée par CSS
    markerElement.appendChild(icon);
    
    // Créer le texte du marqueur si nécessaire (très petit)
    if (marker.name && marker.name.trim().length > 0) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', '0');
      text.setAttribute('y', '14');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '6');
      text.setAttribute('fill', '#000');
      text.setAttribute('stroke', '#fff');
      text.setAttribute('stroke-width', '0.5');
      text.setAttribute('paint-order', 'stroke');
      
      // Limiter le texte à max 10 caractères pour éviter les noms trop longs
      const displayName = marker.name.length > 10 ? marker.name.substring(0, 8) + '...' : marker.name;
      text.textContent = displayName;
      
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
  
  /**
   * Initialise le gestionnaire d'aperçu d'icône
   */
  initIconPreview() {
    const iconSelect = document.getElementById('marker-icon');
    
    if (iconSelect) {
      iconSelect.addEventListener('change', () => this.updateIconPreview());
      
      // Initialiser l'aperçu avec l'icône sélectionnée par défaut
      setTimeout(() => this.updateIconPreview(), 100); // Petit délai pour s'assurer que tout est chargé
    }
  }
  
  /**
   * Met à jour l'aperçu de l'icône sélectionnée
   */
  updateIconPreview() {
    const iconSelect = document.getElementById('marker-icon');
    const iconPreview = document.querySelector('.selected-icon-preview svg use');
    
    if (!iconSelect || !iconPreview) return;
    
    const selectedOption = iconSelect.options[iconSelect.selectedIndex];
    const iconHref = selectedOption?.dataset.icon;
    
    if (iconHref) {
      iconPreview.setAttribute('href', iconHref);
    }
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.MarkerTool = MarkerTool;