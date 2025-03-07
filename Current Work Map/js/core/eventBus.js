/**
 * EventBus - Système de gestion d'événements centralisé pour la carte interactive de Nexus
 * Permet aux différents modules de communiquer sans couplage fort
 */
class EventBus {
  static listeners = {};
  
  /**
   * S'abonne à un événement
   * @param {string} event - Nom de l'événement
   * @param {function} callback - Fonction à appeler quand l'événement est publié
   * @returns {function} - Fonction pour se désabonner
   */
  static subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // Retourne une fonction pour se désabonner
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Publie un événement
   * @param {string} event - Nom de l'événement
   * @param {object} data - Données à passer aux abonnés
   */
  static publish(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur dans l'écouteur d'événement pour ${event}:`, error);
      }
    });
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.EventBus = EventBus;
