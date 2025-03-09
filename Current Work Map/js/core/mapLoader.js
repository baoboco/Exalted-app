/**
 * MapLoader - Chargeur de carte SVG pour la carte interactive de Nexus
 * Permet de charger et manipuler des fichiers SVG dans Leaflet
 */
class MapLoader {
  /**
   * Crée une instance du chargeur de carte
   * @param {string} containerId - ID de l'élément HTML conteneur
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.svgLayers = {};
    this.currentLayerId = null;
    
    // Vérifier que le conteneur existe
    if (!this.container) {
      console.error(`Conteneur de carte introuvable: ${containerId}`);
      return;
    }

    // Vérifier que EventBus est disponible
    if (typeof EventBus === 'undefined') {
      console.error('EventBus non disponible. Assurez-vous que eventBus.js est chargé avant mapLoader.js');
      return;
    }
  }

  /**
   * Initialise la carte Leaflet
   * @param {Object} options - Options d'initialisation
   */
  init(options = {}) {
    const defaultOptions = {
      minZoom: -2,
      maxZoom: 4,
      initialView: [0, 0],
      initialZoom: 0
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      // Créer l'instance de carte Leaflet
      this.map = L.map(this.container.id, {
        crs: L.CRS.Simple,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        zoomControl: true
      }).setView(config.initialView, config.initialZoom);
      
      // Publier l'événement d'initialisation
      EventBus.publish('map:initialized', { 
        map: this.map,
        container: this.container.id
      });
      
      // Configurer les événements de la carte
      this._setupMapEvents();
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      return false;
    }
  }

  /**
   * Charge un fichier SVG comme couche de carte
   * @param {string} svgUrl - URL du fichier SVG (map/nexus-main.svg ou map/nexus-underground.svg)
   * @param {string} layerId - Identifiant de la couche
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async loadMap(svgUrl, layerId) {
    try {
      console.log(`Chargement de la carte: ${svgUrl} (ID: ${layerId})`);
      
      // Charger le fichier SVG via fetch
      const response = await fetch(svgUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const svgText = await response.text();
      
      // Analyser le SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      
      // Obtenir les limites du SVG
      const bounds = this.getBounds(svgElement);
      
      // Créer une couche Leaflet pour le SVG
      const svgLayer = L.svgOverlay(svgElement, bounds, {
        interactive: true,
        className: `map-layer layer-${layerId}`
      });
      
      // Si la carte n'est pas encore initialisée, l'initialiser
      if (!this.map) {
        this.init();
      }
      
      // Stocker la couche SVG
      this.svgLayers[layerId] = svgLayer;
      
      // Activer la couche actuelle
      this.activateLayer(layerId);
      
      // Analyser le SVG pour extraire les éléments nommés
      this.extractSvgElements(svgElement, layerId);
      
      // Ajuster la vue pour montrer toute la carte
      this.map.fitBounds(bounds);
      
      // Publier l'événement de chargement
      EventBus.publish('map:layer:loaded', {
        layerId: layerId,
        bounds: bounds,
        url: svgUrl
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors du chargement de la carte:", error);
      EventBus.publish('map:error', {
        type: 'load',
        layerId: layerId,
        url: svgUrl,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Calcule les limites de la carte à partir du SVG
   * @param {SVGElement} svgElement - Élément SVG
   * @returns {Array} - Limites [[minY, minX], [maxY, maxX]]
   */
  getBounds(svgElement) {
    // Extraire les dimensions du SVG
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      return [[y, x], [y + height, x + width]];
    }
    
