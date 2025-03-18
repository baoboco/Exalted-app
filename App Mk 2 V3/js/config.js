/**
 * Configuration principale pour la carte interactive de Nexus
 * Ce fichier contient toutes les variables de configuration globales.
 * Version 4.1 - CORRIGÉE
 */

// Configuration principale
const CONFIG = {
    // Informations sur l'utilisateur actuel
    utilisateur: {
        id: "user-1",
        nom: "Joueur",
        role: "joueur", // "mj" ou "joueur"
        permissions: {
            voirTout: false,
            modifierCartes: false,
            creerMarqueursOfficiels: false
        }
    },
    
    // Métadonnées de l'application
    version: "4.2.0", // Version corrigée
    nom: "Carte Interactive de Nexus",
    description: "Carte interactive multi-niveaux pour la ville de Nexus dans l'univers d'Exalted",
    
    // Paramètres de la carte
    carte: {
        niveauActuel: 0,
        niveauxDisponibles: [
            {
                id: "surface",
                nom: "Surface",
                ordre: 0,
                fichier: "cartes/nexus-niveau-0.svg",
                visible: true
            },
            {
                id: "souterrain-1",
                nom: "Premier sous-sol",
                ordre: -1,
                fichier: "cartes/nexus-niveau-1.svg",
                visible: true
            },
            {
                id: "egouts",
                nom: "Égouts",
                ordre: -2,
                fichier: "cartes/nexus-niveau-2.svg",
                visible: true
            },
            {
                id: "ruines",
                nom: "Ruines anciennes",
                ordre: -3,
                fichier: "cartes/nexus-niveau-3.svg",
                visible: true
            }
        ],
        cheminNiveaux: [
            "cartes/nexus-niveau-0.svg",  // Surface (niveau 0)
            "cartes/nexus-niveau-1.svg",  // Souterrains (niveau -1)
            "cartes/nexus-niveau-2.svg",  // Égouts (niveau -2)
            "cartes/nexus-niveau-3.svg"   // Ruines anciennes (niveau -3)
        ],
        dimensions: {
            largeur: 2000,
            hauteur: 2000
        },
        zoom: {
            min: 0.5,
            max: 2,
            defaut: 1
        }
    },
    
    // Définition des sous-cartes disponibles
    sousCartes: {
        "taverne-dragon": {
            nom: "Taverne du Dragon Ivre",
            chemin: "cartes/lieux/taverne-dragon.svg",
            parent: {
                niveau: 0,
                position: { x: 540, y: 400 }
            },
            visible: true,
            description: "Une taverne animée au cœur du quartier marchand."
        },
        "temple-lune": {
            nom: "Temple de la Lune",
            chemin: "cartes/lieux/temple-lune.svg",
            parent: {
                niveau: 0,
                position: { x: 1450, y: 400 }
            },
            visible: true,
            description: "Un lieu sacré dédié au culte de la Lune."
        }
    },
    
    // Configuration des performances
    performance: {
        limiteFPS: 60,
        optimisationZoom: true,
        chargerMarqueursParNiveau: true
    },
    
    // Options de débogage
    debug: {
        actif: true, // Activé pour aider au dépannage
        afficherCoordonees: true,
        loggerEvenements: true, // Log plus détaillé pour identifier les problèmes
        afficherErreurs: true
    },
    
    // Chemins vers les ressources
    ressources: {
        icones: {
            dossierBase: "assets/icons/",
            dossierAutres: "assets/icons/autres icones/",
            extension: ".svg",
            fallback: "assets/icons/secret.svg" // Icône par défaut si celle demandée n'existe pas
        },
        cartes: {
            dossierNiveaux: "cartes/",
            dossierLieux: "cartes/lieux/"
        }
    }
};

