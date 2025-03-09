/* Script de diagnostic pour l'outil marqueur */
// Ce script peut être placé à la fin de votre fichier main.js ou dans un fichier séparé

(function DiagnosticTool() {
  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    // Attendre un peu pour que tout soit initialisé
    setTimeout(runDiagnostic, 2000);
  });

  function runDiagnostic() {
    console.log('======= DIAGNOSTIC DE L\'OUTIL MARQUEUR =======');
    
    // 1. Vérifier les objets principaux
    console.log('1. Vérification des objets principaux:');
    console.log('- mapLoader existe:', !!window.mapLoader);
    console.log('- interactionManager existe:', !!window.interactionManager);
    
    // 2. Vérifier l'outil marqueur
    let markerTool = null;
    if (window.interactionManager && window.interactionManager.tools) {
      markerTool = window.interactionManager.tools.marker;
      console.log('- Outil marqueur existe:', !!markerTool);
      console.log('- Outil actif:', window.interactionManager.activeToolId);
    } else {
      console.log('- Impossible de vérifier l\'outil marqueur (interactionManager non disponible)');
    }
    
    // 3. Vérifier le modal de marqueur
    const markerModal = document.getElementById('marker-modal');
    const markerForm = document.getElementById('marker-form');
    console.log('2. Vérification du modal:');
    console.log('- Modal marqueur existe:', !!markerModal);
    console.log('- Formulaire marqueur existe:', !!markerForm);
    
    // 4. Tester l'ouverture du modal
    console.log('3. Test d\'ouverture du modal:');
    try {
      if (markerModal) {
        // Sauvegarder l'état actuel
        const wasActive = markerModal.classList.contains('active');
        
        // Essayer d'ouvrir le modal
        markerModal.classList.add('active');
        console.log('- Modal ouvert manuellement avec succès');
        
        // Attendre 2 secondes et fermer
        setTimeout(() => {
          if (!wasActive) {
            markerModal.classList.remove('active');
            console.log('- Modal fermé après le test');
          }
        }, 2000);
      } else {
        console.log('- Test d\'ouverture impossible (modal non trouvé)');
      }
    } catch (error) {
      console.error('- Erreur lors du test d\'ouverture:', error);
    }
    
    // 5. Diagnostiquer les gestionnaires d'événements
    console.log('4. Diagnostic des événements:');
    
    // Ajouter un écouteur de test sur le conteneur de carte
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      console.log('- Conteneur de carte trouvé');
      
      // Ajouter un écouteur temporaire
      const clickHandler = function(e) {
        console.log('- Clic sur la carte détecté à', e.clientX, e.clientY);
        console.log('- État de l\'outil marqueur actif:', markerTool ? markerTool.active : 'N/A');
        
        // Si l'outil marqueur existe, forcer l'ouverture du modal
        if (markerTool && markerModal) {
          try {
            console.log('- Tentative d\'ouverture du modal via l\'outil marqueur');
            markerTool.openMarkerCreationModal(null, window.mapLoader.currentLayerId, {
              x: e.clientX - mapContainer.getBoundingClientRect().left,
              y: e.clientY - mapContainer.getBoundingClientRect().top
            });
          } catch (error) {
            console.error('- Erreur lors de l\'ouverture du modal:', error);
            
            // Plan B: ouvrir directement le modal
            console.log('- Tentative d\'ouverture directe du modal');
            markerModal.classList.add('active');
          }
        }
      };
      
      // Ajouter l'écouteur temporairement (sera supprimé après 30 secondes)
      mapContainer.addEventListener('click', clickHandler);
      console.log('- Écouteur de diagnostic ajouté pour 30 secondes');
      
      // Supprimer l'écouteur après 30 secondes
      setTimeout(() => {
        mapContainer.removeEventListener('click', clickHandler);
        console.log('- Écouteur de diagnostic supprimé');
      }, 30000);
    } else {
      console.log('- Conteneur de carte non trouvé');
    }
    
    // 6. Débogage de l'outil MarkerTool
    if (markerTool) {
      console.log('5. Débogage de MarkerTool:');
      console.log('- handleElementClick existe:', typeof markerTool.handleElementClick === 'function');
      console.log('- openMarkerCreationModal existe:', typeof markerTool.openMarkerCreationModal === 'function');
      
      // Patcher la méthode pour ajouter des logs
      if (typeof markerTool.openMarkerCreationModal === 'function') {
        const originalMethod = markerTool.openMarkerCreationModal;
        markerTool.openMarkerCreationModal = function(elementId, layerId, position) {
          console.log('=> openMarkerCreationModal appelé avec:', { elementId, layerId, position });
          return originalMethod.call(this, elementId, layerId, position);
        };
        console.log('- Méthode openMarkerCreationModal patchée pour le débogage');
      }
      
      if (typeof markerTool.handleElementClick === 'function') {
        const originalMethod = markerTool.handleElementClick;
        markerTool.handleElementClick = function(elementId, layerId, event) {
          console.log('=> handleElementClick appelé avec:', { elementId, layerId });
          return originalMethod.call(this, elementId, layerId, event);
        };
        console.log('- Méthode handleElementClick patchée pour le débogage');
      }
    }
    
    console.log('======= FIN DU DIAGNOSTIC =======');
    console.log('Cliquez sur la carte pour tester l\'outil marqueur (diagnostics actifs pour 30 secondes)');
  }
})();
