/**
 * Gestion des marqueurs pour la carte de Nexus
 * Ce fichier contient les fonctions pour créer, modifier et supprimer les marqueurs sur la carte
 * Version 3.0 - Utilisation exclusive des icônes SVG personnalisées
 */

// Créer un marqueur sur la carte
function creerMarqueur(donnees) {
    // Vérifier d'abord la visibilité
    if (!verifierVisibilite(donnees.visibilite)) {
        if (CONFIG.debug && CONFIG.debug.actif) {
            console.log(`Marqueur ${donnees.id} non affiché car non visible pour cet utilisateur`);
        }
        return null;
    }
    
    // Vérifier s'il s'agit d'un connecteur entre niveaux
    const estConnecteur = donnees.connecteur && donnees.connecteur.niveauCible !== undefined;
    
    // Classes CSS supplémentaires
    let classesSupplementaires = estConnecteur ? ' connecteur-niveaux' : '';
    
    try {
        // Obtenir le chemin de l'icône SVG et sa couleur
        const cheminIcone = getCheminIconeSVG(donnees.type);
        const couleurMarqueur = getCouleurParType(donnees.type);
        
        // Créer un marqueur avec l'icône SVG
        const icone = L.divIcon({
            className: `marqueur-${donnees.type}${classesSupplementaires}`,
            html: `<div class="marqueur-container" style="background-color:${couleurMarqueur};border-radius:50%;width:36px;height:36px;display:flex;justify-content:center;align-items:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
                    <img src="${cheminIcone}" class="marqueur-svg" alt="${donnees.type}" style="width:24px;height:24px;">
                  </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -15]
        });
        
        // Créer le marqueur Leaflet
        const marqueur = L.marker([donnees.position.y, donnees.position.x], {
            icon: icone,
            title: donnees.nom,
            draggable: estMJ() // Seulement déplaçable par le MJ
        });
        
        // Ajouter interaction en fonction du type
        if (donnees.interaction.type === 'popup') {
            // Contenu supplémentaire pour le popup si c'est un connecteur
            let contenuSupplementaire = '';
            if (estConnecteur) {
                const niveauCible = donnees.connecteur.niveauCible;
                let nomNiveauCible = `Niveau ${niveauCible}`;
                
                // Essayer de récupérer le nom du niveau depuis la config
                const niveauxSauvegardes = localStorage.getItem('nexus-niveaux');
                if (niveauxSauvegardes) {
                    try {
                        const niveaux = JSON.parse(niveauxSauvegardes);
                        const niveauObj = niveaux.find(n => n.ordre === niveauCible);
                        if (niveauObj) {
                            nomNiveauCible = niveauObj.nom;
                        }
                    } catch(e) {
                        console.error("Erreur lors de la recherche du nom du niveau:", e);
                    }
                } else if (NOMS_NIVEAUX && NOMS_NIVEAUX[niveauCible]) {
                    nomNiveauCible = NOMS_NIVEAUX[niveauCible];
                }
                
                contenuSupplementaire = `
                <div class="connecteur-info">
                    <p><strong>Connexion vers:</strong> ${nomNiveauCible}</p>
                    <button class="btn-navigation" onclick="changerNiveau(${niveauCible})">Aller au niveau</button>
                </div>`;
            }
            
            marqueur.bindPopup(`
                <div class="popup-marqueur">
                    <h3>${donnees.nom}</h3>
                    <p>${donnees.interaction.contenu.description}</p>
                    ${donnees.interaction.contenu.details ? `<p class="details">${donnees.interaction.contenu.details}</p>` : ''}
                    ${contenuSupplementaire}
                    ${estMJ() ? '<div class="actions-mj"><button class="btn-edit" onclick="editMarqueur(\'' + donnees.id + '\')">Modifier</button><button class="btn-delete" onclick="confirmerSuppressionMarqueur(\'' + donnees.id + '\')">Supprimer</button></div>' : ''}
                </div>
            `);
        } else if (donnees.interaction.type === 'sous-carte') {
            // Si c'est une sous-carte, configurer l'ouverture au clic
            const idSousCarte = donnees.interaction.contenu.sousCarte;
            
            marqueur.on('click', function() {
                // Vérifier si la sous-carte existe
                let sousCarteExiste = false;
                
                // Vérifier d'abord dans le stockage local
                const sousCartesSauvegardees = localStorage.getItem('nexus-sous-cartes');
                if (sousCartesSauvegardees) {
                    try {
                        const sousCartes = JSON.parse(sousCartesSauvegardees);
                        sousCarteExiste = sousCartes[idSousCarte] !== undefined;
                    } catch(e) {
                        console.error("Erreur lors de la vérification de la sous-carte:", e);
                    }
                }
                
                // Sinon, vérifier dans la variable globale SOUS_CARTES
                if (!sousCarteExiste && typeof SOUS_CARTES !== 'undefined') {
                    sousCarteExiste = SOUS_CARTES[idSousCarte] !== undefined;
                }
                
                if (sousCarteExiste) {
                    ouvrirSousCarte(idSousCarte);
                } else {
                    alert(`La sous-carte "${idSousCarte}" n'est pas disponible.`);
                }
            });
            
            // Ajouter un tooltip pour indiquer qu'il s'agit d'une sous-carte
            marqueur.bindTooltip(`<div class="marqueur-tooltip">Voir détails: ${donnees.nom}</div>`, {
                direction: 'top',
                offset: L.point(0, -10)
            });
        } else if (donnees.interaction.type === 'statique') {
            // Pour les marqueurs statiques, juste afficher le nom au survol
            marqueur.bindTooltip(`<div class="marqueur-tooltip">${donnees.nom}</div>`, {
                direction: 'top',
                offset: L.point(0, -10)
            });
        }
        
        // Ajouter le marqueur à la carte
        marqueur.addTo(map);
        
        // Si c'est un connecteur, ajouter un tooltip spécial
        if (estConnecteur && donnees.interaction.type !== 'popup') {
            const niveauCible = donnees.connecteur.niveauCible;
            let nomNiveauCible = `Niveau ${niveauCible}`;
            
            // Essayer de récupérer le nom du niveau depuis la config ou NOMS_NIVEAUX
            if (NOMS_NIVEAUX && NOMS_NIVEAUX[niveauCible]) {
                nomNiveauCible = NOMS_NIVEAUX[niveauCible];
            }
            
            marqueur.bindTooltip(`<div class="marqueur-tooltip">Connexion vers: ${nomNiveauCible}</div>`, {
                direction: 'top',
                offset: L.point(0, -10)
            });
        }
        
        // Si le MJ, autoriser le déplacement et la sauvegarde de la nouvelle position
        if (estMJ()) {
            marqueur.on('dragend', function() {
                const position = marqueur.getLatLng();
                donnees.position = {
                    x: position.lng,
                    y: position.lat
                };
                donnees.meta.derniereModification = new Date().toISOString();
                sauvegarderMarqueur(donnees);
            });
        }
        
        // Stocker le marqueur pour référence future
        marqueurs[donnees.id] = {
            data: donnees,
            instance: marqueur
        };
        
        return marqueur;
        
    } catch (e) {
        console.error(`Erreur lors de la création du marqueur ${donnees.id} (type: ${donnees.type}):`, e);
        
        // Créer un marqueur de secours en cas d'erreur avec l'icône SVG
        try {
            // Utiliser un cercle coloré avec une première lettre comme fallback
            const couleurFallback = getCouleurParType(donnees.type);
            const premiereLettre = donnees.nom.charAt(0).toUpperCase();
            
            const iconeFallback = L.divIcon({
                className: `marqueur-fallback${classesSupplementaires}`,
                html: `<div style="background-color:${couleurFallback};color:white;border-radius:50%;width:36px;height:36px;display:flex;justify-content:center;align-items:center;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${premiereLettre}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -15]
            });
            
            const marqueurFallback = L.marker([donnees.position.y, donnees.position.x], {
                icon: iconeFallback,
                title: donnees.nom,
                draggable: estMJ()
            });
            
            // Ajouter le même popup
            if (donnees.interaction.type === 'popup') {
                marqueurFallback.bindPopup(`
                    <div class="popup-marqueur">
                        <h3>${donnees.nom}</h3>
                        <p>${donnees.interaction.contenu.description}</p>
                        ${donnees.interaction.contenu.details ? `<p class="details">${donnees.interaction.contenu.details}</p>` : ''}
                        ${estMJ() ? '<div class="actions-mj"><button class="btn-edit" onclick="editMarqueur(\'' + donnees.id + '\')">Modifier</button><button class="btn-delete" onclick="confirmerSuppressionMarqueur(\'' + donnees.id + '\')">Supprimer</button></div>' : ''}
                    </div>
                `);
            }
            
            marqueurFallback.addTo(map);
            
            // Stocker le marqueur pour référence future
            marqueurs[donnees.id] = {
                data: donnees,
                instance: marqueurFallback
            };
            
            return marqueurFallback;
        } catch (err) {
            console.error("Erreur lors de la création du marqueur de secours:", err);
            return null;
        }
    }
}

// Vérifie si un marqueur est visible pour l'utilisateur actuel
function verifierVisibilite(visibilite) {
    switch (visibilite.mode) {
        case 'tous':
            return true;
        case 'mj':
            return estMJ();
        case 'specifique':
            return estMJ() || visibilite.joueurs.includes(CONFIG.utilisateur.id);
        case 'conditionnel':
            // Implémentation de conditions plus complexes à venir dans les phases futures
            return estMJ() || evaluerConditionVisibilite(visibilite.condition);
        default:
            return false;
    }
}

// Évalue une condition de visibilité pour un marqueur
function evaluerConditionVisibilite(condition) {
    // Par défaut, retourner true pour les MJ
    if (estMJ()) return true;
    
    // Condition simple pour les joueurs
    if (!condition) return false;
    
    // TODO: Implémenter un système d'évaluation de conditions plus élaboré
    // Pour l'instant, on vérifie juste si le joueur est explicitement mentionné
    return condition.includes(CONFIG.utilisateur.id);
}

// Récupère le chemin vers l'icône SVG selon le type de marqueur
function getCheminIconeSVG(type) {
    // Table de correspondance des types de marqueurs avec leurs nouvelles icônes
    const typeToIconPath = {
        'taverne': 'assets/icons/Structure et batiments/medieval-village-01.svg',
        'temple': 'assets/icons/Structure et batiments/ancient-columns.svg',
        'commerce': 'assets/icons/Structure et batiments/village.svg',
        'residence': 'assets/icons/Structure et batiments/house.svg',
        'danger': 'assets/icons/Piege/spikes-full.svg',
        'secret': 'assets/icons/icone symbole/skull-crossed-bones.svg',
        'bank': 'assets/icons/Structure et batiments/medieval-village-01.svg',
        'clock-tower': 'assets/icons/Structure et batiments/clock-tower.svg',
        'hospital': 'assets/icons/Structure et batiments/hospital.svg',
        'maze': 'assets/icons/icone symbole/maze-cornea.svg'
    };
    
    // Si le type existe dans notre table de correspondance, utiliser le chemin défini
    if (typeToIconPath[type]) {
        return typeToIconPath[type];
    }
    
    // Vérifier dans les types de marqueurs sauvegardés
    const typesSauvegardes = JSON.parse(localStorage.getItem('nexus-types-marqueurs') || '{}');
    
    // Si le type existe et a une icône définie dans les types sauvegardés
    if (typesSauvegardes[type] && typesSauvegardes[type].icone) {
        const iconeId = typesSauvegardes[type].icone;
        
        // Chercher l'icône dans notre table de correspondance
        if (typeToIconPath[iconeId]) {
            return typeToIconPath[iconeId];
        }
        
        // Essayer avec les icônes spéciales par leur nom
        if (['blacksmith', 'robber', 'hooded-assassin'].includes(iconeId)) {
            return `assets/icons/corps et personnages/${iconeId}.svg`;
        }
        
        if (['crossed-swords', 'bow-arrow', 'dagger-rose'].includes(iconeId)) {
            return `assets/icons/Armes/${iconeId}.svg`;
        }
        
        if (['lever', 'cage', 'spikes-full', 'spikes-half'].includes(iconeId)) {
            return `assets/icons/Piege/${iconeId}.svg`;
        }
        
        if (['skull-crossed-bones', 'help', 'conversation'].includes(iconeId)) {
            return `assets/icons/icone symbole/${iconeId}.svg`;
        }
        
        if (['house', 'ancient-columns', 'medieval-village-01', 'clock-tower', 'hospital'].includes(iconeId)) {
            return `assets/icons/Structure et batiments/${iconeId}.svg`;
        }
    }
    
    // Si le type existe mais que nous n'avons pas de correspondance
    if (type) {
        // Essayer de trouver dans quel dossier l'icône pourrait être
        if (['épée', 'sword', 'arme', 'dague', 'axe', 'hache', 'bow', 'arc'].includes(type.toLowerCase())) {
            return 'assets/icons/Armes/crossed-swords.svg';
        }
        
        if (['temple', 'église', 'castle', 'château', 'house', 'maison', 'shop', 'magasin'].includes(type.toLowerCase())) {
            return 'assets/icons/Structure et batiments/house.svg';
        }
        
        if (['piège', 'trap', 'danger', 'warning', 'attention'].includes(type.toLowerCase())) {
            return 'assets/icons/Piege/spikes-full.svg';
        }
        
        if (['personnage', 'pnj', 'npc', 'person', 'character'].includes(type.toLowerCase())) {
            return 'assets/icons/corps et personnages/blacksmith.svg';
        }
        
        if (['symbole', 'symbol', 'secret', 'hidden', 'caché'].includes(type.toLowerCase())) {
            return 'assets/icons/icone symbole/skull-crossed-bones.svg';
        }
    }
    
    // Icône par défaut en dernier recours
    return 'assets/icons/Structure et batiments/house.svg';
}

// Récupère la couleur selon le type de marqueur
function getCouleurParType(type) {
    // Essayer d'abord de récupérer la couleur depuis les types de marqueurs sauvegardés
    const typesSauvegardes = JSON.parse(localStorage.getItem('nexus-types-marqueurs') || '{}');
    if (typesSauvegardes[type] && typesSauvegardes[type].couleur) {
        return typesSauvegardes[type].couleur;
    }
    
    // Sinon, utiliser une couleur par défaut selon le type
    const couleurs = {
        'taverne': '#8B4513',      // Brun
        'temple': '#FFD700',       // Or
        'commerce': '#32CD32',     // Vert
        'residence': '#4682B4',    // Bleu acier
        'danger': '#DC143C',       // Rouge cramoisi
        'secret': '#800080',       // Violet
        'bank': '#DAA520',         // Or foncé
        'clock-tower': '#696969',  // Gris
        'hospital': '#20B2AA',     // Vert d'eau
        'maze': '#708090'          // Gris ardoise
    };
    
    return couleurs[type] || '#3498db'; // Bleu par défaut
}

// Supprime un marqueur
function supprimerMarqueur(id) {
    if (!marqueurs[id]) return false;
    
    // Supprimer de la carte
    map.removeLayer(marqueurs[id].instance);
    
    // Supprimer du stockage local
    let marqueursSauvegardes = JSON.parse(localStorage.getItem('nexus-marqueurs') || '{}');
    const niveau = marqueurs[id].data.niveau;
    
    if (marqueursSauvegardes[niveau] && marqueursSauvegardes[niveau][id]) {
        delete marqueursSauvegardes[niveau][id];
        localStorage.setItem('nexus-marqueurs', JSON.stringify(marqueursSauvegardes));
    }
    
    // Supprimer de la référence locale
    delete marqueurs[id];
    
    return true;
}

// Demande confirmation avant de supprimer un marqueur
function confirmerSuppressionMarqueur(id) {
    if (!marqueurs[id]) {
        console.error("Marqueur introuvable:", id);
        return;
    }
    
    const nomMarqueur = marqueurs[id].data.nom;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le marqueur "${nomMarqueur}" ?`)) {
        if (supprimerMarqueur(id)) {
            // Fermer le popup qui serait ouvert
            map.closePopup();
            
            // Afficher une confirmation
            afficherAlerte(`Marqueur "${nomMarqueur}" supprimé avec succès`, "success");
        } else {
            afficherAlerte(`Erreur lors de la suppression du marqueur`, "danger");
        }
    }
}

// Modifier un marqueur existant
function editMarqueur(id) {
    if (!marqueurs[id]) {
        console.error("Marqueur introuvable:", id);
        return;
    }
    
    const donnees = marqueurs[id].data;
    
    // Ouvrir le panneau latéral avec le formulaire d'édition
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('location-info').classList.add('hidden');
    document.getElementById('marker-form').classList.remove('hidden');
    
    // Mettre à jour le titre du formulaire
    const formTitle = document.querySelector('#marker-form h4');
    if (formTitle) {
        formTitle.textContent = "Modifier un marqueur";
    }
    
    // Remplir le formulaire avec les données existantes
    document.getElementById('marker-name').value = donnees.nom;
    document.getElementById('marker-type').value = donnees.type;
    document.getElementById('marker-desc').value = donnees.interaction.contenu.description;
    
    // Vérifier si c'est un connecteur entre niveaux
    if (donnees.connecteur && donnees.connecteur.niveauCible !== undefined) {
        document.getElementById('marker-connecteur').checked = true;
        document.querySelector('.connecteur-options').classList.remove('hidden');
        
        // S'assurer que les niveaux sont chargés
        chargerNiveauxPourFormulaire();
        document.getElementById('connecteur-niveau').value = donnees.connecteur.niveauCible;
    } else {
        document.getElementById('marker-connecteur').checked = false;
        document.querySelector('.connecteur-options').classList.add('hidden');
    }
    
    // Si c'est une sous-carte, sélectionner le type d'interaction approprié
    if (donnees.interaction.type === 'sous-carte') {
        document.getElementById('marker-interaction').value = 'sous-carte';
        
        // Charger les sous-cartes et sélectionner celle qui est utilisée
        chargerSousCartesPourFormulaire();
        const selectSousCarte = document.getElementById('marker-sous-carte');
        if (selectSousCarte) {
            selectSousCarte.value = donnees.interaction.contenu.sousCarte || '';
            document.querySelector('.sous-carte-options').classList.remove('hidden');
        }
    } else {
        // Si l'élément existe
        const selectInteraction = document.getElementById('marker-interaction');
        if (selectInteraction) {
            selectInteraction.value = donnees.interaction.type;
            // Masquer les options de sous-carte si nécessaire
            const optionsSousCarte = document.querySelector('.sous-carte-options');
            if (optionsSousCarte) {
                optionsSousCarte.classList.add('hidden');
            }
        }
    }
    
    // Créer un bouton de suppression s'il n'existe pas déjà
    let btnSupprimer = document.querySelector('#marker-form .btn-delete');
    if (!btnSupprimer) {
        btnSupprimer = document.createElement('button');
        btnSupprimer.type = 'button';
        btnSupprimer.className = 'btn-delete';
        btnSupprimer.textContent = 'Supprimer';
        
        // Ajouter le bouton de suppression
        const formGroupe = document.querySelector('#marker-form .form-group:last-child');
        formGroupe.insertBefore(btnSupprimer, formGroupe.firstChild);
    }
    
    // Modifier le libellé du bouton de soumission
    document.querySelector('#marker-form .btn-primary').textContent = 'Mettre à jour';
    
    // Stocker l'ID du marqueur en édition
    document.getElementById('new-marker-form').dataset.editId = id;
    
    // Gestionnaire d'événement pour la suppression
    btnSupprimer.addEventListener('click', function() {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le marqueur "${donnees.nom}"?`)) {
            supprimerMarqueur(id);
            document.getElementById('sidebar').classList.add('hidden');
            document.getElementById('new-marker-form').reset();
            delete document.getElementById('new-marker-form').dataset.editId;
            
            // Retirer le bouton de suppression
            btnSupprimer.remove();
            
            // Restaurer le titre du formulaire
            if (formTitle) {
                formTitle.textContent = "Ajouter un marqueur";
            }
        }
    });
    
    // Modifier le comportement du formulaire pour mettre à jour au lieu d'ajouter
    const form = document.getElementById('new-marker-form');
    const originalSubmitHandler = form.onsubmit;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        
        // Mettre à jour les données du marqueur
        donnees.nom = document.getElementById('marker-name').value;
        donnees.type = document.getElementById('marker-type').value;
        donnees.interaction.contenu.description = document.getElementById('marker-desc').value;
        
        // Mettre à jour le connecteur entre niveaux si nécessaire
        const estConnecteur = document.getElementById('marker-connecteur').checked;
        if (estConnecteur) {
            const niveauCible = parseInt(document.getElementById('connecteur-niveau').value);
            donnees.connecteur = {
                niveauCible: niveauCible
            };
        } else {
            // Supprimer le connecteur s'il existait
            delete donnees.connecteur;
        }
        
        // Mettre à jour le type d'interaction si l'élément existe
        const selectInteraction = document.getElementById('marker-interaction');
        if (selectInteraction) {
            donnees.interaction.type = selectInteraction.value;
            
            // Si c'est une sous-carte, récupérer les infos supplémentaires
            if (donnees.interaction.type === 'sous-carte') {
                const selectSousCarte = document.getElementById('marker-sous-carte');
                if (selectSousCarte) {
                    donnees.interaction.contenu.sousCarte = selectSousCarte.value;
                }
            }
        }
        
        donnees.meta.derniereModification = new Date().toISOString();
        
        // Sauvegarder les modifications
        sauvegarderMarqueur(donnees);
        
        // Recréer le marqueur sur la carte pour rafraîchir l'affichage
        map.removeLayer(marqueurs[id].instance);
        const nouveauMarqueur = creerMarqueur(donnees);
        
        if (nouveauMarqueur) {
            marqueurs[id].instance = nouveauMarqueur;
            
            // Fermer le panneau et réinitialiser le formulaire
            document.getElementById('sidebar').classList.add('hidden');
            document.getElementById('new-marker-form').reset();
            delete document.getElementById('new-marker-form').dataset.editId;
            
            // Retirer le bouton de suppression
            btnSupprimer.remove();
            
            // Restaurer le gestionnaire d'événements original
            form.onsubmit = originalSubmitHandler;
            document.querySelector('#marker-form .btn-primary').textContent = 'Ajouter';
            
            // Restaurer le titre du formulaire
            if (formTitle) {
                formTitle.textContent = "Ajouter un marqueur";
            }
            
            // Afficher une confirmation
            afficherAlerte(`Marqueur "${donnees.nom}" mis à jour avec succès`, "success");
        } else {
            afficherAlerte("Erreur lors de la mise à jour du marqueur", "danger");
        }
    };
    
    // Gestionnaire pour le bouton Annuler
    document.querySelector('#marker-form .btn-cancel').onclick = function() {
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('new-marker-form').reset();
        delete document.getElementById('new-marker-form').dataset.editId;
        
        // Retirer le bouton de suppression
        btnSupprimer.remove();
        
        // Restaurer le gestionnaire d'événements original
        form.onsubmit = originalSubmitHandler;
        document.querySelector('#marker-form .btn-primary').textContent = 'Ajouter';
        
        // Restaurer le titre du formulaire
        if (formTitle) {
            formTitle.textContent = "Ajouter un marqueur";
        }
    };
}