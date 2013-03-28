// Chrome Proxy helper
// popup.js
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/popup.js

/**
 * @fileoverview
 *
 * @author: zhouzhenster@gmail.com
 */

var rule = localStorage.rule;
var bypasslist = (localStorage.bypass).split(',');


$(document).ready(function() {
    color_proxy_item();
    add_li_title();
});


document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#pac-script').addEventListener('click', pacProxy);
    document.querySelector('#socks5-proxy').addEventListener('click', socks5Proxy);
    document.querySelector('#http-proxy').addEventListener('click', httpProxy);
    document.querySelector('#https-proxy').addEventListener('click', httpsProxy);
    document.querySelector('#sys-proxy').addEventListener('click', sysProxy);
    document.querySelector('#direct-proxy').addEventListener('click', directProxy);

    $('[data-i18n-content]').each(function() {
        var message = chrome.i18n.getMessage(this.getAttribute('data-i18n-content'));
        if (message)
            $(this).html(message);
    });

});

chrome.proxy.onProxyError.addListener( function(details) {
        console.log(JSON.stringify(details));
});

/**
 * set help message for popup page
 *
 */
function add_li_title() {
    var _http, _https, _socks, _pac;

    if (localStorage.httpHost && localStorage.httpPort) {
        _http = "http://" + localStorage.httpHost +
                 ":" + localStorage.httpPort;
        $("#http-proxy").attr("title", _http);
    }
    if (localStorage.pacPath) {
        _pac = localStorage.pacPath;
        $("#pac-script").attr("title", _pac);
    }
    if (localStorage.httpsHost && localStorage.httpsPort) {
        _https = "https://" + localStorage.httpsHost +
                  ":" + localStorage.httpsPort;
        $("#https-proxy").attr("title", _https);
    }
    if (localStorage.socks5Host && localStorage.socks5Port) {
        if (localStorage.socks5 === 'true') {
            _socks = "socks5://" + localStorage.socks5Host +
                      ":" + localStorage.socks5Port;
            $("#socks5-proxy").attr("title", _socks);
        }
        else {
            _socks = "socks4://" + localStorage.socks5Host +
                      ":" + localStorage.socks5Port;
            $("#socks5-proxy").attr("title", _socks);
        }
    }
}

/**
 * set popup page item blue color
 *
 */
function color_proxy_item() {

    chrome.proxy.settings.get(
    {'incognito': false},
    function(config) {
        //alert(JSON.stringify(config));
        if (config["value"]["mode"] == "system") {
            $("#system").addClass("selected");
        } else if (config["value"]["mode"] == "direct") {
            $("#direct").addClass("selected");
        } else if (config["value"]["mode"] == "pac_script") {
            $("#pac").addClass("selected");
        } else {
            if (config["value"]["rules"][rule]["scheme"] == "http") {
                $("#http").addClass("selected");
            } else if (config["value"]["rules"][rule]["scheme"] == "https") {
                $("#https").addClass("selected");
            } else if (config["value"]["rules"][rule]["scheme"] == "socks5") {
                $("#socks5").addClass("selected");
            } else if (config["value"]["rules"][rule]["scheme"] == "socks4") {
                $("#socks5").addClass("selected");
            }else {
                ;
            }
        }
    }
    );
}

/**
 * set the icon on or off
 *
 */
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

/**
 * merge pac data
 *
 */

function mergePacData() {
    var pacData;
    var mergeData;

    pacData = localStorage.pacData;
    if (pacData.indexOf('${pac_rules}') !== -1)
        mergeData = pacData.replace('${pac_rules}', localStorage.pacRules);
    else
        mergeData = pacData;

    return mergeData;
}

/**
 * set pac script proxy
 *
 */
function pacProxy() {

    var config = {
        mode: "pac_script",
        pacScript: {
        },
    };


    var mergeData = mergePacData();


    if (localStorage.useMemory == 'true') {
        config["pacScript"]["data"] = mergeData;
        config["pacScript"]["url"] = "";
    } else {
        config["pacScript"]["url"] = localStorage.pacPath;
        config["pacScript"]["data"] = "";
    }

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet("on");
    proxySelected("pac");
}

/**
 * set system proxy
 *
 */
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

/**
 * set socks proxy (socks4 or socks5)
 *
 */
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

    iconSet("on");
    proxySelected("socks5");
}

/**
 * set http proxy
 *
 */
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

    iconSet("on");
    proxySelected("http");
}

/**
 * set https proxy
 *
 */
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

    iconSet("on");
    proxySelected("https");
}

/**
 * set direct proxy
 *
 */
function directProxy() {

    var config = {
        mode: "direct",
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet("off");
    proxySelected("direct");
}
