// Chrome Proxy helper
// popup.js
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/popup.js

/**
 * @fileoverview
 *
 * @author: zhouzhenster@gmail.com
 */

var proxySetting = JSON.parse(localStorage.proxySetting);
var proxyRule = proxySetting['proxy_rule'];
var bypasslist = proxySetting['bypasslist'];
var socksHost = proxySetting['socks_host'];
var socksPort = proxySetting['socks_port'];
var socksType = proxySetting['socks_type'];
var httpHost = proxySetting['http_host'];
var httpPort = proxySetting['http_port'];
var httpsHost = proxySetting['https_host'];
var httpsPort = proxySetting['https_port'];
var pacData = proxySetting['pac_data'];
var pacUrlType = proxySetting['pac_type'].split(':')[0];
var pacScriptUrl = proxySetting['pac_script_url'];
var quicHost = proxySetting['quic_host'];
var quicPort = proxySetting['quic_port'];
var chinaList = JSON.parse(localStorage.chinaList);

if (proxySetting['internal'] == 'china') {
    bypasslist = chinaList.concat(bypasslist.split(','));
} else
    bypasslist = bypasslist ? bypasslist.split(',') : ['<local>'];


/**
 * set help message for popup page
 *
 */
function add_li_title() {
    var _http, _https, _socks, _pac, _quic;

    if (httpHost && httpPort) {
        _http = 'http://' + httpHost + ':' + httpPort;
        $('#http-proxy').attr('title', _http);
    }

    if (pacData) {
        $('#pac-data-proxy').attr('title', "pac data");
    }

    if (pacUrlType) {
        if (pacScriptUrl[pacUrlType]) {
            _pac = proxySetting['pac_type'] + pacScriptUrl[pacUrlType]
            $('#pac-url-proxy').attr('title', _pac);
        }
    }

    if (httpsHost && httpsPort) {
        _https = 'https://' + httpsHost + ':' + httpsPort;
        $('#https-proxy').attr('title', _https);
    }

    if (socksHost && socksPort) {
        _socks = socksType + '://' + socksHost + ':' + socksPort;
        $('#socks5-proxy').attr('title', _socks);
    }

    if (quicHost && quicPort) {
        _quic = 'quic://' + quicHost + ':' + quicPort;
    }

}

/**
 * set popup page item blue color
 *
 */
function color_proxy_item() {
    var mode, rules, proxyRule, scheme;

    chrome.proxy.settings.get({'incognito': false},
      function(config) {
        //console.log(JSON.stringify(config));
        mode = config['value']['mode'];
        rules = config['value']['rules'];

        if (rules) {
            if (rules.hasOwnProperty('singleProxy')) {
                proxyRule = 'singleProxy';
            } else if (rules.hasOwnProperty('proxyForHttp')) {
                proxyRule = 'proxyForHttp';
            } else if (rules.hasOwnProperty('proxyForHttps')) {
                proxyRule = 'proxyForHttps'
            } else if (rules.hasOwnProperty('proxyForFtp')) {
                proxyRule = 'proxyForFtp';
            } else if (rules.hasOwnProperty('fallbackProxy')) {
                proxyRule = 'fallbackProxy';
            }

        }

        if (mode == 'system') {
            $('#sys-proxy').addClass('selected');
        } else if (mode == 'direct') {
            $('#direct-proxy').addClass('selected');
        } else if (mode == 'pac_script') {
            if (localStorage.proxyInfo == 'pac_url')
                $('#pac-url-proxy').addClass('selected');
            else
                $('#pac-data-proxy').addClass('selected');
        } else if (mode == 'auto_detect') {
            $('#auto-detect').addClass('selected');
        }else {
            scheme = rules[proxyRule]['scheme'];

            if (scheme == 'http') {
                $('#http-proxy').addClass('selected');
            } else if (scheme == 'https') {
                $('#https-proxy').addClass('selected');
            } else if (scheme == 'socks5') {
                $('#socks5-proxy').addClass('selected');
            } else if (scheme == 'socks4') {
                $('#socks5-proxy').addClass('selected');
            } else if (scheme == 'quic') {
                $('#quic-proxy').addClass('selected');
            }
        }
    });
}

/**
 * set the icon on or off
 *
 */
function iconSet(str) {

    var icon = {
        path: 'images/on.png',
    }
    if (str == 'off') {
        icon['path'] = 'images/off.png';
    }
    chrome.browserAction.setIcon(icon);
}

function proxySelected(str) {
    var id = '#' + str;
    $('li').removeClass('selected');
    $(id).addClass('selected');
}

/**
 * set pac script proxy
 *
 */