// Récupérer les préférences sauvegardées dans le stockage local
function chargerConfigurationLocale() {
    try {
        // Récupérer le rôle sauvegardé
        const roleSauvegarde = localStorage.getItem('nexus-role');
        if (roleSauvegarde) {
            CONFIG.utilisateur.role = roleSauvegarde;
            
            // Mettre à jour les permissions en fonction du rôle
            if (roleSauvegarde === 'mj') {
                CONFIG.utilisateur.permissions.voirTout = true;
                CONFIG.utilisateur.permissions.modifierCartes = true;
                CONFIG.utilisateur.permissions.creerMarqueursOfficiels = true;
            }
        }
        
        // Récupérer le niveau actuel sauvegardé
        const niveauSauvegarde = localStorage.getItem('nexus-niveau');
        if (niveauSauvegarde) {
            const niveau = parseInt(niveauSauvegarde);
            if (!isNaN(niveau)) {
                CONFIG.carte.niveauActuel = niveau;
            }
        }
        
        // Récupérer la configuration de débogage
        const debugSauvegarde = localStorage.getItem('nexus-debug');
        if (debugSauvegarde) {
            try {
                const debugOptions = JSON.parse(debugSauvegarde);
                CONFIG.debug = {...CONFIG.debug, ...debugOptions};
            } catch(e) {
                console.error("Erreur lors du chargement des options de débogage:", e);
            }
        }
        
        // Récupérer la configuration complète si elle existe
        const configSauvegardee = localStorage.getItem('nexus-config');
        if (configSauvegardee) {
            try {
                const configObj = JSON.parse(configSauvegardee);
                
                // Fusionner les configurations tout en préservant l'utilisateur actuel
                const userActuel = CONFIG.utilisateur;
                
                // Empêcher l'écrasement des paramètres essentiels
                const cheminNiveauxActuel = CONFIG.carte.cheminNiveaux;
                const niveauxDisponiblesActuel = CONFIG.carte.niveauxDisponibles;
                
                Object.assign(CONFIG, configObj);
                
                // Restaurer les paramètres essentiels
                CONFIG.utilisateur = userActuel;
                CONFIG.carte.cheminNiveaux = cheminNiveauxActuel;
                CONFIG.carte.niveauxDisponibles = niveauxDisponiblesActuel;
                
            } catch(e) {
                console.error("Erreur lors du chargement de la configuration complète:", e);
            }
        }
        
        console.log("Configuration locale chargée avec succès");
    } catch(e) {
        console.error("Erreur lors du chargement de la configuration locale:", e);
    }
}

// Sauvegarder la configuration dans le stockage local
function sauvegarderConfiguration() {
    try {
        localStorage.setItem('nexus-config', JSON.stringify(CONFIG));
        localStorage.setItem('nexus-role', CONFIG.utilisateur.role);
        localStorage.setItem('nexus-niveau', CONFIG.carte.niveauActuel);
        localStorage.setItem('nexus-debug', JSON.stringify(CONFIG.debug));
        
        console.log("Configuration sauvegardée avec succès");
        return true;
    } catch(e) {
        console.error("Erreur lors de la sauvegarde de la configuration:", e);
        return false;
    }
}

// Fonction utilitaire pour vérifier si l'utilisateur est MJ
function estMJ() {
    return CONFIG.utilisateur.role === 'mj';
}

// Fonction pour journaliser les événements en mode débogage
function logDebug(message, data) {
    if (CONFIG.debug.actif && CONFIG.debug.loggerEvenements) {
        if (data) {
            console.log(`[DEBUG] ${message}`, data);
        } else {
            console.log(`[DEBUG] ${message}`);
        }
    }
}

// Fonction pour afficher une alerte
function afficherAlerte(message, type = 'info') {
    if (!message) return;
    
    // Créer l'élément d'alerte s'il n'existe pas
    const alertesContainer = document.getElementById('alertes');
    if (!alertesContainer) {
        const newContainer = document.createElement('div');
        newContainer.id = 'alertes';
        newContainer.className = 'position-fixed top-0 end-0 p-3';
        newContainer.style.zIndex = '1100';
        document.body.appendChild(newContainer);
    }
    
    const alertContainer = document.getElementById('alertes');
    
    // Créer l'alerte
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    `;
    
    // Ajouter l'alerte au conteneur
    alertContainer.appendChild(alertDiv);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Charger la configuration locale au démarrage
document.addEventListener('DOMContentLoaded', function() {
    chargerConfigurationLocale();
    
    // Log de démarrage
    if (CONFIG.debug.actif) {
        console.log("Démarrage de l'application:", CONFIG);
    }
});