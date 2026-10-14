// Chrome Proxy helper - options page
// Profile-aware: every form binds to the *editing* profile in #profile-select.
// The active proxy type is chosen from the popup, not here; this page only
// edits a profile's hosts/PAC/bypass/auth. Saves silently unless the editing
// profile is also the active one, in which case the change is re-applied.

var currentEditingId = null;
var activeProfileId = null;
var allProfiles = {};

function refreshProfileSelect() {
    var $sel = $('#profile-select').empty();
    Object.keys(allProfiles).forEach(function(id) {
        var p = allProfiles[id];
        $sel.append($('<option>').val(id).text(p.name));
    });
    $sel.val(currentEditingId);
    updateActiveBadge();
}

function updateActiveBadge() {
    $('#active-indicator').toggle(currentEditingId === activeProfileId);
}

// `internal` is a comma-separated list of built-in bypass-list names.
function _internalSelected(p, name) {
    var names = (p.internal || '').split(',');
    for (var i = 0; i < names.length; i++) {
        if ((names[i] || '').trim() === name) return true;
    }
    return false;
}

function _readInternal() {
    var names = [];
    if ($('#china-list').is(':checked')) names.push('china');
    if ($('#iran-list').is(':checked')) names.push('iran');
    return names.join(',');
}

function loadProxyDataFor(id) {
    var p = allProfiles[id];
    if (!p) return;

    $('#socks-host').val(p.socks_host || '');
    $('#socks-port').val(p.socks_port || '');
    $('#http-host').val(p.http_host || '');
    $('#http-port').val(p.http_port || '');
    $('#https-host').val(p.https_host || '');
    $('#https-port').val(p.https_port || '');
    $('#pac-type').val(p.pac_type || 'file://');
    $('#pac-data').val(p.pac_data || '');
    $('#bypasslist').val(p.bypasslist || '');
    $('#proxylist').val(p.proxylist || '');
    $('#proxy-rule').val(p.proxy_rule || 'singleProxy');
    $('#username').val((p.auth && p.auth.user) || '');
    $('#password').val((p.auth && p.auth.pass) || '');

    try {
        var type = (p.pac_type || 'file://').split(':')[0];
        $('#pac-script-url').val((p.pac_script_url && p.pac_script_url[type]) || '');
    } catch (e) {}

    $('#socks5').prop('checked', p.socks_type === 'socks5');
    $('#socks4').prop('checked', p.socks_type === 'socks4');
    $('#china-list').prop('checked', _internalSelected(p, 'china'));
    $('#iran-list').prop('checked', _internalSelected(p, 'iran'));

    var rulesMode = p.rules_mode || 'Whitelist';
    $('#rules-mode').val(rulesMode);
    applyRulesModeUI(rulesMode);
}

function applyRulesModeUI(mode) {
    $('.rules-whitelist').toggle(mode !== 'Blacklist');
    $('.rules-blacklist').toggle(mode === 'Blacklist');
}

function readFormIntoProfile(p) {
    p.http_host = $('#http-host').val() || '';
    p.http_port = $('#http-port').val() || '';
    p.https_host = $('#https-host').val() || '';
    p.https_port = $('#https-port').val() || '';
    p.socks_host = $('#socks-host').val() || '';
    p.socks_port = $('#socks-port').val() || '';
    p.pac_type = $('#pac-type').val() || 'file://';
    p.pac_data = $('#pac-data').val() || '';
    p.bypasslist = $('#bypasslist').val() || '';
    p.proxylist = $('#proxylist').val() || '';
    p.proxy_rule = $('#proxy-rule').val() || 'singleProxy';

    if (!p.auth) p.auth = { enable: '', user: '', pass: '' };
    p.auth.user = $('#username').val() || '';
    p.auth.pass = $('#password').val() || '';

    if ($('#socks5').is(':checked')) p.socks_type = 'socks5';
    if ($('#socks4').is(':checked')) p.socks_type = 'socks4';

    p.internal = _readInternal();
    p.rules_mode = $('#rules-mode').val() || 'Whitelist';

    try {
        var pacType = (p.pac_type || 'file://').split(':')[0];
        if (!p.pac_script_url) p.pac_script_url = { http: '', https: '', file: '' };
        p.pac_script_url[pacType] = $('#pac-script-url').val() || '';
    } catch (e) {}

    return p;
}

