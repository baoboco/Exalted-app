/**
 * Script principal d'initialisation pour la carte interactive de Nexus
 */
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier que Leaflet est chargé
  if (typeof L === 'undefined') {
    console.error("Erreur: Leaflet n'est pas chargé!");
    alert("Erreur: La bibliothèque de cartographie n'est pas chargée correctement.");
    return;
  }
  
  // Vérifier que EventBus est chargé
  if (typeof EventBus === 'undefined') {
    console.error('EventBus non disponible');
    alert("Erreur: Le système d'événements n'est pas chargé correctement.");
    return;
  }
  
  // Vérifier si AuthManager est disponible
  if (typeof window.authManager === 'undefined') {
    console.error('AuthManager non disponible');
    alert("Erreur: Le système d'authentification n'est pas chargé correctement.");
    return;
  }
  
  // Initialiser le chargeur de carte
  const mapLoader = new MapLoader('map-container');
  
  // Référence au mapLoader dans l'authManager pour les préférences de zoom
  if (window.authManager) {
    window.authManager.mapLoader = mapLoader;
  }
  
  // Initialiser la carte
mapLoader.init({
  minZoom: -2,
  maxZoom: 4,
  initialView: [992.6665, 1494.6665], // Centre de votre viewBox
  initialZoom: -1
});
  
  // Initialiser le gestionnaire de couches
  const layerManager = new LayerManager(mapLoader);
  
  // Ajouter les couches
  layerManager.addLayer('main', 'Surface', 'map/nexus-main.svg');
  layerManager.addLayer('underground', 'Souterrains', 'map/nexus-underground.svg');
  
  // Initialiser le gestionnaire d'interactions
  const interactionManager = new InteractionManager(mapLoader);
  window.interactionManager = interactionManager;
  
  // Enregistrer les outils
  interactionManager.registerTool('marker', new MarkerTool(mapLoader));
  
  // Activer la couche principale par défaut
  layerManager.activateLayer('main');
  
  // Activer l'outil de marqueur par défaut
  interactionManager.activateTool('marker');
  
  // S'abonner aux événements de la carte
  EventBus.subscribe('map:element:click', function(data) {
    console.log('Élément cliqué:', data.elementId);
    
    // Vérifier si un outil est actif
    if (window.interactionManager && window.interactionManager.activeToolId) {
      // Si un outil est actif, ne pas ouvrir le panneau d'informations
      console.log('Un outil est actif, le panneau d\'informations ne sera pas ouvert');
      return;
    }
    
    // Afficher des informations sur l'élément cliqué dans le panneau d'info
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.add('active');
      const infoPanelContent = document.getElementById('info-panel-content');
      if (infoPanelContent) {
        infoPanelContent.innerHTML = `
          <h3>Élément: ${data.elementId}</h3>
          <p>Type: ${data.type}</p>
          <p>Couche: ${data.layerId}</p>
        `;
      }
    }
  });
  
  EventBus.subscribe('map:error', function(data) {
    console.error('Erreur de carte:', data);
    alert(`Erreur: ${data.error}`);
  });
  
  // S'abonner aux événements d'authentification
  EventBus.subscribe('auth:user:changed', function(data) {
    console.log('Utilisateur connecté:', data.user.name);
    
    // Vérifier si l'utilisateur est un MJ pour afficher l'interface de test
    if (data.user.role === 'gm') {
      createEventTestUI();
    }
  });
  
  // Initialiser les gestionnaires d'événements UI
  initUIHandlers();
  
  // Ajouter un contrôle pour basculer entre les cartes si non déjà présent
  if (!document.getElementById('btn-main') && !document.getElementById('btn-underground')) {
    const mapControl = document.createElement('div');
    mapControl.className = 'map-control';
    mapControl.innerHTML = `
      <button id="btn-main">Carte Principale</button>
      <button id="btn-underground">Souterrains</button>
    `;
    
    const controlsContainer = document.getElementById('controls');
    if (controlsContainer) {
      controlsContainer.appendChild(mapControl);
      
      // Ajouter les événements aux boutons
      document.getElementById('btn-main').addEventListener('click', function() {
        layerManager.activateLayer('main');
      });
      
      document.getElementById('btn-underground').addEventListener('click', function() {
        layerManager.activateLayer('underground');
      });
    }
  }
  
  // Initialiser le gestionnaire d'événements
  window.eventManager = new EventManager(mapLoader);
  
  // L'interface de test sera créée uniquement après la connexion d'un MJ
  // via l'événement auth:user:changed
});

/**
 * Initialise les gestionnaires d'événements pour l'interface utilisateur
 */
function initUIHandlers() {
  // Gestionnaire pour le panneau d'informations
  const infoPanel = document.getElementById('info-panel');
  const closeInfoPanelBtn = document.getElementById('close-info-panel-btn');
  
  if (closeInfoPanelBtn) {
    closeInfoPanelBtn.addEventListener('click', () => {
      infoPanel.classList.remove('active');
    });
  }
  
  // Gestionnaire pour le journal personnel
  const journalText = document.getElementById('journal-text');
  const saveJournalBtn = document.getElementById('save-journal-btn');
  
  if (journalText && saveJournalBtn) {
    // Charger le journal depuis le stockage local
    const savedJournal = localStorage.getItem('nexus-journal');
    if (savedJournal) {
      journalText.value = savedJournal;
    }
    
    // Sauvegarder le journal
    saveJournalBtn.addEventListener('click', () => {
      localStorage.setItem('nexus-journal', journalText.value);
      alert('Journal sauvegardé!');
    });
  }
  
  // Gestionnaire pour le bouton d'aide
  const helpBtn = document.getElementById('help-btn');
  
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      alert('Bienvenue dans la carte interactive de Nexus!\n\n' +
            'Utilisez les outils de la barre latérale pour interagir avec la carte.\n' +
            'Vous pouvez ajouter des marqueurs en cliquant sur la carte.');
    });
  }
}

