/**
 * EventManager - Gestionnaire d'événements dynamiques pour la carte interactive de Nexus
 */
class EventManager {
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.events = {};
    
    this.initModalHandlers();
  }
  
  initModalHandlers() {
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const closeButtons = eventModal?.querySelectorAll('.close-modal-btn, .cancel-btn');
    
    // Fermer le modal
    closeButtons?.forEach(button => {
      button.addEventListener('click', () => {
        eventModal.classList.remove('active');
      });
    });
    
    // Soumettre le formulaire
    eventForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('event-name').value;
      const type = document.getElementById('event-type').value;
      const description = document.getElementById('event-description').value;
      
      // Récupérer les zones sélectionnées
      const selectedAreasContainer = document.getElementById('selected-areas');
      const elementIds = Array.from(selectedAreasContainer.children).map(item => 
        item.dataset.elementId
      );
      
      const layerId = eventForm.dataset.layerId;
      
      this.addEvent(type, name, layerId, elementIds, {
        description: description
      });
      
      eventModal.classList.remove('active');
    });
    
    // Bouton de création d'événement
    const createEventBtn = document.getElementById('create-event-btn');
    createEventBtn?.addEventListener('click', () => {
      this.openEventCreationModal();
    });
  }
  
  openEventCreationModal(layerId = null) {
    if (!UserManager.isGameMaster()) return;
    
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const selectedAreasContainer = document.getElementById('selected-areas');
    
    if (!eventModal || !eventForm || !selectedAreasContainer) return;
    
    // Vider les zones sélectionnées
    selectedAreasContainer.innerHTML = '';
    
    // Définir la couche active
    eventForm.dataset.layerId = layerId || this.mapLoader.currentLayerId;
    
    // Réinitialiser le formulaire
    eventForm.reset();
    
    // Activer le mode de sélection d'éléments
    document.body.classList.add('event-selection-mode');
    
    // Afficher le modal
    eventModal.classList.add('active');
  }
  
  addEvent(type, name, layerId, elementIds, options = {}) {
    const eventId = `event-${Date.now()}`;
    const event = {
      id: eventId,
      type,
      name,
      layerId,
      elementIds,
      options,
      active: false,
      createdBy: UserManager.getCurrentUser()?.id || 'guest',
      createdAt: new Date().toISOString()
    };
    
    // Stocker l'événement
    this.events[eventId] = event;
    
    // Ajouter à la liste d'événements
    this.addEventToList(event);
    
    // Dispatcher un événement
    EventBus.publish('event:created', {
      event: event
    });
    
    return eventId;
  }
  
  addEventToList(event) {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const eventItem = document.createElement('li');
    eventItem.className = 'event-item';
    eventItem.dataset.eventId = event.id;
    
    eventItem.innerHTML = `
      <span class="event-name">${event.name}</span>
      <span class="event-type">(${event.type})</span>
      <div class="event-controls">
        <button class="event-activate-btn">${event.active ? 'Désactiver' : 'Activer'}</button>
        <button class="event-delete-btn">×</button>
      </div>
    `;
    
    // Ajouter des écouteurs d'événements
    const activateBtn = eventItem.querySelector('.event-activate-btn');
    const deleteBtn = eventItem.querySelector('.event-delete-btn');
    
    activateBtn.addEventListener('click', () => {
      if (event.active) {
        this.deactivateEvent(event.id);
        activateBtn.textContent = 'Activer';
      } else {
        this.activateEvent(event.id);
        activateBtn.textContent = 'Désactiver';
      }
    });
    
    deleteBtn.addEventListener('click', () => {
      this.deleteEvent(event.id);
      eventItem.remove();
    });
    
    eventsList.appendChild(eventItem);
  }
  
  activateEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return false;
    
    // Activer l'événement
    event.active = true;
    
    // Appliquer les effets visuels
    this.applyEventEffects(event);
    
    // Dispatcher un événement
    EventBus.publish('event:activated', {
      event: event
    });
    
    return true;
  }
  
  deactivateEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return false;
    
    // Désactiver l'événement
    event.active = false;
    
    // Supprimer les effets visuels
    this.removeEventEffects(event);
    
    // Dispatcher un événement
    EventBus.publish('event:deactivated', {
      event: event
    });
    
    return true;
  }
  
  deleteEvent(eventId) {
    const event = this.events[eventId];
    if (!event) return false;
    
    // Si l'événement est actif, le désactiver d'abord
    if (event.active) {
      this.deactivateEvent(eventId);
    }
    
    // Supprimer l'événement
    delete this.events[eventId];
    
    // Dispatcher un événement
    EventBus.publish('event:deleted', {
      eventId: eventId
    });
    
    return true;
  }
  
  applyEventEffects(event) {
    // Récupérer la couche SVG
    const svgLayer = this.mapLoader.svgLayers[event.layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    // Appliquer les effets en fonction du type d'événement
    switch (event.type) {
      case 'fire':
        // Ajouter l'effet de feu
        event.elementIds.forEach(elementId => {
          const element = svgElement.getElementById(elementId);
          if (element) {
            element.classList.add('effect-fire');
            this.addFireEffect(element);
          }
        });
        break;
      case 'flood':
        // Ajouter l'effet d'inondation
        event.elementIds.forEach(elementId => {
          const element = svgElement.getElementById(elementId);
          if (element) {
            element.classList.add('effect-flood');
            this.addFloodEffect(element);
          }
        });
        break;
      case 'collapse':
        // Ajouter l'effet d'effondrement
        event.elementIds.forEach(elementId => {
          const element = svgElement.getElementById(elementId);
          if (element) {
            element.classList.add('effect-collapse');
            element.style.opacity = '0.7';
            element.style.filter = 'grayscale(70%)';
          }
        });
        break;
      case 'battle':
        // Ajouter l'effet de bataille
        event.elementIds.forEach(elementId => {
          const element = svgElement.getElementById(elementId);
          if (element) {
            element.classList.add('effect-battle');
            const origFill = element.getAttribute('fill');
            element.dataset.origFill = origFill;
            element.setAttribute('fill', '#c0392b');
          }
        });
        break;
      case 'festival':
        // Ajouter l'effet de festival
        event.elementIds.forEach(elementId => {
          const element = svgElement.getElementById(elementId);
          if (element) {
            element.classList.add('effect-festival');
            element.style.filter = 'saturate(2) brightness(1.2)';
          }
        });
        break;
    }
  }
  
  removeEventEffects(event) {
    // Récupérer la couche SVG
    const svgLayer = this.mapLoader.svgLayers[event.layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    // Supprimer les effets
    event.elementIds.forEach(elementId => {
      const element = svgElement.getElementById(elementId);
      if (element) {
        // Supprimer toutes les classes d'effet
        element.classList.remove('effect-fire', 'effect-flood', 'effect-collapse', 'effect-battle', 'effect-festival');
        
        // Rétablir les styles
        element.style.opacity = '';
        element.style.filter = '';
        
        // Restaurer la couleur originale si nécessaire
        if (element.dataset.origFill) {
          element.setAttribute('fill', element.dataset.origFill);
          delete element.dataset.origFill;
        }
        
        // Supprimer les animations
        Array.from(element.querySelectorAll('.effect-animation')).forEach(el => el.remove());
      }
    });
  }
  
  addFireEffect(element) {
    // Ajouter une animation de feu
    element.style.filter = 'brightness(1.2) saturate(1.5)';
    
    // On pourrait ajouter des flammes avec SVG, mais c'est simplifié ici
  }
  
  addFloodEffect(element) {
    // Ajouter une animation d'eau
    element.style.filter = 'hue-rotate(180deg) brightness(0.8)';
    
    const origFill = element.getAttribute('fill');
    element.dataset.origFill = origFill;
    
    // Teinter en bleu
    element.setAttribute('fill', '#34495e');
  }
}

window.EventManager = EventManager;