    // Fallback si viewBox n'est pas défini
    const width = parseFloat(svgElement.getAttribute('width') || 1000);
    const height = parseFloat(svgElement.getAttribute('height') || 1000);
    return [[0, 0], [height, width]];
  }
  
  /**
   * Active une couche
   * @param {string} layerId - Identifiant de la couche
   */
  activateLayer(layerId) {
    // Désactiver la couche actuelle
    if (this.currentLayerId && this.svgLayers[this.currentLayerId]) {
      this.map.removeLayer(this.svgLayers[this.currentLayerId]);
    }
    
    // Activer la nouvelle couche
    if (this.svgLayers[layerId]) {
      this.svgLayers[layerId].addTo(this.map);
      this.currentLayerId = layerId;
      
      // Publier l'événement d'activation
      EventBus.publish('map:layer:activated', {
        layerId: layerId,
        previousLayerId: this.currentLayerId
      });
    }
  }
  
  /**
   * Extrait les éléments nommés du SVG
   * @param {SVGElement} svgElement - Élément SVG
   * @param {string} layerId - Identifiant de la couche
   */
  extractSvgElements(svgElement, layerId) {
    if (!svgElement) return;
    
    console.log("Extraction des éléments SVG...");
    
    // Désactiver les interactions sur le fond/zones transparentes
    try {
      const background = svgElement.querySelector('#background');
      if (background && background.style) {
        background.style.pointerEvents = 'none';
      }
    } catch (error) {
      console.warn("Impossible de désactiver les interactions sur l'arrière-plan:", error);
    }
    
    // Extraire tous les éléments qui ont un ID
    const namedElements = svgElement.querySelectorAll('[id]');
    console.log(`Nombre d'éléments avec ID: ${namedElements.length}`);
    
    // Trouver tous les groupes de quartiers
    const quartierGroups = Array.from(namedElements)
      .filter(el => el.tagName === 'g' && el.id.startsWith('G') && el.id !== 'GRues');
    
    console.log(`Nombre de groupes de quartiers: ${quartierGroups.length}`);
    
    // Créer un dictionnaire des éléments nommés
    const elements = {};
    namedElements.forEach(element => {
      elements[element.id] = {
        id: element.id,
        element: element,
        type: element.tagName,
        layer: layerId
      };
      
      // Traiter différemment les éléments selon leur ID
      if (element.id.startsWith('inv_')) {
        // Éléments invisibles pour l'interaction: interactifs mais invisibles
        element.classList.add('interactive');
        
        // Chercher le quartier correspondant
        const quartierName = element.id.substring(4); // Enlever 'inv_'
        const possibleQuartierIds = [
          `G${quartierName}`,                                  // inv_bastion -> Gbastion
          `G${quartierName.charAt(0).toUpperCase() + quartierName.slice(1)}`,  // inv_bastion -> GBastion
          `G${quartierName.toUpperCase()}`                     // inv_bastion -> GBASTION
        ];
        
        let linkedQuartier = null;
        for (const id of possibleQuartierIds) {
          const quartier = svgElement.getElementById(id);
          if (quartier) {
            linkedQuartier = quartier;
            element.dataset.linkedQuartier = id;
            quartier.dataset.linkedInvisible = element.id;
            console.log(`Lien établi: ${element.id} -> ${id}`);
            break;
          }
        }
        
        if (!linkedQuartier) {
          // Chercher par contenu des attributs (inkscapelabel etc.)
          for (const quartier of quartierGroups) {
            const label = quartier.getAttribute('inkscapelabel');
            if (label && label.toLowerCase().includes(quartierName.toLowerCase())) {
              linkedQuartier = quartier;
              element.dataset.linkedQuartier = quartier.id;
              quartier.dataset.linkedInvisible = element.id;
              console.log(`Lien établi par attribut: ${element.id} -> ${quartier.id}`);
              break;
            }
          }
        }
      } else if (element.parentNode && element.parentNode.id === 'GRues') {
        // Éléments de rues: visibles mais non interactifs
        if (element.style) {
          element.style.pointerEvents = 'none';
        }
      } else if (element.id.startsWith('G') && element.id !== 'GRues') {
        // Quartiers: configurer pour l'effet de surbrillance
        element.classList.add('quartier');
        
        // Stocker la couleur originale des paths pour pouvoir y revenir
        const paths = element.querySelectorAll('path');
        paths.forEach(path => {
          if (path.getAttribute('fill')) {
            path.dataset.originalFill = path.getAttribute('fill');
          }
          path.style.pointerEvents = 'none'; // Les paths ne capturent pas les événements directement
        });
      } else {
        // Autres éléments: visibles mais non interactifs
        element.classList.add('interactive');
        if (element.style) {
          element.style.pointerEvents = 'none';
        }
      }
      
      // Ajouter des événements pour l'interaction uniquement sur les éléments invisibles
      if (element.id.startsWith('inv_')) {
        // Évènement de clic
        element.addEventListener('click', (e) => {
          console.log(`Clic sur élément invisible: ${element.id}`);
          
          // Effet visuel temporaire au clic si un quartier est lié
          if (element.dataset.linkedQuartier) {
            const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
            if (quartier) {
              quartier.classList.add('quartier-selected');
              setTimeout(() => {
                quartier.classList.remove('quartier-selected');
              }, 500);
            }
          }
          
          // Publier l'événement pour le reste de l'application
          EventBus.publish('map:element:click', {
            elementId: element.id,
            layerId: layerId,
            type: element.tagName,
            originalEvent: e,
            linkedQuartier: element.dataset.linkedQuartier
          });
        });

        // Évènements de survol
        element.addEventListener('mouseenter', (e) => {
          console.log(`Survol de l'élément: ${element.id}`);
          
          // Ajouter une classe au quartier lié pour l'effet de survol
          if (element.dataset.linkedQuartier) {
            const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
            if (quartier) {
              quartier.classList.add('quartier-hover');
            }
          }
          
          // Publier l'événement pour le reste de l'application
          EventBus.publish('map:element:hover', {
            elementId: element.id,
            layerId: layerId,
            type: element.tagName,
            originalEvent: e,
            linkedQuartier: element.dataset.linkedQuartier
          });
        });
        
        element.addEventListener('mouseleave', (e) => {
          // Retirer la classe de survol
          if (element.dataset.linkedQuartier) {
            const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
            if (quartier) {
              quartier.classList.remove('quartier-hover');
            }
          }
        });
      }
    });
    
    console.log("Extraction des éléments SVG terminée");
    
    // Publier l'événement avec les éléments extraits
    EventBus.publish('map:elements:loaded', {
      layerId: layerId,
      elements: elements,
      count: namedElements.length
    });
  }

  /**
   * Configure les événements de la carte Leaflet
   * @private
   */
  _setupMapEvents() {
    if (!this.map) return;
    
    this.map.on('click', (e) => {
      EventBus.publish('map:click', {
        latlng: e.latlng,
        containerPoint: e.containerPoint,
        layerPoint: e.layerPoint
      });
    });
    
    this.map.on('zoomend', (e) => {
      EventBus.publish('map:zoom', {
        zoom: this.map.getZoom(),
        bounds: this.map.getBounds()
      });
    });
    
    this.map.on('moveend', (e) => {
      EventBus.publish('map:move', {
        center: this.map.getCenter(),
        bounds: this.map.getBounds()
      });
    });
  }

  /**
   * Retourne l'instance de carte Leaflet
   * @returns {L.Map|null} - Instance de carte Leaflet
   */
  getMap() {
    return this.map;
  }

  /**
   * Retourne les couches SVG
   * @returns {Object} - Dictionnaire des couches SVG
   */
  getLayers() {
    return this.svgLayers;
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.MapLoader = MapLoader;