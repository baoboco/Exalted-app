/**
 * NoteTool - Outil de création de notes pour la carte interactive de Nexus
 */
class NoteTool {
  constructor(mapLoader, options = {}) {
    this.id = 'note';
    this.name = 'Ajouter une note';
    this.mapLoader = mapLoader;
    this.options = options;
    this.active = false;
    this.notes = {};
    
    this.initModalHandlers();
  }
  
  activate() {
    this.active = true;
    document.body.classList.add('tool-note-active');
  }
  
  deactivate() {
    this.active = false;
    document.body.classList.remove('tool-note-active');
  }
  
  handleElementClick(elementId, layerId, event) {
    if (!this.active) return;
    
    // Position dans le SVG
    const svgElement = this.mapLoader.svgLayers[layerId].getElement();
    if (!svgElement) return;
    
    const svgPoint = svgElement.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    
    const CTM = svgElement.getScreenCTM();
    if (CTM) {
      const svgCoords = svgPoint.matrixTransform(CTM.inverse());
      this.openNoteCreationModal(elementId, layerId, svgCoords);
    }
  }
  
  initModalHandlers() {
    const noteModal = document.getElementById('note-modal');
    const noteForm = document.getElementById('note-form');
    const closeButtons = noteModal?.querySelectorAll('.close-modal-btn, .cancel-btn');
    
    // Fermer le modal
    closeButtons?.forEach(button => {
      button.addEventListener('click', () => {
        noteModal.classList.remove('active');
      });
    });
    
    // Soumettre le formulaire
    noteForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const content = document.getElementById('note-content').value;
      const visibility = document.getElementById('note-visibility').value;
      
      const noteData = noteForm.dataset;
      const noteId = `note-${Date.now()}`;
      
      const note = {
        id: noteId,
        content,
        visibility,
        layerId: noteData.layerId,
        elementId: noteData.elementId,
        position: {
          x: parseFloat(noteData.x),
          y: parseFloat(noteData.y)
        },
        createdBy: UserManager.getCurrentUser()?.id || 'guest',
        createdAt: new Date().toISOString()
      };
      
      this.addNote(note);
      
      noteModal.classList.remove('active');
    });
  }
  
  openNoteCreationModal(elementId, layerId, position) {
    const noteModal = document.getElementById('note-modal');
    const noteForm = document.getElementById('note-form');
    
    if (!noteModal || !noteForm) return;
    
    noteForm.dataset.elementId = elementId;
    noteForm.dataset.layerId = layerId;
    noteForm.dataset.x = position.x;
    noteForm.dataset.y = position.y;
    
    noteForm.reset();
    
    noteModal.classList.add('active');
  }
  
  addNote(note) {
    this.notes[note.id] = note;
    this.renderNote(note);
    
    EventBus.publish('note:created', {
      note: note
    });
  }
  
  renderNote(note) {
    const svgLayer = this.mapLoader.svgLayers[note.layerId];
    if (!svgLayer) return;
    
    const svgElement = svgLayer.getElement();
    if (!svgElement) return;
    
    const noteElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    noteElement.id = note.id;
    noteElement.classList.add('note');
    noteElement.dataset.visibility = note.visibility;
    noteElement.dataset.createdBy = note.createdBy;
    
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('fill', '#FFF8DC');
    icon.setAttribute('stroke', '#D4B96E');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('rx', '4');
    noteElement.appendChild(icon);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '10');
    text.setAttribute('y', '14');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '14');
    text.textContent = "📝";
    noteElement.appendChild(text);
    
    noteElement.setAttribute('transform', `translate(${note.position.x - 10}, ${note.position.y - 10})`);
    
    svgElement.appendChild(noteElement);
    
    noteElement.addEventListener('click', (e) => {
      this.showNotePopup(note.id, e);
      e.stopPropagation();
    });
  }
  
  showNotePopup(noteId, event) {
    const note = this.notes[noteId];
    if (!note) return;
    
    let popup = document.querySelector('.note-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.className = 'note-popup';
      document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
      <div>${note.content}</div>
      <small>Créé par: ${UserManager.users[note.createdBy]?.name || 'Inconnu'}</small>
    `;
    
    popup.style.left = `${event.clientX + 10}px`;
    popup.style.top = `${event.clientY + 10}px`;
    popup.style.display = 'block';
    
    setTimeout(() => {
      document.addEventListener('click', function hidePopup() {
        popup.style.display = 'none';
        document.removeEventListener('click', hidePopup);
      });
    }, 100);
  }
}

window.NoteTool = NoteTool;
