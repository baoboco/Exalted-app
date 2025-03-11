/**
 * Script principal d'initialisation pour la carte interactive de Nexus
 * Version corrigée pour résoudre les problèmes de chargement SVG
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Vérifier les dépendances critiques
    if (typeof L === 'undefined') {
      throw new Error("Leaflet n'est pas chargé!");
    }
    
    if (typeof EventBus === 'undefined') {
      throw new Error("EventBus n'est pas chargé!");
    }
    
    if (typeof MapLoader === 'undefined') {
      throw new Error("MapLoader n'est pas chargé!");
    }
    
    console.log("Initialisation de l'application...");
    
    // 1. Initialiser le chargeur de carte (dépendance de base)
    const mapLoader = new MapLoader('map-container');
    window.mapLoader = mapLoader; // Pour le débogage
    
    // Initialiser la carte avec des coordonnées adaptées
    await mapLoader.init({
      minZoom: -2,
      maxZoom: 4,
      initialView: [992.6665, 1494.6665],
      initialZoom: -1
    });
    
    console.log("Carte initialisée avec succès");
    
    // 2. Initialiser le gestionnaire d'authentification
    if (typeof AuthManager === 'undefined') {
      console.warn("AuthManager non disponible, création d'une instance par défaut");
      window.authManager = {
        currentUser: { id: 'guest', name: 'Invité', role: 'player' }
      };
      
      // Mettre à jour l'affichage de l'utilisateur
      document.getElementById('current-user-name').textContent = 'Invité';
      document.getElementById('current-user-role').textContent = '(Joueur)';
    }
    
    // 3. Initialiser les gestionnaires principaux
    let layerManager;
    if (typeof LayerManager !== 'undefined') {
      layerManager = new LayerManager(mapLoader);
      window.layerManager = layerManager;
    } else {
      console.warn("LayerManager non disponible");
      throw new Error("LayerManager est requis pour l'application");
    }
    
    let interactionManager;
    if (typeof InteractionManager !== 'undefined') {
      interactionManager = new InteractionManager(mapLoader);
      window.interactionManager = interactionManager;
    } else {
      console.warn("InteractionManager non disponible");
      throw new Error("InteractionManager est requis pour l'application");
    }
    
    // 4. Ajouter les couches de façon asynchrone avec gestion d'erreurs
    if (layerManager) {
      try {
        console.log("Tentative de chargement de la couche principale...");
        await layerManager.addLayer('main', 'Surface', 'map/nexus-main.svg');
        console.log("Couche principale chargée avec succès");
      } catch (error) {
        console.error("Erreur lors du chargement de la couche principale:", error);
        // Essayer avec un chemin alternatif
        try {
          console.log("Tentative avec un chemin alternatif...");
          await layerManager.addLayer('main', 'Surface', './map/nexus-main.svg');
        } catch (fallbackError) {
          console.error("Erreur avec le chemin alternatif:", fallbackError);
          alert("Impossible de charger la carte principale. Vérifiez que le fichier SVG existe.");
        }
      }
      
      try {
        console.log("Tentative de chargement de la couche souterraine...");
        await layerManager.addLayer('underground', 'Souterrains', 'map/nexus-underground.svg');
        console.log("Couche souterraine chargée avec succès");
      } catch (error) {
        console.error("Erreur lors du chargement de la couche souterraine:", error);
        // Ne pas afficher d'alerte ici car cette couche est secondaire
      }
      
      // Mettre à jour le sélecteur de couches dans l'interface
      const layerSelector = document.getElementById('layer-selector');
      if (layerSelector) {
        layerSelector.addEventListener('change', (e) => {
          layerManager.activateLayer(e.target.value);
        });
      }
    }
    
    // 5. Initialiser le gestionnaire d'événements
    let eventManager;
    if (typeof EventManager !== 'undefined') {
      eventManager = new EventManager(mapLoader);
      window.eventManager = eventManager;
      
      // Charger les événements existants
      if (typeof eventManager.loadEventsFromStorage === 'function') {
        eventManager.loadEventsFromStorage();
      }
    } else {
      console.warn("EventManager non disponible");
    }
    
    // 6. Initialiser les outils spécifiques aux rôles
    const currentUser = window.authManager?.currentUser || { role: 'player' };
    
    // Pour le MJ
    if (currentUser.role === 'gm') {
      if (typeof GMTools !== 'undefined') {
        const gmTools = new GMTools(mapLoader, layerManager, eventManager);
        window.gmTools = gmTools;
        document.body.classList.add('gm-view');
      } else {
        console.warn("GMTools non disponible");
      }
    } else {
      // Pour les joueurs
      if (typeof PlayerTools !== 'undefined') {
        const playerTools = new PlayerTools(mapLoader);
        window.playerTools = playerTools;
        document.body.classList.add('player-view');
      } else {
        console.warn("PlayerTools non disponible");
      }
    }
    
    // 7. Enregistrer les outils
    if (interactionManager) {
      if (typeof MarkerTool !== 'undefined') {
        interactionManager.registerTool('marker', new MarkerTool(mapLoader));
      } else {
        console.warn("MarkerTool non disponible");
      }
      
      if (typeof NoteTool !== 'undefined') {
        interactionManager.registerTool('note', new NoteTool(mapLoader));
      } else {
        console.warn("NoteTool non disponible");
      }
      
      // Configurer les boutons d'outils de l'interface
      const toolButtons = document.querySelectorAll('.tool-btn');
      toolButtons.forEach(button => {
        button.addEventListener('click', () => {
          const toolId = button.dataset.tool;
          
          // Supprimer la classe active
          toolButtons.forEach(btn => btn.classList.remove('active'));
          
          // Ajouter la classe active au bouton sélectionné
          button.classList.add('active');
          
          // Activer l'outil
          interactionManager.activateTool(toolId);
        });
      });
    }
    
    // 8. Activer la couche principale avec meilleure gestion d'erreurs
    if (layerManager) {
      try {
        console.log("Activation de la couche principale...");
        await layerManager.activateLayer('main');
        console.log("Couche principale activée avec succès");
      } catch (error) {
        console.error("Erreur lors de l'activation de la couche principale:", error);
        
        // Essayer d'activer une autre couche si disponible
        const layers = Object.keys(mapLoader.svgLayers || {});
        if (layers.length > 0) {
          console.log(`Tentative d'activation de la couche disponible: ${layers[0]}`);
          try {
            await layerManager.activateLayer(layers[0]);
          } catch (fallbackError) {
            console.error("Erreur lors de l'activation de la couche alternative:", fallbackError);
          }
        }
      }
    }
    
    // 9. Initialiser le panneau d'informations
    initInfoPanel();
    
    // 10. Initialiser les modales
    initModals();
    
    console.log("Application initialisée avec succès");
    
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    alert(`Erreur lors de l'initialisation de l'application: ${error.message}`);
  }
});

/**
 * Initialise le panneau d'informations
 */
