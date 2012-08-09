var rule = localStorage.rule;
var bypasslist = (localStorage.bypass).split(',');


$(document).ready(function() {
    init();
});

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#pac-script').addEventListener('click', pacProxy);
    document.querySelector('#socks5-proxy').addEventListener('click', socks5Proxy);
    document.querySelector('#http-proxy').addEventListener('click', httpProxy);
    document.querySelector('#https-proxy').addEventListener('click', httpsProxy);
    document.querySelector('#sys-proxy').addEventListener('click', sysProxy);
});

function init() {

    chrome.proxy.settings.get(
    {'incognito': false},
    function(config) {
        //alert(JSON.stringify(config));
        if (config["value"]["mode"] == "system") {
            $("#system").addClass("selected");
        } 
        else if (config["value"]["mode"] == "pac_script") {
            $("#pac").addClass("selected");

        }
        else {
            if (config["value"]["rules"][rule]["scheme"] == "http") {
                $("#http").addClass("selected");
            }
            if (config["value"]["rules"][rule]["scheme"] == "https") {
                $("#https").addClass("selected");
            }
            if (config["value"]["rules"][rule]["scheme"] == "socks5") {
                $("#socks5").addClass("selected");
            }
        }
    }
    );
}

function iconSet(str) {

    var icon = {
        path: "images/on.png",
    }
    if (str == "off") {
        icon["path"] = "images/off.png";
    }
    chrome.browserAction.setIcon(icon);
}

function proxySelected(str) {
    var id = "#" + str;
    $("span").removeClass("selected");
    $(id).addClass("selected");
}

function pacProxy() {

    var config = {
        mode: "pac_script",
        pacScript: {
            url: localStorage.pacPath,
        }
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet("on");
    proxySelected("pac");
}

function sysProxy() {

    var config = {
        mode: "system",
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet("off");
    proxySelected("system")
}

function socks5Proxy() {
    var type = '';

    if (localStorage.socks5 == 'true')
        type = 'socks5';

    if (localStorage.socks4 == 'true')
        type = 'socks4';

    if (localStorage.socks4 == 'false' &&
        localStorage.socks5 == 'false')
        return;

    if ( !type ) return;

    var config = {
        mode: "fixed_servers",
        rules: {
            bypassList:bypasslist
        }
    };

    config["rules"][rule] = {
                             scheme: type,
                             host: localStorage.socks5Host,
                             port: parseInt(localStorage.socks5Port)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    var icon = {
        path: "images/on.png",
    }

    iconSet("on");
    proxySelected("socks5");
}

function httpProxy() {

    var config = {
        mode: "fixed_servers",
        rules: {
            bypassList: bypasslist
        },
    };

    config["rules"][rule] = {
                             scheme: "http",
                             host: localStorage.httpHost,
                             port: parseInt(localStorage.httpPort)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    var icon = {
        path: "images/on.png",
    }

    iconSet("on");
    proxySelected("http");
}

function httpsProxy() {

    var config = {
        mode: "fixed_servers",
        rules: {
            bypassList:bypasslist
        }
    };

    config["rules"][rule] = {
                             scheme: "https",
                             host: localStorage.httpsHost,
                             port: parseInt(localStorage.httpsPort)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    var icon = {
        path: "images/on.png",
    }

    iconSet("on");
    proxySelected("https");
}
