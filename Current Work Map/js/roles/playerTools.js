/**
 * PlayerTools - Outils spécifiques aux joueurs pour la carte interactive de Nexus
 */
class PlayerTools {
  /**
   * Crée une instance des outils de joueur
   * @param {MapLoader} mapLoader - Instance du chargeur de carte
   */
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.currentPosition = null;
    
    // Initialiser l'interface joueur
    this.setupPlayerInterface();
    
    // Mettre en place les écouteurs d'événements
    this.setupEventListeners();
  }
  
  /**
   * Configure l'interface du joueur
   */
  setupPlayerInterface() {
    // Uniquement si l'utilisateur actuel est un joueur
    if (UserManager.isGameMaster()) return;
    
    // Ajouter la classe is-player au corps pour les styles spécifiques
    document.body.classList.add('is-player');
    
    // Initialiser la position du joueur (fictive pour le moment)
    this.setRandomPosition();
  }
  
  /**
   * Définit une position aléatoire pour le joueur
   */
  setRandomPosition() {
    const activeSvgLayer = this.mapLoader.svgLayers[this.mapLoader.currentLayerId];
    if (!activeSvgLayer) return;
    
    const svgElement = activeSvgLayer.getElement();
    if (!svgElement) return;
    
    // Obtenir les dimensions du SVG
    const svgRect = svgElement.getBoundingClientRect();
    
    // Position aléatoire
    this.currentPosition = {
      x: Math.random() * svgRect.width,
      y: Math.random() * svgRect.height
    };
    
    // Créer le marqueur de position du joueur
    this.renderPlayerMarker();
  }
  
  /**
   * Rend visuellement le marqueur du joueur
   */
  renderPlayerMarker() {
    if (!this.currentPosition) return;
    
    const activeSvgLayer = this.mapLoader.svgLayers[this.mapLoader.currentLayerId];
    if (!activeSvgLayer) return;
    
    const svgElement = activeSvgLayer.getElement();
    if (!svgElement) return;
    
    // Supprimer le marqueur existant si présent
    const existingMarker = svgElement.querySelector('.player-marker');
    if (existingMarker) {
      existingMarker.remove();
    }
    
    // Créer le nouveau marqueur
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
    marker.classList.add('player-marker');
    
    // Cercle de fond
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', '#4CAF50');
    circle.setAttribute('stroke', '#FFFFFF');
    circle.setAttribute('stroke-width', '2');
    marker.appendChild(circle);
    
    // Initiales du joueur
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '0');
    text.setAttribute('y', '4');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '10');
    text.setAttribute('fill', '#FFFFFF');
    
    const currentUser = UserManager.getCurrentUser();
    const initials = currentUser ? currentUser.name.charAt(0) : 'P';
    text.textContent = initials;
    
    marker.appendChild(text);
    
    // Positionner le marqueur
    marker.setAttribute('transform', `translate(${this.currentPosition.x}, ${this.currentPosition.y})`);
    
    // Ajouter au SVG
    svgElement.appendChild(marker);
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // S'abonner aux événements de changement de couche
    EventBus.subscribe('layer:changed', (data) => {
      // Mettre à jour le marqueur quand la couche change
      setTimeout(() => this.renderPlayerMarker(), 100);
    });
    
    // S'abonner aux événements de message reçu
    EventBus.subscribe('message:sent', (data) => {
      // Vérifier si le message est pour le joueur actuel
      const currentUser = UserManager.getCurrentUser();
      if (currentUser && data.to === currentUser.id) {
        this.showMessageNotification(data);
      }
    });
  }
  
  /**
   * Affiche une notification de message
   * @param {object} messageData - Données du message
   */
  showMessageNotification(messageData) {
    const sender = UserManager.users[messageData.from];
    if (!sender) return;
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = 'message-notification';
    
    notification.innerHTML = `
      <div class="notification-header">
        <strong>Message de ${sender.name}</strong>
        <button class="close-notification">×</button>
      </div>
      <div class="notification-content">
        ${messageData.message}
      </div>
    `;
    
    // Ajouter au document
    document.body.appendChild(notification);
    
    // Fermer la notification
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
      notification.classList.add('closing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Fermer automatiquement après un délai
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('closing');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 10000);
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.PlayerTools = PlayerTools;
