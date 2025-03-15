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
    
    // Paramètres de la carte
    carte: {
        niveauActuel: 0,
        cheminNiveaux: [
            "cartes/nexus-niveau-0.svg",  // Surface
            "cartes/nexus-niveau-1.svg",  // Souterrains
            //"cartes/nexus-niveau-2.svg",  // Égouts (à activer quand disponible)
            //"cartes/nexus-niveau-3.svg",  // Ruines anciennes (à activer quand disponible)
        ],
        zoom: {
            min: 0.5,
            max: 2,
            defaut: 1
        }
    }
};