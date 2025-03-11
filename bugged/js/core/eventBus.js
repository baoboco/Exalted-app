/**
 * EventBus - Système d'événements pour la communication entre les modules
 * Implémente un pattern pub/sub pour découpler les composants
 */
class EventBusManager {
  constructor() {
    this.subscribers = {};
    console.log("EventBus initialisé");
  }
  
  /**
   * S'abonne à un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à appeler lors de l'événement
   * @returns {Function} - Fonction pour se désabonner
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    
    this.subscribers[event].push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.unsubscribe(event, callback);
    };
  }
  
  /**
   * Se désabonne d'un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à désabonner
   */
  unsubscribe(event, callback) {
    if (!this.subscribers[event]) return;
    
    this.subscribers[event] = this.subscribers[event].filter(
      subscriber => subscriber !== callback
    );
    
    // Nettoyer les événements sans abonnés
    if (this.subscribers[event].length === 0) {
      delete this.subscribers[event];
    }
  }
  
  /**
   * Publie un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à passer aux abonnés
   */
  publish(event, data = {}) {
    if (!this.subscribers[event]) return;
    
    // Ajouter des informations sur l'événement
    const eventData = {
      ...data,
      _event: event,
      _timestamp: Date.now()
    };
    
    // Appeler les abonnés de manière asynchrone
    setTimeout(() => {
      if (this.subscribers[event]) {  // Vérification supplémentaire pour éviter les erreurs
        this.subscribers[event].forEach(callback => {
          try {
            callback(eventData);
          } catch (error) {
            console.error(`Erreur lors de la gestion de l'événement ${event}:`, error);
          }
        });
      }
    }, 0);
    
    // Publier également sur les abonnés à tous les événements
    if (event !== '*' && this.subscribers['*']) {
      setTimeout(() => {
        if (this.subscribers['*']) {  // Vérification supplémentaire
          this.subscribers['*'].forEach(callback => {
            try {
              callback(eventData);
            } catch (error) {
              console.error(`Erreur lors de la gestion de tous les événements:`, error);
            }
          });
        }
      }, 0);
    }
  }
  
  /**
   * Enregistre un historique des événements publiés (pour le débogage)
   * @param {number} maxEvents - Nombre maximum d'événements à enregistrer
   */
  enableLogging(maxEvents = 100) {
    this.eventLog = [];
    this.maxLogEvents = maxEvents;
    
    // S'abonner à tous les événements
    this.loggerCallback = (data) => {
      this.eventLog.push({
        event: data._event,
        timestamp: data._timestamp,
        data
      });
      
      // Limiter la taille du journal
      if (this.eventLog.length > this.maxLogEvents) {
        this.eventLog.shift();
      }
    };
    
    this.subscribe('*', this.loggerCallback);
    
    console.log("Journalisation des événements activée");
  }
  
  /**
   * Désactive la journalisation des événements
   */
  disableLogging() {
    this.eventLog = null;
    
    // Trouver et supprimer l'abonnement de journalisation
    if (this.loggerCallback) {
      this.unsubscribe('*', this.loggerCallback);
      this.loggerCallback = null;
    }
    
    console.log("Journalisation des événements désactivée");
  }
  
  /**
   * Obtient le journal des événements
   * @returns {Array|null} - Journal des événements ou null si désactivé
   */
  getEventLog() {
    return this.eventLog;
  }
  
  /**
   * Vide le journal des événements
   */
  clearEventLog() {
    if (this.eventLog) {
      this.eventLog = [];
      console.log("Journal des événements vidé");
    }
  }
}

// Créer une instance
const eventBusInstance = new EventBusManager();

// Exposer l'EventBus comme un objet global avec des méthodes qui délèguent à l'instance
window.EventBus = {
  subscribe: (event, callback) => eventBusInstance.subscribe(event, callback),
  unsubscribe: (event, callback) => eventBusInstance.unsubscribe(event, callback),
  publish: (event, data) => eventBusInstance.publish(event, data),
  enableLogging: (maxEvents) => eventBusInstance.enableLogging(maxEvents),
  disableLogging: () => eventBusInstance.disableLogging(),
  getEventLog: () => eventBusInstance.getEventLog(),
  clearEventLog: () => eventBusInstance.clearEventLog()
};

console.log("EventBus global initialisé avec succès");