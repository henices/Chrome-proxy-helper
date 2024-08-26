var localStorage = {};

function setProxyIcon() {

    var icon = {
        path: "images/off.png",
    }

    chrome.proxy.settings.get(
                {'incognito': false},
        function(config) {
            if (config["value"]["mode"] == "system") {
                chrome.action.setIcon(icon);
            } else if (config["value"]["mode"] == "direct") {
                chrome.action.setIcon(icon);
            } else {
                icon["path"] = "images/on.png";
                chrome.action.setIcon(icon);
            }
        }
    );
}

function gotoPage(url) {

    var fulurl = chrome.runtime.getURL(url);
    chrome.tabs.query({ url: fulurl }, function(tabs) {
        if (tabs.length) {
            chrome.tabs.update(tabs[0].id, { selected: true });
            chrome.windows.update(tabs[0].windowId, { focused: true });
            return;
        }
        chrome.tabs.create({url: url, active: true});
    });
}

async function callbackFn(details, cb) {
    console.log("%s onAuthRequiredCB", new Date(Date.now()).toISOString());

    if (localStorage.proxySetting == undefined)
        await getLocalStorage();

    var proxySetting = JSON.parse(localStorage.proxySetting);

    if (proxySetting){
        var auth = proxySetting['auth'];
        var username = auth['user'];
        var password = auth['pass'];
    }

    if (proxySetting['auth']['user'] == '' && 
        proxySetting['auth']['pass'] == '')
        cb({});

    cb({ authCredentials: {username: username, password: password} });
}

chrome.webRequest.onAuthRequired.addListener(
            callbackFn,
            {urls: ["<all_urls>"]},
            ['asyncBlocking'] );

chrome.runtime.onMessage.addListener((msg, sender, res) => {
    if (msg.action != "authUpdate")
        return;

    (async () => {
        console.log("%s receive authUpdate", new Date(Date.now()).toISOString());
        if (localStorage.proxySetting == undefined)
            await getLocalStorage();

        var proxySetting = JSON.parse(localStorage.proxySetting);
        proxySetting['auth'] = msg.data;
        localStorage.proxySetting = JSON.stringify(proxySetting);
        await chrome.storage.local.set(localStorage);

        console.log("%s sending authUpdate response", new Date(Date.now()).toISOString());
        res('done');
    })();

    return true;
});

var proxySetting = {
    'pac_script_url' : {'http': '', 'https': '', 'file' : ''},
    'pac_type'   : 'file://',
    'http_host'  : '',
    'http_port'  : '',
    'https_host' : '',
    'https_port' : '',
    'socks_host' : '',
    'socks_port' : '',
    'socks_type' : 'socks5',
    'bypasslist' : '<local>,192.168.0.0/16,172.16.0.0/12,169.254.0.0/16,10.0.0.0/8',
    'proxy_rule' : 'singleProxy',
    'internal'   : '',
    'auth'       : {'enable': '', 'user': '', 'pass': ''},
    'rules_mode' : 'Whitelist'
}

var chinaList = ['*.cn']

localStorage.chinaList = JSON.stringify(chinaList);

function getBypass() {
    var req = new XMLHttpRequest();
    var url = "https://raw.github.com/henices/Chrome-proxy-helper/master/data/cn.bypasslist";
    req.open('GET', url, true);
    req.onreadystatechange = processResponse;
    req.send(null);

    function processResponse() {
        if (req.readyState == 4 &&
            req.status == 200) {
            localStorage.chinaList = JSON.stringify(req.responseText.split(','));
        } else
            localStorage.chinaList = JSON.stringify(chinaList);
    }
}

chrome.runtime.onInstalled.addListener(async details => {
    var store = await getLocalStorage();
    if (store.proxySetting == undefined) {
        localStorage.proxySetting = JSON.stringify(proxySetting);
        await chrome.storage.local.set(localStorage);

        if (details.reason == "update") {
            chrome.runtime.onMessage.addListener((msg, sender, res) => {
                if (msg.action != "migrationDone")
                    return;

                console.log("%s data migration done", new Date(Date.now()).toISOString());
                chrome.offscreen.closeDocument();
            });

            console.log("%s starting data migration", new Date(Date.now()).toISOString());
            chrome.offscreen.createDocument({
                url: 'migration.html',
                reasons: ['LOCAL_STORAGE'],
                justification: 'Migrate storage data for MV2 to MV3',
            });
        }
    }
    if(details.reason == "install") {
        gotoPage('options.html');
    }
/*
    else if(details.reason == "update") {
        gotoPage('CHANGELOG');
    }
*/
});

function getLocalStorage() {
    console.trace("%s getLocalStorage", new Date(Date.now()).toISOString());
    return chrome.storage.local.get(null).then(result => {
        console.log("%s getLocalStorage: result = %O", new Date(Date.now()).toISOString(), result);
        if (result.proxySetting != undefined) {
            Object.assign(localStorage, result);
        }
        return result;
    });
}


chrome.commands.onCommand.addListener(function(command) {
  if (command == 'open-option')
      gotoPage('options.html');
});

// sync extension settings from google cloud
//chrome.storage.sync.get('proxySetting', function(val) {
//    if (typeof val.proxySetting !== "undefined")
//        localStorage.proxySetting = val.proxySetting;
//});

chrome.proxy.onProxyError.addListener(function(details) {
    console.log("fatal: ", details.fatal);
    console.log("error: ", details.error);
    console.log("details: ", details.details)
});

console.log("%s service worker initialized", new Date(Date.now()).toISOString());
setProxyIcon();

// sync bypass list from github.com
//getBypass();
//setInterval(function() { getBypass(); }, interval);
//var interval = 1000 * 60 * 60;


