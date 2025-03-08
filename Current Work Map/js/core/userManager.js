/**
 * UserManager - Gestion des utilisateurs pour la carte interactive de Nexus
 * Permet de gérer les utilisateurs, leurs rôles et leurs permissions
 */
class UserManager {
  static users = {};
  static currentUserId = null;
  
  /**
   * Enregistre un nouvel utilisateur
   * @param {string} id - Identifiant de l'utilisateur
   * @param {string} name - Nom de l'utilisateur
   * @param {string} role - Rôle (gm, player)
   * @param {object} options - Options supplémentaires
   * @returns {string} - Identifiant de l'utilisateur
   */
  static registerUser(id, name, role, options = {}) {
    this.users[id] = {
      id,
      name,
      role,
      options,
      createdAt: new Date().toISOString()
    };
    
    return id;
  }
  
  /**
   * Définit l'utilisateur actuel
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {boolean} - Succès ou échec
   */
  static setCurrentUser(userId) {
    if (!this.users[userId]) return false;
    
    this.currentUserId = userId;
    
    // Mettre à jour les classes du body
    document.body.classList.remove('is-gm', 'is-player');
    document.body.classList.add(`is-${this.users[userId].role}`);
    
    // Mettre à jour l'interface utilisateur
    const userNameElement = document.getElementById('current-user-name');
    const userRoleElement = document.getElementById('current-user-role');
    
    if (userNameElement) {
      userNameElement.textContent = this.users[userId].name;
    }
    
    if (userRoleElement) {
      userRoleElement.textContent = `(${this.users[userId].role === 'gm' ? 'Maître de Jeu' : 'Joueur'})`;
    }
    
    // Dispatcher un événement
    EventBus.publish('user:changed', {
      userId: userId,
      user: this.users[userId]
    });
    
    return true;
  }
  
  /**
   * Récupère l'utilisateur actuel
   * @returns {object|null} - Utilisateur actuel ou null
   */
  static getCurrentUser() {
    return this.users[this.currentUserId] || null;
  }
  
  /**
   * Vérifie si l'utilisateur actuel est le Maître de Jeu
   * @returns {boolean} - Vrai si l'utilisateur est le MJ
   */
  static isGameMaster() {
    const currentUser = this.getCurrentUser();
    return currentUser && currentUser.role === 'gm';
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.UserManager = UserManager;
