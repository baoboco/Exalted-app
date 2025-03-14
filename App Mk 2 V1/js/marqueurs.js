// Vérifie si l'utilisateur actuel est MJ
function estMJ() {
    return CONFIG.utilisateur.role === 'mj';
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
            return estMJ();
        default:
            return false;
    }
}

// Créer un marqueur sur la carte
function creerMarqueur(donnees) {
    // Vérifier d'abord la visibilité
    if (!verifierVisibilite(donnees.visibilite)) {
        console.log(`Marqueur ${donnees.id} non affiché car non visible pour cet utilisateur`);
        return null;
    }
    
    // Chemin vers l'icône SVG
    const cheminIcone = getCheminIconeSVG(donnees.type);
    const couleurFallback = getCouleurParType(donnees.type);
    
    // Vérifier s'il s'agit d'un connecteur entre niveaux
    const estConnecteur = donnees.connecteur && donnees.connecteur.niveauCible !== undefined;
    
    // Classes CSS supplémentaires
    let classesSupplementaires = '';
    if (estConnecteur) {
        classesSupplementaires += ' connecteur-niveaux';
    }
    
    // Fonction pour créer un marqueur avec l'option choisie (SVG ou couleur)
    function creerMarqueurAvecIcone(avecSVG) {
        let iconeHtml;
        
        if (avecSVG) {
            // Utiliser l'icône SVG externe
            iconeHtml = `<img src="${cheminIcone}" class="marqueur-svg${classesSupplementaires}" alt="${donnees.type}">`;
        } else {
            // Utiliser un cercle coloré avec une première lettre comme fallback
            const premiereLettre = donnees.type.charAt(0).toUpperCase();
            iconeHtml = `<div class="marqueur-fallback${classesSupplementaires}" style="background-color:${couleurFallback};color:white;border-radius:50%;width:30px;height:30px;display:flex;justify-content:center;align-items:center;font-weight:bold;">${premiereLettre}</div>`;
        }
        
        const icone = L.divIcon({
            className: `marqueur-${donnees.type}`,
            html: iconeHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
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
                const nomNiveauCible = NOMS_NIVEAUX[niveauCible] || `Niveau ${niveauCible}`;
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
                    ${estMJ() ? '<div class="actions-mj"><button class="btn-edit" onclick="editMarqueur(\'' + donnees.id + '\')">Modifier</button></div>' : ''}
                </div>
            `);
        } else if (donnees.interaction.type === 'sous-carte') {
            // Si c'est une sous-carte, configurer l'ouverture au clic
            const idSousCarte = donnees.interaction.contenu.sousCarte;
            
            marqueur.on('click', function() {
                if (SOUS_CARTES[idSousCarte]) {
                    ouvrirSousCarte(idSousCarte);
                } else {
                    alert(`La sous-carte "${idSousCarte}" n'est pas encore disponible.`);
                }
            });
            
            // Ajouter un tooltip pour indiquer qu'il s'agit d'une sous-carte
            marqueur.bindTooltip(`<div class="marqueur-tooltip">Voir détails: ${donnees.nom}</div>`, {
                direction: 'top',
                offset: L.point(0, -10)
            });
        }
        
        // Ajouter le marqueur à la carte
        marqueur.addTo(map);
        
        // Si c'est un connecteur, ajouter un tooltip spécial
        if (estConnecteur) {
            const niveauCible = donnees.connecteur.niveauCible;
            const nomNiveauCible = NOMS_NIVEAUX[niveauCible] || `Niveau ${niveauCible}`;
            
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
    }
    
    // Essayer de vérifier si l'icône SVG existe, sinon utiliser le fallback
    try {
        return creerMarqueurAvecIcone(true);
    } catch (e) {
        console.warn(`Erreur lors du chargement de l'icône SVG pour le type ${donnees.type}, utilisation du fallback`, e);
        return creerMarqueurAvecIcone(false);
    }
}

// Supprimer un marqueur
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
    
    // Remplir le formulaire avec les données existantes
    document.getElementById('marker-name').value = donnees.nom;
    document.getElementById('marker-type').value = donnees.type;
    document.getElementById('marker-desc').value = donnees.interaction.contenu.description;
    
    // Vérifier si c'est un connecteur entre niveaux
    if (donnees.connecteur && donnees.connecteur.niveauCible !== undefined) {
        document.getElementById('marker-connecteur').checked = true;
        document.querySelector('.connecteur-options').classList.remove('hidden');
        document.getElementById('connecteur-niveau').value = donnees.connecteur.niveauCible;
    } else {
        document.getElementById('marker-connecteur').checked = false;
        document.querySelector('.connecteur-options').classList.add('hidden');
    }
    
    // Si c'est une sous-carte, sélectionner le type d'interaction approprié
    if (donnees.interaction.type === 'sous-carte') {
        document.getElementById('marker-interaction').value = 'sous-carte';
        // Afficher et peupler les options de sous-carte (si l'élément existe)
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
    
    // Créer un bouton de suppression
    let btnSupprimer = document.createElement('button');
    btnSupprimer.type = 'button';
    btnSupprimer.className = 'btn-delete';
    btnSupprimer.textContent = 'Supprimer';
    
    // Ajouter le bouton de suppression
    const formGroupe = document.querySelector('#marker-form .form-group:last-child');
    formGroupe.insertBefore(btnSupprimer, formGroupe.firstChild);
    
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
    };
}

// Ajouter les gestionnaires d'événements pour les options du formulaire (si pas déjà fait)
document.addEventListener('DOMContentLoaded', function() {
    // Gérer l'affichage/masquage des options de connecteur
    const checkboxConnecteur = document.getElementById('marker-connecteur');
    if (checkboxConnecteur) {
        checkboxConnecteur.addEventListener('change', function() {
            const optionsConnecteur = document.querySelector('.connecteur-options');
            if (optionsConnecteur) {
                if (this.checked) {
                    optionsConnecteur.classList.remove('hidden');
                } else {
                    optionsConnecteur.classList.add('hidden');
                }
            }
        });
    }
    
    // Gérer l'affichage/masquage des options de sous-carte
    const selectInteraction = document.getElementById('marker-interaction');
    if (selectInteraction) {
        selectInteraction.addEventListener('change', function() {
            const optionsSousCarte = document.querySelector('.sous-carte-options');
            if (optionsSousCarte) {
                if (this.value === 'sous-carte') {
                    optionsSousCarte.classList.remove('hidden');
                } else {
                    optionsSousCarte.classList.add('hidden');
                }
            }
        });
    }
});