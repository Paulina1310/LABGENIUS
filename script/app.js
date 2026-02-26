/**
 * LabGenius - Gestionnaire d'interface (Front-end)
 * Regroupe la logique du Séquenceur, du Dashboard, du Thème et de la Bibliothèque.
 */

// --- VARIABLES GLOBALES ET CONSTANTES ---
const COULEURS = { A: 'base-A', T: 'base-T', G: 'base-G', C: 'base-C' };
const COULEURS_ARNM = { A: 'base-A', U: 'base-U', G: 'base-G', C: 'base-C' };

const CODON_TABLE = {
    'TTT': 'Phe', 'TTC': 'Phe', 'TTA': 'Leu', 'TTG': 'Leu',
    'CTT': 'Leu', 'CTC': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu',
    'ATT': 'Ile', 'ATC': 'Ile', 'ATA': 'Ile', 'ATG': 'Met',
    'GTT': 'Val', 'GTC': 'Val', 'GTA': 'Val', 'GTG': 'Val',
    'TCT': 'Ser', 'TCC': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser',
    'CCT': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
    'ACT': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
    'GCT': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
    'TAT': 'Tyr', 'TAC': 'Tyr', 'TAA': 'STOP', 'TAG': 'STOP',
    'CAT': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln',
    'AAT': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys',
    'GAT': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
    'TGT': 'Cys', 'TGC': 'Cys', 'TGA': 'STOP', 'TGG': 'Trp',
    'CGT': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
    'AGT': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
    'GGT': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly'
};

let sequenceOriginale = 'ATGCGTAAATGC';
let sequenceCourante = sequenceOriginale;
let historiqueMutations = [];
let mutationCounter = 0;

// --- INITIALISATION AU CHARGEMENT DU DOM ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("LabGenius : Système prêt.");

    // 1. Animation d'entrée du contenu principal
    const mainElt = document.querySelector('main');
    if (mainElt) {
        mainElt.style.opacity = "0";
        mainElt.style.transform = "translateY(-20px)";
        mainElt.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        
        setTimeout(() => {
            mainElt.style.opacity = "1";
            mainElt.style.transform = "translateY(0)";
        }, 100);
    }

    // 2. Gestion du Thème (Sombre/Clair)
    initTheme();

    // 3. LOGIQUE SÉQUENCEUR (si présent sur la page)
    if (document.getElementById('bases-container')) {
        // RÉCUPÉRATION DU LOCALSTORAGE (Transfert depuis la bibliothèque)
        const sequenceTransferee = localStorage.getItem('labgenius-transfert');
        if (sequenceTransferee) {
            sequenceCourante = sequenceTransferee;
            sequenceOriginale = sequenceTransferee;
            localStorage.removeItem('labgenius-transfert'); // Nettoyage après usage
            showFeedback("Séquence importée de la bibliothèque", "success");
        }
        afficherSequence(sequenceCourante);
    }

    // 4. Écouteur pour le bouton Analyser (Séquenceur)
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chargerSequence();
        });
    }

    // 5. LOGIQUE BIBLIOTHÈQUE (si présent sur la page)
    initLibrary();

    // 6. Statistiques du Dashboard
    updateDashboardStats();
});

// --- FONCTIONS LOGIQUES DU SÉQUENCEUR ---

function traduireEnAcidesAmines(sequence) {
    const bases = sequence.toUpperCase().replace(/[^ATGC]/g, '');
    const codons = bases.match(/.{1,3}/g) || [];
    return codons.map(codon => CODON_TABLE[codon] || '???').join('-');
}

function afficherSequence(seq) {
    const container = document.getElementById('bases-container');
    if (!container) return;

    container.innerHTML = '';
    const basesArray = seq.toUpperCase().replace(/[^ATGC]/g, '').split('');
    
    basesArray.forEach(base => {
        const div = document.createElement('div');
        div.className = 'base ' + (COULEURS[base] || '');
        div.textContent = base;
        container.appendChild(div);
    });

    const gc = basesArray.filter(b => b === 'G' || b === 'C').length;
    const gcPct = basesArray.length ? Math.round(gc / basesArray.length * 100) : 0;
    const codons = seq.match(/.{1,3}/g) || [];
    const acidesAmines = traduireEnAcidesAmines(seq);

    document.getElementById('base-count').textContent = basesArray.length + ' bases';
    document.getElementById('gc-percent').textContent = 'GC: ' + gcPct + '%';
    document.getElementById('codon-display').textContent = codons.join('-');
    
    const aaDisplay = document.getElementById('aa-display');
    if (aaDisplay) aaDisplay.textContent = acidesAmines;
}

