function saveSetting() {
	var proxySetting = JSON.parse(localStorage.proxySetting);

	proxySetting['proxy-host'] = $('#proxy-host').val() || "";
	proxySetting['proxy-port'] = $('#proxy-port').val() || "";
	proxySetting['proxy-type'] = $('#proxy-type').val() || "";
	
	proxySetting['auth']['user'] = $('#username').val() || "";
	proxySetting['auth']['pass'] = $('#password').val() || "";

	var settings = JSON.stringify(proxySetting);
	//console.log(settings);

	localStorage.proxySetting = settings;
	reloadProxy();
	loadSetting();

	// sync settings to google cloud
	chrome.storage.sync.set({'proxySetting' : settings}, function() {});
}

document.addEventListener('DOMContentLoaded', function () {
	$('input').change(
		function() { saveSetting(); });

	$('#proxy-type').change(
		function() { saveSetting(); });
});

function loadSetting() {
	$(document).ready(function() {
		var proxySetting = JSON.parse(localStorage.proxySetting);

		$('#proxy-host').val(proxySetting['proxy-host'] || "");
		$('#proxy-port').val(proxySetting['proxy-port'] || "");
		$('#proxy-type').val(proxySetting['proxy-type'] || "");
	  
		$('#username').val(proxySetting['auth']['user'] || "");
		$('#password').val(proxySetting['auth']['pass'] || "");
	});
}

/**
 * load old proxy info
 */
function loadOldInfo() {
    var mode, url, rules, proxyRule;
    var type, host, port;
    var ret, pacType, pacScriptUrl;

    chrome.proxy.settings.get({'incognito': false},
    function(config) {

        mode = config["value"]["mode"];
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
            }

            $('#proxy-rule').val(proxyRule);
        }

        if (mode == "direct" ||
            mode == "system" ||
            mode == "auto_detect" ) {

            return;

        } else if (mode == "pac_script") {

            // may be need to deal with pac data
            url = config.value.pacScript.url
            if (url) {
                ret = url.split('://');
                pacType = ret[0];
                pacScriptUrl = ret[1];

                $('#pac-type').val(pacType + '://');

                // fix pacScriptUrl on Windows platform
                if (pacType == 'file') {
                    if (pacScriptUrl.substring(0, 1) != '/')
                        pacScriptUrl = '/' + pacScriptUrl;
                }

                $('#pac-script-url').val(pacScriptUrl);
            }

        } else if (mode == "fixed_servers") {

            // we are in manual mode
            type = rules[proxyRule]['scheme'];
            host = rules[proxyRule]['host'];
            port = rules[proxyRule]['port'];
            bypassList = rules.bypassList;

            if (type == 'http') {
                $('#http-host').val(host);
                $('#http-port').val(port);
            } else if (type == 'https') {
                $('#https-host').val(host);
                $('#https-port').val(port);
            } else {
                if (type == 'socks5') {
                    $('#socks5').attr('checked', true);
                    $('#socks4').attr('checked', false);
                } else if (type == 'socks4') {
                    $('#socks5').attr('checked', false);
                    $('#socks4').attr('checked', true);
                }

                $('#socks-host').val(host);
                $('#socks-port').val(port);
            }

            if (bypassList)
                $('#bypasslist').val(bypassList.join(','));
        }
    });

    localStorage.firstime = 1;
}

/**
 * get chrome browser proxy settings 
 * and display on the options page
 *
 */
function getProxyInfo(callback) {

    var proxyInfo;
    var proxySetting = JSON.parse(localStorage.proxySetting);
    var mode, rules, proxyRule;

    chrome.proxy.settings.get({'incognito': false},
    function(config) {
        // console.log(JSON.stringify(config));
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
            }

        }

        if (mode == 'direct' ||
            mode == 'system' ||
            mode == 'auto_detect' ) {
            proxyInfo = mode;
        } else if (mode == "pac_script") {
            var url = config['value']['pacScript']['url'];
            if (url)
                proxyInfo = 'pac_url';
            else 
                proxyInfo = 'pac_data';
        } else if (mode == 'fixed_servers')
            proxyInfo = rules[proxyRule]['scheme'];

        localStorage.proxyInfo = proxyInfo;
        callback(proxyInfo);
    });
}

/**
 * @brief use proxy info to set proxy
 *
 */
function reloadProxy() {

    var type, auto, arrayString;
    var proxy = {type: '', host: '', port: ''};
    var config = {
        mode: '',
        pacScript: {},
        rules: {}
    };

    var proxySetting = JSON.parse(localStorage.proxySetting);

    getProxyInfo(function(info) {

        if (typeof info === 'undefined' ||
           info == 'direct' || info == 'system' ) {
            return;
        }

        if (info == 'pac_url') {
            var pacType = proxySetting['pac_type'];
            var proto = pacType.split(':')[0];

            config.mode = 'pac_script';
            config["pacScript"]["url"] = pacType +
                proxySetting['pac_script_url'][proto];

        } else {

            switch(info) {

            case 'http':
                proxy.type = 'http';
                proxy.host = proxySetting['http_host'];
                proxy.port = parseInt(proxySetting['http_port']);
                break;

            case 'https':
                proxy.type = 'https';
                proxy.host = proxySetting['https_host'];
                proxy.port = parseInt(proxySetting['https_port']);
                break;

            case 'socks4':
                proxy.type = 'socks4';
                proxy.host = proxySetting['socks_host'];
                proxy.port = parseInt(proxySetting['socks_port']);
                break;

            case 'socks5':
                proxy.type = 'socks5';
                proxy.host = proxySetting['socks_host'];
                proxy.port = parseInt(proxySetting['socks_port']);
                break;
            }

            var rule = proxySetting['proxy_rule'];
            var chinaList = JSON.parse(localStorage.chinaList);
            var bypasslist = proxySetting['bypasslist'];

            if (proxySetting['internal'] == 'china') {
                bypasslist = chinaList.concat(bypasslist.split(','));
            } else {
                bypasslist = 
                  bypasslist ? bypasslist.split(',') : ['<local>'];
            }

            config.mode = "fixed_servers";
            //config.rules.bypassList = uniqueArray(bypasslist);
            config["rules"][rule] = {
                scheme: proxy.type,
                host: proxy.host,
                port: parseInt(proxy.port)
            };
        }

        //console.log(JSON.stringify(config));

        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'}, function() {})
    });

}

/**
 * set system proxy
 *
 */
function sysProxy() {

    var config = {
        mode: "system",
    };
    var icon = {
        path: "images/off.png",
    }

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    chrome.browserAction.setIcon(icon);
}


//if (!localStorage.firstime)
//    loadOldInfo();
//else
loadSetting();

//getProxyInfo(function(info) {});