// État global de l'application
let state = {
    allAgents: [],
    availableAgents: [],
    excludedAgents: [],
    excludedRoles: [],
    selectedRoles: [],
    roleSectionVisible: true,
    customAgents: [],
    language: 'en',
    secretMode: { enabled: false, target: "Jett" }
};

const AGENT_ROLES = [
    {
        id: 'duelist',
        labelKey: 'roleDuelist',
        icon: '../assets/logo/duelist.png',
        agents: ['Phoenix', 'Jett', 'Raze', 'Reyna', 'Yoru', 'Neon', 'Iso', 'Waylay', 'Hush']
    },
    {
        id: 'initiator',
        labelKey: 'roleInitiator',
        icon: '../assets/logo/initiator.png',
        agents: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo']
    },
    {
        id: 'controller',
        labelKey: 'roleController',
        icon: '../assets/logo/controller.png',
        agents: ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove', 'Miks']
    },
    {
        id: 'sentinel',
        labelKey: 'roleSentinel',
        icon: '../assets/logo/sentinel.png',
        agents: ['Sage', 'Killjoy', 'Cypher', 'Chamber', 'Deadlock', 'Vyse']
    }
];

// Variables pour l'animation
let canvas = document.getElementById('wheelCanvas');
let ctx = canvas.getContext('2d');
const wheelCacheCanvas = document.createElement('canvas');
wheelCacheCanvas.width = canvas.width;
wheelCacheCanvas.height = canvas.height;
const wheelCacheCtx = wheelCacheCanvas.getContext('2d');
let wheelCacheSignature = null;
let currentRotation = 0;
let isSpinning = false;
let selectedImageForCustom = null;
let agentImages = new Map();
let currentWinner = null;

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
const secretTargetControls = document.getElementById('secretTargetControls');
const secretTargetSelect = document.getElementById('secretTargetSelect');
const secretModeStatus = document.getElementById('secretModeStatus');
const secretShortcutHint = document.getElementById('secretShortcutHint');
const updateBtn = document.getElementById('updateBtn');
const updateSection = document.getElementById('updateSection');
const updateProgress = document.getElementById('updateProgress');
const updateStatus = document.getElementById('updateStatus');
const languageSelect = document.getElementById('languageSelect');
const appMenu = document.getElementById('appMenu');
const roleFilters = document.getElementById('roleFilters');
const clearRoleFiltersBtn = document.getElementById('clearRoleFiltersBtn');
const roleSection = document.getElementById('roleSection');
const toggleRoleSectionBtn = document.getElementById('toggleRoleSectionBtn');
let updateStatusKey = 'updateIdle';
let updateStatusValues = {};
let availableUpdateVersion = null;

/** Load persisted data and assets before drawing the initial roulette. */
async function init() {
    const defaultAgents = await window.electronAPI.getDefaultAgents();
    const userState = await window.electronAPI.getUserState();
    
    state.customAgents = userState.agentsCustom || [];
    state.excludedAgents = userState.agentsExcluded || [];
    state.excludedRoles = (userState.excludedRoles || []).filter(role =>
        AGENT_ROLES.some(definition => definition.id === role)
    );
    state.selectedRoles = (userState.selectedRoles || []).filter(role =>
        AGENT_ROLES.some(definition => definition.id === role)
    );
    state.roleSectionVisible = userState.roleSectionVisible !== false;
    state.language = window.appI18n.languages.includes(userState.language)
        ? userState.language
        : window.appI18n.detectLanguage();
    state.secretMode = userState.secretMode || { enabled: false, target: "Jett" };
    languageSelect.value = state.language;
    window.appI18n.setLanguage(state.language);
    updateRoleSectionToggle();
    updateBtn.textContent = window.appI18n.translate('updateNow');
    renderUpdateStatus();
    
    state.allAgents = [...defaultAgents, ...state.customAgents];
    
    await loadAllImages();
    
    updateAvailableAgents();
    renderRoleFilters();
    drawWheel();
    updateExcludedDisplay();
    updateCustomAgentsDisplay();
    updateSecretTargetOptions();
    updateSecretButtonState();

    try {
        await window.electronAPI.checkForUpdates();
    } catch (error) {
        setUpdateStatus('updateCheckFailed', { message: error.message });
    }
}

