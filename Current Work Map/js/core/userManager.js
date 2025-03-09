/**
 * UserManager - Gestionnaire d'utilisateurs pour la carte interactive
 * Gère l'authentification et les informations des utilisateurs
 */
class UserManager {
  constructor() {
    // Vérifier les dépendances requises
    if (typeof EventBus === 'undefined') {
      console.error("Erreur: EventBus n'est pas chargé!");
      throw new Error("EventBus must be loaded before UserManager");
    }
    
    this.users = {};
    this.currentUser = null;
    
    // Charger les utilisateurs depuis le stockage local
    this.loadUsers();
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
    
    // Tenter de restaurer la session
    this.restoreSession();
    
    console.log("UserManager initialisé");
  }
  
  /**
   * Initialise les écouteurs d'événements
   */
  initEventListeners() {
    // Écouter les événements d'authentification
    EventBus.subscribe('auth:login', (data) => {
      this.login(data.username, data.password);
    });
    
    EventBus.subscribe('auth:logout', () => {
      this.logout();
    });
    
    // Bouton de paramètres utilisateur
    const userSettingsBtn = document.getElementById('user-settings-btn');
    if (userSettingsBtn) {
      userSettingsBtn.addEventListener('click', () => {
        this.showUserSettings();
      });
    }
  }
  
  /**
   * Restaure la session utilisateur depuis le stockage local
   */
  restoreSession() {
    try {
      const sessionData = localStorage.getItem('nexus-user-session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        // Vérifier si l'utilisateur existe
        if (session.userId && this.users[session.userId]) {
          this.currentUser = this.users[session.userId];
          
          // Mettre à jour l'interface
          this.updateUserInterface();
          
          // Publier l'événement de connexion
          EventBus.publish('auth:login:success', {
            user: this.currentUser
          });
          
          console.log(`Session restaurée pour l'utilisateur ${this.currentUser.name}`);
          return true;
        }
      }
      
      // Créer un utilisateur par défaut si aucune session
      this.createDefaultUser();
      return false;
    } catch (error) {
      console.error("Erreur lors de la restauration de la session:", error);
      
      // Créer un utilisateur par défaut en cas d'erreur
      this.createDefaultUser();
      return false;
    }
  }
  
  /**
   * Crée un utilisateur par défaut
   */
  createDefaultUser() {
    // Créer un utilisateur invité par défaut
    const guestUser = {
      id: 'guest',
      name: 'Invité',
      role: 'player'
    };
    
    this.currentUser = guestUser;
    this.users['guest'] = guestUser;
    
    // Mettre à jour l'interface
    this.updateUserInterface();
    
    // Publier l'événement
    EventBus.publish('auth:guest', {
      user: guestUser
    });
    
    console.log("Utilisateur invité créé par défaut");
  }
  
  /**
   * Connecte un utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {boolean} - true si la connexion a réussi, false sinon
   */
  login(username, password) {
    // Pour simplifier, nous n'implémentons pas de vérification de mot de passe réelle
    // Dans une application réelle, cela nécessiterait une authentification appropriée
    
    // Rechercher l'utilisateur par nom d'utilisateur
    const user = Object.values(this.users).find(u => 
      u.username === username || u.name.toLowerCase() === username.toLowerCase()
    );
    
    if (!user) {
      console.error(`Utilisateur ${username} non trouvé`);
      
      // Publier l'événement d'échec
      EventBus.publish('auth:login:error', {
        message: `Utilisateur ${username} non trouvé`
      });
      
      return false;
    }
    
    // Dans une application réelle, vérifier le mot de passe ici
    
    // Mettre à jour l'utilisateur courant
    this.currentUser = user;
    
    // Enregistrer la session
    this.saveSession();
    
    // Mettre à jour l'interface
    this.updateUserInterface();
    
    // Publier l'événement de connexion réussie
    EventBus.publish('auth:login:success', {
      user: this.currentUser
    });
    
    console.log(`Utilisateur ${user.name} connecté`);
    return true;
  }
  