function pacDatatProxy() {

    var config = {
        mode: 'pac_script',
        pacScript: {
        },
    };

    config['pacScript']['data'] = pacData;
    localStorage.proxyInfo = 'pac_data';

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('pac-data-proxy');
}

/**
 * set pac url proxy
 *
 */
function pacUrlProxy() {

    var config = {
        mode: 'pac_script',
        pacScript: {
        },
    };

    config['pacScript']['url'] = proxySetting['pac_type'] + pacScriptUrl[pacUrlType];
    localStorage.proxyInfo = 'pac_url';

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('pac-url-proxy');
}

/**
 * set socks proxy (socks4 or socks5)
 *
 */
function socks5Proxy() {

    var config = {
        mode: 'fixed_servers',
        rules: {
            bypassList:bypasslist
        }
    };

    if (!socksHost) return;

    config['rules'][proxyRule] = {
        scheme: socksType,
        host: socksHost,
        port: parseInt(socksPort)
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('socks5-proxy');

    if (socksType == 'socks5')
        localStorage.proxyInfo = 'socks5';
    else
        localStorage.proxyInfo = 'socks4';
}

/**
 * set http proxy
 *
 */
function httpProxy() {

    var config = {
        mode: 'fixed_servers',
        rules: {
            bypassList: bypasslist
        },
    };

    if (!httpHost) return;

    if (proxyRule == 'fallbackProxy')
        proxyRule = 'singleProxy';

    config['rules'][proxyRule] = {
                             scheme: 'http',
                             host: httpHost,
                             port: parseInt(httpPort)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('http-proxy');
    localStorage.proxyInfo = 'http';
}

/**
 * set https proxy
 *
 */
function httpsProxy() {

    var config = {
        mode: 'fixed_servers',
        rules: {
            bypassList:bypasslist
        }
    };

    if (!httpsHost) return;

    config['rules'][proxyRule] = {
                             scheme: 'https',
                             host: httpsHost,
                             port: parseInt(httpsPort)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('https-proxy');
    localStorage.proxyInfo = 'https';
}

function quicProxy() {

    var config = {
        mode: 'fixed_servers',
        rules: {
            bypassList:bypasslist
        }
    };

    if (!quicHost) return;

    config['rules'][proxyRule] = {
                             scheme: 'quic',
                             host: quicHost,
                             port: parseInt(quicPort)
                         };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('quic-proxy');
    localStorage.proxyInfo = 'quic';
}

/**
 * set direct proxy
 *
 */
function directProxy() {

    var config = {
        mode: 'direct',
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('off');
    proxySelected('direct-proxy');
    localStorage.proxyInfo = 'direct';
}

/**
 * set system proxy
 *
 */
function sysProxy() {

    var config = {
        mode: 'system',
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('off');
    proxySelected('sys-proxy')
    localStorage.proxyInfo = 'system';
}

/**
 * set auto detect proxy
 *
 */
function autoProxy() {

    var config = {
        mode: 'auto_detect',
    };

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    iconSet('on');
    proxySelected('auto-detect')
    localStorage.proxyInfo = 'auto_detect';
}


chrome.proxy.onProxyError.addListener(function(details) {
    console.log(details.error);
});


document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#pac-data-proxy').addEventListener('click', pacDatatProxy);
    document.querySelector('#pac-url-proxy').addEventListener('click', pacUrlProxy);
    document.querySelector('#socks5-proxy').addEventListener('click', socks5Proxy);
    document.querySelector('#http-proxy').addEventListener('click', httpProxy);
    document.querySelector('#https-proxy').addEventListener('click', httpsProxy);
    document.querySelector('#quic-proxy').addEventListener('click', quicProxy);
    document.querySelector('#sys-proxy').addEventListener('click', sysProxy);
    document.querySelector('#direct-proxy').addEventListener('click', directProxy);
    document.querySelector('#auto-detect').addEventListener('click', autoProxy);

    $('[data-i18n-content]').each(function() {
        var message = chrome.i18n.getMessage(this.getAttribute('data-i18n-content'));
        if (message)
            $(this).html(message);
    });

    if (!httpHost) {
        $('#http-proxy').hide();
    }

    if (!socksHost) {
        $('#socks5-proxy').hide();
    }

    if (!httpsHost) {
        $('#https-proxy').hide();
    }

    if (!pacData) {
        $('#pac-data-proxy').hide();
    }

    if (!pacScriptUrl[pacUrlType]) {
        $('#pac-url-proxy').hide();
    }

    if (!quicHost) {
        $('#quic-proxy').hide();
    }

});

$(document).ready(function() {
    color_proxy_item();
    add_li_title();
});