/**
 * Crée une interface pour tester les événements dynamiques (MJ uniquement)
 */
function createEventTestUI() {
  // Ne créer l'interface que pour les MJ
  if (!window.authManager.currentUser || window.authManager.currentUser.role !== 'gm') return;
  
  // Éviter de créer plusieurs fois le panneau
  if (document.querySelector('.event-test-panel')) return;
  
  // Créer le panneau de test des événements
  const eventPanel = document.createElement('div');
  eventPanel.className = 'event-test-panel';
  eventPanel.innerHTML = `
    <h3>Test d'Événements</h3>
    <div class="test-buttons">
      <button data-event="fire" class="event-test-btn">Incendie</button>
      <button data-event="flood" class="event-test-btn">Inondation</button>
      <button data-event="collapse" class="event-test-btn">Effondrement</button>
      <button data-event="battle" class="event-test-btn">Bataille</button>
      <button data-event="festival" class="event-test-btn">Festival</button>
    </div>
    <div class="help-text">Sélectionnez d'abord un type d'événement, puis cliquez sur les zones de la carte pour l'appliquer</div>
  `;
  
  // Ajouter des styles
  const style = document.createElement('style');
  style.textContent = `
    .event-test-panel {
      position: absolute;
      top: 70px;
      right: 20px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }
    
    .test-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 10px 0;
    }
    
    .event-test-btn {
      padding: 5px 10px;
      font-size: 0.9rem;
    }
    
    .event-test-btn.active {
      background-color: var(--accent-color);
    }
    
    .help-text {
      font-size: 0.8rem;
      color: #777;
    }
    
    .selection-mode {
      cursor: crosshair;
    }
  `;
  document.head.appendChild(style);
  
  // Ajouter le panneau à la page
  document.querySelector('.main-container').appendChild(eventPanel);
  
  // Variables pour suivre l'état
  let activeEventType = null;
  let selectedElements = [];
  
  // Ajouter des événements aux boutons
  const eventButtons = eventPanel.querySelectorAll('.event-test-btn');
  eventButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Si le même bouton est cliqué, désactiver
      if (activeEventType === button.dataset.event) {
        activeEventType = null;
        document.body.classList.remove('selection-mode');
        eventButtons.forEach(btn => btn.classList.remove('active'));
        return;
      }
      
      // Activer le nouveau type d'événement
      activeEventType = button.dataset.event;
      document.body.classList.add('selection-mode');
      
      // Mettre à jour les classes active
      eventButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Réinitialiser la sélection
      selectedElements = [];
    });
  });
  
  // S'abonner aux clics sur la carte
  EventBus.subscribe('map:element:click', (data) => {
    if (!activeEventType || !document.body.classList.contains('selection-mode')) return;
    
    // Ajouter l'élément à la sélection
    if (!selectedElements.includes(data.elementId)) {
      selectedElements.push(data.elementId);
      
      // Mettre en évidence l'élément sélectionné
      const svgLayer = window.mapLoader.svgLayers[data.layerId];
      if (svgLayer) {
        const element = svgLayer.getElement().getElementById(data.elementId);
        if (element) {
          // Sauvegarder l'état original
          if (!element.dataset.origOpacity) {
            element.dataset.origOpacity = element.style.opacity || '1';
          }
          // Ajouter une mise en évidence
          element.style.opacity = '0.7';
        }
      }
      
      // Si au moins un élément est sélectionné, proposer de créer l'événement
      if (selectedElements.length === 1) {
        const createBtn = document.createElement('button');
        createBtn.className = 'create-test-event-btn';
        createBtn.textContent = 'Créer l\'événement';
        createBtn.style.marginTop = '10px';
        
        // Supprimer le bouton existant s'il y en a un
        const existingBtn = eventPanel.querySelector('.create-test-event-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
        
        createBtn.addEventListener('click', () => {
          // Créer l'événement
          if (window.eventManager) {
            const eventId = window.eventManager.addEvent(
              activeEventType,
              `Test ${activeEventType}`,
              data.layerId,
              selectedElements,
              { description: `Événement de test ${activeEventType}` }
            );
            
            // Activer immédiatement l'événement
            window.eventManager.activateEvent(eventId);
            
            // Réinitialiser l'interface
            activeEventType = null;
            selectedElements = [];
            document.body.classList.remove('selection-mode');
            eventButtons.forEach(btn => btn.classList.remove('active'));
            createBtn.remove();
            
            // Restaurer l'opacité des éléments
            const svgLayer = window.mapLoader.svgLayers[data.layerId];
            if (svgLayer) {
              const svgElement = svgLayer.getElement();
              if (svgElement) {
                document.querySelectorAll('[data-orig-opacity]').forEach(element => {
                  element.style.opacity = element.dataset.origOpacity;
                  delete element.dataset.origOpacity;
                });
              }
            }
          }
        });
        
        eventPanel.appendChild(createBtn);
      }
    }
  });
}