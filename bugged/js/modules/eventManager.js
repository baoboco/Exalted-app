/**
 * EventManager - Gestionnaire d'événements de jeu pour la carte interactive de Nexus
 * Permet de créer, gérer et déclencher des événements sur la carte
 */
class EventManager {
  /**
   * Crée une instance du gestionnaire d'événements
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before EventManager");
    }
    
    this.mapLoader = mapLoader;
    this.events = {}; // Stockage des événements
    this.activeEvents = []; // Événements actuellement actifs
    this.isSelectingAreasForEvent = false;
    this.selectedAreas = [];
    this.currentEventData = null;
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les clics sur les boutons de création d'événements
    const createEventBtn = document.getElementById('create-event-btn');
    if (createEventBtn) {
      createEventBtn.addEventListener('click', () => this.openEventCreationModal());
    }
    
    // Écouter les événements du bus
    EventBus.subscribe('map:element:click', (data) => {
      if (this.isSelectingAreasForEvent) {
        this.addAreaToEvent(data.elementId, data.layerId);
      }
    });
    
    // Gestionnaire pour sauvegarder l'événement depuis la modale
    const saveEventBtn = document.getElementById('save-event-btn');
    if (saveEventBtn) {
      saveEventBtn.addEventListener('click', () => this.saveEventFromModal());
    }
    
    // Gestionnaire pour annuler la création
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    if (cancelEventBtn) {
      cancelEventBtn.addEventListener('click', () => this.cancelEventCreation());
    }
    
    // Écouteur d'événements pour les changements de couche
    EventBus.subscribe('map:layer:changed', (data) => {
      this.refreshActiveEventsForLayer(data.layerId);
    });
  }
  
  /**
   * Ouvre la modale de création d'événement
   */
  openEventCreationModal() {
    // Réinitialiser les sélections précédentes
    this.selectedAreas = [];
    this.currentEventData = {
      type: '',
      name: '',
      description: '',
      options: {}
    };
    
    // Afficher la modale
    const modal = document.getElementById('event-creation-modal');
    if (modal) {
      modal.style.display = 'block';
      
      // Vider la liste des zones sélectionnées
      const selectedAreasContainer = document.getElementById('selected-areas');
      if (selectedAreasContainer) {
        selectedAreasContainer.innerHTML = '';
      }
      
      // Réinitialiser le formulaire
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
    }
    
    // Active le mode de sélection de zones
    this.isSelectingAreasForEvent = true;
    
    // Notification
    console.log('Mode de sélection de zones pour événement activé');
    EventBus.publish('event:selection:started', {});
  }
  
  /**
   * Ajoute une zone à l'événement en cours de création
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  addAreaToEvent(elementId, layerId) {
    // Vérifier si l'élément est déjà sélectionné
    if (this.selectedAreas.some(area => area.elementId === elementId)) {
      console.log(`La zone ${elementId} est déjà dans la sélection`);
      return;
    }
    
    console.log(`Ajout de la zone ${elementId} à l'événement`);
    
    // Ajouter à la liste des zones sélectionnées
    this.selectedAreas.push({
      elementId: elementId,
      layerId: layerId
    });
    
    // Mettre à jour l'interface utilisateur
    const selectedAreasContainer = document.getElementById('selected-areas');
    if (selectedAreasContainer) {
      const areaItem = document.createElement('div');
      areaItem.className = 'selected-area-item';
      areaItem.dataset.elementId = elementId;
      areaItem.innerHTML = `
        ${elementId}
        <span class="remove-area" data-element-id="${elementId}">×</span>
      `;
      
      // Ajouter l'élément à la liste
      selectedAreasContainer.appendChild(areaItem);
      
      // Ajouter un gestionnaire d'événements pour le bouton de suppression
      const removeButton = areaItem.querySelector('.remove-area');
      if (removeButton) {
        removeButton.addEventListener('click', (e) => {
          this.removeAreaFromSelection(elementId);
          e.stopPropagation();
        });
      }
    }
    
    // Mettre en surbrillance l'élément dans la carte
    this.highlightSelectedArea(elementId, layerId);
    
    // Publier un événement
    EventBus.publish('event:area:added', {
      elementId: elementId,
      layerId: layerId
    });
  }
  
  /**
   * Supprime une zone de la sélection
   * @param {string} elementId - ID de l'élément à supprimer
   */
  removeAreaFromSelection(elementId) {
    // Supprimer de la liste en mémoire
    this.selectedAreas = this.selectedAreas.filter(area => area.elementId !== elementId);
    
    // Supprimer de l'interface utilisateur
    const areaItem = document.querySelector(`.selected-area-item[data-element-id="${elementId}"]`);
    if (areaItem) {
      areaItem.remove();
    }
    
    // Supprimer la surbrillance
    this.unhighlightSelectedArea(elementId);
    
    console.log(`Zone ${elementId} supprimée de la sélection`);
    
    // Publier un événement
    EventBus.publish('event:area:removed', {
      elementId: elementId
    });
  }
  
