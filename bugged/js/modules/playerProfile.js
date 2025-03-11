/**
 * PlayerProfile - Module de gestion de profil utilisateur pour Nexus
 * Permet aux utilisateurs de personnaliser leur profil et préférences
 */
class PlayerProfile {
  /**
   * Initialise le gestionnaire de profil
   * @param {AuthManager} authManager - Référence au gestionnaire d'authentification
   */
  constructor(authManager) {
    this.authManager = authManager;
    this.profiles = {};
    
    // Charger les profils depuis le stockage local
    this.loadProfiles();
    
    // Créer le modal de profil
    this.initProfileModal();
    
    // S'abonner aux événements
    this.setupEventListeners();
  }
  
  /**
   * Charge les profils depuis le stockage local
   */
  loadProfiles() {
    const savedProfiles = localStorage.getItem('nexus-player-profiles');
    if (savedProfiles) {
      try {
        this.profiles = JSON.parse(savedProfiles);
      } catch (error) {
        console.error("Erreur lors du chargement des profils:", error);
        this.profiles = {};
      }
    }
    
    // S'assurer que le profil de l'utilisateur actuel existe
    if (this.authManager.currentUser) {
      this.getProfile(this.authManager.currentUser.id);
    }
  }
  
  /**
   * Sauvegarde les profils dans le stockage local
   */
  saveProfiles() {
    localStorage.setItem('nexus-player-profiles', JSON.stringify(this.profiles));
  }
  
