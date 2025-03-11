/**
 * MarkerTool - Outil pour ajouter des marqueurs sur la carte
 */
class MarkerTool {
  /**
   * Crée une instance de l'outil marqueur
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before MarkerTool");
    }
    
    this.mapLoader = mapLoader;
    this.active = false;
    this.markers = {};
    
    // Charger les marqueurs existants depuis le stockage local
    this.loadMarkers();
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    console.log("MarkerTool initialisé");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les événements de changement de couche
    EventBus.subscribe('map:layer:changed', (data) => {
      if (this.active) {
        this.renderLayerMarkers(data.layerId);
      }
    });
    
    // Écouter les événements de sauvegarde de marqueur
    EventBus.subscribe('marker:save', (data) => {
      this.saveMarker(data);
    });
    
    // Écouter les événements de suppression de marqueur
    EventBus.subscribe('marker:delete', (data) => {
      this.deleteMarker(data.id, data.layerId);
    });
  }
  
  /**
   * Active l'outil
   */
  activate() {
    this.active = true;
    document.body.classList.add('marker-tool-active');
    
    // Afficher les marqueurs de la couche active
    const currentLayerId = this.mapLoader.getCurrentLayerId();
    if (currentLayerId) {
      this.renderLayerMarkers(currentLayerId);
    }
    
    console.log("MarkerTool activé");
  }
  
  /**
   * Désactive l'outil
   */
  deactivate() {
    this.active = false;
    document.body.classList.remove('marker-tool-active');
    
    // Masquer les marqueurs (optionnel, ils peuvent rester visibles)
    // this.hideAllMarkers();
    
    console.log("MarkerTool désactivé");
  }
  
  /**
   * Gère le clic sur un élément
   * @param {object} data - Données de l'événement
   */
  handleElementClick(data) {
    // Ouvrir la modale pour ajouter un marqueur
    EventBus.publish('show:modal', {
      modalId: 'marker-modal',
      title: 'Ajouter un marqueur',
      elementId: data.elementId,
      layerId: data.layerId
    });
  }
  
  /**
   * Sauvegarde un marqueur
   * @param {object} data - Données du marqueur
   */
  saveMarker(data) {
    const { elementId, layerId, name, description, icon, visibility } = data;
    
    // Créer un ID unique pour le marqueur
    const markerId = data.id || `marker_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // S'assurer que l'objet pour cette couche existe
    if (!this.markers[layerId]) {
      this.markers[layerId] = {};
    }
    
    // Créer ou mettre à jour le marqueur
    this.markers[layerId][markerId] = {
      id: markerId,
      elementId,
      name,
      description,
      icon: icon || 'default',
      visibility: visibility || 'public',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Enregistrer dans le stockage local
    this.saveMarkers();
    
    // Si l'outil est actif et que la couche est active, afficher le marqueur
    if (this.active && layerId === this.mapLoader.getCurrentLayerId()) {
      this.renderMarker(markerId, layerId);
    }
    
    // Publier l'événement de marqueur sauvegardé
    EventBus.publish('marker:saved', {
      markerId,
      marker: this.markers[layerId][markerId]
    });
    
    console.log(`Marqueur ${markerId} sauvegardé pour l'élément ${elementId}`);
  }
  
  /**
   * Supprime un marqueur
   * @param {string} markerId - ID du marqueur
   * @param {string} layerId - ID de la couche
   * @returns {boolean} - true si le marqueur a été supprimé, false sinon
   */
  deleteMarker(markerId, layerId) {
    // Vérifier si le marqueur existe
    if (!this.markers[layerId] || !this.markers[layerId][markerId]) {
      console.warn(`Marqueur ${markerId} non trouvé sur la couche ${layerId}`);
      return false;
    }
    
    // Supprimer le marqueur du DOM s'il est affiché
    this.removeMarkerFromDOM(markerId);
    
    // Supprimer le marqueur des données
    delete this.markers[layerId][markerId];
    
    // Nettoyer les couches vides
    if (Object.keys(this.markers[layerId]).length === 0) {
      delete this.markers[layerId];
    }
    
    // Enregistrer dans le stockage local
    this.saveMarkers();
    
    // Publier l'événement de marqueur supprimé
    EventBus.publish('marker:deleted', {
      markerId,
      layerId
    });
    
    console.log(`Marqueur ${markerId} supprimé`);
    return true;
  }
  
