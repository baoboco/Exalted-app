/**
 * VisibilityManager - Gestionnaire de visibilité pour la carte interactive de Nexus
 */
class VisibilityManager {
  /**
   * Applique les filtres de visibilité en fonction de l'utilisateur actuel
   */
  static applyVisibilityFilters() {
    const currentUser = UserManager.getCurrentUser();
    if (!currentUser) return;
    
    // Récupérer tous les éléments avec une visibilité définie
    const visibilityElements = document.querySelectorAll('[data-visibility]');
    
    visibilityElements.forEach(element => {
      const visibility = element.dataset.visibility;
      const createdBy = element.dataset.createdBy;
      
      // Déterminer si l'élément doit être visible
      const isVisible = this.shouldBeVisible(visibility, createdBy, currentUser);
      
      // Appliquer la visibilité
      element.classList.toggle('hidden', !isVisible);
    });
  }
  
  /**
   * Détermine si un élément doit être visible pour un utilisateur
   * @param {string} visibility - Visibilité de l'élément (public, private, gm-only)
   * @param {string} createdBy - ID du créateur de l'élément
   * @param {object} user - Utilisateur actuel
   * @returns {boolean} - Vrai si l'élément doit être visible
   */
  static shouldBeVisible(visibility, createdBy, user) {
    // Si l'utilisateur est le MJ, il voit tout
    if (user.role === 'gm') return true;
    
    // Si la visibilité est publique, tout le monde voit
    if (visibility === 'public') return true;
    
    // Si la visibilité est privée, seul le créateur voit
    if (visibility === 'private') {
      return createdBy === user.id;
    }
    
    // Si la visibilité est "gm-only", seul le MJ voit
    if (visibility === 'gm-only') {
      return false; // l'utilisateur n'est pas le MJ (vérifié plus haut)
    }
    
    // Par défaut, visible
    return true;
  }
  
  /**
   * Définit la visibilité d'un élément
   * @param {HTMLElement} element - Élément à modifier
   * @param {string} visibility - Visibilité (public, private, gm-only)
   */
  static setElementVisibility(element, visibility) {
    if (!element) return;
    
    // Définir la visibilité
    element.dataset.visibility = visibility;
    
    // Appliquer les filtres
    this.applyVisibilityFilters();
  }
  
  /**
   * Initialise les événements pour la gestion de la visibilité
   */
  static initEvents() {
    // S'abonner aux événements de changement d'utilisateur
    EventBus.subscribe('user:changed', () => {
      this.applyVisibilityFilters();
    });
    
    // S'abonner aux événements de création de marqueurs et notes
    EventBus.subscribe('marker:created', () => {
      this.applyVisibilityFilters();
    });
    
    EventBus.subscribe('note:created', () => {
      this.applyVisibilityFilters();
    });
  }
}

// Initialiser les événements
VisibilityManager.initEvents();

// Exporter la classe pour une utilisation dans d'autres modules
window.VisibilityManager = VisibilityManager;