  /**
   * Met en surbrillance une zone sélectionnée
   * @param {string} elementId - ID de l'élément
   * @param {string} layerId - ID de la couche
   */
  highlightSelectedArea(elementId, layerId) {
    const svgLayer = this.mapLoader.svgLayers[layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    const element = svgElement.getElementById(elementId);
    if (!element) return;
    
    // Ajouter une classe pour la surbrillance
    element.classList.add('event-area-selected');
    
    // Si l'élément est lié à un quartier, mettre également ce quartier en surbrillance
    if (element.dataset.linkedQuartier) {
      const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
      if (quartier) {
        quartier.classList.add('event-area-selected');
      }
    }
  }
  
  /**
   * Supprime la surbrillance d'une zone
   * @param {string} elementId - ID de l'élément
   */
  unhighlightSelectedArea(elementId) {
    // Parcourir toutes les couches pour trouver l'élément
    Object.keys(this.mapLoader.svgLayers).forEach(layerId => {
      const svgLayer = this.mapLoader.svgLayers[layerId];
      if (!svgLayer) return;
      
      const svgElement = svgLayer.getElement();
      if (!svgElement) return;
      
      const element = svgElement.getElementById(elementId);
      if (!element) return;
      
      // Supprimer la classe de surbrillance
      element.classList.remove('event-area-selected');
      
      // Si l'élément est lié à un quartier, supprimer également la surbrillance de ce quartier
      if (element.dataset.linkedQuartier) {
        const quartier = svgElement.getElementById(element.dataset.linkedQuartier);
        if (quartier) {
          quartier.classList.remove('event-area-selected');
        }
      }
    });
  }
  
  /**
   * Enregistre l'événement à partir des données de la modale
   */
  saveEventFromModal() {
    const modal = document.getElementById('event-creation-modal');
    if (!modal) return;
    
    // Récupérer les données du formulaire
    const form = modal.querySelector('form');
    if (!form) return;
    
    const eventType = form.querySelector('#event-type').value;
    const eventName = form.querySelector('#event-name').value;
    const eventDescription = form.querySelector('#event-description').value;
    
    // Validation basique
    if (!eventType || !eventName || this.selectedAreas.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires et sélectionner au moins une zone.');
      return;
    }
    
    // Créer un nouvel événement
    const eventId = this.createEvent(
      eventType,
      eventName,
      this.selectedAreas.map(area => area.elementId),
      {
        description: eventDescription,
        layer: this.mapLoader.currentLayerId,
        areas: this.selectedAreas
      }
    );
    
    // Fermer la modale
    modal.style.display = 'none';
    
    // Désactiver le mode de sélection
    this.isSelectingAreasForEvent = false;
    
    // Supprimer les surbrillances
    this.selectedAreas.forEach(area => {
      this.unhighlightSelectedArea(area.elementId);
    });
    
    // Réinitialiser les données
    this.selectedAreas = [];
    this.currentEventData = null;
    
    // Notification
    console.log(`Événement ${eventName} créé avec succès`);
    
    // Demander à l'utilisateur s'il souhaite activer l'événement immédiatement
    if (confirm(`Souhaitez-vous activer l'événement "${eventName}" immédiatement ?`)) {
      this.activateEvent(eventId);
    }
  }
  
  /**
   * Annule la création d'un événement
   */
  cancelEventCreation() {
    // Fermer la modale
    const modal = document.getElementById('event-creation-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Désactiver le mode de sélection
    this.isSelectingAreasForEvent = false;
    
    // Supprimer les surbrillances
    this.selectedAreas.forEach(area => {
      this.unhighlightSelectedArea(area.elementId);
    });
    
    // Réinitialiser les données
    this.selectedAreas = [];
    this.currentEventData = null;
    
    console.log('Création d\'événement annulée');
    EventBus.publish('event:creation:canceled', {});
  }
  
  /**
   * Crée un nouvel événement
   * @param {string} type - Type d'événement
   * @param {string} name - Nom de l'événement
   * @param {Array} areas - Zones affectées par l'événement
   * @param {object} options - Options supplémentaires
   * @returns {string} - ID de l'événement créé
   */
  createEvent(type, name, areas, options = {}) {
    const eventId = `event-${Date.now()}`;
    this.events[eventId] = {
      id: eventId,
      type,
      name,
      areas,
      options,
      isActive: false,
      createdBy: typeof UserManager !== 'undefined' ? UserManager.getCurrentUser()?.id : 'unknown',
      createdAt: new Date().toISOString()
    };
    
    console.log(`Événement ${name} (${type}) créé`);
    
    // Enregistrer l'événement dans le stockage
    this.saveEventsToStorage();
    
    // Notifier les autres modules
    EventBus.publish('event:created', { eventId, event: this.events[eventId] });
    
    return eventId;
  }
  
  /**
   * Active un événement
   * @param {string} eventId - ID de l'événement
   */
  activateEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return;
    
    // Vérifier si l'événement est déjà actif
    if (event.isActive) {
      console.log(`L'événement ${event.name} est déjà actif`);
      return;
    }
    
    event.isActive = true;
    this.activeEvents.push(eventId);
    
    // Appliquer les effets visuels selon le type d'événement
    this.applyEventEffects(event);
    
    console.log(`Événement ${event.name} activé`);
    
    // Enregistrer l'état dans le stockage
    this.saveEventsToStorage();
    
    // Notifier les autres modules
    EventBus.publish('event:activated', { eventId, event });
  }
  
  /**
   * Désactive un événement
   * @param {string} eventId - ID de l'événement
   */
  deactivateEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return;
    
    // Vérifier si l'événement est déjà inactif
    if (!event.isActive) {
      console.log(`L'événement ${event.name} est déjà inactif`);
      return;
    }
    
    event.isActive = false;
    this.activeEvents = this.activeEvents.filter(id => id !== eventId);
    
    // Supprimer les effets visuels
    this.removeEventEffects(event);
    
    console.log(`Événement ${event.name} désactivé`);
    
    // Enregistrer l'état dans le stockage
    this.saveEventsToStorage();
    
    // Notifier les autres modules
    EventBus.publish('event:deactivated', { eventId, event });
  }
  
