// État global de l'application
let state = {
    allAgents: [],
    availableAgents: [],
    excludedAgents: [],
    customAgents: [],
    secretMode: { enabled: false, target: "Jett" }
};

// Variables pour l'animation
let canvas = document.getElementById('wheelCanvas');
let ctx = canvas.getContext('2d');
let currentRotation = 0;
let spinVelocity = 0;
let isSpinning = false;
let animationFrame = null;
let selectedImageForCustom = null;
let agentImages = new Map();
let currentWinner = null;

// Variables pour le mode secret avec animation naturelle
let secretTargetAngle = null;

// Éléments DOM
const spinBtn = document.getElementById('spinBtn');
const excludeBtn = document.getElementById('excludeBtn');
const excludedList = document.getElementById('excludedList');
const resetExcludedBtn = document.getElementById('resetExcludedBtn');
const selectImageBtn = document.getElementById('selectImageBtn');
const addAgentBtn = document.getElementById('addAgentBtn');
const agentNameInput = document.getElementById('agentNameInput');
const selectedImagePath = document.getElementById('selectedImagePath');
const customAgentsList = document.getElementById('customAgentsList');
const wheelContainer = document.querySelector('.wheel-container');
const secretModeToggle = document.getElementById('secretModeToggle');

// ============ INITIALISATION ============
async function init() {
    const defaultAgents = await window.electronAPI.getDefaultAgents();
    const userState = await window.electronAPI.getUserState();
    
    state.customAgents = userState.agentsCustom || [];
    state.excludedAgents = userState.agentsExcluded || [];
    state.secretMode = userState.secretMode || { enabled: false, target: "Jett" };
    
    state.allAgents = [...defaultAgents, ...state.customAgents];
    
    await loadAllImages();
    
    updateAvailableAgents();
    drawWheel();
    updateExcludedDisplay();
    updateCustomAgentsDisplay();
    updateSecretButtonState();
    
    console.log('🎯 Mode Secret: Ctrl+Shift+A ou bouton 🔒 en haut à droite');
}

async function loadAllImages() {
    const loadPromises = state.allAgents.map(agent => {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`✅ Image chargée: ${agent.nom}`);
                agentImages.set(agent.nom, img);
                resolve();
            };
            
            img.onerror = (e) => {
                console.warn(`❌ Image non trouvée: ${agent.nom} -> ${agent.image}`);
                
                const canvas = document.createElement('canvas');
                canvas.width = 60;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                
                const hue = (agent.nom.length * 40) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                ctx.fillRect(0, 0, 60, 60);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(agent.nom[0], 30, 30);
                
                agentImages.set(agent.nom, canvas);
                resolve();
            };
            
            img.src = '../' + agent.image;
        });
    });
    
    await Promise.all(loadPromises);
    console.log('✅ Toutes les images sont chargées');
}

function updateAvailableAgents() {
    state.availableAgents = state.allAgents.filter(
        agent => !state.excludedAgents.includes(agent.nom)
    );
}

function updateSecretButtonState() {
    if (state.secretMode.enabled) {
        secretModeToggle.classList.add('active');
        secretModeToggle.textContent = '🔓';
        secretModeToggle.title = `Mode Secret ACTIF - Cible: ${state.secretMode.target}`;
    } else {
        secretModeToggle.classList.remove('active');
        secretModeToggle.textContent = '🔒';
        secretModeToggle.title = 'Mode Secret INACTIF';
    }
}

