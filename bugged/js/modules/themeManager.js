/**
 * ThemeManager - Gestionnaire de thème pour la carte interactive de Nexus
 * Gère l'application des thèmes visuels (clair, sombre, contraste élevé)
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'light'; // Thème par défaut
    
    // Initialiser le thème au chargement
    this.initTheme();
    
    // Mettre en place les écouteurs d'événements
    this.setupEventListeners();
  }
  
  /**
   * Initialise le thème à partir des préférences stockées
   */
  initTheme() {
    // Si un utilisateur est connecté, essayer de charger ses préférences
    if (window.authManager && window.authManager.currentUser) {
      const userId = window.authManager.currentUser.id;
      const storedPrefs = localStorage.getItem(`nexus-prefs-${userId}`);
      
      if (storedPrefs) {
        try {
          const preferences = JSON.parse(storedPrefs);
          if (preferences.display && preferences.display.theme) {
            this.setTheme(preferences.display.theme);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des préférences de thème:', error);
        }
      }
    } else {
      // Si pas d'utilisateur, vérifier s'il y a un thème général stocké
      const globalTheme = localStorage.getItem('nexus-global-theme');
      if (globalTheme) {
        this.setTheme(globalTheme);
      } else {
        // Vérifier la préférence système pour dark mode
        this.checkSystemPreference();
      }
    }
  }
  
  /**
   * Vérifie la préférence système pour le mode sombre
   */
  checkSystemPreference() {
    // Vérifier si l'utilisateur préfère un thème sombre au niveau du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
    
    // Réagir aux changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      const newTheme = event.matches ? 'dark' : 'light';
      
      // Seulement appliquer si l'utilisateur n'a pas défini de préférence explicite
      if (!localStorage.getItem('nexus-global-theme') && 
          !(window.authManager && window.authManager.currentUser)) {
        this.setTheme(newTheme);
      }
    });
  }
  
  /**
   * Met en place les écouteurs d'événements
   */
  setupEventListeners() {
    // Écouter les mises à jour de préférences
    if (window.EventBus) {
      EventBus.subscribe('preferences:updated', (data) => {
        if (data.preferences?.display?.theme) {
          this.setTheme(data.preferences.display.theme);
        }
      });
      
      // Écouter les changements d'utilisateur
      EventBus.subscribe('auth:user:changed', () => {
        this.initTheme();
      });
    }
  }
  
  /**
   * Définit le thème actif
   * @param {string} theme - Thème à appliquer ('light', 'dark', ou 'contrast')
   */
  setTheme(theme) {
    if (!['light', 'dark', 'contrast'].includes(theme)) {
      theme = 'light'; // Fallback au thème clair si la valeur est invalide
    }
    
    // Mettre à jour le thème actuel
    this.currentTheme = theme;
    
    // Supprimer les anciennes classes de thème
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-contrast');
    
    // Ajouter la nouvelle classe
    document.body.classList.add(`theme-${theme}`);
    
    // Mettre à jour l'attribut data-theme sur l'élément HTML
    document.documentElement.setAttribute('data-theme', theme);
    
    // Stocker le thème actif globalement (pour les utilisateurs non connectés)
    if (!window.authManager || !window.authManager.currentUser) {
      localStorage.setItem('nexus-global-theme', theme);
    }
    
    // Appliquer des styles supplémentaires pour chaque thème
    this.applyAdditionalStyles(theme);
    
    console.log(`Thème appliqué: ${theme}`);
  }
  
  /**
   * Applique des styles supplémentaires selon le thème
   * @param {string} theme - Thème actif
   */
  applyAdditionalStyles(theme) {
    // Ajuster les styles spécifiques pour Leaflet
    this.adjustLeafletStyles(theme);
    
    // Ajuster les couleurs des icônes SVG
    this.adjustSvgColors(theme);
  }
  
  /**
   * Ajuste les styles de Leaflet selon le thème
   * @param {string} theme - Thème actif
   */
  adjustLeafletStyles(theme) {
    // Ne rien faire si Leaflet n'est pas chargé
    if (!window.L) return;
    
    // Créer/mettre à jour le style pour Leaflet
    let leafletStyle = document.getElementById('leaflet-theme-styles');
    if (!leafletStyle) {
      leafletStyle = document.createElement('style');
      leafletStyle.id = 'leaflet-theme-styles';
      document.head.appendChild(leafletStyle);
    }
    
    // Définir les styles selon le thème
    if (theme === 'dark') {
      leafletStyle.textContent = `
        .leaflet-control-zoom {
          background-color: #1e1e1e !important;
          border-color: #444 !important;
        }
        .leaflet-control-zoom a {
          background-color: #2d2d2d !important;
          color: #e1e1e1 !important;
          border-color: #444 !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #3d3d3d !important;
        }
        .leaflet-container {
          background-color: #121212 !important;
        }
      `;
    } else if (theme === 'contrast') {
      leafletStyle.textContent = `
        .leaflet-control-zoom {
          background-color: #000 !important;
          border-color: #fff !important;
        }
        .leaflet-control-zoom a {
          background-color: #000 !important;
          color: #fff !important;
          border-color: #fff !important;
          border-width: 2px !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #333 !important;
        }
        .leaflet-container {
          background-color: #000 !important;
        }
      `;
    } else {
      // Thème clair (par défaut)
      leafletStyle.textContent = '';
    }
  }
  
  /**
   * Ajuste les couleurs des SVG selon le thème
   * @param {string} theme - Thème actif
   */
  adjustSvgColors(theme) {
    // Trouver tous les éléments SVG
    const svgLayers = document.querySelectorAll('.map-layer');
    
    if (svgLayers.length === 0) return;
    
    svgLayers.forEach(layer => {
      const svgElement = layer.querySelector('svg');
      if (!svgElement) return;
      
      // Appliquer une transformation CSS selon le thème
      if (theme === 'dark') {
        svgElement.style.filter = 'brightness(0.85) saturate(0.9)';
      } else if (theme === 'contrast') {
        svgElement.style.filter = 'contrast(1.3) brightness(0.9)';
      } else {
        svgElement.style.filter = 'none';
      }
    });
  }
  
  /**
   * Retourne le thème actif
   * @returns {string} - Thème actif
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Bascule entre les thèmes clair et sombre
   * @returns {string} - Nouveau thème actif
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
}

// Initialiser le gestionnaire de thème
window.themeManager = new ThemeManager();

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Ajouter un bouton de basculement de thème dans la barre du haut pour un accès rapide
  const userControls = document.querySelector('.user-controls');
  
  if (userControls) {
    const themeToggleBtn = document.createElement('button');
    themeToggleBtn.id = 'theme-toggle-btn';
    themeToggleBtn.innerHTML = '🌓';
    themeToggleBtn.title = 'Changer de thème';
    themeToggleBtn.style.fontSize = '1.2rem';
    themeToggleBtn.style.padding = '0 10px';
    
    themeToggleBtn.addEventListener('click', () => {
      window.themeManager.toggleTheme();
    });
    
    // Insérer le bouton avant le bouton de paramètres
    const settingsBtn = document.getElementById('user-settings-btn');
    if (settingsBtn) {
      userControls.insertBefore(themeToggleBtn, settingsBtn);
    } else {
      userControls.appendChild(themeToggleBtn);
    }
  }
});
