let state = { secretMode: { enabled: false, target: "Jett" } };
let allAgents = [];
const select = document.getElementById('agentSelect');
const statusDiv = document.getElementById('status');
const enableBtn = document.getElementById('enableBtn');
const disableBtn = document.getElementById('disableBtn');

async function init() {
    // Charger les agents par défaut ET les agents personnalisés
    const defaultAgents = await window.electronAPI.getDefaultAgents();
    const userState = await window.electronAPI.getUserState();
    
    // Fusionner tous les agents
    const customAgents = userState.agentsCustom || [];
    allAgents = [...defaultAgents, ...customAgents];
    
    state.secretMode = userState.secretMode || { enabled: false, target: "Jett" };
    
    // Remplir le select avec TOUS les agents
    select.innerHTML = '';
    allAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.nom;
        option.textContent = agent.nom;
        if (agent.nom === state.secretMode.target) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    updateStatus();
}

function updateStatus() {
    if (state.secretMode.enabled) {
        statusDiv.className = 'status enabled';
        statusDiv.textContent = `Mode secret : ACTIVÉ sur ${state.secretMode.target}`;
    } else {
        statusDiv.className = 'status disabled';
        statusDiv.textContent = 'Mode secret : DÉSACTIVÉ';
    }
}

async function saveSecretMode() {
    const userState = await window.electronAPI.getUserState();
    userState.secretMode = state.secretMode;
    await window.electronAPI.saveUserState(userState);
}

enableBtn.addEventListener('click', async () => {
    state.secretMode.enabled = true;
    state.secretMode.target = select.value;
    updateStatus();
    await saveSecretMode();
});

disableBtn.addEventListener('click', async () => {
    state.secretMode.enabled = false;
    updateStatus();
    await saveSecretMode();
});

select.addEventListener('change', () => {
    if (state.secretMode.enabled) {
        state.secretMode.target = select.value;
        saveSecretMode();
        updateStatus();
    }
});

init();