  /**
   * Déconnecte l'utilisateur actuel
   */
  logout() {
    // Supprimer la session
    localStorage.removeItem('nexus-user-session');
    
    // Créer un utilisateur invité
    this.createDefaultUser();
    
    // Publier l'événement de déconnexion
    EventBus.publish('auth:logout:success', {});
    
    console.log("Utilisateur déconnecté");
    
    // Recharger la page pour réinitialiser l'état
    window.location.reload();
  }
  
  /**
   * Ajoute un nouvel utilisateur
   * @param {object} userData - Données de l'utilisateur
   * @returns {object|null} - Utilisateur créé ou null si échec
   */
  addUser(userData) {
    // Vérifier si l'utilisateur existe déjà
    if (this.getUserByName(userData.name)) {
      console.error(`Utilisateur avec le nom ${userData.name} existe déjà`);
      return null;
    }
    
    // Créer un ID unique
    const userId = `user_${Date.now()}`;
    
    // Créer l'utilisateur
    const user = {
      id: userId,
      name: userData.name,
      role: userData.role || 'player',
      color: userData.color || this.getRandomColor(),
      createdAt: new Date().toISOString()
    };
    
    // Ajouter à la liste
    this.users[userId] = user;
    
    // Enregistrer les utilisateurs
    this.saveUsers();
    
    // Publier l'événement
    EventBus.publish('user:added', {
      user
    });
    
    console.log(`Utilisateur ${user.name} ajouté`);
    return user;
  }
  
  /**
   * Met à jour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {object} userData - Données à mettre à jour
   * @returns {object|null} - Utilisateur mis à jour ou null si non trouvé
   */
  updateUser(userId, userData) {
    // Vérifier si l'utilisateur existe
    if (!this.users[userId]) {
      console.error(`Utilisateur avec l'ID ${userId} non trouvé`);
      return null;
    }
    
    // Mettre à jour les données
    const user = this.users[userId];
    
    // Mettre à jour seulement les propriétés fournies
    Object.keys(userData).forEach(key => {
      // Ne pas permettre la modification de l'ID
      if (key !== 'id') {
        user[key] = userData[key];
      }
    });
    
    // Mettre à jour la date de modification
    user.updatedAt = new Date().toISOString();
    
    // Enregistrer les utilisateurs
    this.saveUsers();
    
    // Si c'est l'utilisateur courant, mettre à jour l'interface
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = user;
      this.updateUserInterface();
    }
    
    // Publier l'événement
    EventBus.publish('user:updated', {
      user
    });
    