function renderUpdateStatus() {
    updateStatus.textContent = window.appI18n.translate(updateStatusKey, updateStatusValues);
}

function updateRoleSectionToggle() {
    roleSection.hidden = !state.roleSectionVisible;
    toggleRoleSectionBtn.textContent = window.appI18n.translate(
        state.roleSectionVisible ? 'hideRoleSection' : 'showRoleSection'
    );
    toggleRoleSectionBtn.setAttribute('aria-expanded', String(state.roleSectionVisible));
}

function toggleRoleSection() {
    state.roleSectionVisible = !state.roleSectionVisible;
    updateRoleSectionToggle();
    saveState();
}

function setUpdateStatus(key, values = {}) {
    updateStatusKey = key;
    updateStatusValues = values;
    renderUpdateStatus();
    updateStatus.hidden = false;
    updateSection.hidden = false;
}

/**
 * Load one agent portrait, falling back to an initials tile when its file is missing.
 * @param {{nom: string, image: string}} agent
 * @param {string} [fallbackColor] Optional background color for custom agents.
 */
function loadAgentImage(agent, fallbackColor) {
    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
            agentImages.set(agent.nom, image);
            resolve(image);
        };

        image.onerror = () => {
            console.warn(`Image not found for ${agent.nom}: ${agent.image}`);
            const fallback = createFallbackAgentImage(agent.nom, fallbackColor);
            agentImages.set(agent.nom, fallback);
            resolve(fallback);
        };

        image.src = getAgentImageSource(agent);
    });
}

function createFallbackAgentImage(name, backgroundColor) {
    const fallback = document.createElement('canvas');
    fallback.width = 64;
    fallback.height = 64;
    const fallbackContext = fallback.getContext('2d');

    fallbackContext.fillStyle = backgroundColor || `hsl(${(name.length * 40) % 360}, 70%, 50%)`;
    fallbackContext.fillRect(0, 0, fallback.width, fallback.height);
    fallbackContext.fillStyle = 'white';
    fallbackContext.font = 'bold 32px Arial';
    fallbackContext.textAlign = 'center';
    fallbackContext.textBaseline = 'middle';
    fallbackContext.fillText(name[0], fallback.width / 2, fallback.height / 2);

    return fallback;
}

async function loadAllImages() {
    await Promise.all(state.allAgents.map(agent => loadAgentImage(agent)));
}

function updateAvailableAgents() {
    const hasRoleFilter = state.selectedRoles.length > 0;
    state.availableAgents = state.allAgents.filter(agent => {
        if (state.excludedAgents.includes(agent.nom)) return false;

        const role = AGENT_ROLES.find(definition => definition.agents.includes(agent.nom));
        if (role && state.excludedRoles.includes(role.id)) return false;

        if (!hasRoleFilter) return true;
        return role && state.selectedRoles.includes(role.id);
    });
}

function renderRoleFilters() {
    roleFilters.replaceChildren();

    AGENT_ROLES.forEach(role => {
        const card = document.createElement('div');
        card.className = 'role-card';
        if (state.excludedRoles.includes(role.id)) card.classList.add('excluded');

        const label = document.createElement('label');
        label.className = 'role-filter-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = role.id;
        checkbox.checked = state.selectedRoles.includes(role.id);
        checkbox.setAttribute('aria-label', window.appI18n.translate(role.labelKey));
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                state.selectedRoles = [...new Set([...state.selectedRoles, role.id])];
            } else {
                state.selectedRoles = state.selectedRoles.filter(id => id !== role.id);
            }
            refreshRoleFilteredWheel();
        });

        const icon = document.createElement('img');
        icon.src = role.icon;
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');

        const roleName = document.createElement('span');
        roleName.textContent = window.appI18n.translate(role.labelKey);

        label.append(checkbox, icon, roleName);

        const excludeButton = document.createElement('button');
        excludeButton.type = 'button';
        excludeButton.className = 'role-exclude-btn';
        excludeButton.textContent = window.appI18n.translate(
            state.excludedRoles.includes(role.id) ? 'restoreRole' : 'excludeRole'
        );
        excludeButton.setAttribute('aria-pressed', String(state.excludedRoles.includes(role.id)));
        excludeButton.addEventListener('click', () => toggleRoleExclusion(role.id));

        card.append(label, excludeButton);
        roleFilters.appendChild(card);
    });

    clearRoleFiltersBtn.disabled = state.selectedRoles.length === 0;
}

