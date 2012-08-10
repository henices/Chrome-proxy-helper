function init() {
    var icon = {
        path: "images/off.png",
    }

    chrome.proxy.settings.get(
                {'incognito': false},
        function(config) {
            if (config["value"]["mode"] == "system") {
                chrome.browserAction.setIcon(icon);
            }
            else {
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
                    chrome.tabs.create({
                            url: opturl,
                            index: tab.index + 1
                    });
        });
    });
}

init();

if ( !localStorage.firstime ) {
    localStorage.socks5 = true;
    localStorage.socks4 = false;
    gotoOptPage();
}

