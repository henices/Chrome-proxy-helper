// Profile-aware storage helpers shared by background.js, popup.js, options.js.
// Loaded via <script> in pages and via importScripts() in the service worker.

var PROFILES_SCHEMA_VERSION = 2;

// Built-in bypass lists
var INTERNAL_LISTS = {
    china: ['*.cn'],
    iran:  ['*.ir']
};

var DEFAULT_PROFILE_FIELDS = {
    mode: 'direct',
    pac_script_url: { http: '', https: '', file: '' },
    pac_type: 'file://',
    pac_data: '',
    http_host: '', http_port: '',
    https_host: '', https_port: '',
    socks_host: '', socks_port: '', socks_type: 'socks5',
    bypasslist: '<local>,192.168.0.0/16,172.16.0.0/12,169.254.0.0/16,10.0.0.0/8',
    proxylist: '',
    proxy_rule: 'singleProxy',
    internal: '',
    auth: { enable: '', user: '', pass: '' },
    rules_mode: 'Whitelist'
};

var MODE_LABEL_KEYS = {
    direct: 'direct_proxy',
    system: 'system_proxy',
    auto_detect: 'auto_detect_set',
    http: 'http_proxy_set',
    https: 'https_proxy_set',
    socks: 'socks_proxy_set',
    pac_url: 'pac_url_set',
    pac_data: 'pac_data_set'
};

var MODE_ICONS = {
    direct:      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    system:      '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    auto_detect: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>',
    http:        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    https:       '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
    socks:       '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    pac_url:     '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    pac_data:    '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
};

function normalizeMode(mode) {
    return (mode === 'socks4' || mode === 'socks5') ? 'socks' : mode;
}

function modeIcon(mode) {
    return MODE_ICONS[normalizeMode(mode)] || MODE_ICONS.direct;
}

function modeLabel(mode) {
    var key = MODE_LABEL_KEYS[normalizeMode(mode)];
    return key ? i18nMessage(key, mode) : mode;
}

// The proxy entries this profile actually has filled in, in display order.
// 'socks' is a single UI entry; callers resolve it to the profile's socks_type.
// (Direct / System / Auto Detect aren't here — they're always offered.)
function configuredModes(p) {
    var modes = [];
    if (p.http_host && p.http_port) modes.push('http');
    if (p.https_host && p.https_port) modes.push('https');
    if (p.socks_host && p.socks_port) modes.push('socks');
    var pacProto = (p.pac_type || '').split(':')[0];
    if (p.pac_script_url && p.pac_script_url[pacProto]) modes.push('pac_url');
    if (p.pac_data) modes.push('pac_data');
    return modes;
}

function resolveMode(p, mode) {
    return mode === 'socks' ? (p && p.socks_type) || 'socks5' : mode;
}

function _profileNewId() {
    return 'p_' + Math.random().toString(36).slice(2, 9);
}

function _profileDeepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function _profileDefault(id, name) {
    var p = _profileDeepCopy(DEFAULT_PROFILE_FIELDS);
    p.id = id;
    p.name = name;
    return p;
}

function _profileUniqueArray(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
        if (!seen[arr[i]]) { seen[arr[i]] = true; out.push(arr[i]); }
    }
    return out;
}

function i18nMessage(key, fallback) {
    var m;
    try { m = chrome.i18n.getMessage(key); } catch (e) {}
    return m || fallback;
}

function _profileDefaultName() {
    return i18nMessage('profile_default_name', 'Default');
}

// Legacy localized values used as the default profile name in earlier builds.
var _LEGACY_DEFAULT_NAMES = { '默认': true, 'proxy': true };

function _renameLegacyDefault(profiles, cb) {
    var p = profiles && profiles['default'];
    if (!p || !_LEGACY_DEFAULT_NAMES[p.name]) { cb && cb(); return; }
    p.name = _profileDefaultName();
    chrome.storage.local.set({ profiles: profiles }, function() { cb && cb(); });
}

function ensureMigrated(cb) {
    chrome.storage.local.get(null, function(result) {
        if (result.schemaVersion === PROFILES_SCHEMA_VERSION && result.profiles) {
            _renameLegacyDefault(result.profiles, function() { cb && cb(); });
            return;
        }

        var profile = _profileDefault('default', _profileDefaultName());
        if (result.proxySetting) {
            try {
                var v1 = JSON.parse(result.proxySetting);
                Object.assign(profile, v1);
                profile.id = 'default';
                profile.name = _profileDefaultName();
                profile.mode = result.proxyInfo || 'direct';
            } catch (e) {}
        }

        var update = {
            schemaVersion: PROFILES_SCHEMA_VERSION,
            activeProfileId: 'default',
            profiles: { 'default': profile }
        };
        if (!result.internalLists) {
            update.internalLists = JSON.parse(JSON.stringify(INTERNAL_LISTS));
        }

        chrome.storage.local.set(update, function() {
            chrome.storage.local.remove(['proxySetting', 'proxyInfo'], function() {
                cb && cb();
            });
        });
    });
}

function listProfiles(cb) {
    chrome.storage.local.get(['profiles', 'activeProfileId'], function(r) {
        cb(r.profiles || {}, r.activeProfileId || null);
    });
}

