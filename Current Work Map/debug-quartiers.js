/**
 * Script de débogage pour les interactions des quartiers dans la carte de Nexus
 * Ajouter ce script à la fin de votre page pour diagnostiquer les problèmes de surbrillance
 */
(function() {
  // Attendre que tout soit chargé
  window.addEventListener('load', function() {
    // Laisser le temps à la carte de se charger
    setTimeout(initDebugTools, 2000);
  });

  function initDebugTools() {
    console.log('====== OUTILS DE DIAGNOSTIC POUR LES QUARTIERS ======');
    
    // Créer un bouton de débogage
    const debugButton = document.createElement('button');
    debugButton.textContent = '🔍 Mode Debug';
    debugButton.style.position = 'fixed';
    debugButton.style.top = '70px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '8px 12px';
    debugButton.style.backgroundColor = '#f44336';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';
    
    document.body.appendChild(debugButton);
    
    let debugMode = false;
    
    // Fonction de basculement du mode debug
    debugButton.addEventListener('click', () => {
      debugMode = !debugMode;
      document.body.classList.toggle('debug-mode', debugMode);
      debugButton.textContent = debugMode ? '🔍 Mode Normal' : '🔍 Mode Debug';
      debugButton.style.backgroundColor = debugMode ? '#4CAF50' : '#f44336';
      
      console.log(`Mode debug ${debugMode ? 'activé' : 'désactivé'}`);
      
      // Analyser la structure et afficher les informations
      if (debugMode) {
        analyzeQuartiers();
      }
    });
    
    // Fonction d'analyse des quartiers
    function analyzeQuartiers() {
      console.log("Analyse de la structure des quartiers et des zones invisibles...");
      
      // 1. Trouver tous les éléments invisibles et les quartiers
      const invElements = document.querySelectorAll('[id^="inv_"]');
      const quartiers = document.querySelectorAll('[id^="G"]');
      
      console.log(`Trouvé ${invElements.length} zones invisibles et ${quartiers.length} groupes potentiels de quartiers`);
      
      // 2. Analyser les zones invisibles
      invElements.forEach(inv => {
        console.log(`\nZone invisible: ${inv.id}`);
        console.log(`- TagName: ${inv.tagName}`);
        console.log(`- Classes: ${inv.className}`);
        console.log(`- Parent: ${inv.parentElement?.id || 'aucun'}`);
        
        // Chercher le quartier qui devrait être lié
        const quartierName = inv.id.substring(4); // Sans "inv_"
        console.log(`- Nom de quartier attendu: ${quartierName}`);
        
        // Vérifier différentes possibilités de nommage
        ['G' + quartierName, 
         'G' + quartierName.charAt(0).toUpperCase() + quartierName.slice(1),
         'G' + quartierName.toUpperCase()].forEach(possibleId => {
          const quartier = document.getElementById(possibleId);
          if (quartier) {
            console.log(`- Quartier trouvé par ID: ${possibleId}`);
            
            // Créer une relation explicite via dataset
            inv.dataset.debugLinkedQuartier = quartier.id;
            quartier.dataset.debugLinkedInvisible = inv.id;
            
            // Ajouter des événements de test
            addTestEvents(inv, quartier);
          }
        });
        
        // Vérifier l'effet des règles CSS
        testCSSSelectors(inv);
      });
      
      console.log("\nVérification de la compatibilité :has()...");
      testHasSelector();
      
      // Ajouter un outil pour tester manuellement l'effet de survol
      addHoverTool();
    }
    
    // Tester les sélecteurs CSS
    function testCSSSelectors(inv) {
      console.log(`\nTest des sélecteurs CSS pour ${inv.id}:`);
      
      // Tester différentes combinaisons de sélecteurs
      const selectors = [
        `#${inv.id}:hover ~ path`,
        `#${inv.id}:hover + path`,
        `g:has(#${inv.id}:hover) path`,
        `g:has(#${inv.id}:hover) > path`
      ];
      
      selectors.forEach(selector => {
        try {
          // Essayer de récupérer des éléments avec ce sélecteur statiquement
          // (sans le :hover qui ne peut être testé que réellement)
          const baseSelector = selector.replace(':hover', '');
          const elements = document.querySelectorAll(baseSelector);
          console.log(`- Sélecteur "${selector}": ${elements.length} éléments potentiels`);
        } catch (error) {
          console.error(`- Sélecteur "${selector}" non supporté:`, error.message);
        }
      });
    }
    
    // Tester le support du sélecteur :has()
    function testHasSelector() {
      try {
        document.querySelector('div:has(*)');
        console.log("✅ Le sélecteur :has() est supporté par ce navigateur");
      } catch (error) {
        console.error("❌ Le sélecteur :has() n'est PAS supporté par ce navigateur");
        console.log("Solution alternative nécessaire pour la surbrillance");
        
        // Ajouter une alerte visible
        const warningBox = document.createElement('div');
        warningBox.style.position = 'fixed';
        warningBox.style.bottom = '10px';
        warningBox.style.left = '10px';
        warningBox.style.backgroundColor = '#ff9800';
        warningBox.style.color = 'black';
        warningBox.style.padding = '10px';
        warningBox.style.borderRadius = '4px';
        warningBox.style.zIndex = '9999';
        warningBox.textContent = "Le sélecteur CSS :has() n'est pas supporté par ce navigateur. La surbrillance des quartiers pourrait ne pas fonctionner.";
        document.body.appendChild(warningBox);
        
        // Disparaître après 10 secondes
        setTimeout(() => {
          warningBox.style.opacity = '0';
          warningBox.style.transition = 'opacity 1s';
          setTimeout(() => warningBox.remove(), 1000);
        }, 10000);
      }
    }
    
    // Ajouter des événements de test pour voir les interactions
    function addTestEvents(invisibleElement, quartierElement) {
      // Enregistrer les événements de souris avec log
      invisibleElement.addEventListener('mouseenter', () => {
        if (debugMode) {
          console.log(`🖱️ Souris ENTRE sur ${invisibleElement.id}`);
          console.log(`👉 Devrait affecter: ${quartierElement.id}`);
          
          // Vérifier si la classe est ajoutée
          setTimeout(() => {
            if (quartierElement.classList.contains('quartier-hover')) {
              console.log(`✅ Classe 'quartier-hover' correctement ajoutée à ${quartierElement.id}`);
            } else {
              console.warn(`❌ Classe 'quartier-hover' NON ajoutée à ${quartierElement.id}`);
            }
          }, 50);
        }
      });
      
      invisibleElement.addEventListener('mouseleave', () => {
        if (debugMode) {
          console.log(`🖱️ Souris SORT de ${invisibleElement.id}`);
          
          // Vérifier si la classe est retirée
          setTimeout(() => {
            if (!quartierElement.classList.contains('quartier-hover')) {
              console.log(`✅ Classe 'quartier-hover' correctement retirée de ${quartierElement.id}`);
            } else {
              console.warn(`❌ Classe 'quartier-hover' NON retirée de ${quartierElement.id}`);
            }
          }, 50);
        }
      });
    }
    
    // Ajouter un outil pour tester manuellement l'effet de survol
    function addHoverTool() {
      // Créer un panel d'outils de test
      const toolPanel = document.createElement('div');
      toolPanel.style.position = 'fixed';
      toolPanel.style.top = '120px';
      toolPanel.style.right = '10px';
      toolPanel.style.backgroundColor = '#fff';
      toolPanel.style.padding = '10px';
      toolPanel.style.borderRadius = '4px';
      toolPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toolPanel.style.zIndex = '9998';
      toolPanel.style.maxWidth = '250px';
      toolPanel.style.display = 'none'; // Caché par défaut
      
      toolPanel.innerHTML = `
        <h3 style="margin-top:0;margin-bottom:10px;font-size:14px;">Outils de test de surbrillance</h3>
        <p style="font-size:12px;margin-bottom:10px;">Sélectionnez un quartier pour simuler un survol</p>
        <select id="debug-quartier-select" style="width:100%;margin-bottom:10px;"></select>
        <div>
          <button id="debug-hover-on" style="background:#4CAF50;color:white;border:none;padding:5px 10px;margin-right:5px;">Simuler Survol</button>
          <button id="debug-hover-off" style="background:#f44336;color:white;border:none;padding:5px 10px;">Arrêter Survol</button>
        </div>
      `;
      
      document.body.appendChild(toolPanel);
      
      // Afficher le panel quand le mode debug est activé
      const originalClick = debugButton.onclick;
      debugButton.onclick = function(e) {
        if (originalClick) originalClick.call(this, e);
        toolPanel.style.display = debugMode ? 'block' : 'none';
        
        // Remplir le sélecteur de quartiers si visible
        if (debugMode) {
          const selectEl = document.getElementById('debug-quartier-select');
          selectEl.innerHTML = '';
          
          // Ajouter tous les quartiers au sélecteur
          const quartiers = document.querySelectorAll('[id^="G"]:not(#GRues)');
          
          Array.from(quartiers).sort((a, b) => a.id.localeCompare(b.id)).forEach(quartier => {
            const option = document.createElement('option');
            option.value = quartier.id;
            option.textContent = quartier.id + (quartier.getAttribute('inkscapelabel') ? ` (${quartier.getAttribute('inkscapelabel')})` : '');
            selectEl.appendChild(option);
          });
        }
      };
      
      // Ajouter les événements pour les boutons de simulation
      document.getElementById('debug-hover-on').addEventListener('click', () => {
        const quartierId = document.getElementById('debug-quartier-select').value;
        if (!quartierId) return;
        
        const quartier = document.getElementById(quartierId);
        if (quartier) {
          // Simuler un survol en ajoutant la classe manuellement
          quartier.classList.add('quartier-hover');
          console.log(`Simulation de survol activée pour ${quartierId}`);
          
          // Essayer de trouver l'élément invisible associé
          const invId = quartier.dataset.linkedInvisible || quartier.dataset.debugLinkedInvisible;
          if (invId) {
            const inv = document.getElementById(invId);
            if (inv) {
              inv.classList.add('hover-simulated');
              console.log(`Élément invisible associé: ${invId}`);
            }
          }
        }
      });
      
      document.getElementById('debug-hover-off').addEventListener('click', () => {
        // Retirer toutes les simulations de survol
        document.querySelectorAll('.quartier-hover').forEach(el => {
          console.log(`Simulation de survol désactivée pour ${el.id}`);
          el.classList.remove('quartier-hover');
        });
        
        document.querySelectorAll('.hover-simulated').forEach(el => {
          el.classList.remove('hover-simulated');
        });
      });
    }
    
    // Ajouter des styles CSS pour le débogage
    function addDebugStyles() {
      const styleEl = document.createElement('style');
      styleEl.id = 'debug-quartiers-styles';
      styleEl.textContent = `
        /* Styles de débogage pour les quartiers */
        body.debug-mode [id^="inv_"] {
          fill: rgba(255, 0, 0, 0.2) !important;
          stroke: red;
          stroke-width: 1px;
          pointer-events: auto !important;
        }
        
        body.debug-mode .hover-simulated {
          fill: rgba(0, 255, 0, 0.3) !important;
          stroke: green;
          stroke-width: 2px;
        }
        
        body.debug-mode .quartier-hover path {
          filter: brightness(1.5) saturate(1.2) !important;
          stroke: rgba(255, 255, 255, 0.7) !important;
          stroke-width: 2px !important;
        }
        
        /* Styles pour les outils de débogage */
        #debug-quartier-select {
          padding: 5px;
          font-size: 12px;
        }
        
        #debug-hover-on, #debug-hover-off {
          cursor: pointer;
          font-size: 12px;
        }
      `;
      
      document.head.appendChild(styleEl);
    }
    
    // Analyser les règles CSS spécifiques
    function analyzeCSSRules() {
      console.log("\nVérification des règles CSS:");
      const cssIssues = [];
      
      try {
        // Parcourir les feuilles de style à la recherche des règles pertinentes
        let invHoverRules = 0;
        
        Array.from(document.styleSheets).forEach(sheet => {
          try {
            Array.from(sheet.cssRules).forEach(rule => {
              if (rule.selectorText && rule.selectorText.includes('[id^="inv_"]:hover')) {
                invHoverRules++;
                console.log(`Règle trouvée: ${rule.selectorText}`);
                console.log(`  ${rule.style.cssText}`);
              }
            });
          } catch (e) {
            // Ignorer les feuilles avec restrictions CORS
          }
        });
        
        if (invHoverRules === 0) {
          cssIssues.push("Aucune règle CSS pour [id^='inv_']:hover n'a été trouvée.");
        }
      } catch (error) {
        console.error("Erreur lors de l'analyse CSS:", error);
      }
      
      // Afficher les problèmes CSS si présents
      if (cssIssues.length > 0) {
        console.warn("⚠️ PROBLÈMES CSS DÉTECTÉS ⚠️");
        cssIssues.forEach(issue => console.warn(`- ${issue}`));
      }
    }
    
    // Ajouter une fonction pour tester manuellement l'application des règles CSS
    function testCSSRuleApplication() {
      const testButton = document.createElement('button');
      testButton.textContent = '🧪 Tester CSS';
      testButton.style.position = 'fixed';
      testButton.style.top = '280px';
      testButton.style.right = '10px';
      testButton.style.zIndex = '9999';
      testButton.style.padding = '8px 12px';
      testButton.style.backgroundColor = '#9C27B0';
      testButton.style.color = 'white';
      testButton.style.border = 'none';
      testButton.style.borderRadius = '4px';
      testButton.style.cursor = 'pointer';
      testButton.style.display = 'none'; // Caché par défaut
      
      document.body.appendChild(testButton);
      
      // Afficher lorsque le mode debug est activé
      const originalClick = debugButton.onclick;
      debugButton.onclick = function(e) {
        if (originalClick) originalClick.call(this, e);
        testButton.style.display = debugMode ? 'block' : 'none';
      };
      
      testButton.addEventListener('click', () => {
        console.log('===== TEST D\'APPLICATION DES RÈGLES CSS =====');
        
        // Tester la compatibilité avec toutes les règles CSS importantes
        const testSelectors = [
          '[id^="inv_"]:hover ~ path',
          '[id^="inv_"]:hover + path',
          'g:has([id^="inv_"]:hover) > path',
          'g:has([id^="inv_"]:hover) path',
          '.quartier-hover path'
        ];
        
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '320px';
        div.style.right = '10px';
        div.style.width = '250px';
        div.style.backgroundColor = '#fff';
        div.style.padding = '10px';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        div.style.zIndex = '9998';
        div.style.maxHeight = '300px';
        div.style.overflowY = 'auto';
        
        div.innerHTML = '<h3 style="margin-top:0;font-size:14px;">Résultats des tests CSS</h3>';
        
        testSelectors.forEach(selector => {
          const p = document.createElement('p');
          p.style.fontSize = '12px';
          p.style.margin = '5px 0';
          
          try {
            // Essayer d'appliquer le sélecteur (version sans :hover)
            const baseSelector = selector.replace(':hover', '');
            document.querySelector(baseSelector);
            p.innerHTML = `✅ <code>${selector}</code>: Supporté`;
            p.style.color = 'green';
          } catch (error) {
            p.innerHTML = `❌ <code>${selector}</code>: <span style="color:red">Non supporté</span>`;
            p.style.color = '#d32f2f';
          }
          
          div.appendChild(p);
        });
        
        // Ajouter un bouton pour fermer
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.style.padding = '5px 10px';
        closeButton.style.marginTop = '10px';
        closeButton.style.backgroundColor = '#9E9E9E';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
          div.remove();
        });
        
        div.appendChild(closeButton);
        document.body.appendChild(div);
      });
    }
    
    // Initialiser les styles et fonctions de test supplémentaires
    addDebugStyles();
    analyzeCSSRules();
    testCSSRuleApplication();
    
    console.log('====== FIN INITIALISATION OUTILS DE DIAGNOSTIC ======');
    console.log('Cliquez sur le bouton "Mode Debug" pour analyser les quartiers');
  }
})();