// ============ DESSIN DE LA ROUE ============
function drawWheel(cursorAngle = currentRotation) {
    ctx.clearRect(0, 0, 500, 500);
    
    const centerX = 250;
    const centerY = 250;
    const radius = 170;        // Réduit pour laisser de la place aux noms à l'extérieur
    const textRadius = 215;    // Rayon pour les noms (à l'extérieur)
    const count = state.availableAgents.length;
    
    if (count === 0) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Aucun agent disponible', centerX, centerY);
        return;
    }
    
    const angleStep = (Math.PI * 2) / count;
    
    // Fond de la roue
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#ff4655';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Cercle extérieur pour les noms
    ctx.beginPath();
    ctx.arc(centerX, centerY, textRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 70, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Dessiner les agents (positions FIXES)
    state.availableAgents.forEach((agent, index) => {
        const angle = index * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Position du texte à l'extérieur
        const textX = centerX + Math.cos(angle) * textRadius;
        const textY = centerY + Math.sin(angle) * textRadius;
        
        const img = agentImages.get(agent.nom);
        if (img) {
            // === DESSIN DE L'IMAGE ===
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2);
            
            // Cercle derrière l'image
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fillStyle = '#2a2a4a';
            ctx.fill();
            ctx.strokeStyle = '#ff4655';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Image de l'agent
            ctx.drawImage(img, -28, -28, 56, 56);
            ctx.restore();
            
            // === DESSIN DU NOM À L'EXTÉRIEUR ===
            ctx.save();
            ctx.translate(textX, textY);
            
            // Fond pour le texte
            const textWidth = ctx.measureText(agent.nom).width;
            ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            
            // Centrer le texte
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ff4655';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Contour du texte pour lisibilité
            ctx.shadowBlur = 4;
            ctx.fillText(agent.nom, 0, 0);
            
            // Surligner en blanc pour meilleure lisibilité
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeText(agent.nom, 0, 0);
            ctx.fillStyle = '#ff4655';
            ctx.fillText(agent.nom, 0, 0);
            
            ctx.restore();
        }
    });
    
    // === CENTRE DE LA ROUE ===
    if (currentWinner) {
        const winnerImg = agentImages.get(currentWinner.nom);
        if (winnerImg) {
            // Cercle de fond plus grand
            ctx.beginPath();
            ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            ctx.strokeStyle = '#ff4655';
            ctx.lineWidth = 5;
            ctx.stroke();
            
            // Image de l'agent au centre (plus grande)
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(winnerImg, centerX - 70, centerY - 70, 140, 140);
            ctx.restore();
            
            // Deuxième cercle fin pour l'esthétique
            ctx.beginPath();
            ctx.arc(centerX, centerY, 72, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 70, 85, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Nom de l'agent gagnant au centre (en bas, en blanc)
            ctx.font = 'bold 13px Arial';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentWinner.nom, centerX, centerY + 100);
            ctx.shadowBlur = 0;
        }
    } else {
        // Centre normal quand pas d'agent sélectionné
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#ff4655';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#ff4655';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VALORANT', centerX, centerY);
    }
    
    // === CURSEUR MOBILE (Flèche) ===
    const cursorLength = radius + 20;
    const cursorX = centerX + Math.cos(cursorAngle) * cursorLength;
    const cursorY = centerY + Math.sin(cursorAngle) * cursorLength;
    
    const arrowSize = 18;
    const perpAngle = cursorAngle + Math.PI / 2;
    
    const tipX = cursorX;
    const tipY = cursorY;
    
    const leftX = cursorX - Math.cos(cursorAngle) * arrowSize + Math.cos(perpAngle) * (arrowSize / 2);
    const leftY = cursorY - Math.sin(cursorAngle) * arrowSize + Math.sin(perpAngle) * (arrowSize / 2);
    
    const rightX = cursorX - Math.cos(cursorAngle) * arrowSize - Math.cos(perpAngle) * (arrowSize / 2);
    const rightY = cursorY - Math.sin(cursorAngle) * arrowSize - Math.sin(perpAngle) * (arrowSize / 2);
    
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    
    ctx.fillStyle = '#ff4655';
    ctx.shadowColor = '#ff4655';
    ctx.shadowBlur = 15;
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();
}

