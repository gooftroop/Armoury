var rulesOverlay = document.querySelector('.rules-overlay');
var railTabs = document.querySelectorAll('.rules-rail-tab');
var railIndex = 0;
var secondaryCardsDrawer = document.querySelector('.secondary-cards-drawer');
var secondaryMissionCardDrawer = document.getElementById('secondaryMissionCardDrawer');
var missionRulesCardDrawer = document.getElementById('missionRulesCardDrawer');

function clearRailActive() {
    var idx = 0;
    for (idx = 0; idx < railTabs.length; idx += 1) {
        railTabs[idx].classList.remove('active');
    }
}

function handleRailTabClick() {
    closeMissionDrawers();
    var wasActive = this.classList.contains('active');
    clearRailActive();
    if (rulesOverlay) {
        if (wasActive) {
            rulesOverlay.style.display = 'none';
        } else {
            this.classList.add('active');
            rulesOverlay.style.display = '';
        }
    }
}

for (railIndex = 0; railIndex < railTabs.length; railIndex += 1) {
    railTabs[railIndex].addEventListener('click', handleRailTabClick);
}

var rulesOverlayClose = document.querySelector('.rules-overlay .btn-icon');
function handleOverlayClose(event) {
    closeAllModals();
    event.stopPropagation();
}
if (rulesOverlayClose && rulesOverlay) {
    rulesOverlayClose.addEventListener('click', handleOverlayClose);
}

function closeMissionDrawers() {
    if (secondaryMissionCardDrawer) secondaryMissionCardDrawer.classList.remove('active');
    if (missionRulesCardDrawer) missionRulesCardDrawer.classList.remove('active');
}

function toggleMissionDrawer(type) {
    var target;
    var other;
    var tabIndex = type === 'secondary' ? 2 : 3;
    if (type === 'secondary') {
        target = secondaryMissionCardDrawer;
        other = missionRulesCardDrawer;
    } else {
        target = missionRulesCardDrawer;
        other = secondaryMissionCardDrawer;
    }
    if (rulesOverlay) rulesOverlay.style.display = 'none';
    if (secondaryCardsDrawer) secondaryCardsDrawer.classList.remove('active');
    if (other) other.classList.remove('active');
    clearRailActive();
    if (target) {
        if (target.classList.contains('active')) {
            target.classList.remove('active');
        } else {
            target.classList.add('active');
            if (railTabs[tabIndex]) railTabs[tabIndex].classList.add('active');
        }
    }
}

function toggleSecondaryCardsDrawer() {
    if (secondaryCardsDrawer) {
        if (secondaryCardsDrawer.classList.contains('active')) {
            secondaryCardsDrawer.classList.remove('active');
        } else {
            secondaryCardsDrawer.classList.add('active');
        }
    }
}

var secondaryCardsCloseButton = document.querySelector('.secondary-cards-drawer .btn-icon');
if (secondaryCardsCloseButton) {
    secondaryCardsCloseButton.addEventListener('click', function() {
        closeAllModals();
    });
}

var detailPanel = document.getElementById('defaultDetailPanel') || document.querySelector('.match-detail-panel:not(.unit-detail-drawer):not(.stratagem-drawer)');
var unitDetailDrawer = document.querySelector('.unit-detail-drawer');
var stratagemDrawer = document.querySelector('.stratagem-drawer');

function showDefaultPanel() {
    var matchLayout = document.querySelector('.match-layout');
    if (matchLayout) matchLayout.classList.remove('panel-closed');
    if (detailPanel) detailPanel.style.display = '';
    if (unitDetailDrawer) unitDetailDrawer.classList.remove('active');
    if (stratagemDrawer) stratagemDrawer.classList.remove('active');
}

function hideDetailPanel() {
    var matchLayout = document.querySelector('.match-layout');
    if (matchLayout) matchLayout.classList.add('panel-closed');
    if (unitDetailDrawer) unitDetailDrawer.classList.remove('active');
    if (stratagemDrawer) stratagemDrawer.classList.remove('active');
    if (rulesOverlay) rulesOverlay.style.display = 'none';
}

function showUnitDetailDrawer() {
    if (detailPanel) detailPanel.style.display = 'none';
    if (stratagemDrawer) stratagemDrawer.classList.remove('active');
    if (unitDetailDrawer) unitDetailDrawer.classList.add('active');
}

function showStratagemDrawer() {
    if (detailPanel) detailPanel.style.display = 'none';
    if (unitDetailDrawer) unitDetailDrawer.classList.remove('active');
    if (stratagemDrawer) stratagemDrawer.classList.add('active');
}

