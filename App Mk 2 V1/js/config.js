/**
 * Configuration principale pour la carte interactive de Nexus
 * Ce fichier contient toutes les variables de configuration globales.
 * Version 4.0
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
    version: "4.0.0",
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
                fichier: "nexus-niveau-0.svg",
                visible: true
            },
            {
                id: "souterrain-1",
                nom: "Premier sous-sol",
                ordre: -1,
                fichier: "nexus-niveau-1.svg",
                visible: true
            },
            {
                id: "egouts",
                nom: "Égouts",
                ordre: -2,
                fichier: "nexus-niveau-2.svg",
                visible: false
            },
            {
                id: "ruines",
                nom: "Ruines anciennes",
                ordre: -3,
                fichier: "nexus-niveau-3.svg",
                visible: false
            }
        ],
        cheminNiveaux: [
            "cartes/nexus-niveau-0.svg",  // Surface
            "cartes/nexus-niveau-1.svg",  // Souterrains
            //"cartes/nexus-niveau-2.svg",  // Égouts (à activer quand disponible)
            //"cartes/nexus-niveau-3.svg",  // Ruines anciennes (à activer quand disponible)
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
    
    // Configuration des performances
    performance: {
        limiteFPS: 60,
        optimisationZoom: true,
        chargerMarqueursParNiveau: true
    },
    
    // Options de débogage
    debug: {
        actif: false,
        afficherCoordonees: false,
        loggerEvenements: false
    },
    
    // Chemins vers les ressources
    ressources: {
        icones: {
            dossierBase: "assets/icons/",
            dossierAutres: "assets/icons/autres-icones/",
            extension: ".svg",
            fallback: "assets/icons/marqueur-defaut.svg"
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
            if (!isNaN(niveau) && niveau >= 0 && niveau < CONFIG.carte.cheminNiveaux.length) {
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
                Object.assign(CONFIG, configObj);
                CONFIG.utilisateur = userActuel;
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

// Charger la configuration locale au démarrage
document.addEventListener('DOMContentLoaded', chargerConfigurationLocale);