  /**
   * Rend les marqueurs pour une couche
   * @param {string} layerId - ID de la couche
   */
  renderLayerMarkers(layerId) {
    // Supprimer les marqueurs existants du DOM
    this.removeAllMarkersFromDOM();
    
    // Vérifier si la couche a des marqueurs
    if (!this.markers[layerId]) return;
    
    // Rendre chaque marqueur
    Object.keys(this.markers[layerId]).forEach(markerId => {
      this.renderMarker(markerId, layerId);
    });
  }
  
  /**
   * Rend un marqueur sur la carte
   * @param {string} markerId - ID du marqueur
   * @param {string} layerId - ID de la couche
   */
  renderMarker(markerId, layerId) {
    // Vérifier si le marqueur existe
    if (!this.markers[layerId] || !this.markers[layerId][markerId]) {
      console.warn(`Marqueur ${markerId} non trouvé sur la couche ${layerId}`);
      return;
    }
    
    const marker = this.markers[layerId][markerId];
    
    // Récupérer l'élément SVG sur lequel placer le marqueur
    const element = this.mapLoader.getElementById(marker.elementId, layerId);
    if (!element) {
      console.warn(`Élément ${marker.elementId} non trouvé sur la couche ${layerId}`);
      return;
    }
    
    // Supprimer le marqueur existant s'il y en a un
    this.removeMarkerFromDOM(markerId);
    
    // Créer le marqueur
    const svgElement = element.ownerSVGElement;
    if (!svgElement) return;
    
    // Obtenir les coordonnées du centre de l'élément
    const bbox = element.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Créer un groupe pour le marqueur
    const markerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markerGroup.classList.add('map-marker');
    markerGroup.dataset.markerId = markerId;
    
    // Créer les éléments SVG pour le marqueur selon l'icône
    this.createMarkerIcon(markerGroup, marker.icon);
    
    // Positionner le marqueur
    markerGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
    
    // Ajouter des attributs pour les données du marqueur
    markerGroup.dataset.name = marker.name;
    markerGroup.dataset.elementId = marker.elementId;
    
    // Ajouter des interactions
    markerGroup.addEventListener('click', (e) => {
      // Empêcher la propagation pour ne pas déclencher le clic sur l'élément
      e.stopPropagation();
      
      // Afficher les informations du marqueur
      this.showMarkerInfo(markerId, layerId);
    });
    
    markerGroup.addEventListener('mouseenter', () => {
      this.showMarkerTooltip(marker, markerGroup);
    });
    
    markerGroup.addEventListener('mouseleave', () => {
      this.hideMarkerTooltip();
    });
    
    // Ajouter le marqueur au SVG
    svgElement.appendChild(markerGroup);
  }
  