function getProfile(id, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        cb((r.profiles && r.profiles[id]) || null);
    });
}

function getActiveProfile(cb) {
    chrome.storage.local.get(['profiles', 'activeProfileId'], function(r) {
        cb((r.profiles && r.profiles[r.activeProfileId]) || null, r.activeProfileId || null);
    });
}

function saveProfile(id, profile, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var profiles = r.profiles || {};
        profile.id = id;
        profiles[id] = profile;
        chrome.storage.local.set({ profiles: profiles }, function() { cb && cb(); });
    });
}

function createProfile(name, fromId, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var profiles = r.profiles || {};
        var id = _profileNewId();
        var src = fromId && profiles[fromId];
        var p = src ? _profileDeepCopy(src) : _profileDefault(id, name);
        p.id = id;
        p.name = name;
        profiles[id] = p;
        chrome.storage.local.set({ profiles: profiles }, function() {
            cb && cb(id, p);
        });
    });
}

function renameProfile(id, newName, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var profiles = r.profiles || {};
        if (!profiles[id]) { cb && cb(); return; }
        profiles[id].name = newName;
        chrome.storage.local.set({ profiles: profiles }, function() { cb && cb(); });
    });
}

function deleteProfile(id, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var profiles = r.profiles || {};
        if (!profiles[id]) { cb && cb(); return; }
        delete profiles[id];
        chrome.storage.local.set({ profiles: profiles }, function() { cb && cb(); });
    });
}

function setActiveProfile(id, cb) {
    chrome.storage.local.set({ activeProfileId: id }, function() { cb && cb(); });
}

function _profileSetIcon(mode) {
    var path = (mode === 'direct' || mode === 'system') ? 'images/off.png' : 'images/on.png';
    try { chrome.action.setIcon({ path: path }); } catch (e) {}
}

// {type, host, port} for the four fixed-server proxy modes (or null for direct/system/pac/...)
function _profileEndpoint(profile) {
    switch (profile.mode) {
        case 'http':   return { type: 'http',   host: profile.http_host,  port: parseInt(profile.http_port)  };
        case 'https':  return { type: 'https',  host: profile.https_host, port: parseInt(profile.https_port) };
        case 'socks4': return { type: 'socks4', host: profile.socks_host, port: parseInt(profile.socks_port) };
        case 'socks5': return { type: 'socks5', host: profile.socks_host, port: parseInt(profile.socks_port) };
        default:       return null;
    }
}

var _PAC_SCHEME_TOKEN = { http: 'PROXY', https: 'HTTPS', socks4: 'SOCKS', socks5: 'SOCKS5' };


function _internalPatterns(profile, stored) {
    var names = (profile.internal || '').split(',');
    var out = [];
    for (var i = 0; i < names.length; i++) {
        var name = (names[i] || '').trim();
        if (!name) continue;
        var patterns = (stored && stored[name]) || INTERNAL_LISTS[name];
        if (!patterns) continue;
        for (var j = 0; j < patterns.length; j++) {
            if (out.indexOf(patterns[j]) === -1) out.push(patterns[j]);
        }
    }
    return out;
}

function _profileBuildFixedServers(profile, internalLists) {
    var rule = profile.proxy_rule;
    var proxy = _profileEndpoint(profile) || { type: '', host: '', port: 0 };
    if (proxy.type === 'http' && rule === 'fallbackProxy') rule = 'singleProxy';

    var bypass;
    var internal = _internalPatterns(profile, internalLists);
    if (internal.length) {
        bypass = internal.concat((profile.bypasslist || '').split(','));
    } else {
        bypass = profile.bypasslist ? profile.bypasslist.split(',') : ['<local>'];
    }

    var config = {
        mode: 'fixed_servers',
        rules: { bypassList: _profileUniqueArray(bypass) }
    };
    config.rules[rule] = { scheme: proxy.type, host: proxy.host, port: proxy.port };
    return config;
}

function _profileBuildConfig(p, internalLists) {
    switch (p.mode) {
        case 'direct':      return { mode: 'direct' };
        case 'system':      return { mode: 'system' };
        case 'auto_detect': return { mode: 'auto_detect' };
        case 'pac_data':
            return { mode: 'pac_script', pacScript: { data: p.pac_data || '' } };
        case 'pac_url':
            var proto = (p.pac_type || 'http://').split(':')[0];
            return {
                mode: 'pac_script',
                pacScript: { url: (p.pac_type || '') + ((p.pac_script_url && p.pac_script_url[proto]) || '') }
            };
        default:
            if (p.rules_mode === 'Blacklist') {
                return _profileBuildBlacklistPac(p);
            }
            return _profileBuildFixedServers(p, internalLists);
    }
}

