/**
 * AuthManager - Gestionnaire d'authentification pour la carte interactive de Nexus
 * Permet de gérer l'identification et les permissions des utilisateurs
 */
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = {};
    this.roles = {
      'gm': {
        name: 'Maître de Jeu',
        permissions: ['edit_map', 'manage_events', 'manage_users', 'see_all']
      },
      'player': {
        name: 'Joueur',
        permissions: ['add_markers', 'add_notes', 'edit_own']
      }
    };
    
    // Tenter de restaurer la session
    this.restoreSession();
    
    // Initialiser l'interface de connexion
    this.initLoginUI();
  }
  
  /**
   * Initialise l'interface d'identification
   */
  initLoginUI() {
    // Créer le modal de connexion s'il n'existe pas déjà
    if (!document.getElementById('login-modal')) {
      const loginModal = document.createElement('div');
      loginModal.id = 'login-modal';
      loginModal.className = 'modal';
      
      loginModal.innerHTML = `
        <div class="modal-content login-modal-content">
          <div class="modal-header">
            <h2>Bienvenue sur la Carte de Nexus</h2>
          </div>
          <div class="modal-body">
            <form id="login-form">
              <div class="form-group">
                <label for="username">Nom d'utilisateur</label>
                <input type="text" id="username" required>
              </div>
              <div class="form-group">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" required>
              </div>
              <div class="form-group">
                <label for="remember-me">
                  <input type="checkbox" id="remember-me">
                  Se souvenir de moi
                </label>
              </div>
              <div id="login-error" class="error-message"></div>
              <div class="form-actions">
                <button type="submit" class="primary-btn">Se connecter</button>
              </div>
            </form>
            
            <div class="quick-login">
              <h3>Connexion rapide</h3>
              <div class="quick-login-buttons">
                <button class="quick-login-btn gm-btn" data-username="gm" data-password="gm123">Maître de Jeu</button>
                <button class="quick-login-btn player-btn" data-username="player1" data-password="player123">Joueur 1</button>
                <button class="quick-login-btn player-btn" data-username="player2" data-password="player123">Joueur 2</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(loginModal);
      
      // Ajouter les styles pour le modal de connexion
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .login-modal-content {
          max-width: 400px;
        }
        
        .modal-header h2 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
        }
        
        .quick-login {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        
        .quick-login h3 {
          font-size: 1rem;
          margin-bottom: 10px;
          color: #666;
        }
        
        .quick-login-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .quick-login-btn {
          flex: 1;
          min-width: 100px;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .gm-btn {
          background-color: var(--primary-color);
          color: white;
        }
        
        .player-btn {
          background-color: var(--secondary-color);
          color: white;
        }
        
        .error-message {
          color: #e74c3c;
          font-size: 0.9rem;
          margin: 10px 0;
          min-height: 20px;
        }
      `;
      document.head.appendChild(styleEl);
      
      // Gestionnaires d'événements
      this.setupLoginEvents();
    }
  }
  
  /**
   * Configure les gestionnaires d'événements pour le login
   */
  setupLoginEvents() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const quickLoginButtons = document.querySelectorAll('.quick-login-btn');
    
    // Gestionnaire de soumission du formulaire
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember-me').checked;
      
      this.authenticate(username, password, rememberMe).then(success => {
        if (success) {
          // Fermer le modal et continuer
          document.getElementById('login-modal').classList.remove('active');
        } else {
          loginError.textContent = 'Identifiants incorrects. Veuillez réessayer.';
        }
      });
    });
    
    // Gestionnaires des boutons de connexion rapide
    quickLoginButtons.forEach(button => {
      button.addEventListener('click', () => {
        const username = button.dataset.username;
        const password = button.dataset.password;
        
        if (username && password) {
          document.getElementById('username').value = username;
          document.getElementById('password').value = password;
          document.getElementById('remember-me').checked = true;
          
          // Simuler un clic sur le bouton de connexion
          const submitBtn = loginForm.querySelector('button[type="submit"]');
          submitBtn.click();
        }
      });
    });
  }
  
  /**
   * Authentifie un utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @param {boolean} rememberMe - Se souvenir de l'utilisateur
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async authenticate(username, password, rememberMe = false) {
    // Dans une version réelle, on ferait une requête API
    // Pour cette version, on utilise des utilisateurs en dur
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Utilisateurs en dur pour le développement
    const hardcodedUsers = {
      'gm': { password: 'gm123', role: 'gm', name: 'Maître de Jeu' },
      'player1': { password: 'player123', role: 'player', name: 'Joueur 1' },
      'player2': { password: 'player123', role: 'player', name: 'Joueur 2' }
    };
    
    // Vérifier les identifiants
    if (hardcodedUsers[username] && hardcodedUsers[username].password === password) {
      const user = {
        id: username,
        username: username,
        role: hardcodedUsers[username].role,
        name: hardcodedUsers[username].name,
        permissions: this.roles[hardcodedUsers[username].role].permissions,
        lastLogin: new Date().toISOString()
      };
      
      // Stocker l'utilisateur et la session
      this.setCurrentUser(user);
      
      if (rememberMe) {
        this.saveSession(user);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Définit l'utilisateur actuel
   * @param {object} user - Utilisateur
   */
  setCurrentUser(user) {
    this.currentUser = user;
    
    // Mettre à jour l'interface utilisateur
    this.updateUIForUser(user);
    
    // Dispatcher un événement pour le reste de l'application
    EventBus.publish('auth:user:changed', {
      user: user
    });
    
    // Mettre à jour les classes et permissions
    this.updatePermissions(user);
    
    // Stocker dans UserManager pour la compatibilité avec le code existant
    if (window.UserManager) {
      const userInManager = window.UserManager.users[user.id];
      if (!userInManager) {
        window.UserManager.registerUser(user.id, user.name, user.role);
      }
      window.UserManager.setCurrentUser(user.id);
    }
  }
  
  /**
   * Met à jour l'interface utilisateur selon l'utilisateur connecté
   * @param {object} user - Utilisateur
   */
  updateUIForUser(user) {
    // Mettre à jour l'en-tête avec le nom d'utilisateur
    const userNameElement = document.getElementById('current-user-name');
    const userRoleElement = document.getElementById('current-user-role');
    
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
    
    if (userRoleElement) {
      userRoleElement.textContent = `(${this.roles[user.role]?.name || user.role})`;
    }
    
    // Mettre à jour le menu utilisateur dans les paramètres
    this.updateUserMenu(user);
  }
  
  /**
   * Met à jour le menu utilisateur dans les paramètres
   * @param {object} user - Utilisateur
   */
  updateUserMenu(user) {
    const userSettingsBtn = document.getElementById('user-settings-btn');
    
    if (userSettingsBtn) {
      userSettingsBtn.textContent = 'Paramètres';
      
      // Recréer le menu si nécessaire
      let userMenu = document.getElementById('user-menu');
      
      if (!userMenu) {
        userMenu = document.createElement('div');
        userMenu.id = 'user-menu';
        userMenu.className = 'user-menu';
        
        document.body.appendChild(userMenu);
        
        // Ajouter les styles pour le menu
        const style = document.createElement('style');
        style.textContent = `
          .user-menu {
            position: absolute;
            top: 60px;
            right: 20px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: none;
            min-width: 200px;
          }
          
          .user-menu.active {
            display: block;
          }
          
          .user-menu-header {
            padding: 10px 15px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 4px 4px 0 0;
          }
          
          .user-menu-item {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
          }
          
          .user-menu-item:hover {
            background-color: #f5f5f5;
          }
          
          .user-menu-item:last-child {
            border-bottom: none;
            border-radius: 0 0 4px 4px;
          }
          
          .user-menu-item.danger {
            color: #e74c3c;
          }
        `;
        document.head.appendChild(style);
        
        // Gestionnaire pour afficher/masquer le menu
        userSettingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userMenu.classList.toggle('active');
        });
        
        // Fermer le menu au clic à l'extérieur
        document.addEventListener('click', (e) => {
          if (!userMenu.contains(e.target) && e.target !== userSettingsBtn) {
            userMenu.classList.remove('active');
          }
        });
      }
      
      // Mettre à jour le contenu du menu
      userMenu.innerHTML = `
        <div class="user-menu-header">
          <div>${user.name}</div>
          <div>${this.roles[user.role]?.name || user.role}</div>
        </div>
        <div class="user-menu-item" data-action="profile">Profil</div>
        <div class="user-menu-item" data-action="preferences">Préférences</div>
        ${user.role === 'gm' ? '<div class="user-menu-item" data-action="manage-users">Gérer les utilisateurs</div>' : ''}
        <div class="user-menu-item danger" data-action="logout">Déconnexion</div>
      `;
      
      // Ajouter les gestionnaires d'événements aux éléments du menu
      userMenu.querySelectorAll('.user-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          this.handleMenuAction(action);
          userMenu.classList.remove('active');
        });
      });
    }
  }
  
  /**
   * Gère les actions du menu utilisateur
   * @param {string} action - Action à effectuer
   */
  handleMenuAction(action) {
    switch (action) {
      case 'profile':
        // Ouvrir le modal de profil
        if (window.playerProfile) {
          window.playerProfile.openProfileModal();
        } else {
          alert('Fonctionnalité de profil en cours de développement');
        }
        break;
      
      case 'preferences':
        // Ouvrir les préférences
        this.openPreferencesModal();
        break;
      
      case 'manage-users':
        // Ouvrir la gestion des utilisateurs (MJ uniquement)
        if (this.currentUser.role === 'gm') {
          this.openUserManagementModal();
        }
        break;
      
      case 'logout':
        // Déconnexion
        this.logout();
        break;
    }
  }
  
  /**
   * Ouvre le modal des préférences
   */
  openPreferencesModal() {
    // Créer le modal de préférences s'il n'existe pas déjà
    if (!document.getElementById('preferences-modal')) {
      const prefModal = document.createElement('div');
      prefModal.id = 'preferences-modal';
      prefModal.className = 'modal';
      
      prefModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Préférences</h3>
            <button class="close-modal-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="tabs">
              <div class="tab-buttons">
                <button class="tab-btn active" data-tab="display">Affichage</button>
                <button class="tab-btn" data-tab="interaction">Interaction</button>
                <button class="tab-btn" data-tab="notifications">Notifications</button>
              </div>
              
              <div class="tab-content active" data-tab="display">
                <div class="form-group">
                  <label for="theme-select">Thème</label>
                  <select id="theme-select">
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                    <option value="contrast">Contraste élevé</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="font-size">Taille de police</label>
                  <select id="font-size">
                    <option value="small">Petite</option>
                    <option value="medium" selected>Moyenne</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="default-zoom">Zoom par défaut</label>
                  <input type="range" id="default-zoom" min="-2" max="4" value="0" step="0.5">
                  <div class="range-value"><span id="zoom-value">0</span></div>
                </div>
              </div>
              
              <div class="tab-content" data-tab="interaction">
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="confirm-deletions" checked>
                    Confirmer les suppressions
                  </label>
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="auto-save" checked>
                    Sauvegarde automatique des notes
                  </label>
                </div>
                
                <div class="form-group">
                  <label for="double-click-action">Action au double-clic</label>
                  <select id="double-click-action">
                    <option value="add-marker">Ajouter un marqueur</option>
                    <option value="add-note">Ajouter une note</option>
                    <option value="zoom-in">Zoomer</option>
                  </select>
                </div>
              </div>
              
              <div class="tab-content" data-tab="notifications">
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="notify-events" checked>
                    Notifications pour les événements
                  </label>
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="notify-markers" checked>
                    Notifications pour les nouveaux marqueurs
                  </label>
                </div>
                
                <div class="form-group">
                  <label for="notification-sound">Son des notifications</label>
                  <select id="notification-sound">
                    <option value="none">Aucun</option>
                    <option value="soft" selected>Doux</option>
                    <option value="medium">Moyen</option>
                    <option value="loud">Fort</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button id="save-preferences-btn" class="primary-btn">Enregistrer</button>
              <button id="reset-preferences-btn">Réinitialiser</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(prefModal);
      
      // Ajouter les styles
      const style = document.createElement('style');
      style.textContent = `
        .tabs {
          margin-bottom: 20px;
        }
        
        .tab-buttons {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 15px;
        }
        
        .tab-btn {
          padding: 8px 16px;
          background-color: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #666;
          cursor: pointer;
        }
        
        .tab-btn.active {
          border-bottom-color: var(--primary-color);
          color: var(--primary-color);
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .range-value {
          text-align: center;
          margin-top: 5px;
          font-size: 0.9rem;
          color: #666;
        }
      `;
      document.head.appendChild(style);
      
      // Gestionnaires d'événements pour les onglets
      const tabBtns = prefModal.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          // Désactiver tous les onglets
          tabBtns.forEach(b => b.classList.remove('active'));
          prefModal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          // Activer l'onglet cliqué
          btn.classList.add('active');
          const tabName = btn.dataset.tab;
          prefModal.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
        });
      });
      
      // Gestionnaire pour le curseur de zoom
      const zoomSlider = document.getElementById('default-zoom');
      const zoomValue = document.getElementById('zoom-value');
      
      zoomSlider?.addEventListener('input', () => {
        zoomValue.textContent = zoomSlider.value;
      });
      
      // Gestionnaire pour fermer le modal
      const closeBtn = prefModal.querySelector('.close-modal-btn');
      closeBtn?.addEventListener('click', () => {
        prefModal.classList.remove('active');
      });
      
      // Gestionnaire pour sauvegarder les préférences
      const saveBtn = document.getElementById('save-preferences-btn');
      saveBtn?.addEventListener('click', () => {
        this.savePreferences();
        prefModal.classList.remove('active');
      });
      
      // Gestionnaire pour réinitialiser les préférences
      const resetBtn = document.getElementById('reset-preferences-btn');
      resetBtn?.addEventListener('click', () => {
        this.resetPreferences();
      });
    }
    
    // Charger les préférences actuelles
    this.loadPreferences();
    
    // Afficher le modal
    document.getElementById('preferences-modal').classList.add('active');
  }
  
  /**
   * Ouvre le modal de gestion des utilisateurs (MJ uniquement)
   */
  openUserManagementModal() {
    if (this.currentUser.role !== 'gm') return;
    
    // Créer le modal de gestion des utilisateurs s'il n'existe pas déjà
    if (!document.getElementById('user-management-modal')) {
      const userModal = document.createElement('div');
      userModal.id = 'user-management-modal';
      userModal.className = 'modal';
      
      userModal.innerHTML = `
        <div class="modal-content large-modal">
          <div class="modal-header">
            <h3>Gestion des Utilisateurs</h3>
            <button class="close-modal-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="user-management-controls">
              <button id="add-user-btn" class="primary-btn">Ajouter un utilisateur</button>
              <div class="search-container">
                <input type="text" id="user-search" placeholder="Rechercher...">
              </div>
            </div>
            
            <div class="user-list-container">
              <table class="user-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Identifiant</th>
                    <th>Rôle</th>
                    <th>Dernière connexion</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="user-list">
                  <!-- Les utilisateurs seront ajoutés ici -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(userModal);
      
      // Ajouter les styles
      const style = document.createElement('style');
      style.textContent = `
        .large-modal {
          max-width: 800px;
          width: 90%;
        }
        
        .user-management-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .search-container {
          flex: 1;
          max-width: 300px;
          margin-left: 20px;
        }
        
        .search-container input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .user-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .user-table th, .user-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .user-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        
        .user-table tr:hover {
          background-color: #f9f9f9;
        }
        
        .user-actions {
          display: flex;
          gap: 5px;
        }
        
        .user-actions button {
          padding: 5px 10px;
          font-size: 0.8rem;
        }
        
        .edit-btn {
          background-color: #3498db;
        }
        
        .delete-btn {
          background-color: #e74c3c;
        }
      `;
      document.head.appendChild(style);
      
      // Gestionnaire pour fermer le modal
      const closeBtn = userModal.querySelector('.close-modal-btn');
      closeBtn?.addEventListener('click', () => {
        userModal.classList.remove('active');
      });
      
      // Gestionnaire pour ajouter un utilisateur
      const addUserBtn = document.getElementById('add-user-btn');
      addUserBtn?.addEventListener('click', () => {
        this.openAddUserModal();
      });
      
      // Gestionnaire pour la recherche
      const searchInput = document.getElementById('user-search');
      searchInput?.addEventListener('input', () => {
        this.filterUsers(searchInput.value);
      });
    }
    
    // Charger la liste des utilisateurs
    this.loadUserList();
    
    // Afficher le modal
    document.getElementById('user-management-modal').classList.add('active');
  }
  
  /**
   * Charge la liste des utilisateurs pour le modal de gestion
   */
  loadUserList() {
    const userList = document.getElementById('user-list');
    if (!userList) return;
    
    // Vider la liste
    userList.innerHTML = '';
    
    // Obtenir tous les utilisateurs (pour cette démo, on utilise les utilisateurs en dur)
    const hardcodedUsers = {
      'gm': { password: 'gm123', role: 'gm', name: 'Maître de Jeu', lastLogin: new Date().toISOString() },
      'player1': { password: 'player123', role: 'player', name: 'Joueur 1', lastLogin: new Date().toISOString() },
      'player2': { password: 'player123', role: 'player', name: 'Joueur 2', lastLogin: new Date(Date.now() - 86400000).toISOString() }
    };
    
    // Ajouter chaque utilisateur à la liste
    Object.entries(hardcodedUsers).forEach(([id, user]) => {
      const row = document.createElement('tr');
      row.dataset.userId = id;
      
      // Formater la date de dernière connexion
      const lastLogin = new Date(user.lastLogin);
      const formattedDate = lastLogin.toLocaleDateString() + ' ' + lastLogin.toLocaleTimeString();
      
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${id}</td>
        <td>${this.roles[user.role]?.name || user.role}</td>
        <td>${formattedDate}</td>
        <td>
          <div class="user-actions">
            <button class="edit-btn">Éditer</button>
            <button class="delete-btn">Supprimer</button>
          </div>
        </td>
      `;
      
      // Gestionnaires pour les boutons d'action
      const editBtn = row.querySelector('.edit-btn');
      editBtn?.addEventListener('click', () => {
        this.openEditUserModal(id);
      });
      
      const deleteBtn = row.querySelector('.delete-btn');
      deleteBtn?.addEventListener('click', () => {
        this.confirmDeleteUser(id);
      });
      
      userList.appendChild(row);
    });
  }
  
  /**
   * Filtre la liste des utilisateurs
   * @param {string} query - Terme de recherche
   */
  filterUsers(query) {
    const userRows = document.querySelectorAll('#user-list tr');
    
    query = query.toLowerCase();
    
    userRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }
  
  /**
   * Met à jour les permissions en fonction de l'utilisateur
   * @param {object} user - Utilisateur
   */
  updatePermissions(user) {
    // Mettre à jour les classes du corps
    document.body.classList.remove('is-gm', 'is-player');
    document.body.classList.add(`is-${user.role}`);
    
    // Mettre à jour la visibilité des éléments en fonction des permissions
    this.updateVisibility();
  }
  
  /**
   * Met à jour la visibilité des éléments en fonction des permissions
   */
  updateVisibility() {
    // Vérifier si le gestionnaire de visibilité existe
    if (window.VisibilityManager) {
      window.VisibilityManager.applyVisibilityFilters();
    }
  }
  
  /**
   * Sauvegarde les préférences utilisateur
   */
  savePreferences() {
    const preferences = {
      display: {
        theme: document.getElementById('theme-select').value,
        fontSize: document.getElementById('font-size').value,
        defaultZoom: document.getElementById('default-zoom').value
      },
      interaction: {
        confirmDeletions: document.getElementById('confirm-deletions').checked,
        autoSave: document.getElementById('auto-save').checked,
		doubleClickAction: document.getElementById('double-click-action').value
      },
      notifications: {
        notifyEvents: document.getElementById('notify-events').checked,
        notifyMarkers: document.getElementById('notify-markers').checked,
        notificationSound: document.getElementById('notification-sound').value
      }
    };
    
    // Stocker les préférences
    localStorage.setItem(`nexus-prefs-${this.currentUser.id}`, JSON.stringify(preferences));
    
    // Appliquer les préférences
    this.applyPreferences(preferences);
    
    alert('Préférences enregistrées avec succès.');
  }
  
  /**
   * Charge les préférences utilisateur
   */
  loadPreferences() {
    // Récupérer les préférences depuis le stockage local
    const storedPrefs = localStorage.getItem(`nexus-prefs-${this.currentUser.id}`);
    
    if (storedPrefs) {
      const preferences = JSON.parse(storedPrefs);
      
      // Remplir les champs du formulaire
      if (preferences.display) {
        document.getElementById('theme-select').value = preferences.display.theme || 'light';
        document.getElementById('font-size').value = preferences.display.fontSize || 'medium';
        document.getElementById('default-zoom').value = preferences.display.defaultZoom || '0';
        document.getElementById('zoom-value').textContent = preferences.display.defaultZoom || '0';
      }
      
      if (preferences.interaction) {
        document.getElementById('confirm-deletions').checked = preferences.interaction.confirmDeletions !== false;
        document.getElementById('auto-save').checked = preferences.interaction.autoSave !== false;
        document.getElementById('double-click-action').value = preferences.interaction.doubleClickAction || 'add-marker';
      }
      
      if (preferences.notifications) {
        document.getElementById('notify-events').checked = preferences.notifications.notifyEvents !== false;
        document.getElementById('notify-markers').checked = preferences.notifications.notifyMarkers !== false;
        document.getElementById('notification-sound').value = preferences.notifications.notificationSound || 'soft';
      }
      
      // Appliquer les préférences
      this.applyPreferences(preferences);
    }
  }
  
  /**
   * Réinitialise les préférences utilisateur
   */
  resetPreferences() {
    if (confirm('Voulez-vous vraiment réinitialiser toutes vos préférences ?')) {
      // Supprimer les préférences stockées
      localStorage.removeItem(`nexus-prefs-${this.currentUser.id}`);
      
      // Réinitialiser les champs du formulaire
      document.getElementById('theme-select').value = 'light';
      document.getElementById('font-size').value = 'medium';
      document.getElementById('default-zoom').value = '0';
      document.getElementById('zoom-value').textContent = '0';
      
      document.getElementById('confirm-deletions').checked = true;
      document.getElementById('auto-save').checked = true;
      document.getElementById('double-click-action').value = 'add-marker';
      
      document.getElementById('notify-events').checked = true;
      document.getElementById('notify-markers').checked = true;
      document.getElementById('notification-sound').value = 'soft';
      
      // Appliquer les préférences par défaut
      this.applyPreferences({
        display: {
          theme: 'light',
          fontSize: 'medium',
          defaultZoom: '0'
        },
        interaction: {
          confirmDeletions: true,
          autoSave: true,
          doubleClickAction: 'add-marker'
        },
        notifications: {
          notifyEvents: true,
          notifyMarkers: true,
          notificationSound: 'soft'
        }
      });
      
      alert('Préférences réinitialisées avec succès.');
    }
  }
  
  /**
   * Applique les préférences à l'interface
   * @param {object} preferences - Préférences utilisateur
   */
  applyPreferences(preferences) {
  if (!preferences) return;
  
  // Appliquer le thème
  if (preferences.display?.theme) {
    // Supprimer les classes de thème existantes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-contrast');
    
    // Ajouter la nouvelle classe de thème
    document.body.classList.add(`theme-${preferences.display.theme}`);
    
    // Si le thème est sombre ou à contraste élevé, ajouter un attribut data-theme
    document.documentElement.setAttribute('data-theme', preferences.display.theme);
    
    console.log(`Thème appliqué: ${preferences.display.theme}`);
  }
  
  // Appliquer la taille de police
  if (preferences.display?.fontSize) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${preferences.display.fontSize}`);
  }
  
  // Appliquer le zoom par défaut
  if (preferences.display?.defaultZoom && this.mapLoader?.map) {
    this.mapLoader.map.setZoom(parseFloat(preferences.display.defaultZoom));
  }
  
  // Dispatcher un événement pour que les autres modules puissent réagir
  EventBus.publish('preferences:updated', {
    preferences: preferences
  });
}
 
  /**
   * Ouvre le modal d'ajout d'utilisateur
   */
  openAddUserModal() {
    // Créer le modal d'ajout d'utilisateur s'il n'existe pas déjà
    if (!document.getElementById('add-user-modal')) {
      const addUserModal = document.createElement('div');
      addUserModal.id = 'add-user-modal';
      addUserModal.className = 'modal';
      
      addUserModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Ajouter un utilisateur</h3>
            <button class="close-modal-btn">×</button>
          </div>
          <div class="modal-body">
            <form id="add-user-form">
              <div class="form-group">
                <label for="add-user-name">Nom</label>
                <input type="text" id="add-user-name" required>
              </div>
              <div class="form-group">
                <label for="add-user-username">Identifiant</label>
                <input type="text" id="add-user-username" required>
              </div>
              <div class="form-group">
                <label for="add-user-password">Mot de passe</label>
                <input type="password" id="add-user-password" required>
              </div>
              <div class="form-group">
                <label for="add-user-role">Rôle</label>
                <select id="add-user-role" required>
                  <option value="gm">Maître de Jeu</option>
                  <option value="player" selected>Joueur</option>
                </select>
              </div>
              <div id="add-user-error" class="error-message"></div>
              <div class="form-actions">
                <button type="submit" class="primary-btn">Ajouter</button>
                <button type="button" class="cancel-btn">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      document.body.appendChild(addUserModal);
      
      // Gestionnaire pour fermer le modal
      const closeBtn = addUserModal.querySelector('.close-modal-btn');
      const cancelBtn = addUserModal.querySelector('.cancel-btn');
      
      [closeBtn, cancelBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
          addUserModal.classList.remove('active');
        });
      });
      
      // Gestionnaire pour le formulaire
      const addUserForm = document.getElementById('add-user-form');
      addUserForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('add-user-name').value;
        const username = document.getElementById('add-user-username').value;
        const password = document.getElementById('add-user-password').value;
        const role = document.getElementById('add-user-role').value;
        
        // Simuler l'ajout d'un utilisateur
        alert(`Utilisateur ajouté: ${name} (${username}) avec le rôle ${role}`);
        
        // Fermer le modal
        addUserModal.classList.remove('active');
        
        // Recharger la liste des utilisateurs
        this.loadUserList();
      });
    }
    
    // Réinitialiser le formulaire
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
      addUserForm.reset();
    }
    
    // Afficher le modal
    document.getElementById('add-user-modal').classList.add('active');
  }
  
  /**
   * Ouvre le modal d'édition d'utilisateur
   * @param {string} userId - ID de l'utilisateur à éditer
   */
  openEditUserModal(userId) {
    // Simuler la récupération des données utilisateur (en dur pour cette démo)
    const hardcodedUsers = {
      'gm': { password: 'gm123', role: 'gm', name: 'Maître de Jeu' },
      'player1': { password: 'player123', role: 'player', name: 'Joueur 1' },
      'player2': { password: 'player123', role: 'player', name: 'Joueur 2' }
    };
    
    const user = hardcodedUsers[userId];
    if (!user) return;
    
    // Créer le modal d'édition s'il n'existe pas déjà
    if (!document.getElementById('edit-user-modal')) {
      const editUserModal = document.createElement('div');
      editUserModal.id = 'edit-user-modal';
      editUserModal.className = 'modal';
      
      editUserModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Modifier un utilisateur</h3>
            <button class="close-modal-btn">×</button>
          </div>
          <div class="modal-body">
            <form id="edit-user-form">
              <input type="hidden" id="edit-user-id">
              <div class="form-group">
                <label for="edit-user-name">Nom</label>
                <input type="text" id="edit-user-name" required>
              </div>
              <div class="form-group">
                <label for="edit-user-username">Identifiant</label>
                <input type="text" id="edit-user-username" disabled>
              </div>
              <div class="form-group">
                <label for="edit-user-password">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <input type="password" id="edit-user-password">
              </div>
              <div class="form-group">
                <label for="edit-user-role">Rôle</label>
                <select id="edit-user-role" required>
                  <option value="gm">Maître de Jeu</option>
                  <option value="player">Joueur</option>
                </select>
              </div>
              <div id="edit-user-error" class="error-message"></div>
              <div class="form-actions">
                <button type="submit" class="primary-btn">Enregistrer</button>
                <button type="button" class="cancel-btn">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      document.body.appendChild(editUserModal);
      
      // Gestionnaire pour fermer le modal
      const closeBtn = editUserModal.querySelector('.close-modal-btn');
      const cancelBtn = editUserModal.querySelector('.cancel-btn');
      
      [closeBtn, cancelBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
          editUserModal.classList.remove('active');
        });
      });
      
      // Gestionnaire pour le formulaire
      const editUserForm = document.getElementById('edit-user-form');
      editUserForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const password = document.getElementById('edit-user-password').value;
        const role = document.getElementById('edit-user-role').value;
        
        // Simuler la modification d'un utilisateur
        alert(`Utilisateur modifié: ${name} (${id}) avec le rôle ${role}`);
        
        // Fermer le modal
        editUserModal.classList.remove('active');
        
        // Recharger la liste des utilisateurs
        this.loadUserList();
      });
    }
    
    // Remplir le formulaire avec les données de l'utilisateur
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-username').value = userId;
    document.getElementById('edit-user-password').value = '';
    document.getElementById('edit-user-role').value = user.role;
    
    // Afficher le modal
    document.getElementById('edit-user-modal').classList.add('active');
  }
  
  /**
   * Demande confirmation pour supprimer un utilisateur
   * @param {string} userId - ID de l'utilisateur à supprimer
   */
  confirmDeleteUser(userId) {
    if (confirm(`Voulez-vous vraiment supprimer l'utilisateur "${userId}" ?`)) {
      // Simuler la suppression
      alert(`Utilisateur ${userId} supprimé avec succès`);
      
      // Recharger la liste des utilisateurs
      this.loadUserList();
    }
  }
  
  /**
   * Enregistre la session utilisateur
   * @param {object} user - Utilisateur
   */
  saveSession(user) {
    localStorage.setItem('nexus-auth-session', JSON.stringify({
      userId: user.id,
      timestamp: new Date().getTime()
    }));
  }
  
  /**
   * Restaure la session utilisateur
   * @returns {boolean} - Succès ou échec
   */
  restoreSession() {
    const session = localStorage.getItem('nexus-auth-session');
    if (!session) return false;
    
    try {
      const { userId, timestamp } = JSON.parse(session);
      
      // Vérifier si la session n'est pas expirée (1 semaine)
      const now = new Date().getTime();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      
      if (now - timestamp > weekMs) {
        // Session expirée, la supprimer
        localStorage.removeItem('nexus-auth-session');
        return false;
      }
      
      // Simuler une reconnexion silencieuse
      this.authenticate(userId, 'passwordNotNeeded', true)
        .then(success => {
          if (success) {
            // Session restaurée avec succès
            console.log('Session utilisateur restaurée:', userId);
          } else {
            // Échec de la restauration, supprimer la session
            localStorage.removeItem('nexus-auth-session');
          }
        });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la restauration de la session:', error);
      localStorage.removeItem('nexus-auth-session');
      return false;
    }
  }
  
  /**
   * Déconnecte l'utilisateur actuel
   */
  logout() {
    // Supprimer la session
    localStorage.removeItem('nexus-auth-session');
    
    // Réinitialiser l'utilisateur actuel
    this.currentUser = null;
    
    // Afficher le modal de connexion
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
      loginModal.classList.add('active');
    }
    
    // Dispatcher un événement
    EventBus.publish('auth:user:logout', {});
    
    // Mettre à jour les classes du body
    document.body.classList.remove('is-gm', 'is-player');
  }
  
  /**
   * Affiche le modal de connexion
   */
  showLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
      loginModal.classList.add('active');
    }
  }
}

// Initialiser le gestionnaire d'authentification et l'exporter globalement
window.authManager = new AuthManager();

// Exécuter au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Si aucun utilisateur n'est connecté, afficher le modal de connexion
  if (!window.authManager.currentUser) {
    window.authManager.showLoginModal();
  }
});