function refreshRoleFilteredWheel() {
    updateAvailableAgents();
    currentWinner = null;
    excludeBtn.disabled = true;
    wheelContainer.classList.remove('winner-selected');
    renderRoleFilters();
    drawWheel(currentRotation);
    saveState();
}

function toggleRoleExclusion(roleId) {
    if (state.excludedRoles.includes(roleId)) {
        state.excludedRoles = state.excludedRoles.filter(id => id !== roleId);
    } else {
        state.excludedRoles = [...state.excludedRoles, roleId];
    }

    refreshRoleFilteredWheel();
}

function updateSecretButtonState() {
    const target = state.secretMode.target;

    if (state.secretMode.enabled) {
        secretModeToggle.classList.add('active');
        secretModeToggle.textContent = window.appI18n.translate('secretDisable');
        secretModeToggle.title = window.appI18n.translate('secretTitleActive', { target });
        secretModeToggle.setAttribute('aria-pressed', 'true');
    } else {
        secretModeToggle.classList.remove('active');
        secretModeToggle.textContent = window.appI18n.translate('secretEnable');
        secretModeToggle.title = window.appI18n.translate('secretTitleInactive');
        secretModeToggle.setAttribute('aria-pressed', 'false');
    }

    secretModeStatus.textContent = window.appI18n.translate(
        state.secretMode.enabled ? 'secretStatusActive' : 'secretStatusInactive',
        { target }
    );
    secretModeToggle.disabled = state.allAgents.length === 0;
    secretTargetControls.hidden = !state.secretMode.enabled;
    secretShortcutHint.hidden = !state.secretMode.enabled;
}

function updateSecretTargetOptions() {
    secretTargetSelect.replaceChildren();

    state.allAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.nom;
        option.textContent = agent.nom;
        secretTargetSelect.appendChild(option);
    });

    if (!state.allAgents.some(agent => agent.nom === state.secretMode.target)) {
        state.secretMode.target = state.allAgents[0]?.nom || '';
    }

    secretTargetSelect.value = state.secretMode.target;
    secretTargetSelect.disabled = state.allAgents.length === 0;
}

/** Resolve both legacy bundled paths and persistent custom-image file URLs. */
function getAgentImageSource(agent) {
    return agent.image.startsWith('file://') ? agent.image : '../' + agent.image;
}

// ============ DESSIN DE LA ROUE ============
/** Render the wheel rim and agent portraits once for reuse during animation. */
function drawStaticWheel() {
    const centerX = 250;
    const centerY = 250;
    const radius = 240;
    const count = state.availableAgents.length;
    const angleStep = (Math.PI * 2) / count;

    wheelCacheCtx.clearRect(0, 0, wheelCacheCanvas.width, wheelCacheCanvas.height);
    wheelCacheCtx.beginPath();
    wheelCacheCtx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    wheelCacheCtx.fillStyle = '#1a1a2e';
    wheelCacheCtx.fill();
    wheelCacheCtx.strokeStyle = '#ff4655';
    wheelCacheCtx.lineWidth = 3;
    wheelCacheCtx.stroke();

    state.availableAgents.forEach((agent, index) => {
        const angle = index * angleStep;
        const imageRadius = radius - 40; // Marge de 40px pour contenir les cercles de 32px
        const x = centerX + Math.cos(angle) * imageRadius;
        const y = centerY + Math.sin(angle) * imageRadius;
        const img = agentImages.get(agent.nom);

        if (img) {
            wheelCacheCtx.save();
            wheelCacheCtx.translate(x, y);
            wheelCacheCtx.rotate(angle + Math.PI / 2);

            wheelCacheCtx.beginPath();
            wheelCacheCtx.arc(0, 0, 32, 0, Math.PI * 2);
            wheelCacheCtx.fillStyle = '#2a2a4a';
            wheelCacheCtx.fill();
            wheelCacheCtx.strokeStyle = '#ff4655';
            wheelCacheCtx.lineWidth = 2;
            wheelCacheCtx.stroke();

            wheelCacheCtx.beginPath();
            wheelCacheCtx.arc(0, 0, 30, 0, Math.PI * 2);
            wheelCacheCtx.clip();
            wheelCacheCtx.drawImage(img, -32, -32, 64, 64);
            wheelCacheCtx.restore();
        }
    });
}