function selectUnit(unitType, rowEl) {
    var panel = document.getElementById('defaultDetailPanel');
    if (!panel) return;
    var matchLayout = document.querySelector('.match-layout');
    if (matchLayout) matchLayout.classList.remove('panel-closed');
    if (unitDetailDrawer) unitDetailDrawer.classList.remove('active');
    if (stratagemDrawer) stratagemDrawer.classList.remove('active');
    if (panel) panel.style.display = '';
    var rows = document.querySelectorAll('.match-unit-row, .move-unit, .shooting-unit, .charge-unit, .fight-unit');
    var r;
    for (r = 0; r < rows.length; r += 1) { rows[r].classList.remove('selected'); }
    if (rowEl) rowEl.classList.add('selected');
    var html = '';
    if (unitType === 'captain') {
        html += '<div class="detail-unit-header"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;"><div>';
        html += '<div class="detail-unit-name">Captain in Terminator Armour</div>';
        html += '<div class="detail-unit-keywords">Character, Infantry, Imperium, Terminator, Captain</div>';
        html += '</div><button class="drawer-close" aria-label="Close" onclick="hideDetailPanel()"><i data-lucide="x"></i></button></div></div>';
        html += '<div class="stat-block" style="margin-bottom:14px;">';
        html += '<div class="stat-block-cell"><span class="stat-block-label">M</span><span class="stat-block-value">5"</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">T</span><span class="stat-block-value">5</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">SV</span><span class="stat-block-value">2+</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">W</span><span class="stat-block-value">6</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">LD</span><span class="stat-block-value">6+</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">OC</span><span class="stat-block-value">1</span></div>';
        html += '</div>';
        html += '<div style="margin-top:var(--space-4);"><div class="text-label" style="margin-bottom:var(--space-2);">Models (1)</div>';
        html += '<div style="display:flex;flex-direction:column;gap:var(--space-2);">';
        html += '<div style="padding:var(--space-3);background:oklch(1 0 0 / 6%);border-radius:var(--radius-md);">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">';
        html += '<span style="font-size:14px;font-weight:500;color:var(--text-primary);">Captain in Terminator Armour</span>';
        html += '<div style="display:flex;align-items:center;gap:var(--space-2);">';
        html += '<div class="hp-bar" style="width:48px;height:4px;"><div class="hp-bar-fill hp-high" style="width:100%;"></div></div>';
        html += '<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">6/6</span>';
        html += '<div class="model-hp-controls">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">−</button>';
        html += '<input type="text" class="model-hp-input" value="6">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">+</button>';
        html += '</div></div></div>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Ranged</div>';
        html += '<table class="weapon-table" style="font-size:12px;margin-bottom:var(--space-2);">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>BS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Storm bolter</td><td>24"</td><td>2</td><td>2+</td><td>4</td><td>0</td><td>1</td></tr></tbody></table>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Melee</div>';
        html += '<table class="weapon-table" style="font-size:12px;">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>WS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Relic weapon</td><td>Melee</td><td>5</td><td>2+</td><td>6</td><td>-2</td><td>2</td></tr></tbody></table>';
        html += '</div></div></div>';
        html += '<div style="margin-top:var(--space-4);"><div class="text-label" style="margin-bottom:var(--space-2);">Abilities</div>';
        html += '<div class="ability-card"><div class="ability-name">Rites of Battle (Aura)</div><div class="ability-desc">Once per turn, one unit within 6" can re-roll a Hit roll.</div></div>';
        html += '<div class="ability-card"><div class="ability-name">Leader</div><div class="ability-desc">Can attach to Terminator Squad, Assault Terminator Squad.</div></div>';
        html += '<div class="ability-card"><div class="ability-name">Deep Strike</div><div class="ability-desc">Can be set up in Reserves and deployed 9"+ from enemies.</div></div>';
        html += '</div>';
    } else if (unitType === 'intercessor') {
        html += '<div class="detail-unit-header"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;"><div>';
        html += '<div class="detail-unit-name">Intercessor Squad</div>';
        html += '<div class="detail-unit-keywords">Infantry, Battleline, Imperium, Intercessor</div>';
        html += '</div><button class="drawer-close" aria-label="Close" onclick="hideDetailPanel()"><i data-lucide="x"></i></button></div></div>';
        html += '<div class="stat-block" style="margin-bottom:14px;">';
        html += '<div class="stat-block-cell"><span class="stat-block-label">M</span><span class="stat-block-value">6"</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">WS</span><span class="stat-block-value">3+</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">BS</span><span class="stat-block-value">3+</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">S</span><span class="stat-block-value">4</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">T</span><span class="stat-block-value">4</span></div>';
        html += '<div class="stat-block-cell"><span class="stat-block-label">W</span><span class="stat-block-value">2</span></div>';
        html += '</div>';
        html += '<div style="margin-top:var(--space-4);"><div class="text-label" style="margin-bottom:var(--space-2);">Models (6)</div>';
        html += '<div style="display:flex;flex-direction:column;gap:var(--space-2);">';
        html += '<div style="padding:var(--space-3);background:oklch(1 0 0 / 6%);border-radius:var(--radius-md);">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">';
        html += '<span style="font-size:14px;font-weight:500;color:var(--text-primary);">Intercessor Sergeant</span>';
        html += '<div style="display:flex;align-items:center;gap:var(--space-2);">';
        html += '<div class="hp-bar" style="width:48px;height:4px;"><div class="hp-bar-fill hp-high" style="width:100%;"></div></div>';
        html += '<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">2/2</span>';
        html += '<div class="model-hp-controls">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">−</button>';
        html += '<input type="text" class="model-hp-input" value="2">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">+</button>';
        html += '</div></div></div>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Ranged</div>';
        html += '<table class="weapon-table" style="font-size:12px;margin-bottom:var(--space-2);">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>BS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Bolt rifle</td><td>24"</td><td>2</td><td>3+</td><td>4</td><td>-1</td><td>1</td></tr>';
        html += '<tr><td>Bolt pistol</td><td>12"</td><td>1</td><td>3+</td><td>4</td><td>0</td><td>1</td></tr></tbody></table>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Melee</div>';
        html += '<table class="weapon-table" style="font-size:12px;">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>WS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Astartes chainsword</td><td>Melee</td><td>4</td><td>3+</td><td>4</td><td>-1</td><td>1</td></tr></tbody></table>';
        html += '</div>';
        html += '<div style="padding:var(--space-3);background:oklch(1 0 0 / 6%);border-radius:var(--radius-md);">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">';
        html += '<span style="font-size:14px;font-weight:500;color:var(--text-primary);">Intercessor ×5</span>';
        html += '<div style="display:flex;align-items:center;gap:var(--space-2);">';
        html += '<div class="hp-bar" style="width:48px;height:4px;"><div class="hp-bar-fill hp-high" style="width:80%;"></div></div>';
        html += '<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">8/10</span>';
        html += '<div class="model-hp-controls">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">−</button>';
        html += '<input type="text" class="model-hp-input" value="8">';
        html += '<button class="counter-btn" style="width:18px;height:18px;font-size:10px;border-radius:3px;">+</button>';
        html += '</div></div></div>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Ranged</div>';
        html += '<table class="weapon-table" style="font-size:12px;margin-bottom:var(--space-2);">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>BS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Bolt rifle</td><td>24"</td><td>2</td><td>3+</td><td>4</td><td>-1</td><td>1</td></tr>';
        html += '<tr><td>Bolt pistol</td><td>12"</td><td>1</td><td>3+</td><td>4</td><td>0</td><td>1</td></tr></tbody></table>';
        html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:var(--space-1);">Melee</div>';
        html += '<table class="weapon-table" style="font-size:12px;">';
        html += '<thead><tr><th>Weapon</th><th>Rng</th><th>A</th><th>WS</th><th>S</th><th>AP</th><th>D</th></tr></thead>';
        html += '<tbody><tr><td>Close combat weapon</td><td>Melee</td><td>3</td><td>3+</td><td>4</td><td>0</td><td>1</td></tr></tbody></table>';
        html += '</div></div></div>';
        html += '<div style="margin-top:var(--space-4);"><div class="text-label" style="margin-bottom:var(--space-2);">Abilities</div>';
        html += '<div class="ability-card"><div class="ability-name">Oath of Moment</div><div class="ability-desc">Re-roll hit rolls of 1 when targeting the selected enemy unit.</div></div>';
        html += '</div>';
    }
    panel.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeAllModals() {
    showDefaultPanel();
    clearRailActive();
    if (rulesOverlay) rulesOverlay.style.display = 'none';
    if (secondaryCardsDrawer) secondaryCardsDrawer.classList.remove('active');
    if (secondaryMissionCardDrawer) secondaryMissionCardDrawer.classList.remove('active');
    if (missionRulesCardDrawer) missionRulesCardDrawer.classList.remove('active');
    var endTurnOverlay = document.getElementById('end-turn-overlay');
    if (endTurnOverlay) endTurnOverlay.style.display = 'none';
    if (typeof closeMatchUnitDrawer === 'function') {
        closeMatchUnitDrawer();
    }
}

var allDetails = document.querySelectorAll('details.popover-trigger');
document.addEventListener('click', function(e) {
    var j;
    for (j = 0; j < allDetails.length; j += 1) {
        if (!allDetails[j].contains(e.target)) {
            allDetails[j].removeAttribute('open');
        }
    }
});

var drawerCloseButtons = document.querySelectorAll('.unit-detail-drawer .drawer-close, .stratagem-drawer .drawer-close');
var dcbIdx;
for (dcbIdx = 0; dcbIdx < drawerCloseButtons.length; dcbIdx += 1) {
    drawerCloseButtons[dcbIdx].addEventListener('click', function() {
        closeAllModals();
    });
}

window.clearRailActive = clearRailActive;
window.closeMissionDrawers = closeMissionDrawers;
window.toggleMissionDrawer = toggleMissionDrawer;
window.toggleSecondaryCardsDrawer = toggleSecondaryCardsDrawer;
window.showDefaultPanel = showDefaultPanel;
window.hideDetailPanel = hideDetailPanel;
window.showUnitDetailDrawer = showUnitDetailDrawer;
window.showStratagemDrawer = showStratagemDrawer;
window.selectUnit = selectUnit;
window.closeAllModals = closeAllModals;