function chargerSequence() {
    const input = document.getElementById('sequence-input');
    const val = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    if (val) {
        sequenceCourante = val;
        sequenceOriginale = val;
        afficherSequence(val);
    }
}

// --- FONCTIONS DE LA BIBLIOTHÈQUE ---

function initLibrary() {
    // 1. Recherche dynamique améliorée
    const searchInput = document.getElementById('library-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.genome-card');
            const separator = document.querySelector('.library-separator');
            let hasVisibleSavedSequences = false;
            let hasVisibleOriginalSequences = false;
            
            cards.forEach(card => {
                const text = card.innerText.toLowerCase();
                const isVisible = text.includes(term);
                card.style.display = isVisible ? 'flex' : 'none';
                
                // Vérifier quelles séquences sont visibles
                if (isVisible) {
                    if (card.classList.contains('saved-sequence')) {
                        hasVisibleSavedSequences = true;
                    } else {
                        hasVisibleOriginalSequences = true;
                    }
                }
            });
            
            // Gérer l'affichage du séparateur
            if (separator) {
                const savedSequences = getSauvegardes();
                if (savedSequences.length > 0) {
                    // Afficher le séparateur seulement s'il y a des séquences sauvegardées et qu'elles sont visibles
                    separator.style.display = (hasVisibleSavedSequences || term === '') ? 'block' : 'none';
                } else {
                    separator.style.display = 'none';
                }
            }
        });
    }

    // 2. Boutons "Charger" (vers Séquenceur)
    const loadButtons = document.querySelectorAll('.load-btn');
    loadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const seq = btn.getAttribute('data-seq');
            localStorage.setItem('labgenius-transfert', seq);
            showFeedback("Séquence envoyée à l'éditeur...", "success");
            setTimeout(() => window.location.href = 'sequenceur.php', 800);
        });
    });

    // 3. Gestion des Favoris (LocalStorage)
    const favButtons = document.querySelectorAll('.favorite-btn');
    let favorites = JSON.parse(localStorage.getItem('labgenius-favorites')) || [];

    favButtons.forEach(btn => {
        const card = btn.closest('.genome-card');
        const cardId = card.getAttribute('data-id');

        // État initial
        if (favorites.includes(cardId)) btn.style.color = "var(--primary-neon)";

        btn.addEventListener('click', () => {
            if (favorites.includes(cardId)) {
                favorites = favorites.filter(id => id !== cardId);
                btn.style.color = "";
            } else {
                favorites.push(cardId);
                btn.style.color = "var(--primary-neon)";
                showFeedback("Ajouté aux favoris", "success");
            }
            localStorage.setItem('labgenius-favorites', JSON.stringify(favorites));
        });
    });

    // 4. Afficher les séquences sauvegardées
    afficherSequencesSauvegardees();
}

// --- FONCTIONS ACTIONS GÉNÉRALES ---

function brinComplementaire() {
    const comp = { A: 'T', T: 'A', G: 'C', C: 'G' };
    const brin = sequenceCourante.split('').map(b => comp[b] || b).join('');
    afficherBrinComplementaire(brin);
}

function transcrire() {
    const arnm = sequenceCourante.toUpperCase().replace(/T/g, 'U');
    afficherARNm(arnm);
}

function mutationPonctuelle() {
    const bases = ['A', 'T', 'G', 'C'];
    const seq = sequenceCourante.split('');
    const idx = Math.floor(Math.random() * seq.length);
    const ancien = seq[idx];
    const newBases = bases.filter(b => b !== ancien);
    seq[idx] = newBases[Math.floor(Math.random() * newBases.length)];
    
    sequenceCourante = seq.join('');
    afficherSequence(sequenceCourante);
    ajouterMutationHistorique(idx + 1, ancien, seq[idx]);
}

function reinitialiser() {
    sequenceCourante = sequenceOriginale;
    afficherSequence(sequenceOriginale);
    document.getElementById('arnm-display').style.display = 'none';
    document.getElementById('complement-display').style.display = 'none';
    document.getElementById('mutation-history').style.display = 'none';
    historiqueMutations = [];
    mutationCounter = 0;
}

// --- FONCTIONS D'AFFICHAGE SECONDAIRES ---

function afficherARNm(arnm) {
    const container = document.getElementById('arnm-bases-container');
    if(!container) return;
    container.innerHTML = '';
    arnm.split('').forEach(base => {
        const div = document.createElement('div');
        div.className = 'base ' + (COULEURS_ARNM[base] || '');
        div.textContent = base;
        container.appendChild(div);
    });
    const codons = arnm.match(/.{1,3}/g) || [];
    document.getElementById('arnm-codons-display').textContent = codons.join('-');
    document.getElementById('arnm-display').style.display = 'block';
}

