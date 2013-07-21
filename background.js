

function setProxyIcon() {

    var icon = {
        path: "images/off.png",
    }

    chrome.proxy.settings.get(
                {'incognito': false},
        function(config) {
            if (config["value"]["mode"] == "system") {
                chrome.browserAction.setIcon(icon);
            } else if (config["value"]["mode"] == "direct") {
                chrome.browserAction.setIcon(icon);
            } else {
                icon["path"] = "images/on.png";
                chrome.browserAction.setIcon(icon);
            }
        }
    );
}

function gotoOptPage() {
    localStorage.firstime = 1;

    var opturl = "options.html";
    var fulurl = chrome.extension.getURL(opturl);
    chrome.tabs.getAllInWindow(undefined, function(tabs) {
        for (var i in tabs) {
            tab = tabs[i];
            if (tab.url == fulurl) {
                chrome.tabs.update(tab.id, { selected: true });
                return;
            }
        }
        chrome.tabs.getSelected(null, function(tab) {
                    chrome.tabs.create({url: opturl,index: tab.index + 1});
        });
    });
}

function callbackFn(details) {
    var proxySetting = JSON.parse(localStorage.proxySetting);

    if (proxySetting){
        var auth = proxySetting['auth'];
        var username = auth['user'];
        var password = auth['pass'];
    }

    if (proxySetting['auth']['enable'] == '')
        return {};

    return details.isProxy === !0 ? {
        authCredentials: {
            username: username,
                password: password
        }
    } : {}
}

chrome.webRequest.onAuthRequired.addListener(
            callbackFn,
            {urls: ["<all_urls>"]},
            ['asyncBlocking'] );

var proxySetting = {
    'pac_script_url' : {'http': '', 'https': '', 'file' : ''},
    'pac_type'   : '',
    'http_host'  : '',
    'http_port'  : '',
    'https_host' : '',
    'https_port' : '',
    'socks_host' : '',
    'socks_port' : '',
    'socks_type' : 'socks5',
    'bypasslist' : '127.0.0.1,localhost',
    'proxy_rule' : '',
    'internal'   : '',
    'auth'       : {'enable': '', 'user': '', 'pass': ''}
}

if (!localStorage.proxySetting) {
    localStorage.proxySetting = JSON.stringify(proxySetting);
    gotoOptPage();
}

setProxyIcon();