function save() {
    if (!currentEditingId) return;
    var id = currentEditingId;
    // Single read-modify-write: popup may have changed mode / activeProfileId
    // in storage while this page was open; re-fetch both so the form-merge
    // doesn't clobber the popup's update.
    chrome.storage.local.get(['profiles', 'activeProfileId'], function(r) {
        var profiles = r.profiles || {};
        var stored = profiles[id];
        if (!stored) return;
        readFormIntoProfile(stored);
        stored.id = id;
        profiles[id] = stored;
        var freshActive = r.activeProfileId || null;
        chrome.storage.local.set({ profiles: profiles }, function() {
            allProfiles[id] = stored;
            activeProfileId = freshActive;
            updateActiveBadge();
            if (id === freshActive) applyProfile(id);
        });
    });
}

function reloadAndRender(selectId, cb) {
    listProfiles(function(profiles, active) {
        allProfiles = profiles;
        activeProfileId = active;
        if (selectId && allProfiles[selectId]) {
            currentEditingId = selectId;
        } else if (!allProfiles[currentEditingId]) {
            currentEditingId = activeProfileId || Object.keys(allProfiles)[0];
        }
        refreshProfileSelect();
        loadProxyDataFor(currentEditingId);
        cb && cb();
    });
}

function onSelectProfile() {
    currentEditingId = $('#profile-select').val();
    loadProxyDataFor(currentEditingId);
    updateActiveBadge();
}

function onNewProfile() {
    var name = window.prompt(i18nMessage('profile_name_prompt', 'Profile name:'), '');
    if (!name) return;
    createProfile(name, null, function(newId) {
        reloadAndRender(newId);
    });
}

function onRenameProfile() {
    if (!currentEditingId) return;
    var current = allProfiles[currentEditingId];
    var name = window.prompt(i18nMessage('profile_name_prompt', 'Profile name:'), current ? current.name : '');
    if (!name) return;
    renameProfile(currentEditingId, name, function() {
        reloadAndRender(currentEditingId);
    });
}

function onDuplicateProfile() {
    if (!currentEditingId) return;
    var current = allProfiles[currentEditingId];
    var defaultName = current ? current.name + ' (copy)' : '';
    var name = window.prompt(i18nMessage('profile_name_prompt', 'Profile name:'), defaultName);
    if (!name) return;
    createProfile(name, currentEditingId, function(newId) {
        reloadAndRender(newId);
    });
}

function onDeleteProfile() {
    if (!currentEditingId) return;
    var id = currentEditingId;
    chrome.storage.local.get(['activeProfileId'], function(r) {
        if (r.activeProfileId === id) {
            window.alert(i18nMessage('cannot_delete_active_profile', 'Cannot delete the active profile. Switch to another profile first.'));
            return;
        }
        if (!window.confirm(i18nMessage('delete_profile_confirm', 'Delete this profile? This cannot be undone.'))) return;
        deleteProfile(id, function() {
            reloadAndRender(null);
        });
    });
}

function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        $('#pac-data').val(ev.target.result);
        save();
    };
    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', function() {
    $('#profile-select').on('change', onSelectProfile);
    $('#profile-new').on('click', onNewProfile);
    $('#profile-rename').on('click', onRenameProfile);
    $('#profile-duplicate').on('click', onDuplicateProfile);
    $('#profile-delete').on('click', onDeleteProfile);

    $('.mainview input, .mainview textarea, .mainview select').not('#pac-type').on('change', save);

    $('#rules-mode').on('change', function() {
        applyRulesModeUI($('#rules-mode').val());
    });

    $('#pac-type').on('change', function() {
        var type = $('#pac-type').val().split(':')[0];
        var p = allProfiles[currentEditingId];
        if (p && p.pac_script_url) {
            $('#pac-script-url').val(p.pac_script_url[type] || '');
        }
        save();
    });

    var pacFile = document.getElementById('pac-file');
    if (pacFile) pacFile.addEventListener('change', readSingleFile, false);

    ensureMigrated(function() {
        reloadAndRender(null);
    });
});