// Chrome's proxy API only supports a bypass list (whitelist), so Blacklist mode
// is implemented as a synthesized PAC script: requests whose host matches the
// list go through the configured proxy, everything else goes DIRECT.
// China list is whitelist-only and intentionally ignored here.
function _profileBuildBlacklistPac(profile) {
    var ep = _profileEndpoint(profile);
    var proxy = ep ? (_PAC_SCHEME_TOKEN[ep.type] + ' ' + ep.host + ':' + ep.port) : 'DIRECT';

    var list = _profileUniqueArray(
        (profile.proxylist || '').split(',')
            .map(function(s) { return (s || '').trim(); })
            .filter(Boolean)
    );

    return { mode: 'pac_script', pacScript: { data: _profileBlacklistPacScript(proxy, list) } };
}

function _profileBlacklistPacScript(proxy, patterns) {
    return [
        '// Auto-generated by Chrome Proxy Helper (Blacklist mode).',
        '// Hosts matching PATTERNS use PROXY (no DIRECT fallback - proxy',
        '// failures are surfaced to match Whitelist mode). Everything else',
        '// goes DIRECT.',
        'var PROXY = ' + JSON.stringify(proxy) + ';',
        'var PATTERNS = ' + JSON.stringify(patterns) + ';',
        '',
        'function _stripSchemePort(p) {',
        '    var s = p.indexOf("://");',
        '    if (s !== -1) p = p.substring(s + 3);',
        '    if (p.indexOf("/") === -1) {',
        '        var c = p.lastIndexOf(":");',
        '        if (c !== -1) p = p.substring(0, c);',
        '    }',
        '    return p.toLowerCase();',
        '}',
        '',
        'function _cidrMask(bits) {',
        '    bits = parseInt(bits, 10);',
        '    var m = [0, 0, 0, 0];',
        '    for (var i = 0; i < 4 && bits > 0; i++) {',
        '        var n = bits >= 8 ? 8 : bits;',
        '        bits -= n;',
        '        m[i] = (0xff << (8 - n)) & 0xff;',
        '    }',
        '    return m.join(".");',
        '}',
        '',
        'function _isIPv4(s) {',
        '    return /^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(s);',
        '}',
        '',
        'function _endsWithDomain(host, bare) {',
        '    if (host === bare) return true;',
        '    var sfx = "." + bare;',
        '    return host.indexOf(sfx, host.length - sfx.length) !== -1;',
        '}',
        '',
        'function _matches(host, pattern) {',
        '    if (!pattern) return false;',
        '    if (pattern === "<local>") return host.indexOf(".") === -1;',
        '    var slash = pattern.indexOf("/");',
        '    if (slash !== -1) {',
        '        var ip = _isIPv4(host) ? host : dnsResolve(host);',
        '        if (!ip) return false;',
        '        return isInNet(ip, pattern.substring(0, slash), _cidrMask(pattern.substring(slash + 1)));',
        '    }',
        '    if (pattern.charAt(0) === ".") return _endsWithDomain(host, pattern.substring(1));',
        '    if (pattern.indexOf("*") === -1 && pattern.indexOf("?") === -1) return _endsWithDomain(host, pattern);',
        '    // "*.foo.com" should also match the apex "foo.com" - shExpMatch alone skips it.',
        '    if (pattern.charAt(0) === "*" && pattern.charAt(1) === ".") {',
        '        var apex = pattern.substring(2);',
        '        if (apex && apex.indexOf("*") === -1 && apex.indexOf("?") === -1) return _endsWithDomain(host, apex);',
        '    }',
        '    return shExpMatch(host, pattern);',
        '}',
        '',
        // Normalize once at load, not per request.
        'PATTERNS = PATTERNS.map(_stripSchemePort);',
        '',
        'function FindProxyForURL(url, host) {',
        '    host = (host || "").toLowerCase();',
        '    for (var i = 0; i < PATTERNS.length; i++) {',
        '        if (_matches(host, PATTERNS[i])) return PROXY;',
        '    }',
        '    return "DIRECT";',
        '}'
    ].join('\n');
}


function _withInternalLists(cb) {
    chrome.storage.local.get(['internalLists'], function(r) {
        var lists = r.internalLists;
        if (typeof lists === 'string') {
            try { lists = JSON.parse(lists); } catch (e) { lists = null; }
        }
        cb((lists && typeof lists === 'object') ? lists : null);
    });
}

function _applyProfileObj(p, internalLists, cb) {
    if (!p) { cb && cb(); return; }
    var config = _profileBuildConfig(p, internalLists);
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, function() {
        _profileSetIcon(p.mode);
        cb && cb();
    });
}

function applyProfile(id, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var p = r.profiles && r.profiles[id];
        _withInternalLists(function(internalLists) {
            _applyProfileObj(p, internalLists, cb);
        });
    });
}

function applyMode(id, mode, cb) {
    chrome.storage.local.get(['profiles'], function(r) {
        var profiles = r.profiles || {};
        if (!profiles[id]) { cb && cb(); return; }
        profiles[id].mode = mode;
        chrome.storage.local.set({ profiles: profiles }, function() {
            _withInternalLists(function(internalLists) {
                _applyProfileObj(profiles[id], internalLists, cb);
            });
        });
    });
}

function setActiveAndApply(id, cb) {
    setActiveProfile(id, function() {
        applyProfile(id, cb);
    });
}

function setActiveAndApplyMode(id, mode, cb) {
    setActiveProfile(id, function() {
        applyMode(id, mode, cb);
    });
}