/** Reuse the static wheel image while drawing only the winner and pointer per frame. */
function drawWheel(wheelRotation = currentRotation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = 250;
    const centerY = 250;
    const count = state.availableAgents.length;

    if (count === 0) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(window.appI18n.translate('noAgentsAvailable'), centerX, centerY);
        return;
    }

    const signature = state.availableAgents
        .map(agent => `${agent.nom}:${agentImages.get(agent.nom)?.src || ''}`)
        .join('|');

    if (signature !== wheelCacheSignature) {
        drawStaticWheel();
        wheelCacheSignature = signature;
    }

    ctx.drawImage(wheelCacheCanvas, 0, 0);

    // === CENTRE DE LA ROUE ===
    if (currentWinner) {
        const winnerImg = agentImages.get(currentWinner.nom);
        if (winnerImg) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            ctx.strokeStyle = '#ff4655';
            ctx.lineWidth = 5;
            ctx.stroke();
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(winnerImg, centerX - 70, centerY - 70, 140, 140);
            ctx.restore();
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, 72, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 70, 85, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Nom de l'agent sélectionné
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentWinner.nom, centerX, centerY + 95);
            ctx.shadowBlur = 0;
        }
    } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#ff4655';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#ff4655';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VALORANT', centerX, centerY);
    }
    
    // === CURSEUR MOBILE ===
    const cursorStartRadius = 75;
    const cursorEndRadius = 155;
    
    const cursorAngle = wheelRotation - Math.PI / 2;
    const startX = centerX + Math.cos(cursorAngle) * cursorStartRadius;
    const startY = centerY + Math.sin(cursorAngle) * cursorStartRadius;
    const endX = centerX + Math.cos(cursorAngle) * cursorEndRadius;
    const endY = centerY + Math.sin(cursorAngle) * cursorEndRadius;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(255, 70, 85, 0.3)');
    gradient.addColorStop(1, '#ff4655');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4655';
    ctx.shadowBlur = 12;
    ctx.stroke();
    
    const arrowSize = 12;
    const perpAngle = cursorAngle + Math.PI / 2;
    
    const tipX = endX;
    const tipY = endY;
    const leftX = endX - Math.cos(cursorAngle) * arrowSize + Math.cos(perpAngle) * (arrowSize / 2);
    const leftY = endY - Math.sin(cursorAngle) * arrowSize + Math.sin(perpAngle) * (arrowSize / 2);
    const rightX = endX - Math.cos(cursorAngle) * arrowSize - Math.cos(perpAngle) * (arrowSize / 2);
    const rightY = endY - Math.sin(cursorAngle) * arrowSize - Math.sin(perpAngle) * (arrowSize / 2);
    
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
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();
}

