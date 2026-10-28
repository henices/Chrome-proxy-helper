importScripts('javascripts/profiles.js');

function setProxyIcon() {
    var icon = { path: 'images/off.png' };
    chrome.proxy.settings.get({ incognito: false }, function(config) {
        var mode = config && config.value && config.value.mode;
        if (mode && mode !== 'system' && mode !== 'direct') {
            icon.path = 'images/on.png';
        }
        chrome.action.setIcon(icon);
    });
}

function gotoPage(url) {
    var fullUrl = chrome.runtime.getURL(url);
    chrome.tabs.query({ url: fullUrl }, function(tabs) {
        if (tabs.length) {
            chrome.tabs.update(tabs[0].id, { selected: true });
            chrome.windows.update(tabs[0].windowId, { focused: true });
            return;
        }
        chrome.tabs.create({ url: url, active: true });
    });
}

async function callbackFn(details, cb) {
    console.log('%s onAuthRequiredCB', new Date(Date.now()).toISOString());
    var r = await chrome.storage.local.get(['profiles', 'activeProfileId']);
    var p = r.profiles && r.profiles[r.activeProfileId];
    if (!p || !p.auth || (!p.auth.user && !p.auth.pass)) {
        cb({});
        return;
    }
    cb({ authCredentials: { username: p.auth.user, password: p.auth.pass } });
}

chrome.webRequest.onAuthRequired.addListener(
    callbackFn,
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
);

chrome.runtime.onMessage.addListener(function(msg, sender, res) {
    if (msg.action !== 'authUpdate') return;

    (async () => {
        console.log('%s receive authUpdate', new Date(Date.now()).toISOString());
        var r = await chrome.storage.local.get(['profiles', 'activeProfileId']);
        var profiles = r.profiles || {};
        var p = profiles[r.activeProfileId];
        if (p) {
            p.auth = msg.data;
            await chrome.storage.local.set({ profiles: profiles });
        }
        res('done');
    })();

    return true;
});

function runProfileMigration() {
    ensureMigrated(function() {
        console.log('%s profiles ready', new Date(Date.now()).toISOString());
    });
}

chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.local.get(null, function(store) {
        var needsMv2Migration = details.reason === 'update' &&
                                store.proxySetting === undefined &&
                                store.profiles === undefined;

        if (needsMv2Migration) {
            chrome.runtime.onMessage.addListener(function migrationListener(msg) {
                if (msg.action !== 'migrationDone') return;
                console.log('%s data migration done', new Date(Date.now()).toISOString());
                chrome.runtime.onMessage.removeListener(migrationListener);
                chrome.offscreen.closeDocument();
                runProfileMigration();
            });

            console.log('%s starting MV2->MV3 data migration', new Date(Date.now()).toISOString());
            chrome.offscreen.createDocument({
                url: 'migration.html',
                reasons: ['LOCAL_STORAGE'],
                justification: 'Migrate storage data for MV2 to MV3'
            });
        } else {
            runProfileMigration();
        }

        if (details.reason === 'install') {
            gotoPage('options.html');
        }
    });
});

chrome.commands.onCommand.addListener(function(command) {
    if (command === 'open-option') {
        gotoPage('options.html');
        return;
    }
    if (command === 'cycle-profile') {
        chrome.storage.local.get(['profiles', 'activeProfileId'], function(r) {
            var ids = Object.keys(r.profiles || {});
            if (ids.length < 2) return;
            var idx = ids.indexOf(r.activeProfileId);
            var nextId = ids[(idx + 1) % ids.length];
            setActiveAndApply(nextId);
        });
    }
});

chrome.proxy.onProxyError.addListener(function(details) {
    console.log('fatal: ', details.fatal);
    console.log('error: ', details.error);
    console.log('details: ', details.details);
});

console.log('%s service worker initialized', new Date(Date.now()).toISOString());
chrome.proxy.settings.onChange.addListener(setProxyIcon);
setProxyIcon();