function initInfoPanel() {
  const infoPanel = document.getElementById('info-panel');
  const closePanelBtn = document.getElementById('close-info-panel-btn');
  
  if (infoPanel && closePanelBtn) {
    closePanelBtn.addEventListener('click', () => {
      infoPanel.classList.remove('visible');
    });
    
    // S'abonner aux événements pour afficher les informations
    EventBus.subscribe('show:element:info', (data) => {
      showElementInfo(data.elementId, data.layerId, data.title, data.content);
    });
  }
}

/**
 * Affiche des informations dans le panneau latéral
 * @param {string} elementId - ID de l'élément
 * @param {string} layerId - ID de la couche
 * @param {string} title - Titre à afficher
 * @param {string} content - Contenu HTML
 */
function showElementInfo(elementId, layerId, title, content) {
  const infoPanel = document.getElementById('info-panel');
  const panelTitle = document.getElementById('info-panel-title');
  const panelContent = document.getElementById('info-panel-content');
  
  if (infoPanel && panelTitle && panelContent) {
    panelTitle.textContent = title || `Information: ${elementId}`;
    panelContent.innerHTML = content || 'Aucune information disponible.';
    
    // Ajouter des attributs pour le suivi
    infoPanel.dataset.elementId = elementId;
    infoPanel.dataset.layerId = layerId;
    
    // Afficher le panneau
    infoPanel.classList.add('visible');
  }
}