// ============ ANIMATION ============
function spinWheel(event) {
    if (isSpinning || state.availableAgents.length === 0) return;

    const useSecretTarget = state.secretMode.enabled && (event.ctrlKey || event.altKey);
    if (useSecretTarget && !state.availableAgents.some(agent => agent.nom === state.secretMode.target)) {
        secretModeStatus.textContent = window.appI18n.translate('secretTargetUnavailable', {
            target: state.secretMode.target
        });
        return;
    }

    updateSecretButtonState();
    isSpinning = true;
    spinBtn.disabled = true;
    excludeBtn.disabled = true;
    
    wheelContainer.classList.remove('winner-selected');
    currentWinner = null;
    drawWheel(currentRotation);
    
    // Keep velocity local to this spin so completed animations leave no stale state.
    let spinVelocity = 0.3 + Math.random() * 0.5;
    
    let secretTargetAngle = null;
    if (useSecretTarget) {
        const targetIndex = state.availableAgents.findIndex(a => a.nom === state.secretMode.target);
        if (targetIndex !== -1) {
            const angleStep = (Math.PI * 2) / state.availableAgents.length;
            secretTargetAngle = targetIndex * angleStep + Math.PI / 2;
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
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
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
    
    let normalizedAngle = (currentRotation - Math.PI / 2) % (Math.PI * 2);
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
    updateSecretButtonState();
    saveState();
}

// ============ EXCLUSION ============
function excludeCurrentAgent() {
    if (!currentWinner) return;

    excludeAgent(currentWinner.nom);
}

function excludeAgent(agentName) {
    if (state.excludedAgents.includes(agentName)) return;

    state.excludedAgents.push(agentName);
    updateAvailableAgents();
    currentWinner = null;
    drawWheel(currentRotation);
    updateExcludedDisplay();
    saveState();

    excludeBtn.disabled = true;
    wheelContainer.classList.remove('winner-selected');
}

function excludeClickedAgent(event) {
    if (isSpinning || state.availableAgents.length === 0) return;

    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const clickX = (event.clientX - bounds.left) * scaleX;
    const clickY = (event.clientY - bounds.top) * scaleY;
    const center = canvas.width / 2;
    const portraitRadius = 32;
    const orbitRadius = 200;
    const angleStep = (Math.PI * 2) / state.availableAgents.length;

    const clickedAgent = state.availableAgents.find((agent, index) => {
        const angle = index * angleStep;
        const agentX = center + Math.cos(angle) * orbitRadius;
        const agentY = center + Math.sin(angle) * orbitRadius;
        return Math.hypot(clickX - agentX, clickY - agentY) <= portraitRadius;
    });

    if (clickedAgent) excludeAgent(clickedAgent.nom);
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
    state.excludedRoles = [];
    updateAvailableAgents();
    currentWinner = null;
    drawWheel(currentRotation);
    updateExcludedDisplay();
    renderRoleFilters();
    saveState();
    
    wheelContainer.classList.remove('winner-selected');
}

function updateExcludedDisplay() {
    if (state.excludedAgents.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = window.appI18n.translate('noExcludedAgents');
        emptyMessage.style.color = '#888';
        excludedList.replaceChildren(emptyMessage);
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
        alert(window.appI18n.translate('enterAgentName'));
        return;
    }
    
    if (!selectedImageForCustom) {
        alert(window.appI18n.translate('selectAgentImage'));
        return;
    }
    
    if (state.allAgents.some(a => a.nom.toLowerCase() === name.toLowerCase())) {
        alert(window.appI18n.translate('duplicateAgentName'));
        return;
    }
    
    const newAgent = {
        nom: name,
        image: selectedImageForCustom.path
    };
    
    state.customAgents.push(newAgent);
    state.allAgents.push(newAgent);
    updateSecretTargetOptions();
    updateSecretButtonState();
    
    await loadAgentImage(newAgent, '#ff4655');
    
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
    updateSecretTargetOptions();
    updateSecretButtonState();
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
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = window.appI18n.translate('noCustomAgents');
        emptyMessage.style.color = '#888';
        customAgentsList.replaceChildren(emptyMessage);
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
        deleteBtn.textContent = window.appI18n.translate('removeAgent');
        deleteBtn.onclick = () => deleteCustomAgent(agent);
        div.appendChild(deleteBtn);
        
        customAgentsList.appendChild(div);
    });
}

async function saveState() {
    // Persist only user-editable settings; bundled agents are loaded from agents.json.
    await window.electronAPI.saveUserState({
        agentsCustom: state.customAgents,
        agentsExcluded: state.excludedAgents,
        excludedRoles: state.excludedRoles,
        selectedRoles: state.selectedRoles,
        roleSectionVisible: state.roleSectionVisible,
        language: state.language,
        secretMode: state.secretMode
    });
}