function afficherBrinComplementaire(brin) {
    const container = document.getElementById('complement-bases-container');
    if(!container) return;
    container.innerHTML = '';
    brin.split('').forEach(base => {
        const div = document.createElement('div');
        div.className = 'base ' + (COULEURS[base] || '');
        div.textContent = base;
        container.appendChild(div);
    });
    const codons = brin.match(/.{1,3}/g) || [];
    document.getElementById('complement-codons-display').textContent = codons.join('-');
    document.getElementById('complement-display').style.display = 'block';
}

function ajouterMutationHistorique(pos, oldB, newB) {
    mutationCounter++;
    const time = new Date().toLocaleTimeString();
    historiqueMutations.unshift({ id: mutationCounter, pos, oldB, newB, time });
    const list = document.getElementById('history-list');
    if(list) {
        list.innerHTML = historiqueMutations.map(m => `
            <div class="history-item">
                <span class="mutation-text">#${m.id} Position ${m.pos} : ${m.oldB} → ${m.newB}</span>
                <span class="timestamp">${m.time}</span>
            </div>
        `).join('');
    }
    document.getElementById('mutation-history').style.display = 'block';
}

// --- SYSTÈME DE SAUVEGARDE LOCALSTORAGE ---

function sauvegarderSequence(nom, sequence, type = 'sequenceur') {
    const sauvegardes = JSON.parse(localStorage.getItem('labgenius-sauvegardes')) || [];
    
    // Calculer les méta-données
    const bases = sequence.toUpperCase().replace(/[^ATGC]/g, '');
    const gc = bases.filter(b => b === 'G' || b === 'C').length;
    const gcPct = bases.length ? Math.round(gc / bases.length * 100) : 0;
    const acidesAmines = traduireEnAcidesAmines(sequence);
    
    const nouvelleSauvegarde = {
        id: Date.now().toString(),
        nom: nom || `Séquence ${sauvegardes.length + 1}`,
        sequence: sequence,
        type: type,
        date: new Date().toLocaleDateString('fr-FR'),
        bases: bases.length,
        gc: gcPct,
        acidesAmines: acidesAmines,
        timestamp: Date.now()
    };
    
    sauvegardes.unshift(nouvelleSauvegarde);
    
    // Limiter à 20 sauvegardes maximum
    if (sauvegardes.length > 20) {
        sauvegardes.splice(20);
    }
    
    localStorage.setItem('labgenius-sauvegardes', JSON.stringify(sauvegardes));
    showFeedback(`Séquence "${nouvelleSauvegarde.nom}" sauvegardée dans la bibliothèque`, "success");
    
    return nouvelleSauvegarde;
}

function sauvegarderSequenceActuelle() {
    if (sequenceCourante && sequenceCourante.length > 0) {
        const nom = prompt("Nommez votre séquence pour la sauvegarder :", `Séquence du ${new Date().toLocaleDateString('fr-FR')}`);
        if (nom) {
            sauvegarderSequence(nom, sequenceCourante, 'sequenceur');
        }
    } else {
        showFeedback("Aucune séquence à sauvegarder", "error");
    }
}

function getSauvegardes() {
    return JSON.parse(localStorage.getItem('labgenius-sauvegardes')) || [];
}

function supprimerSauvegarde(id) {
    const sauvegardes = getSauvegardes();
    const sauvegardesFiltrees = sauvegardes.filter(s => s.id !== id);
    localStorage.setItem('labgenius-sauvegardes', JSON.stringify(sauvegardesFiltrees));
    showFeedback("Séquence supprimée", "success");
    
    // Recharger la page pour mettre à jour l'affichage
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// --- SYSTÈME DE THÈME ET FEEDBACK ---

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    if (localStorage.getItem('labgenius-theme') === 'light') {
        document.body.classList.add('light-mode');
        updateThemeUI(true);
    }
    toggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('labgenius-theme', isLight ? 'light' : 'dark');
        updateThemeUI(isLight);
    });
}

function updateThemeUI(isLight) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (text) text.innerText = isLight ? 'Mode Clair' : 'Mode Sombre';
}

function updateDashboardStats() {
    const saved = JSON.parse(localStorage.getItem('lab_sequences')) || [];
    const countEl = document.querySelector('.stat-card:nth-child(1) .value');
    if (countEl) countEl.innerText = saved.length;
}