/**
 * Initialise les modales
 */
function initModals() {
  // Trouver toutes les modales
  const modals = document.querySelectorAll('.modal');
  
  // Initialiser chaque modale
  modals.forEach(modal => {
    // Trouver les boutons de fermeture
    const closeButtons = modal.querySelectorAll('.close-modal-btn, .cancel-btn');
    
    // Ajouter les écouteurs d'événements pour fermer la modale
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    });
    
    // Fermer la modale lors d'un clic à l'extérieur
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // S'abonner aux événements pour ouvrir les modales
  EventBus.subscribe('show:modal', (data) => {
    const modal = document.getElementById(data.modalId);
    if (modal) {
      // Mettre à jour le contenu si nécessaire
      if (data.title) {
        const header = modal.querySelector('.modal-header h3');
        if (header) header.textContent = data.title;
      }
      
      // Autres mises à jour spécifiques à chaque modale
      updateModalContent(modal, data);
      
      // Afficher la modale
      modal.style.display = 'block';
    }
  });
}

/**
 * Met à jour le contenu d'une modale en fonction des données
 * @param {HTMLElement} modal - Élément de la modale
 * @param {object} data - Données pour la modale
 */
function updateModalContent(modal, data) {
  switch (modal.id) {
    case 'marker-modal':
      updateMarkerModal(modal, data);
      break;
    case 'event-modal':
      updateEventModal(modal, data);
      break;
    case 'note-modal':
      updateNoteModal(modal, data);
      break;
  }
}

/**
 * Met à jour le contenu de la modale de marqueur
 * @param {HTMLElement} modal - Élément de la modale
 * @param {object} data - Données pour la modale
 */
function updateMarkerModal(modal, data) {
  // Mettre à jour les champs du formulaire
  if (data.marker) {
    modal.querySelector('#marker-name').value = data.marker.name || '';
    modal.querySelector('#marker-description').value = data.marker.description || '';
    
    const iconSelect = modal.querySelector('#marker-icon');
    if (iconSelect && data.marker.icon) {
      iconSelect.value = data.marker.icon;
      updateSelectedIcon(iconSelect);
    }
    
    const visibilitySelect = modal.querySelector('#marker-visibility');
    if (visibilitySelect && data.marker.visibility) {
      visibilitySelect.value = data.marker.visibility;
    }
  } else {
    // Réinitialiser le formulaire pour un nouveau marqueur
    modal.querySelector('#marker-form').reset();
  }
  
  // Configurer le bouton de soumission
  const form = modal.querySelector('#marker-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const markerData = {
      name: modal.querySelector('#marker-name').value,
      description: modal.querySelector('#marker-description').value,
      icon: modal.querySelector('#marker-icon').value,
      visibility: modal.querySelector('#marker-visibility').value,
      elementId: data.elementId,
      layerId: data.layerId
    };
    
    // Publier l'événement de sauvegarde
    EventBus.publish('marker:save', markerData);
    modal.style.display = 'none';
  };
}

/**
 * Met à jour la prévisualisation de l'icône sélectionnée
 * @param {HTMLSelectElement} selectElement - Élément select pour l'icône
 */
function updateSelectedIcon(selectElement) {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const iconId = selectedOption.dataset.icon;
  const preview = selectElement.parentElement.querySelector('.selected-icon-preview svg use');
  
  if (preview && iconId) {
    preview.setAttribute('href', iconId);
  }
}