  /**
   * Récupère le profil d'un utilisateur, en le créant si nécessaire
   * @param {string} userId - ID de l'utilisateur
   * @returns {object} - Profil de l'utilisateur
   */
  getProfile(userId) {
    if (!this.profiles[userId]) {
      // Créer un profil par défaut
      const user = this.authManager.currentUser;
      const defaultName = user ? user.name : 'Utilisateur';
      const role = user ? user.role : 'player';
      
      // Palette de couleurs selon le rôle
      const defaultColor = role === 'gm' ? '#9C27B0' : '#4CAF50';
      
      this.profiles[userId] = {
        userId: userId,
        displayName: defaultName,
        bio: '',
        avatarColor: defaultColor,
        markerColor: defaultColor,
        markerIcon: 'default',
        stats: {
          markers: 0,
          notes: 0,
          sessionsPlayed: 0,
          lastActiveDate: new Date().toISOString()
        },
        preferences: {
          mapView: {
            defaultZoom: 0,
            showLabels: true,
            showGrid: false
          },
          notifications: {
            enableSound: true,
            enablePopups: true
          }
        },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      this.saveProfiles();
    }
    
    return this.profiles[userId];
  }
  
  /**
   * Met à jour le profil d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {object} updates - Mises à jour à appliquer
   * @returns {object} - Profil mis à jour
   */
  updateProfile(userId, updates) {
    const profile = this.getProfile(userId);
    
    // Appliquer les mises à jour
    Object.assign(profile, updates);
    
    // Mettre à jour la date de modification
    profile.lastModified = new Date().toISOString();
    
    // Sauvegarder les changements
    this.saveProfiles();
    
    // Publier un événement
    EventBus.publish('profile:updated', {
      userId: userId,
      profile: profile
    });
    
    return profile;
  }
  
  /**
   * Initialise le modal de profil
   */
  initProfileModal() {
    // Créer le modal s'il n'existe pas déjà
    if (!document.getElementById('profile-modal')) {
      const profileModal = document.createElement('div');
      profileModal.id = 'profile-modal';
      profileModal.className = 'modal';
      
      profileModal.innerHTML = `
        <div class="modal-content profile-modal">
          <div class="modal-header">
            <h3>Profil utilisateur</h3>
            <button class="close-modal-btn">×</button>
          </div>
          <div class="modal-body">
            <!-- Section informations personnelles -->
            <div class="profile-header">
              <div class="avatar-container">
                <div class="avatar" id="profile-avatar">
                  <span id="profile-initial">?</span>
                </div>
                <div class="avatar-colors">
                  <div class="color-option" style="background-color: #4CAF50" data-color="#4CAF50"></div>
                  <div class="color-option" style="background-color: #2196F3" data-color="#2196F3"></div>
                  <div class="color-option" style="background-color: #9C27B0" data-color="#9C27B0"></div>
                  <div class="color-option" style="background-color: #F44336" data-color="#F44336"></div>
                  <div class="color-option" style="background-color: #FF9800" data-color="#FF9800"></div>
                </div>
              </div>
              <div class="profile-info">
                <div class="form-group">
                  <label for="profile-name">Nom d'affichage</label>
                  <input type="text" id="profile-name" placeholder="Votre nom">
                </div>
                <div class="form-group">
                  <label for="profile-role">Rôle</label>
                  <input type="text" id="profile-role" disabled>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="profile-bio">Biographie</label>
              <textarea id="profile-bio" rows="3" placeholder="Décrivez votre personnage..."></textarea>
            </div>
            
            <!-- Section apparence -->
            <div class="section-divider">
              <h4>Apparence des marqueurs</h4>
            </div>
            
            <div class="marker-options">
              <div class="form-group">
                <label for="marker-color">Couleur des marqueurs</label>
                <input type="color" id="marker-color" value="#4CAF50">
              </div>
              
              <div class="form-group">
                <label for="marker-icon">Icône par défaut</label>
                <select id="marker-icon">
                  <option value="default">Standard</option>
                  <option value="star">Étoile</option>
                  <option value="pin">Épingle</option>
                  <option value="flag">Drapeau</option>
                  <option value="home">Maison</option>
                </select>
              </div>
            </div>
            
            <div class="marker-preview">
              <div class="preview-container">
                <div id="marker-preview-icon" class="marker-icon"></div>
              </div>
            </div>
            
            <!-- Section statistiques -->
            <div class="section-divider">
              <h4>Statistiques</h4>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">📍</div>
                <div class="stat-value" id="stat-markers">0</div>
                <div class="stat-label">Marqueurs créés</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value" id="stat-notes">0</div>
                <div class="stat-label">Notes ajoutées</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🎲</div>
                <div class="stat-value" id="stat-sessions">0</div>
                <div class="stat-label">Sessions jouées</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🗓️</div>
                <div class="stat-value" id="stat-last-active">-</div>
                <div class="stat-label">Dernière activité</div>
              </div>
            </div>
            
            <div class="stats-actions">
              <button id="reset-stats-btn" class="secondary-btn">Réinitialiser les statistiques</button>
            </div>
            
            <div class="form-actions">
              <button id="save-profile-btn" class="primary-btn">Enregistrer</button>
              <button id="cancel-profile-btn" class="secondary-btn">Annuler</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(profileModal);
      
      // Ajouter les styles adaptés à une page unique sans onglets
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .profile-modal {
          max-width: 600px;
        }
        
        .profile-header {
          display: flex;
          margin-bottom: 20px;
          gap: 20px;
        }
        
        .avatar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #4CAF50;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
        }
        
        .avatar-colors {
          display: flex;
          gap: 5px;
          margin-top: 5px;
        }
        
        .color-option {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.2s;
        }
        
        .color-option:hover, .color-option.active {
          transform: scale(1.2);
          border-color: #fff;
          box-shadow: 0 0 0 1px #000;
        }
        
        .profile-info {
          flex: 1;
        }
        
        .section-divider {
          margin: 25px 0 15px;
          border-bottom: 1px solid #eee;
        }
        
        .section-divider h4 {
          margin: 0 0 10px;
          color: var(--primary-color);
        }
        
        .marker-options {
          display: flex;
          gap: 15px;
        }
        
        .marker-options .form-group {
          flex: 1;
        }
        
        .marker-preview {
          margin-top: 15px;
          text-align: center;
        }
        
        .preview-container {
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-top: 10px;
        }
        
        .marker-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #4CAF50;
          position: relative;
        }
        
        .marker-icon:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #4CAF50;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--primary-color);
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #666;
        }
        
        .stats-actions {
          text-align: center;
          margin-top: 20px;
          margin-bottom: 30px;
        }
        
        .secondary-btn {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .form-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Initialiser les gestionnaires d'événements
    this.setupProfileModalHandlers();
  }
  
  /**
   * Configure les écouteurs d'événements pour le profil
   */
  setupEventListeners() {
    // S'abonner aux événements d'authentification
    EventBus.subscribe('auth:user:changed', (data) => {
      // Mettre à jour les statistiques
      if (data.user) {
        const profile = this.getProfile(data.user.id);
        profile.stats.lastActiveDate = new Date().toISOString();
        this.saveProfiles();
      }
    });
    
    // S'abonner à la création de marqueurs
    EventBus.subscribe('marker:created', (data) => {
      const currentUser = this.authManager.currentUser;
      if (currentUser && data.marker.createdBy === currentUser.id) {
        const profile = this.getProfile(currentUser.id);
        profile.stats.markers++;
        this.saveProfiles();
      }
    });
    
    // S'abonner à la création de notes
    EventBus.subscribe('note:created', (data) => {
      const currentUser = this.authManager.currentUser;
      if (currentUser && data.note.createdBy === currentUser.id) {
        const profile = this.getProfile(currentUser.id);
        profile.stats.notes++;
        this.saveProfiles();
      }
    });
  }
  
  /**
   * Configure les gestionnaires d'événements pour le modal de profil
   */
  setupProfileModalHandlers() {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) return;
    
    // Gestion des couleurs d'avatar
    const colorOptions = profileModal.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Mettre à jour la classe active
        colorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        
        // Appliquer la couleur à l'avatar
        const color = option.dataset.color;
        document.getElementById('profile-avatar').style.backgroundColor = color;
      });
    });
    
    // Prévisualisation du marqueur
    const markerColorInput = document.getElementById('marker-color');
    const markerIconSelect = document.getElementById('marker-icon');
    const markerPreview = document.getElementById('marker-preview-icon');
    
    const updateMarkerPreview = () => {
      if (markerPreview) {
        markerPreview.style.backgroundColor = markerColorInput.value;
      }
    };
    
    markerColorInput?.addEventListener('input', updateMarkerPreview);
    markerIconSelect?.addEventListener('change', updateMarkerPreview);
    
    // Fermer le modal
    const closeBtn = profileModal.querySelector('.close-modal-btn');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        profileModal.classList.remove('active');
      });
    });
    
    // Sauvegarder le profil
    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn?.addEventListener('click', () => {
      this.saveProfileChanges();
      profileModal.classList.remove('active');
    });
    
    // Réinitialiser les statistiques
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    resetStatsBtn?.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment réinitialiser vos statistiques ?')) {
        this.resetProfileStats();
      }
    });
  }
  
  /**
   * Ouvre le modal de profil
   */
  openProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!this.authManager.currentUser) {
      alert('Vous devez être connecté pour accéder à votre profil.');
      return;
    }
    
    // Charger les données du profil
    this.loadProfileData();
    
    // Afficher le modal
    profileModal.classList.add('active');
  }
  
  /**
   * Charge les données du profil dans le formulaire
   */
  loadProfileData() {
    const currentUser = this.authManager.currentUser;
    if (!currentUser) return;
    
    const profile = this.getProfile(currentUser.id);
    
    // Informations personnelles
    document.getElementById('profile-name').value = profile.displayName || currentUser.name;
    document.getElementById('profile-role').value = this.authManager.roles[currentUser.role]?.name || currentUser.role;
    document.getElementById('profile-bio').value = profile.bio || '';
    
    // Avatar
    const avatarEl = document.getElementById('profile-avatar');
    const initialEl = document.getElementById('profile-initial');
    
    if (avatarEl) {
      avatarEl.style.backgroundColor = profile.avatarColor;
    }
    
    if (initialEl) {
      initialEl.textContent = (profile.displayName || currentUser.name).charAt(0);
    }
    
    // Marquer la couleur active
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.color === profile.avatarColor);
    });
    
    // Apparence
    document.getElementById('marker-color').value = profile.markerColor;
    document.getElementById('marker-icon').value = profile.markerIcon;
    
    // Mise à jour de la prévisualisation
    const markerPreview = document.getElementById('marker-preview-icon');
    if (markerPreview) {
      markerPreview.style.backgroundColor = profile.markerColor;
    }
    
    // Statistiques
    document.getElementById('stat-markers').textContent = profile.stats.markers;
    document.getElementById('stat-notes').textContent = profile.stats.notes;
    document.getElementById('stat-sessions').textContent = profile.stats.sessionsPlayed;
    
    // Formatter la date de dernière activité
    const lastActive = new Date(profile.stats.lastActiveDate);
    document.getElementById('stat-last-active').textContent = lastActive.toLocaleDateString();
  }
  
  /**
   * Sauvegarde les modifications du profil
   */
  saveProfileChanges() {
    const currentUser = this.authManager.currentUser;
    if (!currentUser) return;
    
    // Récupérer les valeurs du formulaire
    const displayName = document.getElementById('profile-name').value;
    const bio = document.getElementById('profile-bio').value;
    
    // Récupérer la couleur d'avatar sélectionnée
    let avatarColor = '#4CAF50';
    const activeColorOption = document.querySelector('.color-option.active');
    if (activeColorOption) {
      avatarColor = activeColorOption.dataset.color;
    }
    
    // Récupérer les préférences de marqueur
    const markerColor = document.getElementById('marker-color').value;
    const markerIcon = document.getElementById('marker-icon').value;
    
    // Mettre à jour le profil
    this.updateProfile(currentUser.id, {
      displayName,
      bio,
      avatarColor,
      markerColor,
      markerIcon
    });
    
    // Afficher un message de confirmation
    alert('Profil mis à jour avec succès !');
  }
  
  /**
   * Réinitialise les statistiques du profil
   */
  resetProfileStats() {
    const currentUser = this.authManager.currentUser;
    if (!currentUser) return;
    
    const profile = this.getProfile(currentUser.id);
    
    // Réinitialiser les statistiques
    profile.stats = {
      markers: 0,
      notes: 0,
      sessionsPlayed: 0,
      lastActiveDate: new Date().toISOString()
    };
    
    // Sauvegarder les changements
    this.saveProfiles();
    
    // Mettre à jour l'affichage
    this.loadProfileData();
    
    // Afficher un message de confirmation
    alert('Statistiques réinitialisées avec succès !');
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
window.PlayerProfile = PlayerProfile;

// Initialiser le profil utilisateur si l'AuthManager est disponible
document.addEventListener('DOMContentLoaded', () => {
  if (window.authManager) {
    window.playerProfile = new PlayerProfile(window.authManager);
  }
});

/**
 * Ajoutez ce code à la fin de votre fichier playerProfile.js pour corriger
 * la taille du modal de profil et assurer qu'il s'adapte à l'écran
 */

// Ajouter des styles supplémentaires
document.addEventListener('DOMContentLoaded', () => {
  // Créer un élément de style
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* Ajustements pour le modal de profil */
    #profile-modal .modal-content {
      max-height: 90vh;
      overflow-y: auto;
      margin: 5vh auto;
    }
    
    /* Réduire légèrement les espaces pour être plus compact */
    #profile-modal .modal-body {
      padding: 15px;
    }
    
    #profile-modal .profile-header {
      gap: 15px;
      margin-bottom: 15px;
    }
    
    #profile-modal .avatar {
      width: 70px;
      height: 70px;
    }
    
    #profile-modal .form-group {
      margin-bottom: 12px;
    }
    
    #profile-modal .avatar-colors {
      margin-top: 3px;
    }
    
    /* Réduction de la taille des stats pour gagner de l'espace */
    #profile-modal .stats-grid {
      gap: 10px;
    }
    
    #profile-modal .stat-card {
      padding: 12px 10px;
    }
    
    #profile-modal .stat-value {
      font-size: 1.5rem;
    }
    
    /* Assurer que les boutons de sauvegarde restent visibles */
    #profile-modal .form-actions {
      position: sticky;
      bottom: 0;
      background-color: white;
      padding: 10px 0;
      margin-bottom: 0;
      z-index: 10;
    }
    
    /* Style pour les séparateurs de section */
    #profile-modal .section-divider {
      background-color: white;
      z-index: 5;
    }
  `;
  document.head.appendChild(styleEl);
  
  // Ajouter un gestionnaire pour ajuster la modal selon la taille de l'écran
  const adjustProfileModal = () => {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) return;
    
    const modalContent = profileModal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Ajuster la hauteur maximale selon la hauteur de la fenêtre
    const windowHeight = window.innerHeight;
    modalContent.style.maxHeight = `${windowHeight * 0.9}px`;
    
    // Si la fenêtre est petite, réduire davantage les marges
    if (windowHeight < 600) {
      modalContent.style.margin = '2vh auto';
    }
  };
  
  // S'assurer que la modal est bien dimensionnée lors de l'ouverture
  const originalOpenProfileModal = window.PlayerProfile.prototype.openProfileModal;
  if (window.PlayerProfile && originalOpenProfileModal) {
    window.PlayerProfile.prototype.openProfileModal = function() {
      originalOpenProfileModal.call(this);
      setTimeout(adjustProfileModal, 10);
    };
  }
  
  // Ajuster la taille lors du redimensionnement de la fenêtre
  window.addEventListener('resize', adjustProfileModal);
  
  // Appliquer l'ajustement maintenant si la modal est déjà présente
  adjustProfileModal();
});
