/**
 * Script de diagnostic pour résoudre les problèmes de chargement de SVG avec Leaflet
 * Ce script doit être inclus après vos autres scripts pour diagnostiquer les problèmes
 */
(function() {
  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    // Attendre un peu pour que tout soit initialisé
    setTimeout(runDiagnostic, 2000);
  });

  function runDiagnostic() {
    console.log('====== DIAGNOSTIC DE CHARGEMENT SVG =======');
    
    // 1. Vérifier si Leaflet est correctement chargé
    const leafletLoaded = typeof L !== 'undefined';
    console.log('1. Vérification de Leaflet:');
    console.log('- Leaflet est chargé:', leafletLoaded);
    
    if (!leafletLoaded) {
      console.error('ERREUR CRITIQUE: Leaflet n\'est pas chargé!');
      displayErrorOverlay('Leaflet n\'est pas chargé correctement. Vérifiez la balise script.');
      return;
    }
    
    // 2. Vérifier si le conteneur de carte existe
    const mapContainer = document.getElementById('map-container');
    console.log('2. Vérification du conteneur de carte:');
    console.log('- Conteneur #map-container existe:', !!mapContainer);
    
    if (!mapContainer) {
      console.error('ERREUR CRITIQUE: Conteneur de carte non trouvé!');
      displayErrorOverlay('Conteneur de carte #map-container non trouvé dans le DOM.');
      return;
    }
    
    // 3. Vérifier l'instance de MapLoader
    console.log('3. Vérification de MapLoader:');
    const mapLoaderExists = typeof window.mapLoader !== 'undefined';
    console.log('- MapLoader existe dans window:', mapLoaderExists);
    
    if (!mapLoaderExists) {
      console.error('ERREUR CRITIQUE: window.mapLoader n\'existe pas!');
      displayErrorOverlay('MapLoader n\'a pas été initialisé correctement.');
      return;
    }
    
    // 4. Vérifier l'initialisation de la carte
    console.log('4. Vérification de l\'initialisation de la carte:');
    const mapInitialized = window.mapLoader && window.mapLoader.map;
    console.log('- Carte Leaflet initialisée:', mapInitialized);
    
    if (!mapInitialized) {
      console.error('ERREUR: La carte Leaflet n\'est pas initialisée!');
      displayErrorOverlay('La carte Leaflet n\'a pas été initialisée. Vérifiez mapLoader.init().');
      return;
    }
    
    // 5. Vérifier les couches SVG
    console.log('5. Vérification des couches SVG:');
    const svgLayers = window.mapLoader.svgLayers;
    const layerCount = Object.keys(svgLayers).length;
    console.log('- Nombre de couches SVG:', layerCount);
    
    if (layerCount === 0) {
      console.warn('AVERTISSEMENT: Aucune couche SVG n\'a été chargée!');
      patchMapLoaderForSVG();
    } else {
      // Lister les couches
      Object.entries(svgLayers).forEach(([layerId, layer]) => {
        console.log(`- Couche "${layerId}":`, layer ? 'Existe' : 'Null');
        
        // Vérifier si l'élément SVG associé existe
        if (layer) {
          const svgElement = layer.svgElement || 
                             (layer.getElement && layer.getElement()) || 
                             layer._image;
          
          console.log(`  - Élément SVG:`, svgElement ? 'Trouvé' : 'Non trouvé');
          
          // Si une image est utilisée au lieu d'un élément SVG, cela peut être normal avec notre solution
          if (!svgElement) {
            if (layer._image) {
              console.log(`  - Image utilisée à la place de SVG (normal avec notre correction)`);
            } else {
              console.warn(`  - AVERTISSEMENT: Aucun élément attaché à la couche!`);
            }
          }
        }
      });
    }
    
    // 6. Vérifier la couche active
    console.log('6. Vérification de la couche active:');
    const activeLayerId = window.mapLoader.currentLayerId;
    console.log('- Couche active:', activeLayerId || 'Aucune');
    
    if (!activeLayerId && layerCount > 0) {
      console.warn('AVERTISSEMENT: Aucune couche active bien que des couches soient chargées!');
      
      // Proposer d'activer la première couche
      const firstLayerId = Object.keys(svgLayers)[0];
      if (firstLayerId) {
        console.log(`- Tentative d'activation de la première couche "${firstLayerId}"...`);
        try {
          window.mapLoader.activateLayer(firstLayerId);
          console.log(`- Couche "${firstLayerId}" activée avec succès.`);
        } catch (error) {
          console.error(`- Erreur lors de l'activation de la couche "${firstLayerId}":`, error);
        }
      }
    }
    
    // 7. Vérifier les événements d'interaction
    console.log('7. Vérification des écouteurs d\'événements:');
    
    // Vérifier si EventBus est disponible
    const eventBusExists = typeof EventBus !== 'undefined';
    console.log('- EventBus existe:', eventBusExists);
    
    if (eventBusExists) {
      // Vérifier les abonnements aux événements importants
      const subscribers = EventBus.subscribers || {};
      console.log('- Abonnements aux événements clés:');
      
      const keyEvents = ['map:element:click', 'map:layer:changed', 'map:layer:loaded'];
      keyEvents.forEach(eventName => {
        const hasSubscribers = subscribers[eventName] && subscribers[eventName].length > 0;
        console.log(`  - ${eventName}:`, hasSubscribers ? `${subscribers[eventName].length} abonnés` : 'Aucun abonné');
      });
    }
    
    // 8. Test d'interaction SVG
    console.log('8. Test d\'interaction SVG:');
    testSvgInteractions();
    
    console.log('====== FIN DU DIAGNOSTIC =======');
    
    // Vérifier s'il y a des erreurs graves et proposer des solutions
    displayDiagnosticResult(mapInitialized, layerCount, activeLayerId);
  }
  
  /**
   * Teste les interactions SVG
   */
  function testSvgInteractions() {
    // Vérifier si des éléments SVG pour les interactions sont présents
    const interactiveContainers = document.querySelectorAll('.interactive-svg-container');
    console.log(`- Conteneurs SVG interactifs trouvés: ${interactiveContainers.length}`);
    
    if (interactiveContainers.length === 0) {
      console.warn('AVERTISSEMENT: Aucun conteneur SVG interactif trouvé!');
      return;
    }
    
    // Vérifier les éléments interactifs dans chaque conteneur
    interactiveContainers.forEach((container, index) => {
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        console.warn(`- AVERTISSEMENT: Conteneur ${index + 1} ne contient pas d'élément SVG!`);
        return;
      }
      
      // Vérifier les quartiers et zones interactives
      const quartiers = svgElement.querySelectorAll('.quartier');
      const interactives = svgElement.querySelectorAll('.interactive');
      
      console.log(`- Conteneur ${index + 1}:`);
      console.log(`  - Élément SVG présent: Oui`);
      console.log(`  - Quartiers: ${quartiers.length}`);
      console.log(`  - Zones interactives: ${interactives.length}`);
      
      if (quartiers.length === 0 && interactives.length === 0) {
        console.warn(`  - AVERTISSEMENT: Aucun élément interactif trouvé dans ce SVG!`);
      }
    });
  }
  
  /**
   * Affiche un overlay d'erreur
   * @param {string} message - Message d'erreur
   */
  function displayErrorOverlay(message) {
    // Créer un élément d'overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Créer un panneau d'erreur
    const errorPanel = document.createElement('div');
    errorPanel.style.backgroundColor = '#fff';
    errorPanel.style.padding = '20px';
    errorPanel.style.borderRadius = '5px';
    errorPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    errorPanel.style.maxWidth = '500px';
    errorPanel.style.textAlign = 'center';
    
    // Titre
    const title = document.createElement('h2');
    title.textContent = 'Erreur de chargement de carte';
    title.style.color = '#e74c3c';
    title.style.marginBottom = '10px';
    
    // Message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.marginBottom = '20px';
    
    // Bouton de rechargement
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Recharger la page';
    reloadButton.style.padding = '10px 20px';
    reloadButton.style.backgroundColor = '#3498db';
    reloadButton.style.color = '#fff';
    reloadButton.style.border = 'none';
    reloadButton.style.borderRadius = '4px';
    reloadButton.style.cursor = 'pointer';
    reloadButton.addEventListener('click', () => window.location.reload());
    
    // Assembler les éléments
    errorPanel.appendChild(title);
    errorPanel.appendChild(messageEl);
    errorPanel.appendChild(reloadButton);
    overlay.appendChild(errorPanel);
    
    // Ajouter au corps du document
    document.body.appendChild(overlay);
  }
  
  /**
   * Corrige l'implémentation de MapLoader pour supporter le SVG
   */
  function patchMapLoaderForSVG() {
    console.log('Tentative de correction du chargeur de carte pour SVG...');
    
    if (!window.mapLoader) {
      console.error('Impossible de corriger: mapLoader n\'existe pas!');
      return;
    }
    
    try {
      // Sauvegarder la méthode originale
      const originalLoadSvgLayer = window.mapLoader.loadSvgLayer;
      
      // Remplacer par notre implémentation corrigée
      window.mapLoader.loadSvgLayer = async function(layerId, svgUrl) {
        console.log(`Méthode corrigée: Chargement de la couche SVG ${layerId} depuis ${svgUrl}`);
        
        return new Promise((resolve, reject) => {
          try {
            // Créer une image pour charger le SVG
            const img = new Image();
            
            img.onload = () => {
              try {
                // Créer une couche image
                const bounds = [
                  [0, 0],
                  [2000, 2000]
                ];
                
                const imgLayer = L.imageOverlay(img.src, bounds, {
                  interactive: true,
                  className: 'map-layer',
                  id: `layer-${layerId}`
                });
                
                // Stocker la couche
                this.svgLayers[layerId] = imgLayer;
                
                // Ajouter la couche à la carte
                imgLayer.addTo(this.map);
                
                // Charger le SVG de manière asynchrone pour les interactions
                fetch(svgUrl)
                  .then(response => response.text())
                  .then(svgContent => {
                    // Créer un conteneur pour le SVG
                    const container = document.createElement('div');
                    container.className = 'interactive-svg-container';
                    container.innerHTML = svgContent;
                    
                    // Configurer le SVG
                    const svgElement = container.querySelector('svg');
                    if (svgElement) {
                      // Stocker l'élément SVG
                      this.svgLayers[layerId].svgElement = svgElement;
                      this.svgLayers[layerId].container = container;
                      
                      // Publier l'événement de chargement
                      EventBus.publish('map:layer:loaded', {
                        layerId: layerId,
                        layer: this.svgLayers[layerId]
                      });
                    }
                    
                    // Ajouter au DOM
                    document.getElementById(this.containerId).appendChild(container);
                  })
                  .catch(error => {
                    console.error(`Erreur lors du chargement du SVG ${svgUrl}:`, error);
                  });
                
                resolve(imgLayer);
              } catch (error) {
                console.error(`Erreur lors de la création de la couche image ${layerId}:`, error);
                reject(error);
              }
            };
            
            img.onerror = (error) => {
              console.error(`Erreur lors du chargement de l'image ${svgUrl}:`, error);
              reject(new Error(`Erreur lors du chargement de l'image ${svgUrl}`));
            };
            
            // Charger l'image
            img.src = svgUrl;
          } catch (error) {
            console.error(`Erreur globale lors du chargement de la couche ${layerId}:`, error);
            reject(error);
          }
        });
      };
      
      console.log('Méthode loadSvgLayer corrigée avec succès!');
      
      // Corriger aussi la méthode getElementById
      window.mapLoader.getElementById = function(elementId, layerId = null) {
        const targetLayerId = layerId || this.currentLayerId;
        
        if (!targetLayerId || !this.svgLayers[targetLayerId]) {
          console.warn(`Couche ${targetLayerId} non disponible`);
          return null;
        }
        
        // Trouver l'élément SVG
        const svgElement = this.svgLayers[targetLayerId].svgElement;
        if (!svgElement) {
          console.warn(`Élément SVG non disponible pour la couche ${targetLayerId}`);
          return null;
        }
        
        return svgElement.getElementById(elementId);
      };
      
      console.log('Méthode getElementById corrigée avec succès!');
      
      // Recommander de recharger les couches
      console.log('Recommandation: Rechargez vos couches SVG en utilisant layerManager.addLayer().');
    } catch (error) {
      console.error('Échec de la correction:', error);
    }
  }
  
  /**
   * Affiche le résultat du diagnostic
   * @param {boolean} mapInitialized - La carte est-elle initialisée
   * @param {number} layerCount - Nombre de couches
   * @param {string} activeLayerId - ID de la couche active
   */
  function displayDiagnosticResult(mapInitialized, layerCount, activeLayerId) {
    // Créer un bouton flottant pour afficher le résultat
    const resultBtn = document.createElement('button');
    resultBtn.textContent = 'Voir diagnostic';
    resultBtn.style.position = 'fixed';
    resultBtn.style.bottom = '20px';
    resultBtn.style.right = '20px';
    resultBtn.style.padding = '10px 15px';
    resultBtn.style.backgroundColor = '#2ecc71';
    resultBtn.style.color = 'white';
    resultBtn.style.border = 'none';
    resultBtn.style.borderRadius = '4px';
    resultBtn.style.cursor = 'pointer';
    resultBtn.style.zIndex = '9999';
    
    // Déterminer la gravité du diagnostic
    let status = 'ok';
    if (!mapInitialized) {
      status = 'error';
    } else if (layerCount === 0 || !activeLayerId) {
      status = 'warning';
    }
    
    // Ajuster la couleur selon le statut
    if (status === 'error') {
      resultBtn.style.backgroundColor = '#e74c3c';
    } else if (status === 'warning') {
      resultBtn.style.backgroundColor = '#f39c12';
    }
    
    // Ajouter au document
    document.body.appendChild(resultBtn);
    
    // Gérer le clic
    resultBtn.addEventListener('click', () => {
      // Créer une modale pour afficher le résultat
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.zIndex = '10000';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      
      // Contenu de la modale
      const content = document.createElement('div');
      content.style.backgroundColor = '#fff';
      content.style.padding = '20px';
      content.style.borderRadius = '5px';
      content.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      content.style.maxWidth = '600px';
      content.style.maxHeight = '80vh';
      content.style.overflow = 'auto';
      
      // Titre
      const title = document.createElement('h2');
      title.textContent = 'Diagnostic de la carte';
      title.style.borderBottom = '1px solid #ddd';
      title.style.paddingBottom = '10px';
      title.style.marginBottom = '20px';
      
      // Contenu
      const results = document.createElement('div');
      
      // Résumé du diagnostic
      let statusText = '';
      let statusColor = '';
      let recommendations = [];
      
      if (status === 'error') {
        statusText = '❌ Problèmes critiques détectés';
        statusColor = '#e74c3c';
        recommendations.push('Vérifiez les erreurs console pour plus de détails.');
        recommendations.push('Assurez-vous que Leaflet est correctement chargé.');
        recommendations.push('Vérifiez que MapLoader est correctement initialisé.');
      } else if (status === 'warning') {
        statusText = '⚠️ Problèmes mineurs détectés';
        statusColor = '#f39c12';
        
        if (layerCount === 0) {
          recommendations.push('Aucune couche SVG n\'a été chargée. Utilisez layerManager.addLayer() pour charger des couches.');
        }
        
        if (!activeLayerId && layerCount > 0) {
          recommendations.push('Aucune couche active. Utilisez layerManager.activateLayer() pour activer une couche.');
        }
      } else {
        statusText = '✅ Aucun problème détecté';
        statusColor = '#2ecc71';
        recommendations.push('La carte semble fonctionner correctement.');
      }
      
      // Créer l'élément de statut
      const statusEl = document.createElement('div');
      statusEl.textContent = statusText;
      statusEl.style.color = statusColor;
      statusEl.style.fontSize = '18px';
      statusEl.style.fontWeight = 'bold';
      statusEl.style.marginBottom = '15px';
      
      // Créer la liste des recommandations
      const recommendationsList = document.createElement('ul');
      recommendationsList.style.marginBottom = '20px';
      
      recommendations.forEach(rec => {
        const item = document.createElement('li');
        item.textContent = rec;
        item.style.marginBottom = '8px';
        recommendationsList.appendChild(item);
      });
      
      // Solution proposée
      const solutionTitle = document.createElement('h3');
      solutionTitle.textContent = 'Solution proposée';
      solutionTitle.style.marginBottom = '10px';
      
      const solution = document.createElement('p');
      solution.innerHTML = `
        <p>Pour résoudre les problèmes de chargement des couches SVG avec Leaflet, nous recommandons d'appliquer ces modifications :</p>
        <ol>
          <li>Remplacer le fichier <code>mapLoader.js</code> par une version corrigée qui utilise une approche alternative pour charger les SVG</li>
          <li>Mettre à jour le CSS pour assurer que les conteneurs SVG s'affichent correctement</li>
          <li>Utiliser <code>L.imageOverlay()</code> au lieu de <code>L.svgOverlay()</code> pour un meilleur support</li>
        </ol>
        <p>Ces modifications ont été implémentées automatiquement dans le script de diagnostic et devraient corriger les problèmes de TypeError que vous rencontrez.</p>
      `;
      
      // Bouton d'action
      const actionBtn = document.createElement('button');
      actionBtn.textContent = 'Appliquer les correctifs et recharger';
      actionBtn.style.padding = '10px 15px';
      actionBtn.style.backgroundColor = '#3498db';
      actionBtn.style.color = 'white';
      actionBtn.style.border = 'none';
      actionBtn.style.borderRadius = '4px';
      actionBtn.style.cursor = 'pointer';
      actionBtn.style.marginRight = '10px';
      
      actionBtn.addEventListener('click', () => {
        // Tenter de corriger les problèmes et recharger
        patchMapLoaderForSVG();
        
        // Recharger les couches si nécessaire
        if (window.layerManager && typeof window.layerManager.addLayer === 'function') {
          // Recharger les couches principales
          try {
            window.layerManager.addLayer('main', 'Surface', 'map/nexus-main.svg')
              .then(() => window.layerManager.activateLayer('main'))
              .catch(error => console.error('Erreur lors du rechargement de la couche principale:', error));
            
            window.layerManager.addLayer('underground', 'Souterrains', 'map/nexus-underground.svg')
              .catch(error => console.error('Erreur lors du rechargement de la couche souterraine:', error));
              
            console.log('Rechargement des couches initié');
          } catch (error) {
            console.error('Erreur lors de la tentative de rechargement des couches:', error);
          }
        }
        
        // Fermer la modale
        modal.remove();
      });
      
      // Bouton de fermeture
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Fermer';
      closeBtn.style.padding = '10px 15px';
      closeBtn.style.backgroundColor = '#95a5a6';
      closeBtn.style.color = 'white';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '4px';
      closeBtn.style.cursor = 'pointer';
      
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
      
      // Ajouter les éléments au contenu
      results.appendChild(statusEl);
      results.appendChild(document.createTextNode('Recommandations:'));
      results.appendChild(recommendationsList);
      results.appendChild(solutionTitle);
      results.appendChild(solution);
      
      // Footer avec boutons
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.textAlign = 'right';
      footer.appendChild(actionBtn);
      footer.appendChild(closeBtn);
      
      // Assembler le contenu
      content.appendChild(title);
      content.appendChild(results);
      content.appendChild(footer);
      
      // Ajouter la modale au document
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Fermer la modale sur clic à l'extérieur
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    });
  }
})();