// ============ EVENT LISTENERS ============
spinBtn.addEventListener('click', spinWheel);
excludeBtn.addEventListener('click', excludeCurrentAgent);
canvas.addEventListener('click', excludeClickedAgent);
resetExcludedBtn.addEventListener('click', resetAllExcluded);
secretModeToggle.addEventListener('click', toggleSecretMode);

secretTargetSelect.addEventListener('change', () => {
    state.secretMode.target = secretTargetSelect.value;
    updateSecretButtonState();
    saveState();
});

clearRoleFiltersBtn.addEventListener('click', () => {
    state.selectedRoles = [];
    refreshRoleFilteredWheel();
});
toggleRoleSectionBtn.addEventListener('click', toggleRoleSection);

languageSelect.addEventListener('change', () => {
    state.language = languageSelect.value;
    window.appI18n.setLanguage(state.language);
    updateBtn.textContent = window.appI18n.translate('updateNow');
    updateRoleSectionToggle();
    renderUpdateStatus();
    updateSecretButtonState();
    updateExcludedDisplay();
    updateCustomAgentsDisplay();
    renderRoleFilters();
    drawWheel(currentRotation);
    if (selectedImageForCustom) {
        selectedImagePath.textContent = window.appI18n.translate('selectedImage', {
            name: selectedImageForCustom.name
        });
    }
    saveState();
});

updateBtn.addEventListener('click', async () => {
    updateBtn.disabled = true;
    updateProgress.value = 0;
    updateProgress.hidden = false;
    setUpdateStatus('updateAvailable', { version: availableUpdateVersion });

    try {
        await window.electronAPI.downloadUpdate();
    } catch (error) {
        updateBtn.disabled = false;
        setUpdateStatus('updateCheckFailed', {
            message: error.message
        });
    }
});

window.electronAPI.onUpdateStatus(({ status, version, percent, message }) => {
    switch (status) {
        case 'checking':
            updateSection.hidden = true;
            break;
        case 'available':
            availableUpdateVersion = version;
            updateBtn.textContent = window.appI18n.translate('updateNow');
            updateBtn.hidden = false;
            updateBtn.disabled = false;
            updateProgress.hidden = true;
            updateStatus.hidden = true;
            updateSection.hidden = false;
            break;
        case 'current':
            availableUpdateVersion = null;
            updateBtn.hidden = true;
            updateProgress.hidden = true;
            updateStatus.hidden = true;
            updateSection.hidden = true;
            break;
        case 'downloading':
            setUpdateStatus('updateAvailable', { version });
            updateProgress.value = 0;
            updateProgress.hidden = false;
            break;
        case 'progress':
            updateProgress.value = percent;
            setUpdateStatus('updateProgress', {
                percent: Math.round(percent)
            });
            break;
        case 'installing':
            setUpdateStatus('updateInstalling', { version });
            updateProgress.hidden = true;
            break;
        case 'unavailable':
            updateBtn.hidden = true;
            updateProgress.hidden = true;
            updateStatus.hidden = true;
            updateSection.hidden = true;
            break;
        case 'error':
            updateBtn.disabled = false;
            updateProgress.hidden = true;
            updateBtn.hidden = !availableUpdateVersion;
            setUpdateStatus('updateFailed', { message });
            break;
        default:
            updateBtn.disabled = false;
            setUpdateStatus('updateUnknown');
    }
});

selectImageBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.selectImage();
    if (result.success) {
        selectedImageForCustom = result;
        selectedImagePath.textContent = window.appI18n.translate('selectedImage', {
            name: result.name
        });
        addAgentBtn.disabled = false;
    }
});

addAgentBtn.addEventListener('click', addCustomAgent);
addAgentBtn.disabled = true;

agentNameInput.addEventListener('input', () => {
    addAgentBtn.disabled = !agentNameInput.value.trim() || !selectedImageForCustom;
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        appMenu.open = true;
        secretTargetSelect.focus();
    }
    if (e.key === 'Escape') {
        appMenu.open = false;
    }
});

document.addEventListener('click', (event) => {
    if (!appMenu.contains(event.target)) {
        appMenu.open = false;
    }
});

window.electronAPI.onOpenSecretMenu(() => {
    appMenu.open = true;
    secretTargetSelect.focus();
});

// ============ DÉMARRAGE ============
init();