  /**
   * Supprime un événement
   * @param {string} eventId - ID de l'événement
   */
  deleteEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return;
    
    // Si l'événement est actif, le désactiver d'abord
    if (event.isActive) {
      this.deactivateEvent(eventId);
    }
    
    // Supprimer l'événement de la liste
    delete this.events[eventId];
    
    console.log(`Événement ${event.name} supprimé`);
    
    // Enregistrer l'état dans le stockage
    this.saveEventsToStorage();
    
    // Notifier les autres modules
    EventBus.publish('event:deleted', { eventId });
  }
  
  /**
   * Applique les effets visuels d'un événement
   * @param {object} event - Événement
   */
  applyEventEffects(event) {
    // Vérifier si l'événement a des zones définies
    if (!event.areas || event.areas.length === 0) {
      console.warn(`L'événement ${event.name} n'a pas de zones définies`);
      return;
    }
    
    // Récupérer la couche associée à l'événement
    const layerId = event.options.layer || this.mapLoader.currentLayerId;
    
    // Récupérer la couche SVG
    const svgLayer = this.mapLoader.svgLayers[layerId];
    if (!svgLayer) {
      console.warn(`La couche ${layerId} n'existe pas`);
      return;
    }
    
    const svg = svgLayer.getElement();
    if (!svg) {
      console.warn(`Élément SVG non trouvé pour la couche ${layerId}`);
      return;
    }
    
    // Appliquer des effets visuels selon le type d'événement
    event.areas.forEach(area => {
      const element = svg.getElementById(area);
      if (!element) {
        console.warn(`Élément ${area} non trouvé dans la couche ${layerId}`);
        return;
      }
      
      // Ajouter une classe selon le type d'événement
      element.classList.add(`event-${event.type}`);
      element.classList.add('event-active');
      
      // Stocker les styles originaux pour pouvoir les restaurer
      if (!element.dataset.originalFill) {
        element.dataset.originalFill = element.getAttribute('fill') || '';
      }
      
      // Appliquer des styles spécifiques selon le type
      switch (event.type) {
        case 'fire':
          element.style.fill = '#ff4500';
          break;
        case 'flood':
          element.style.fill = '#4682b4';
          break;
        case 'battle':
          element.style.fill = '#8b0000';
          break;
        case 'festival':
          element.style.fill = '#ffd700';
          break;
        case 'crime':
          element.style.fill = '#800080';
          break;
        case 'construction':
          element.style.fill = '#a0522d';
          break;
        default:
          // Type d'événement générique
          element.style.fill = '#777777';
      }
      
      // Si l'élément est lié à un quartier, appliquer également les effets à ce quartier
      if (element.dataset.linkedQuartier) {
        const quartier = svg.getElementById(element.dataset.linkedQuartier);
        if (quartier) {
          quartier.classList.add(`event-${event.type}`);
          quartier.classList.add('event-active');
          
          if (!quartier.dataset.originalFill) {
            quartier.dataset.originalFill = quartier.getAttribute('fill') || '';
          }
        }
      }
    });
  }
  
  /**
   * Supprime les effets visuels d'un événement
   * @param {object} event - Événement
   */
  removeEventEffects(event) {
    // Vérifier si l'événement a des zones définies
    if (!event.areas || event.areas.length === 0) return;
    
    // Récupérer la couche associée à l'événement
    const layerId = event.options.layer || this.mapLoader.currentLayerId;
    
    // Récupérer la couche SVG
    const svgLayer = this.mapLoader.svgLayers[layerId];
    if (!svgLayer) return;
    
    const svg = svgLayer.getElement();
    if (!svg) return;
    
    // Supprimer les effets visuels
    event.areas.forEach(area => {
      const element = svg.getElementById(area);
      if (!element) return;
      
      // Supprimer la classe d'événement
      element.classList.remove(`event-${event.type}`);
      element.classList.remove('event-active');
      
      // Restaurer les styles originaux
      if (element.dataset.originalFill) {
        element.setAttribute('fill', element.dataset.originalFill);
        delete element.dataset.originalFill;
      }
      
      // Supprimer les styles spécifiques
      element.style.fill = '';
      
      // Si l'élément est lié à un quartier, supprimer également les effets de ce quartier
      if (element.dataset.linkedQuartier) {
        const quartier = svg.getElementById(element.dataset.linkedQuartier);
        if (quartier) {
          quartier.classList.remove(`event-${event.type}`);
          quartier.classList.remove('event-active');
          
          if (quartier.dataset.originalFill) {
            quartier.setAttribute('fill', quartier.dataset.originalFill);
            delete quartier.dataset.originalFill;
          }
        }
      }
    });
  }
  
  /**
   * Enregistre les événements dans le stockage local
   */
  saveEventsToStorage() {
    try {
      localStorage.setItem('nexus-events', JSON.stringify(this.events));
      localStorage.setItem('nexus-active-events', JSON.stringify(this.activeEvents));
      console.log('Événements enregistrés dans le stockage local');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des événements:', error);
    }
  }
  
  /**
   * Charge les événements depuis le stockage local
   */
  loadEventsFromStorage() {
    try {
      const events = localStorage.getItem('nexus-events');
      const activeEvents = localStorage.getItem('nexus-active-events');
      
      if (events) {
        this.events = JSON.parse(events);
        console.log('Événements chargés depuis le stockage local');
      }
      
      if (activeEvents) {
        this.activeEvents = JSON.parse(activeEvents);
        console.log('Événements actifs chargés depuis le stockage local');
      }
      
      // Activer les événements qui étaient actifs
      this.activeEvents.forEach(eventId => {
        const event = this.events[eventId];
        if (event) {
          event.isActive = true;
          this.applyEventEffects(event);
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  }
  
  /**
   * Rafraîchit les événements actifs pour une couche spécifique
   * @param {string} layerId - ID de la couche
   */
  refreshActiveEventsForLayer(layerId) {
    // Réappliquer les effets pour tous les événements actifs sur cette couche
    this.activeEvents.forEach(eventId => {
      const event = this.events[eventId];
      if (event && (event.options.layer === layerId || !event.options.layer)) {
        this.applyEventEffects(event);
      }
    });
  }
  
  /**
   * Retourne la liste des événements
   * @returns {Array} - Liste des événements
   */
  getEvents() {
    return Object.values(this.events);
  }
  
  /**
   * Retourne la liste des événements actifs
   * @returns {Array} - Liste des événements actifs
   */
  getActiveEvents() {
    return this.activeEvents.map(eventId => this.events[eventId]).filter(Boolean);
  }
  
  /**
   * Retourne un événement par son ID
   * @param {string} eventId - ID de l'événement
   * @returns {object|null} - Événement ou null si non trouvé
   */
  getEventById(eventId) {
    return this.events[eventId] || null;
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.EventManager = EventManager;