function showFeedback(message, type = 'success') {
    const fb = document.createElement('div');
    fb.style.position = 'fixed';
    fb.style.bottom = '20px';
    fb.style.right = '20px';
    fb.style.padding = '12px 20px';
    fb.style.borderRadius = '8px';
    fb.style.background = type === 'success' ? '#00f2c3' : '#ff4444';
    fb.style.color = '#0a0e14';
    fb.style.zIndex = '1000';
    fb.style.fontWeight = 'bold';
    fb.innerText = message;
    document.body.appendChild(fb);
    setTimeout(() => fb.remove(), 2500);
}

function afficherSequencesSauvegardees() {
    const libraryList = document.getElementById('library-list');
    if (!libraryList) return;

    const sauvegardes = getSauvegardes();
    
    if (sauvegardes.length === 0) return;

    // Créer un séparateur
    const separator = document.createElement('div');
    separator.className = 'library-separator';
    separator.innerHTML = `
        <h3 style="color: var(--primary-neon); margin: 30px 0 15px 0; font-size: 1.1rem;">
            📁 Mes Séquences Sauvegardées
        </h3>
    `;
    libraryList.appendChild(separator);

    // Ajouter chaque séquence sauvegardée
    sauvegardes.forEach(sauvegarde => {
        const card = document.createElement('article');
        card.className = 'genome-card saved-sequence';
        card.setAttribute('data-id', sauvegarde.id);
        card.setAttribute('data-type', sauvegarde.type);
        
        const typeIcon = sauvegarde.type === 'synthese' ? '⚗️' : '🧬';
        const typeLabel = sauvegarde.type === 'synthese' ? 'Synthèse' : 'Séquenceur';
        
        card.innerHTML = `
            <div class="card-info">
                <h3>${typeIcon} ${sauvegarde.nom}</h3>
                <p>Séquence ${typeLabel.toLowerCase()} avec ${sauvegarde.bases} bases</p>
                <div class="card-meta">
                    <span>${sauvegarde.bases} bases</span> • 
                    <span>GC: ${sauvegarde.gc}%</span> • 
                    <span>${sauvegarde.date}</span> • 
                    <span>${typeLabel}</span>
                </div>
                ${sauvegarde.acidesAmines ? `<div class="aa-preview" style="margin-top: 8px; color: var(--text-muted); font-size: 0.85rem;">${sauvegarde.acidesAmines}</div>` : ''}
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm favorite-btn" title="Ajouter aux favoris">
                    <i class="fa-solid fa-bookmark"></i>
                </button>
                <button class="btn btn-primary btn-sm load-btn" data-seq="${sauvegarde.sequence}" title="Envoyer au séquenceur">
                    <i class="fa-solid fa-play"></i>charger
                </button>
                <button class="btn btn-secondary btn-sm delete-btn" onclick="supprimerSauvegarde('${sauvegarde.id}')" title="Supprimer">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        libraryList.appendChild(card);
    });

    // Réinitialiser les écouteurs pour les nouvelles cartes
    reinitLibraryListeners();
}

function reinitLibraryListeners() {
    // Réinitialiser les boutons de chargement
    const loadButtons = document.querySelectorAll('.saved-sequence .load-btn');
    loadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const seq = btn.getAttribute('data-seq');
            localStorage.setItem('labgenius-transfert', seq);
            showFeedback("Séquence envoyée à l'éditeur...", "success");
            setTimeout(() => window.location.href = 'sequenceur.php', 800);
        });
    });

    // Réinitialiser les boutons de favoris
    const favButtons = document.querySelectorAll('.saved-sequence .favorite-btn');
    let favorites = JSON.parse(localStorage.getItem('labgenius-favorites')) || [];

    favButtons.forEach(btn => {
        const card = btn.closest('.genome-card');
        const cardId = card.getAttribute('data-id');

        if (favorites.includes(cardId)) btn.style.color = "var(--primary-neon)";

        btn.addEventListener('click', () => {
            if (favorites.includes(cardId)) {
                favorites = favorites.filter(id => id !== cardId);
                btn.style.color = "";
            } else {
                favorites.push(cardId);
                btn.style.color = "var(--primary-neon)";
                showFeedback("Ajouté aux favoris", "success");
            }
            localStorage.setItem('labgenius-favorites', JSON.stringify(favorites));
        });
    });

    // Mettre à jour la recherche pour inclure les nouvelles cartes
    const searchInput = document.getElementById('library-search');
    if (searchInput) {
        // Déclencher un événement de recherche pour appliquer les filtres actuels
        searchInput.dispatchEvent(new Event('input'));
    }
}