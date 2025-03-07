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
  
  // Initialiser le chargeur de carte
  const mapLoader = new MapLoader('map-container');
  
  // Initialiser la carte
  mapLoader.init({
    minZoom: -2,
    maxZoom: 4,
    initialView: [0, 0],
    initialZoom: 0
  });
  
  // Initialiser le gestionnaire de couches
  const layerManager = new LayerManager(mapLoader);
  
  // Ajouter les couches
  // Remarque: Changement du chemin de 'maps/' à 'map/' pour correspondre à la structure du projet
  layerManager.addLayer('main', 'Surface', 'map/nexus-main.svg');
  layerManager.addLayer('underground', 'Souterrains', 'map/nexus-underground.svg');
  
  // Initialiser le gestionnaire d'interactions
  const interactionManager = new InteractionManager(mapLoader);
  
  // Enregistrer les outils
  interactionManager.registerTool('marker', new MarkerTool(mapLoader));
  
  // Enregistrer les utilisateurs de test
  UserManager.registerUser('gm', 'Maître de Jeu', 'gm');
  UserManager.registerUser('player1', 'Joueur 1', 'player');
  UserManager.registerUser('player2', 'Joueur 2', 'player');
  
  // Définir l'utilisateur actuel (MJ par défaut pour le développement)
  UserManager.setCurrentUser('gm');
  
  // Activer la couche principale par défaut
  layerManager.activateLayer('main');
  
  // Activer l'outil de marqueur par défaut
  interactionManager.activateTool('marker');
  
  // S'abonner aux événements de la carte
  EventBus.subscribe('map:element:click', function(data) {
    console.log('Élément cliqué:', data.elementId);
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