/**
 * Met à jour le contenu de la modale d'événement
 * @param {HTMLElement} modal - Élément de la modale
 * @param {object} data - Données pour la modale
 */
function updateEventModal(modal, data) {
  // Mise à jour similaire à updateMarkerModal
  if (data.event) {
    modal.querySelector('#event-name').value = data.event.name || '';
    modal.querySelector('#event-description').value = data.event.description || '';
    
    const typeSelect = modal.querySelector('#event-type');
    if (typeSelect && data.event.type) {
      typeSelect.value = data.event.type;
    }
    
    // Mettre à jour les zones sélectionnées
    const selectedAreasContainer = modal.querySelector('#selected-areas');
    if (selectedAreasContainer && data.event.areas) {
      selectedAreasContainer.innerHTML = '';
      
      data.event.areas.forEach(area => {
        const areaItem = document.createElement('div');
        areaItem.className = 'selected-item';
        areaItem.dataset.areaId = area;
        areaItem.innerHTML = `
          ${area}
          <span class="remove-item" data-area-id="${area}">×</span>
        `;
        selectedAreasContainer.appendChild(areaItem);
      });
      
      // Ajouter les écouteurs d'événements pour supprimer les zones
      selectedAreasContainer.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
          const areaId = button.dataset.areaId;
          button.parentElement.remove();
          
          // Publier l'événement de suppression de zone
          EventBus.publish('event:area:removed', { areaId });
        });
      });
    }
  } else {
    // Réinitialiser le formulaire pour un nouvel événement
    modal.querySelector('#event-form').reset();
    modal.querySelector('#selected-areas').innerHTML = '';
  }
  
  // Configurer le bouton de soumission
  const form = modal.querySelector('#event-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    
    // Récupérer les zones sélectionnées
    const selectedAreas = Array.from(
      modal.querySelectorAll('#selected-areas .selected-item')
    ).map(item => item.dataset.areaId);
    
    const eventData = {
      name: modal.querySelector('#event-name').value,
      description: modal.querySelector('#event-description').value,
      type: modal.querySelector('#event-type').value,
      areas: selectedAreas,
      id: data.event ? data.event.id : null
    };
    
    // Publier l'événement de sauvegarde
    EventBus.publish('event:save', eventData);
    modal.style.display = 'none';
  };
}

/**
 * Met à jour le contenu de la modale de note
 * @param {HTMLElement} modal - Élément de la modale
 * @param {object} data - Données pour la modale
 */
function updateNoteModal(modal, data) {
  if (data.note) {
    modal.querySelector('#note-content').value = data.note.content || '';
    
    const visibilitySelect = modal.querySelector('#note-visibility');
    if (visibilitySelect && data.note.visibility) {
      visibilitySelect.value = data.note.visibility;
    }
  } else {
    // Réinitialiser le formulaire pour une nouvelle note
    modal.querySelector('#note-form').reset();
  }
  
  // Configurer le bouton de soumission
  const form = modal.querySelector('#note-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const noteData = {
      content: modal.querySelector('#note-content').value,
      visibility: modal.querySelector('#note-visibility').value,
      elementId: data.elementId,
      layerId: data.layerId,
      id: data.note ? data.note.id : null
    };
    
    // Publier l'événement de sauvegarde
    EventBus.publish('note:save', noteData);
    modal.style.display = 'none';
  };
  
  // Configurer le bouton de suppression si c'est une note existante
  const deleteButton = modal.querySelector('.delete-btn');
  if (deleteButton) {
    if (data.note && data.note.id) {
      deleteButton.style.display = 'inline-block';
      deleteButton.onclick = () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
          EventBus.publish('note:delete', {
            id: data.note.id,
            elementId: data.elementId,
            layerId: data.layerId
          });
          modal.style.display = 'none';
        }
      };
    } else {
      deleteButton.style.display = 'none';
    }
  }
}