  /**
   * Crée l'icône du marqueur
   * @param {SVGElement} markerGroup - Groupe SVG du marqueur
   * @param {string} iconType - Type d'icône
   */
  createMarkerIcon(markerGroup, iconType) {
    // Créer le cercle de base
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', this.getMarkerColor(iconType));
    circle.setAttribute('stroke', '#FFFFFF');
    circle.setAttribute('stroke-width', '2');
    
    markerGroup.appendChild(circle);
    
    // Ajouter une icône spécifique selon le type
    if (iconType !== 'default') {
      const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "use");
      iconPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${iconType}`);
      iconPath.setAttribute('x', '-8');
      iconPath.setAttribute('y', '-8');
      iconPath.setAttribute('width', '16');
      iconPath.setAttribute('height', '16');
      
      markerGroup.appendChild(iconPath);
    }
  }
  
  /**
   * Récupère la couleur d'un type de marqueur
   * @param {string} iconType - Type d'icône
   * @returns {string} - Code couleur
   */
  getMarkerColor(iconType) {
    const colors = {
      default: '#FF5722',
      quest: '#FFC107',
      danger: '#F44336',
      npc: '#2196F3',
      shop: '#4CAF50'
    };
    
    return colors[iconType] || colors.default;
  }
  
  /**
   * Affiche les informations d'un marqueur
   * @param {string} markerId - ID du marqueur
   * @param {string} layerId - ID de la couche
   */
  showMarkerInfo(markerId, layerId) {
    // Vérifier si le marqueur existe
    if (!this.markers[layerId] || !this.markers[layerId][markerId]) {
      console.warn(`Marqueur ${markerId} non trouvé sur la couche ${layerId}`);
      return;
    }
    
    const marker = this.markers[layerId][markerId];
    
    // Créer le contenu HTML
    const content = `
      <div class="marker-info">
        <div class="marker-icon">
          <svg width="24" height="24">
            <use href="#icon-${marker.icon}"></use>
          </svg>
        </div>
        <div class="marker-details">
          <p>${marker.description || 'Aucune description'}</p>
          <div class="marker-actions">
            <button id="edit-marker-btn" class="btn btn-small">Modifier</button>
            <button id="delete-marker-btn" class="btn btn-small btn-danger">Supprimer</button>
          </div>
        </div>
      </div>
    `;
    
    // Afficher dans le panneau d'informations
    EventBus.publish('show:element:info', {
      elementId: marker.elementId,
      layerId,
      title: marker.name,
      content
    });
    
    // Ajouter les écouteurs d'événements pour les boutons
    setTimeout(() => {
      const editBtn = document.getElementById('edit-marker-btn');
      const deleteBtn = document.getElementById('delete-marker-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          // Ouvrir la modale d'édition
          EventBus.publish('show:modal', {
            modalId: 'marker-modal',
            title: 'Modifier le marqueur',
            elementId: marker.elementId,
            layerId,
            marker
          });
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Êtes-vous sûr de vouloir supprimer le marqueur "${marker.name}" ?`)) {
            this.deleteMarker(markerId, layerId);
            
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
   * Affiche une infobulle pour un marqueur
   * @param {object} marker - Données du marqueur
   * @param {SVGElement} markerElement - Élément SVG du marqueur
   */
  showMarkerTooltip(marker, markerElement) {
    // Supprimer les infobulles existantes
    this.hideMarkerTooltip();
    
    // Obtenir la position à l'écran
    const bbox = markerElement.getBoundingClientRect();
    
    // Créer l'infobulle
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.textContent = marker.name;
    tooltip.style.left = `${bbox.left + bbox.width / 2}px`;
    tooltip.style.top = `${bbox.top - 30}px`;
    
    // Ajouter l'infobulle au document
    document.body.appendChild(tooltip);
  }
  
  /**
   * Masque l'infobulle du marqueur
   */
  hideMarkerTooltip() {
    const tooltips = document.querySelectorAll('.marker-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }
  
  /**
   * Supprime un marqueur du DOM
   * @param {string} markerId - ID du marqueur
   */
  removeMarkerFromDOM(markerId) {
    const markerElement = document.querySelector(`.map-marker[data-marker-id="${markerId}"]`);
    if (markerElement) {
      markerElement.remove();
    }
  }
  
  /**
   * Supprime tous les marqueurs du DOM
   */
  removeAllMarkersFromDOM() {
    const markerElements = document.querySelectorAll('.map-marker');
    markerElements.forEach(marker => marker.remove());
  }
  
  /**
   * Charge les marqueurs depuis le stockage local
   */
  loadMarkers() {
    try {
      const storedMarkers = localStorage.getItem('nexus-markers');
      if (storedMarkers) {
        this.markers = JSON.parse(storedMarkers);
        console.log("Marqueurs chargés depuis le stockage local");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des marqueurs:", error);
      this.markers = {};
    }
  }
  
  /**
   * Enregistre les marqueurs dans le stockage local
   */
  saveMarkers() {
    try {
      localStorage.setItem('nexus-markers', JSON.stringify(this.markers));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des marqueurs:", error);
    }
  }
}

// Exporter la classe
window.MarkerTool = MarkerTool;