// ============ ANIMATION ============
function spinWheel() {
    if (isSpinning || state.availableAgents.length === 0) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    excludeBtn.disabled = true;
    
    wheelContainer.classList.remove('winner-selected');
    currentWinner = null;
    drawWheel(currentRotation);
    
    spinVelocity = 0.3 + Math.random() * 0.5;
    
    secretTargetAngle = null;
    if (state.secretMode.enabled && state.availableAgents.length > 0) {
        const targetIndex = state.availableAgents.findIndex(a => a.nom === state.secretMode.target);
        if (targetIndex !== -1) {
            const angleStep = (Math.PI * 2) / state.availableAgents.length;
            secretTargetAngle = targetIndex * angleStep;
        }
    }
    
    function animate() {
        if (spinVelocity > 0.003) {
            currentRotation += spinVelocity;
            spinVelocity *= 0.985;
            
            if (secretTargetAngle !== null && spinVelocity < 0.05) {
                let normalizedCurrent = currentRotation % (Math.PI * 2);
                if (normalizedCurrent < 0) normalizedCurrent += Math.PI * 2;
                
                let diff = secretTargetAngle - normalizedCurrent;
                
                if (diff > Math.PI) diff -= Math.PI * 2;
                if (diff < -Math.PI) diff += Math.PI * 2;
                
                if (Math.abs(diff) > 0.01) {
                    currentRotation += diff * 0.05;
                    spinVelocity *= 0.95;
                } else {
                    currentRotation = currentRotation - normalizedCurrent + secretTargetAngle;
                    spinVelocity = 0;
                }
            }
            
            drawWheel(currentRotation);
            animationFrame = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            animationFrame = null;
            
            if (secretTargetAngle !== null) {
                let normalizedCurrent = currentRotation % (Math.PI * 2);
                if (normalizedCurrent < 0) normalizedCurrent += Math.PI * 2;
                currentRotation = currentRotation - normalizedCurrent + secretTargetAngle;
                drawWheel(currentRotation);
            }
            
            determineWinner();
        }
    }
    
    animate();
}

function determineWinner() {
    if (state.availableAgents.length === 0) return;
    
    const angleStep = (Math.PI * 2) / state.availableAgents.length;
    
    let normalizedAngle = currentRotation % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    
    let minDiff = Infinity;
    let winnerIndex = 0;
    
    state.availableAgents.forEach((_, index) => {
        const agentAngle = index * angleStep;
        let diff = Math.abs(agentAngle - normalizedAngle);
        
        if (diff > Math.PI) {
            diff = Math.PI * 2 - diff;
        }
        
        if (diff < minDiff) {
            minDiff = diff;
            winnerIndex = index;
        }
    });
    
    currentWinner = state.availableAgents[winnerIndex];
    
    wheelContainer.classList.add('winner-selected');
    drawWheel(currentRotation);
    excludeBtn.disabled = false;
}

// ============ MODE SECRET ============
function toggleSecretMode() {
    state.secretMode.enabled = !state.secretMode.enabled;
    
    if (state.secretMode.enabled) {
        window.electronAPI.openSecretWindow();
    }
    
    updateSecretButtonState();
    saveState();
}

window.addEventListener('focus', async () => {
    const userState = await window.electronAPI.getUserState();
    state.secretMode = userState.secretMode || { enabled: false, target: "Jett" };
    updateSecretButtonState();
});

// ============ EXCLUSION ============
function excludeCurrentAgent() {
    if (!currentWinner) return;
    
    if (!state.excludedAgents.includes(currentWinner.nom)) {
        state.excludedAgents.push(currentWinner.nom);
        updateAvailableAgents();
        currentWinner = null;
        drawWheel(currentRotation);
        updateExcludedDisplay();
        saveState();
        
        excludeBtn.disabled = true;
        wheelContainer.classList.remove('winner-selected');
    }
}

function reintegrateAgent(agentName) {
    state.excludedAgents = state.excludedAgents.filter(name => name !== agentName);
    updateAvailableAgents();
    currentWinner = null;
    drawWheel(currentRotation);
    updateExcludedDisplay();
    saveState();
    
    wheelContainer.classList.remove('winner-selected');
}

function resetAllExcluded() {
    state.excludedAgents = [];
    updateAvailableAgents();
    currentWinner = null;
    drawWheel(currentRotation);
    updateExcludedDisplay();
    saveState();
    
    wheelContainer.classList.remove('winner-selected');
}

