/**
 * MapLoader - Chargeur de carte pour la carte interactive de Nexus
 * Gère le chargement, l'affichage et l'interaction avec les fichiers SVG
 */
class MapLoader {
  /**
   * Crée une instance du chargeur de carte
   * @param {string} containerId - ID du conteneur HTML pour la carte
   */
  constructor(containerId) {
    // Vérifier les dépendances requises
    if (typeof L === 'undefined') {
      console.error("Erreur: Leaflet n'est pas chargé!");
      throw new Error("Leaflet must be loaded before MapLoader");
    }
    
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before MapLoader");
    }
    
    this.containerId = containerId;
    this.map = null;
    this.svgLayers = {};
    this.currentLayerId = null;
    this.extractedElements = {};
    this.options = {
      minZoom: -2,
      maxZoom: 4,
      initialView: [0, 0],
      initialZoom: 0
    };
    
    console.log("Instance MapLoader créée pour le conteneur:", containerId);
  }
  
  /**
   * Initialise la carte
   * @param {object} options - Options de configuration
   * @returns {Promise} - Promesse résolue lorsque la carte est initialisée
   */
  async init(options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Fusionner les options
        this.options = {...this.options, ...options};
        
        console.log("Initialisation de la carte avec les options:", this.options);
        
        // Créer l'instance de carte Leaflet
        this.map = L.map(this.containerId, {
          crs: L.CRS.Simple,
          minZoom: this.options.minZoom,
          maxZoom: this.options.maxZoom,
          zoomControl: true,
          attributionControl: false
        });
        
        // Définir la vue initiale
        this.map.setView(this.options.initialView, this.options.initialZoom);
        
        // Ajouter les contrôles personnalisés
        this.addCustomControls();
        
        // Publier l'événement d'initialisation
        EventBus.publish('map:initialized', {
          mapInstance: this.map,
          options: this.options
        });
        
        console.log("Carte initialisée avec succès");
        resolve(this.map);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la carte:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Ajoute des contrôles personnalisés à la carte
   */
  addCustomControls() {
    // Contrôle de zoom personnalisé
    const zoomControl = L.control.zoom({
      position: 'topright'
    });
    
    // Ajouter le contrôle à la carte
    zoomControl.addTo(this.map);
    
    console.log("Contrôles personnalisés ajoutés à la carte");
  }
  
  /**
   * Charge une couche SVG
   * @param {string} layerId - ID unique pour la couche
   * @param {string} svgUrl - URL du fichier SVG
   * @returns {Promise} - Promesse résolue lorsque la couche est chargée
   */
  async loadSvgLayer(layerId, svgUrl) {
    return new Promise((resolve, reject) => {
      console.log(`Chargement de la couche SVG: ${layerId} depuis ${svgUrl}`);
      
      // Vérifier si la couche existe déjà
      if (this.svgLayers[layerId]) {
        console.log(`La couche ${layerId} existe déjà, elle sera remplacée`);
      }
      
      // Vérifier que l'URL est valide
      if (!svgUrl) {
        console.error(`URL SVG invalide pour la couche ${layerId}`);
        reject(new Error(`URL SVG invalide pour la couche ${layerId}`));
        return;
      }
      
      // Correction: Utiliser une approche différente pour charger le SVG
      const img = new Image();
      img.onload = () => {
        try {
          // Créer la couche image avec l'URL chargée
          const bounds = [
            [0, 0],
            [2000, 2000]
          ];
          
          // Utiliser L.imageOverlay au lieu de L.svgOverlay pour éviter les problèmes avec les SVG
          const svgLayer = L.imageOverlay(img.src, bounds, {
            interactive: true,
            className: 'map-layer',
            id: `layer-${layerId}`
          });
          
          // Stocker la couche
          this.svgLayers[layerId] = svgLayer;
          
          // Ajouter la couche à la carte
          svgLayer.addTo(this.map);
          
          // Créer un élément SVG pour les interactions
          this.createInteractiveSvgLayer(layerId, svgUrl, bounds)
            .then(() => {
              console.log(`Couche SVG ${layerId} chargée avec succès`);
              
              // Publier l'événement de chargement
              EventBus.publish('map:layer:loaded', {
                layerId: layerId,
                layer: svgLayer
              });
              
              resolve(svgLayer);
            })
            .catch(error => {
              console.error(`Erreur lors de la création de la couche interactive pour ${layerId}:`, error);
              reject(error);
            });
          
        } catch (error) {
          console.error(`Erreur lors de la création de la couche SVG ${layerId}:`, error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error(`Erreur lors du chargement de l'image SVG ${svgUrl}:`, error);
        reject(new Error(`Erreur lors du chargement de l'image SVG ${svgUrl}`));
      };
      
      // Charger l'image
      img.src = svgUrl;
    });
  }
  
  /**
   * Crée une couche SVG interactive à partir d'un fichier SVG
   * @param {string} layerId - ID de la couche
   * @param {string} svgUrl - URL du fichier SVG
   * @param {Array} bounds - Limites de la couche
   * @returns {Promise} - Promesse résolue lorsque la couche est créée
   */
  async createInteractiveSvgLayer(layerId, svgUrl, bounds) {
    return new Promise((resolve, reject) => {
      // Récupérer le contenu SVG
      fetch(svgUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.text();
        })
        .then(svgContent => {
          // Créer un élément div pour contenir le SVG
          const container = document.createElement('div');
          container.className = 'interactive-svg-container';
          container.style.position = 'absolute';
          container.style.pointerEvents = 'none';
          container.style.width = '100%';
          container.style.height = '100%';
          
          // Insérer le contenu SVG
          container.innerHTML = svgContent;
          
          // Récupérer l'élément SVG
          const svgElement = container.querySelector('svg');
          if (!svgElement) {
            throw new Error(`Aucun élément SVG trouvé dans ${svgUrl}`);
          }
          
          // Configurer le SVG pour l'interactivité
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.position = 'absolute';
          svgElement.style.top = '0';
          svgElement.style.left = '0';
          svgElement.style.pointerEvents = 'none';
          
          // Ajouter l'ID de la couche
          svgElement.dataset.layerId = layerId;
          
          // Ajouter le conteneur à la carte
          document.getElementById(this.containerId).appendChild(container);
          
          // Stocker la référence à l'élément SVG
          this.svgLayers[layerId].svgElement = svgElement;
          this.svgLayers[layerId].container = container;
          
          // Extraire les éléments SVG pour l'interactivité
          this.extractSvgElements(svgElement, layerId);
          
          resolve(svgElement);
        })
        .catch(error => {
          console.error(`Erreur lors de la création de la couche SVG interactive ${layerId}:`, error);
          reject(error);
        });
    });
  }
  
  /**
   * Active une couche SVG
   * @param {string} layerId - ID de la couche à activer
   */
  activateLayer(layerId) {
    // Vérifier si la couche existe
    if (!this.svgLayers[layerId]) {
      console.error(`La couche ${layerId} n'existe pas`);
      return;
    }
    
    console.log(`Activation de la couche: ${layerId}`);
    
    // Désactiver la couche actuelle
    if (this.currentLayerId && this.svgLayers[this.currentLayerId]) {
      this.svgLayers[this.currentLayerId].setOpacity(0);
      
      // Masquer la couche SVG interactive
      if (this.svgLayers[this.currentLayerId].container) {
        this.svgLayers[this.currentLayerId].container.style.display = 'none';
      }
    }
    
    // Activer la nouvelle couche
    this.svgLayers[layerId].setOpacity(1);
    
    // Afficher la couche SVG interactive
    if (this.svgLayers[layerId].container) {
      this.svgLayers[layerId].container.style.display = 'block';
    }
    
    this.currentLayerId = layerId;
    
    // Publier l'événement de changement de couche
    EventBus.publish('map:layer:changed', {
      layerId: layerId,
      layer: this.svgLayers[layerId]
    });
    
    console.log(`Couche ${layerId} activée`);
  }
  
  /**
   * Extrait les éléments SVG pour l'interactivité
   * @param {SVGElement} svgElement - Élément SVG
   * @param {string} layerId - ID de la couche
   */
  extractSvgElements(svgElement, layerId) {
    if (!svgElement) {
      console.error("Élément SVG non défini lors de l'extraction");
      return;
    }
    
    console.log("Extraction des éléments SVG...");
    
    try {
      // Désactiver les interactions sur le fond
      const background = svgElement.querySelector('#background');
      if (background && background.style) {
        background.style.pointerEvents = 'none';
      }
    } catch (error) {
      console.warn("Impossible de désactiver les interactions sur l'arrière-plan:", error);
    }
    
    // S'assurer que les éléments ont un ID
    this.ensureElementIds(svgElement);
    
    try {
      // Extraire uniquement les éléments qui nous intéressent
      const quarterGroups = svgElement.querySelectorAll('g[id^="G"]:not(#GRues)');
      const invisibleElements = svgElement.querySelectorAll('[id^="inv_"]');
      const streetElements = svgElement.querySelectorAll('#GRues *, [id*="Rue"], [id*="rue"]');
      
      console.log(`Extraction ciblée: ${quarterGroups.length} quartiers, ${invisibleElements.length} zones invisibles, ${streetElements.length} rues`);
      
      // Traiter uniquement les éléments qui nous intéressent
      const elements = {};
      
      // Traiter les quartiers
      this.processQuarterGroups(quarterGroups, elements, layerId);
      
      // Traiter les éléments invisibles
      this.processInvisibleElements(invisibleElements, quarterGroups, elements, layerId, svgElement);
      
      // Traiter les rues (juste désactiver les interactions)
      streetElements.forEach(element => {
        if (element.style) {
          element.style.pointerEvents = 'none';
        }
        element.classList.add('street', 'no-highlight');
        
        // Ajouter à notre registre d'éléments
        if (element.id) {
          elements[element.id] = {
            id: element.id,
            element: element,
            type: element.tagName,
            layer: layerId
          };
        }
      });
      
      // Stocker les éléments extraits
      this.extractedElements[layerId] = elements;
      
      console.log("Extraction des éléments SVG terminée");
      
      // Publier l'événement avec les éléments extraits
      EventBus.publish('map:elements:loaded', {
        layerId: layerId,
        elements: elements,
        count: Object.keys(elements).length
      });
    } catch (error) {
      console.error("Erreur lors de l'extraction des éléments SVG:", error);
    }
  }
  
  /**
   * S'assure que tous les éléments SVG ont un ID
   * @param {SVGElement} svgElement - Élément SVG parent
   */
  ensureElementIds(svgElement) {
    // Chercher les éléments sans ID
    const elementsWithoutId = svgElement.querySelectorAll('path:not([id]), rect:not([id]), circle:not([id]), polygon:not([id])');
    
    console.log(`Éléments sans ID trouvés: ${elementsWithoutId.length}`);
    
    // Ajouter un ID à chaque élément qui n'en a pas
    elementsWithoutId.forEach((element, index) => {
      // Générer un ID basé sur le type et un index
      const typePrefix = element.tagName.toLowerCase();
      element.id = `${typePrefix}_auto_${Date.now()}_${index}`;
    });
  }
  
  /**
   * Traite les groupes de quartiers
   * @param {NodeList} quarterGroups - Liste des groupes de quartiers
   * @param {object} elements - Objet pour stocker les éléments traités
   * @param {string} layerId - ID de la couche
   */
  processQuarterGroups(quarterGroups, elements, layerId) {
    quarterGroups.forEach(element => {
      try {
        // Configurer pour l'effet de surbrillance
        element.classList.add('quartier');
        
        // Activer les interactions
        element.style.pointerEvents = 'auto';
        
        // Stocker la couleur originale des paths
        const paths = element.querySelectorAll('path');
        paths.forEach(path => {
          if (path.getAttribute('fill')) {
            path.dataset.originalFill = path.getAttribute('fill');
          }
          // Permettre les interactions sur les chemins pour que les événements se propagent
          path.style.pointerEvents = 'auto';
        });
        
        // Ajouter à notre registre d'éléments
        elements[element.id] = {
          id: element.id,
          element: element,
          type: element.tagName,
          layer: layerId
        };
      } catch (error) {
        console.error(`Erreur lors du traitement du quartier ${element.id}:`, error);
      }
    });
  }
  
  /**
   * Traite les éléments invisibles
   * @param {NodeList} invisibleElements - Liste des éléments invisibles
   * @param {NodeList} quarterGroups - Liste des groupes de quartiers
   * @param {object} elements - Objet pour stocker les éléments traités
   * @param {string} layerId - ID de la couche
   * @param {SVGElement} svgElement - Élément SVG parent
   */
  processInvisibleElements(invisibleElements, quarterGroups, elements, layerId, svgElement) {
    // Créer une Map pour la recherche rapide
    const quarterMap = new Map();
    quarterGroups.forEach(quartier => {
      try {
        quarterMap.set(quartier.id, quartier);
        
        // Stocker également les noms alternatifs (attributs)
        const label = quartier.getAttribute('inkscapelabel');
        if (label) {
          quarterMap.set(label.toLowerCase(), quartier);
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de l'élément ${quartier.id}:`, error);
      }
    });
    
    invisibleElements.forEach(element => {
      try {
        element.classList.add('interactive');
        
        // Rendre l'élément interactif
        element.style.pointerEvents = 'auto';
        
        // Chercher le quartier correspondant
        let quartierName = '';
        if (element.id.startsWith('inv_')) {
          quartierName = element.id.substring(4); // Sans "inv_"
        } else {
          // Essai avec le nom complet
          quartierName = element.id;
        }
        
        let linkedQuartier = null;
        
        // Vérifier les noms directs
        const possibleIds = [
          `G${quartierName}`,
          `G${quartierName.charAt(0).toUpperCase() + quartierName.slice(1)}`,
          `G${quartierName.toUpperCase()}`
        ];
        
        for (const id of possibleIds) {
          if (quarterMap.has(id)) {
            linkedQuartier = quarterMap.get(id);
            element.dataset.linkedQuartier = id;
            linkedQuartier.dataset.linkedInvisible = element.id;
            break;
          }
        }
        
        // Si toujours pas trouvé, chercher par attribut
        if (!linkedQuartier) {
          for (const [id, quartier] of quarterMap.entries()) {
            if (id.toLowerCase().includes(quartierName.toLowerCase())) {
              linkedQuartier = quartier;
              element.dataset.linkedQuartier = quartier.id;
              quartier.dataset.linkedInvisible = element.id;
              break;
            }
          }
        }
        
        // Ajouter les gestionnaires d'événements
        this.addElementEventHandlers(element, svgElement, layerId);
        
        // Ajouter à notre registre d'éléments
        elements[element.id] = {
          id: element.id,
          element: element,
          type: element.tagName,
          layer: layerId,
          linkedQuartier: element.dataset.linkedQuartier
        };
      } catch (error) {
        console.error(`Erreur lors du traitement de l'élément invisible ${element.id}:`, error);
      }
    });
  }
  
  /**
   * Ajoute des gestionnaires d'événements aux éléments
   * @param {SVGElement} element - Élément SVG
   * @param {SVGElement} svgElement - Élément SVG parent
   * @param {string} layerId - ID de la couche
   */
  addElementEventHandlers(element, svgElement, layerId) {
    try {
      // Événement de clic
      element.addEventListener('click', (e) => {
        console.log(`Clic sur élément invisible: ${element.id}`);
        
        // Effet visuel temporaire au clic
        if (element.dataset.linkedQuartier) {
          const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
          if (quartier) {
            quartier.classList.add('quartier-selected');
            setTimeout(() => {
              quartier.classList.remove('quartier-selected');
            }, 500);
          }
        }
        
        // Publier l'événement
        EventBus.publish('map:element:click', {
          elementId: element.id,
          layerId: layerId,
          type: element.tagName,
          originalEvent: e,
          linkedQuartier: element.dataset.linkedQuartier
        });
      });
      
      // Événements de survol
      element.addEventListener('mouseenter', (e) => {
        if (element.dataset.linkedQuartier) {
          const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
          if (quartier) {
            quartier.classList.add('quartier-hover');
          }
        }
        
        EventBus.publish('map:element:hover', {
          elementId: element.id,
          layerId: layerId,
          type: element.tagName,
          originalEvent: e,
          linkedQuartier: element.dataset.linkedQuartier
        });
      });
      
      element.addEventListener('mouseleave', (e) => {
        if (element.dataset.linkedQuartier) {
          const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
          if (quartier) {
            quartier.classList.remove('quartier-hover');
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'ajout des gestionnaires d'événements pour l'élément ${element.id}:`, error);
    }
  }
  
  /**
   * Récupère un élément SVG par son ID
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche (optionnel, utilise la couche active par défaut)
   * @returns {SVGElement|null} - Élément SVG ou null si non trouvé
   */
  getElementById(elementId, layerId = null) {
    const targetLayerId = layerId || this.currentLayerId;
    
    if (!targetLayerId || !this.svgLayers[targetLayerId]) {
      console.warn(`Couche ${targetLayerId} non disponible`);
      return null;
    }
    
    const svgElement = this.svgLayers[targetLayerId].svgElement;
    if (!svgElement) {
      console.warn(`Élément SVG non disponible pour la couche ${targetLayerId}`);
      return null;
    }
    
    return svgElement.getElementById(elementId);
  }
  
  /**
   * Récupère les éléments SVG extraits pour une couche
   * @param {string} layerId - ID de la couche (optionnel, utilise la couche active par défaut)
   * @returns {object} - Objet contenant les éléments extraits
   */
  getExtractedElements(layerId = null) {
    const targetLayerId = layerId || this.currentLayerId;
    
    if (!targetLayerId || !this.extractedElements[targetLayerId]) {
      console.warn(`Éléments extraits non disponibles pour la couche ${targetLayerId}`);
      return {};
    }
    
    return this.extractedElements[targetLayerId];
  }
  
  /**
   * Récupère l'instance de carte Leaflet
   * @returns {L.Map|null} - Instance de carte Leaflet ou null si non initialisée
   */
  getMap() {
    return this.map;
  }
  
  /**
   * Récupère l'ID de la couche active
   * @returns {string|null} - ID de la couche active ou null si aucune couche active
   */
  getCurrentLayerId() {
    return this.currentLayerId;
  }
  
  /**
   * Récupère la couche SVG active
   * @returns {L.SVGOverlay|null} - Couche SVG active ou null si aucune couche active
   */
  getActiveLayer() {
    if (!this.currentLayerId) return null;
    return this.svgLayers[this.currentLayerId];
  }
  
  /**
   * Ajoute un marqueur à la carte
   * @param {object} position - Position du marqueur {x: number, y: number}
   * @param {object} options - Options du marqueur
   * @returns {L.Marker} - Instance du marqueur Leaflet
   */
  addMarker(position, options = {}) {
    const defaultOptions = {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div class="marker-inner"></div>',
        iconSize: [20, 20]
      })
    };
    
    // Fusionner les options
    const mergedOptions = {...defaultOptions, ...options};
    
    // Créer le marqueur
    const marker = L.marker([position.y, position.x], mergedOptions);
    
    // Ajouter à la carte
    marker.addTo(this.map);
    
    return marker;
  }
}