    console.log(`Utilisateur ${user.name} mis à jour`);
    return user;
  }
  
  /**
   * Supprime un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean} - true si l'utilisateur a été supprimé, false sinon
   */
  deleteUser(userId) {
    // Vérifier si l'utilisateur existe
    if (!this.users[userId]) {
      console.error(`Utilisateur avec l'ID ${userId} non trouvé`);
      return false;
    }
    
    // Ne pas permettre la suppression de l'utilisateur courant
    if (this.currentUser && this.currentUser.id === userId) {
      console.error("Impossible de supprimer l'utilisateur courant");
      return false;
    }
    
    // Récupérer le nom pour le log
    const userName = this.users[userId].name;
    
    // Supprimer l'utilisateur
    delete this.users[userId];
    
    // Enregistrer les utilisateurs
    this.saveUsers();
    
    // Publier l'événement
    EventBus.publish('user:deleted', {
      userId
    });
    
    console.log(`Utilisateur ${userName} supprimé`);
    return true;
  }
  
  /**
   * Récupère un utilisateur par son ID
   * @param {string} userId - ID de l'utilisateur
   * @returns {object|null} - Utilisateur ou null si non trouvé
   */
  getUser(userId) {
    return this.users[userId] || null;
  }
  
  /**
   * Récupère un utilisateur par son nom
   * @param {string} name - Nom de l'utilisateur
   * @returns {object|null} - Utilisateur ou null si non trouvé
   */
  getUserByName(name) {
    return Object.values(this.users).find(
      user => user.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }
  
  /**
   * Récupère l'utilisateur courant
   * @returns {object|null} - Utilisateur courant ou null si aucun
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Récupère tous les utilisateurs
   * @returns {object} - Liste des utilisateurs {id: user}
   */
  getAllUsers() {
    return this.users;
  }
  
  /**
   * Met à jour l'interface utilisateur
   */
  updateUserInterface() {
    if (!this.currentUser) return;
    
    // Mettre à jour le nom dans la barre de navigation
    const userNameElement = document.getElementById('current-user-name');
    if (userNameElement) {
      userNameElement.textContent = this.currentUser.name;
    }
    
    // Mettre à jour le rôle
    const userRoleElement = document.getElementById('current-user-role');
    if (userRoleElement) {
      userRoleElement.textContent = `(${this.formatRole(this.currentUser.role)})`;
    }
    
    // Ajouter la classe appropriée au body
    document.body.classList.remove('player-view', 'gm-view');
    document.body.classList.add(this.currentUser.role === 'gm' ? 'gm-view' : 'player-view');
  }
  
  /**
   * Formate le rôle pour l'affichage
   * @param {string} role - Rôle de l'utilisateur
   * @returns {string} - Rôle formaté
   */
  formatRole(role) {
    const roles = {
      'gm': 'Maître de Jeu',
      'player': 'Joueur'
    };
    
    return roles[role] || role;
  }
  
  /**
   * Affiche les paramètres utilisateur
   */
  showUserSettings() {
    // Créer et afficher une modale pour les paramètres utilisateur
    // Dans une application réelle, cela serait plus élaboré
    
    alert(`Utilisateur: ${this.currentUser.name}\nRôle: ${this.formatRole(this.currentUser.role)}`);
  }
  
  /**
   * Génère une couleur aléatoire
   * @returns {string} - Code couleur hexadécimal
   */
  getRandomColor() {
    const colors = [
      '#4CAF50', // Vert
      '#2196F3', // Bleu
      '#FFC107', // Jaune
      '#FF5722', // Orange
      '#E91E63', // Rose
      '#9C27B0', // Violet
      '#00BCD4', // Cyan
      '#795548'  // Marron
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Charge les utilisateurs depuis le stockage local
   */
  loadUsers() {
    try {
      const storedUsers = localStorage.getItem('nexus-users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        console.log("Utilisateurs chargés depuis le stockage local");
      } else {
        // Créer les utilisateurs par défaut
        this.createDefaultUsers();
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      
      // Créer les utilisateurs par défaut en cas d'erreur
      this.createDefaultUsers();
    }
  }
  
  /**
   * Enregistre les utilisateurs dans le stockage local
   */
  saveUsers() {
    try {
      localStorage.setItem('nexus-users', JSON.stringify(this.users));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des utilisateurs:", error);
    }
  }
  
  /**
   * Enregistre la session utilisateur dans le stockage local
   */
  saveSession() {
    if (!this.currentUser) return;
    
    try {
      const sessionData = {
        userId: this.currentUser.id,
        timestamp: Date.now()
      };
      
      localStorage.setItem('nexus-user-session', JSON.stringify(sessionData));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la session:", error);
    }
  }
  
  /**
   * Crée les utilisateurs par défaut
   */
  createDefaultUsers() {
    // Utilisateur invité
    this.users['guest'] = {
      id: 'guest',
      name: 'Invité',
      role: 'player',
      color: '#808080'
    };
    
    // Maître de jeu
    this.users['gm'] = {
      id: 'gm',
      name: 'Maître de Jeu',
      role: 'gm',
      color: '#9C27B0'
    };
    
    // Enregistrer les utilisateurs
    this.saveUsers();
    
    console.log("Utilisateurs par défaut créés");
  }
}

// Créer une instance et l'exporter
window.UserManager = new UserManager();