function updateExcludedDisplay() {
    if (state.excludedAgents.length === 0) {
        excludedList.innerHTML = '<p style="color: #888;">Aucun agent exclu</p>';
        return;
    }
    
    excludedList.innerHTML = '';
    state.excludedAgents.forEach(agentName => {
        const agent = state.allAgents.find(a => a.nom === agentName);
        if (!agent) return;
        
        const div = document.createElement('div');
        div.className = 'excluded-item';
        div.onclick = () => reintegrateAgent(agentName);
        
        const img = agentImages.get(agentName);
        if (img) {
            const imgElement = document.createElement('img');
            imgElement.src = img.src;
            div.appendChild(imgElement);
        }
        
        const span = document.createElement('span');
        span.textContent = agentName;
        div.appendChild(span);
        
        excludedList.appendChild(div);
    });
}

// ============ AGENTS CUSTOM ============
async function addCustomAgent() {
    const name = agentNameInput.value.trim();
    if (!name) {
        alert('Veuillez entrer un nom');
        return;
    }
    
    if (!selectedImageForCustom) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    if (state.allAgents.some(a => a.nom.toLowerCase() === name.toLowerCase())) {
        alert('Un agent avec ce nom existe déjà');
        return;
    }
    
    const newAgent = {
        nom: name,
        image: selectedImageForCustom.path
    };
    
    state.customAgents.push(newAgent);
    state.allAgents.push(newAgent);
    
    await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            agentImages.set(name, img);
            resolve();
        };
        img.onerror = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 60;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff4655';
            ctx.fillRect(0, 0, 60, 60);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name[0], 30, 30);
            agentImages.set(name, canvas);
            resolve();
        };
        img.src = '../' + selectedImageForCustom.path;
    });
    
    updateAvailableAgents();
    drawWheel(currentRotation);
    updateCustomAgentsDisplay();
    saveState();
    
    agentNameInput.value = '';
    selectedImageForCustom = null;
    selectedImagePath.textContent = '';
    addAgentBtn.disabled = true;
}

async function deleteCustomAgent(agent) {
    await window.electronAPI.deleteCustomImage(agent.image);
    
    state.customAgents = state.customAgents.filter(a => a.nom !== agent.nom);
    state.allAgents = state.allAgents.filter(a => a.nom !== agent.nom);
    state.excludedAgents = state.excludedAgents.filter(name => name !== agent.nom);
    agentImages.delete(agent.nom);
    
    updateAvailableAgents();
    currentWinner = null;
    drawWheel(currentRotation);
    updateExcludedDisplay();
    updateCustomAgentsDisplay();
    saveState();
    
    wheelContainer.classList.remove('winner-selected');
}

function updateCustomAgentsDisplay() {
    if (state.customAgents.length === 0) {
        customAgentsList.innerHTML = '<p style="color: #888;">Aucun agent personnalisé</p>';
        return;
    }
    
    customAgentsList.innerHTML = '';
    state.customAgents.forEach(agent => {
        const div = document.createElement('div');
        div.className = 'custom-agent-item';
        
        const img = agentImages.get(agent.nom);
        if (img) {
            const imgElement = document.createElement('img');
            imgElement.src = img.src;
            div.appendChild(imgElement);
        }
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = agent.nom;
        div.appendChild(nameSpan);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.onclick = () => deleteCustomAgent(agent);
        div.appendChild(deleteBtn);
        
        customAgentsList.appendChild(div);
    });
}

async function saveState() {
    await window.electronAPI.saveUserState({
        agentsCustom: state.customAgents,
        agentsExcluded: state.excludedAgents,
        secretMode: state.secretMode
    });
}

// ============ EVENT LISTENERS ============
spinBtn.addEventListener('click', spinWheel);
excludeBtn.addEventListener('click', excludeCurrentAgent);
resetExcludedBtn.addEventListener('click', resetAllExcluded);
secretModeToggle.addEventListener('click', toggleSecretMode);

selectImageBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.selectImage();
    if (result.success) {
        selectedImageForCustom = result;
        selectedImagePath.textContent = `Image: ${result.name}.png`;
        addAgentBtn.disabled = false;
    }
});

addAgentBtn.addEventListener('click', addCustomAgent);
addAgentBtn.disabled = true;

agentNameInput.addEventListener('input', () => {
    addAgentBtn.disabled = !agentNameInput.value.trim() || !selectedImageForCustom;
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        window.electronAPI.openSecretWindow();
    }
});

// ============ DÉMARRAGE ============
init();