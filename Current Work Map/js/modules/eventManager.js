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
    
    // Appliquer les animations avancées
    this.addAdvancedAnimations(event);
    
    // Dispatcher un événement
    EventBus.publish('event:effect:applied', {
      event: event,
      type: event.type
    });
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
  
  // Nouvelles méthodes pour les animations avancées
  addAdvancedAnimations(event) {
    // Récupérer la couche SVG
    const svgLayer = this.mapLoader.svgLayers[event.layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    // Vérifier si les filtres SVG sont déjà définis
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgElement.appendChild(defs);
    }
    
    // Créer des filtres avancés en fonction du type d'événement
    switch (event.type) {
      case 'fire':
        this.createFireFilter(defs);
        break;
      case 'flood':
        this.createFloodFilter(defs);
        break;
      case 'collapse':
        this.createCollapseFilter(defs);
        break;
      case 'battle':
        this.createBattleFilter(defs);
        break;
      case 'festival':
        this.createFestivalFilter(defs);
        break;
    }
    
    // Pour chaque élément affecté, appliquer l'animation appropriée
    event.elementIds.forEach(elementId => {
      const element = svgElement.getElementById(elementId);
      if (!element) return;
      
      switch (event.type) {
        case 'fire':
          this.applyFireAnimation(element);
          break;
        case 'flood':
          this.applyFloodAnimation(element);
          break;
        case 'collapse':
          this.applyCollapseAnimation(element);
          break;
        case 'battle':
          this.applyBattleAnimation(element);
          break;
        case 'festival':
          this.applyFestivalAnimation(element);
          break;
      }
    });
  }
  
  // Filtres et animations pour le feu
  createFireFilter(defs) {
    if (defs.querySelector('#filter-fire')) return;
    
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute('id', 'filter-fire');
    filter.innerHTML = `
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feComponentTransfer result="brighter">
        <feFuncR type="linear" slope="3"/>
        <feFuncG type="linear" slope="2"/>
        <feFuncB type="linear" slope="1"/>
      </feComponentTransfer>
      <feComposite in="SourceGraphic" in2="brighter" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    `;
    defs.appendChild(filter);
    
    // Ajouter une animation de flammes
    const fireAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    fireAnimation.setAttribute('attributeName', 'stdDeviation');
    fireAnimation.setAttribute('values', '2;4;2');
    fireAnimation.setAttribute('dur', '0.8s');
    fireAnimation.setAttribute('repeatCount', 'indefinite');
    
    filter.querySelector('feGaussianBlur').appendChild(fireAnimation);
  }
  
  applyFireAnimation(element) {
    element.classList.add('effect-fire');
    element.style.filter = 'url(#filter-fire)';
    
    // Sauvegarder la couleur originale
    const origFill = element.getAttribute('fill');
    element.dataset.origFill = origFill || '';
    
    // Créer une animation de flammes qui se superpose
    const flameGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    flameGroup.classList.add('effect-animation', 'flame-animation');
    
    // Obtenir les limites de l'élément
    const bbox = element.getBBox();
    
    // Créer des flammes aléatoires autour de l'élément
    for (let i = 0; i < 5; i++) {
      const flame = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const x = bbox.x + Math.random() * bbox.width;
      const y = bbox.y + bbox.height;
      const height = 10 + Math.random() * 15;
      const width = 5 + Math.random() * 8;
      
      flame.setAttribute('d', `M ${x} ${y} Q ${x - width/2} ${y - height/2}, ${x} ${y - height} Q ${x + width/2} ${y - height/2}, ${x} ${y} Z`);
      flame.setAttribute('fill', `rgba(255, ${Math.floor(100 + Math.random() * 100)}, 0, 0.7)`);
      
      // Animation de hauteur
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute('attributeName', 'd');
      animate.setAttribute('values', `
        M ${x} ${y} Q ${x - width/2} ${y - height/2}, ${x} ${y - height} Q ${x + width/2} ${y - height/2}, ${x} ${y} Z;
        M ${x} ${y} Q ${x - width/2} ${y - height/3}, ${x} ${y - height*1.3} Q ${x + width/2} ${y - height/3}, ${x} ${y} Z;
        M ${x} ${y} Q ${x - width/2} ${y - height/2}, ${x} ${y - height} Q ${x + width/2} ${y - height/2}, ${x} ${y} Z
      `);
      animate.setAttribute('dur', `${0.5 + Math.random() * 1}s`);
      animate.setAttribute('repeatCount', 'indefinite');
      
      flame.appendChild(animate);
      flameGroup.appendChild(flame);
    }
    
    // Ajouter les flammes après l'élément
    element.parentNode.insertBefore(flameGroup, element.nextSibling);
  }
  
  // Filtres et animations pour l'inondation
  createFloodFilter(defs) {
    if (defs.querySelector('#filter-flood')) return;
    
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute('id', 'filter-flood');
    filter.innerHTML = `
      <feColorMatrix type="matrix" values="
        0.1 0 0 0 0
        0 0.3 0 0 0
        0 0 0.7 0 0
        0 0 0 1 0
      "/>
      <feGaussianBlur stdDeviation="1"/>
    `;
    defs.appendChild(filter);
    
    // Ajouter une animation d'ondulation
    const waveAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    waveAnimation.setAttribute('attributeName', 'stdDeviation');
    waveAnimation.setAttribute('values', '1;2;1');
    waveAnimation.setAttribute('dur', '3s');
    waveAnimation.setAttribute('repeatCount', 'indefinite');
    
    filter.querySelector('feGaussianBlur').appendChild(waveAnimation);
  }
  
  applyFloodAnimation(element) {
    element.classList.add('effect-flood');
    element.style.filter = 'url(#filter-flood)';
    
    // Sauvegarder la couleur originale
    const origFill = element.getAttribute('fill');
    element.dataset.origFill = origFill || '';
    
    // Teinte bleue
    element.setAttribute('fill', '#3498db');
    
    // Créer une animation d'ondulation d'eau
    const waveGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    waveGroup.classList.add('effect-animation', 'water-animation');
    
    // Obtenir les limites de l'élément
    const bbox = element.getBBox();
    
    // Créer des vagues qui se superposent à l'élément
    for (let i = 0; i < 3; i++) {
      const wave = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const y = bbox.y + bbox.height * (0.7 + i * 0.1);
      
      // Créer un chemin de vague sinusoïdal
      let path = `M ${bbox.x - 5} ${y}`;
      const waveHeight = 3;
      const steps = 10;
      const stepWidth = (bbox.width + 10) / steps;
      
      for (let j = 0; j <= steps; j++) {
        const x = bbox.x - 5 + j * stepWidth;
        const yOffset = waveHeight * Math.sin(j * Math.PI);
        path += ` L ${x} ${y + yOffset}`;
      }
      
      wave.setAttribute('d', path);
      wave.setAttribute('fill', 'none');
      wave.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
      wave.setAttribute('stroke-width', '2');
      
      // Animation de déplacement horizontal
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animate.setAttribute('attributeName', 'transform');
      animate.setAttribute('type', 'translate');
      animate.setAttribute('from', '0 0');
      animate.setAttribute('to', `${stepWidth} 0`);
      animate.setAttribute('dur', `${3 + i}s`);
      animate.setAttribute('repeatCount', 'indefinite');
      
      wave.appendChild(animate);
      waveGroup.appendChild(wave);
    }
    
    // Ajouter les vagues après l'élément
    element.parentNode.insertBefore(waveGroup, element.nextSibling);
  }
  
  // Filtres et animations pour l'effondrement
  createCollapseFilter(defs) {
    if (defs.querySelector('#filter-collapse')) return;
    
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute('id', 'filter-collapse');
    filter.innerHTML = `
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
      <feComposite in="SourceGraphic" operator="arithmetic" k1="0.5" k2="0.5" k3="0" k4="0"/>
    `;
    defs.appendChild(filter);
  }
  
  applyCollapseAnimation(element) {
    element.classList.add('effect-collapse');
    element.style.filter = 'url(#filter-collapse)';
    element.style.opacity = '0.7';
    
    // Ajouter un tremblement d'animation
    const animateX = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animateX.setAttribute('attributeName', 'x');
    animateX.setAttribute('values', `${element.getAttribute('x')};${parseFloat(element.getAttribute('x')) + 2};${parseFloat(element.getAttribute('x')) - 2};${element.getAttribute('x')}`);
    animateX.setAttribute('dur', '0.2s');
    animateX.setAttribute('repeatCount', '5');
    
    const animateY = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animateY.setAttribute('attributeName', 'y');
    animateY.setAttribute('values', `${element.getAttribute('y')};${parseFloat(element.getAttribute('y')) + 2};${parseFloat(element.getAttribute('y')) - 2};${element.getAttribute('y')}`);
    animateY.setAttribute('dur', '0.3s');
    animateY.setAttribute('repeatCount', '5');
    
    element.appendChild(animateX);
    element.appendChild(animateY);
    
    // Ajouter des débris qui tombent
    const debrisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    debrisGroup.classList.add('effect-animation', 'debris-animation');
    
    // Obtenir les limites de l'élément
    const bbox = element.getBBox();
    
    // Créer des débris
    for (let i = 0; i < 10; i++) {
      const debris = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const x = bbox.x + Math.random() * bbox.width;
      const y = bbox.y + Math.random() * bbox.height;
      const size = 1 + Math.random() * 3;
      
      debris.setAttribute('x', x);
      debris.setAttribute('y', y);
      debris.setAttribute('width', size);
      debris.setAttribute('height', size);
      debris.setAttribute('fill', '#777');
      
      // Animation de chute
      const animateMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      animateMotion.setAttribute('path', `M 0 0 L ${-5 + Math.random() * 10} ${20 + Math.random() * 30}`);
      animateMotion.setAttribute('dur', `${1 + Math.random() * 2}s`);
      animateMotion.setAttribute('fill', 'freeze');
      
      debris.appendChild(animateMotion);
      debrisGroup.appendChild(debris);
    }
    
    // Ajouter les débris après l'élément
    element.parentNode.insertBefore(debrisGroup, element.nextSibling);
  }
  
  // Filtres et animations pour la bataille
  createBattleFilter(defs) {
    if (defs.querySelector('#filter-battle')) return;
    
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute('id', 'filter-battle');
    filter.innerHTML = `
      <feColorMatrix type="matrix" values="
        1.5 0 0 0 0
        0 0.5 0 0 0
        0 0 0.5 0 0
        0 0 0 1 0
      "/>
    `;
    defs.appendChild(filter);
  }
  
  applyBattleAnimation(element) {
    element.classList.add('effect-battle');
    element.style.filter = 'url(#filter-battle)';
    
    // Sauvegarder la couleur originale
    const origFill = element.getAttribute('fill');
    element.dataset.origFill = origFill || '';
    
    // Teinte rouge
    element.setAttribute('fill', '#c0392b');
    
    // Créer une animation de combat
    const battleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    battleGroup.classList.add('effect-animation', 'battle-animation');
    
    // Obtenir les limites de l'élément
    const bbox = element.getBBox();
    
    // Créer des éclairs d'épées et des symboles de combat
    for (let i = 0; i < 5; i++) {
      const x = bbox.x + Math.random() * bbox.width;
      const y = bbox.y + Math.random() * bbox.height;
      
      // Créer un symbole de combat (éclair, croix, etc.)
      const symbol = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // Alternance entre différents symboles
      let symbolPath;
      const symbolType = Math.floor(Math.random() * 3);
      
      if (symbolType === 0) {
        // Éclair
        symbolPath = `M ${x} ${y} L ${x+5} ${y+10} L ${x} ${y+15} L ${x+8} ${y+25}`;
        symbol.setAttribute('stroke', 'yellow');
      } else if (symbolType === 1) {
        // Croix d'épées
        symbolPath = `M ${x-5} ${y-5} L ${x+5} ${y+5} M ${x+5} ${y-5} L ${x-5} ${y+5}`;
        symbol.setAttribute('stroke', 'white');
      } else {
        // Étoile
        symbolPath = `M ${x} ${y-5} L ${x+2} ${y-2} L ${x+5} ${y-2} L ${x+3} ${y+1} L ${x+4} ${y+4} L ${x} ${y+2} L ${x-4} ${y+4} L ${x-3} ${y+1} L ${x-5} ${y-2} L ${x-2} ${y-2} Z`;
        symbol.setAttribute('fill', 'orange');
      }
      
      symbol.setAttribute('d', symbolPath);
      symbol.setAttribute('stroke-width', '2');
      symbol.style.opacity = '0';
      
      // Animation de pulsation
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute('attributeName', 'opacity');
      animate.setAttribute('values', '0;1;0');
      animate.setAttribute('dur', `${0.5 + Math.random() * 0.5}s`);
      animate.setAttribute('begin', `${Math.random() * 3}s`);
      animate.setAttribute('repeatCount', 'indefinite');
      
      symbol.appendChild(animate);
      battleGroup.appendChild(symbol);
    }
    
    // Ajouter les symboles de bataille après l'élément
    element.parentNode.insertBefore(battleGroup, element.nextSibling);
  }
  
  // Filtres et animations pour le festival
  createFestivalFilter(defs) {
    if (defs.querySelector('#filter-festival')) return;
    
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute('id', 'filter-festival');
    filter.innerHTML = `
      <feColorMatrix type="saturate" values="2"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.2"/>
        <feFuncG type="linear" slope="1.2"/>
        <feFuncB type="linear" slope="1.2"/>
      </feComponentTransfer>
    `;
    defs.appendChild(filter);
  }
  
  applyFestivalAnimation(element) {
    element.classList.add('effect-festival');
    element.style.filter = 'url(#filter-festival)';
    
    // Créer une animation de fête
    const festivalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    festivalGroup.classList.add('effect-animation', 'festival-animation');
    
    // Obtenir les limites de l'élément
    const bbox = element.getBBox();
    
    // Créer des confettis et des décorations
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const x = bbox.x + Math.random() * bbox.width;
      const y = bbox.y - 10 - Math.random() * 20;
      const size = 1 + Math.random() * 3;
      
      // Couleurs vives pour les confettis
      const colors = ['#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.setAttribute('x', x);
      confetti.setAttribute('y', y);
      confetti.setAttribute('width', size);
      confetti.setAttribute('height', size);
      confetti.setAttribute('fill', color);
      confetti.style.opacity = '0.8';
      
      // Animation de chute et de rotation
      const fallDuration = 3 + Math.random() * 4;
      
      const animateMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      animateMotion.setAttribute('path', `M 0 0 Q ${-20 + Math.random() * 40} ${bbox.height/2} ${-30 + Math.random() * 60} ${bbox.height + 20}`);
      animateMotion.setAttribute('dur', `${fallDuration}s`);
      animateMotion.setAttribute('repeatCount', 'indefinite');
      
      const animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animateTransform.setAttribute('attributeName', 'transform');
      animateTransform.setAttribute('type', 'rotate');
      animateTransform.setAttribute('from', '0');
      animateTransform.setAttribute('to', `${Math.random() > 0.5 ? 360 : -360}`);
      animateTransform.setAttribute('dur', `${1 + Math.random() * 2}s`);
      animateTransform.setAttribute('repeatCount', 'indefinite');
      
      confetti.appendChild(animateMotion);
      confetti.appendChild(animateTransform);
      festivalGroup.appendChild(confetti);
    }
    
    // Ajouter les confettis après l'élément
    element.parentNode.insertBefore(festivalGroup, element.nextSibling);
  }
  
  addFireEffect(element) {
    // Ajouter une animation de feu (version simple maintenue pour compatibilité)
    element.style.filter = 'brightness(1.2) saturate(1.5)';
    
    // On pourrait ajouter des flammes avec SVG, mais c'est simplifié ici
  }
  
  addFloodEffect(element) {
    // Ajouter une animation d'eau (version simple maintenue pour compatibilité)
    element.style.filter
	element.style.filter = 'hue-rotate(180deg) brightness(0.8)';
    
    const origFill = element.getAttribute('fill');
    element.dataset.origFill = origFill;
    
    // Teinter en bleu
    element.setAttribute('fill', '#34495e');
  }
}

window.EventManager = EventManager;