// Chrome Proxy helper
// by zhouzhenster@gmail.com
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/options.js


function loadProxyData() {

  $(document).ready(function() {

      var proxySetting = JSON.parse(localStorage.proxySetting);

      $('#socks-host').val(proxySetting['socks_host'] || "");
      $('#socks-port').val(proxySetting['socks_port'] || "");
      $('#http-host').val(proxySetting['http_host'] || "");
      $('#http-port').val(proxySetting['http_port'] || "");
      $('#https-host').val(proxySetting['https_host'] || "");
      $('#https-port').val(proxySetting['https_port'] || "");
      $('#pac-type').val(proxySetting['pac_type'] || "");
      $('#bypasslist').val(proxySetting['bypasslist'] || "");
      $('#proxy-rule').val(proxySetting['proxy_rule'] || "");
      $('#username').val(proxySetting['auth']['user'] || "");
      $('#password').val(proxySetting['auth']['pass'] || "");

      var type = proxySetting['pac_type'].split(':')[0];
      $('#pac-script-url').val(proxySetting['pac_script_url'][type] || "");

      if (proxySetting['socks_type'] == 'socks5') {
        $('#socks5').attr('checked', true);
        $('#socks4').attr('checked', false);
      }

      if (proxySetting['socks_type'] == 'socks4') {
        $('#socks4').attr('checked', true);
        $('#socks5').attr('checked', false);
      }

      if (proxySetting['auth']['enable'] == 'y') {
          $('#use-pass').attr('checked', true);
      }

      if (proxySetting['internal'] == 'china') {
          $('#use-china-list').attr('checked', true);
      }

      $('#div-auth-input').hide();

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
                alert(url);
                ret = url.split('://');
                pacType = ret[0];
                pacScriptUrl = ret[1];

                $('#pac-script-url').val(pacScriptUrl);
                $('#pac-type').val(pacType + '://');
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
function getProxyInfo() {

    var proxyInfo, controlInfo, host, port;
    var proxySetting = JSON.parse(localStorage.proxySetting);
    var mode, rules, proxyRule;

    chrome.proxy.settings.get({'incognito': false},
    function(config) {
        //alert(JSON.stringify(config));
        mode = config['value']['mode'];
        rules = config['value']['rules'];

        if (rules) {
            if (rules.hasOwnProperty('singleProxy')) {
                proxyRule = 'singleProxy';
            } else if (rules.hasOwnProperty('proxyForHttp')) {
                proxyRule = 'proxyForHttp';
            } else if (rules.hasOwnProperty('proxyForHttps')) {
                proxyRule = 'proxyForHttps'
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
    });
}

/**
 * get uniq array
 *
 */
function uniqueArray(arr) {
    var hash = {}, result = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (!hash.hasOwnProperty(arr[i])) {
            hash[arr[i]] = true;
            result.push(arr[i]);
        }
    }
    return result;
}

/**
 * @brief use proxy info to set proxy
 *
 */
function reloadProxy(info) {

    var type, auto, arrayString;
    var proxy = {type: '', host: '', port: ''};
    var config = {
        mode: '',
        pacScript: {},
        rules: {}
    };

    var proxySetting = JSON.parse(localStorage.proxySetting);

    if (!info)
        return;

    if (info == 'direct' || info == 'system')
        return;

    if (info == 'pac') {
        var pacType = proxySetting['pac_type'];
        var proto = pacType.split(':')[0];

        config.mode = 'pac_script';
        config["pacScript"]["url"] = pacType +
            proxySetting['pac_script_url'][proto];

    } else {

        config.mode = "fixed_servers";

        if (info == 'http') {
            proxy.type = 'http';
            proxy.host = proxySetting['http_host'];
            proxy.port = parseInt(proxySetting['http_port']);

        } else if (info == 'https') {
            proxy.type = 'https';
            proxy.host = proxySetting['https_host'];
            proxy.port = parseInt(proxySetting['https_port']);

        } else if (info == 'socks4') {
            proxy.type = 'socks4';
            proxy.host = proxySetting['socks_host'];
            proxy.port = parseInt(proxySetting['socks_port']);

        } else if (info == 'socks5') {
            proxy.type = 'socks5';
            proxy.host = proxySetting['socks_host'];
            proxy.port = parseInt(proxySetting['socks_port']);
        }

        var rule = proxySetting['proxy_rule'];
        var chinaList = JSON.parse(localStorage.chinaList);
        var bypasslist = proxySetting['bypasslist'];

        if (proxySetting['internal'] == 'china') {
            chinaList = chinaList.map(function(element) {
                return '*' + element;
            });
            bypasslist = chinaList.concat(bypasslist.split(','));
        } else {
            bypasslist = 
              bypasslist ? bypasslist.split(',') : ['127.0.0.1', 'localhost'];
        }

        config.rules.bypassList = uniqueArray(bypasslist);
        config["rules"][rule] = {
            scheme: proxy.type,
            host: proxy.host,
            port: proxy.port
        };
    }

    //console.log(JSON.stringify(config));

    chrome.proxy.settings.set({
        value: config,
        scope: 'regular'}, function() {})

    getProxyInfo();
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

/**
 * button id save click handler
 *
 */
function save() {

  var proxySetting = JSON.parse(localStorage.proxySetting);
  proxySetting['http_host'] = $('#http-host').val() || "";
  proxySetting['http_port'] = $('#http-port').val() || "";
  proxySetting['https_host'] = $('#https-host').val() || "";
  proxySetting['https_port'] = $('#https-port').val() || "";
  proxySetting['socks_host'] = $('#socks-host').val() || "";
  proxySetting['socks_port'] = $('#socks-port').val() || "";
  proxySetting['pac_type'] = $('#pac-type').val() || "";
  proxySetting['bypasslist'] = $('#bypasslist').val() || "";
  proxySetting['proxy_rule'] = $('#proxy-rule').val() || "";
  proxySetting['auth']['user'] = $('#username').val() || "";
  proxySetting['auth']['pass'] = $('#password').val() || "";

  var pacType = $('#pac-type').val().split(':')[0];
  proxySetting['pac_script_url'][pacType] = $('#pac-script-url').val() || "";

  if ($('#socks5').attr('checked')) 
      proxySetting['socks_type'] = 'socks5';

  if ($('#socks4').attr('checked'))
      proxySetting['socks_type'] = 'socks4';

  if ($('#use-pass').attr('checked'))
      proxySetting['auth']['enable'] = 'y';
  else
      proxySetting['auth']['enable'] = '';

  if ($('#use-china-list').attr('checked'))
      proxySetting['internal'] = "china";
  else
      proxySetting['internal'] = "";


  localStorage.proxySetting = JSON.stringify(proxySetting);
  reloadProxy(localStorage.proxyInfo);
}


/**
 * set proxy for get pac data
 *
 */
function setPacProxy() {

    var proxy = {type:'', host:'', port:''};

    pacProxyHost = $('#pac-proxy-host').val().split(':');
    pacViaProxy = $('#pac-via-proxy').val().split(':');

    proxy.type = pacViaProxy[0];
    proxy.host = pacProxyHost[0];
    proxy.port = parseInt(pacProxyHost[1]);

    var config = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: proxy.type,
                host: proxy.host,
                port: proxy.port
            }
        }
    };

    chrome.proxy.settings.set(
        {value: config, scope: 'regular'}, function() {});

}

/**
 * get pac script data from url
 */
function getPac() {

    var req = new XMLHttpRequest();
    var url = $('#pac-url').val();
    var result = "";

    // async request
    req.open("GET", url, true);
    req.onreadystatechange = processResponse;
    req.send(null);

    function processPacData(ret) {
        var regx_dbase64 = /decode64\("(.*)"\)/i;
        var regx_find = /FindProxyForURL/i;
        var pacData = "";

        // autoproxy2pac
        if (ret.indexOf('decode64') != -1) {
            match = regx_dbase64.test(ret);
            if (match) {
                var decodePacData = $.base64Decode(RegExp.$1);
                if (regx_find.test(decodePacData)) 
                    pacData = decodePacData;
            }
        }
        // plain text
        else {
            if (regx_find.test(ret))
                pacData = ret;
        }

        return pacData;
    }

    function processResponse() {

        if (req.readyState == 4) {
            if (req.status == 200) {
                result = req.responseText;
            }
        }

        return result;
    }
}

document.addEventListener('DOMContentLoaded', function () {

    $('#btn-save').click(function() {
        save();
    });

    $('#btn-cancel').click(function() {
        location.reload();
    });

    $('#socks4').change(function() {
        $('#socks5').attr('checked', false);
    });

    $('#socks5').change(function() {
        $('#socks4').attr('checked', false);
    });

    $('#btn-auth-edit').click(function() {
        $('#div-auth-input').show();
    });

    $('#diagnosis').click(function() {
        chrome.tabs.create({url: 'chrome://net-internals/#proxy'});
    });

    var proxySetting = JSON.parse(localStorage.proxySetting);
    $('#pac-type').change(function() {
        var type = $('#pac-type').val().split(':')[0];
        $('#pac-script-url').val(proxySetting['pac_script_url'][type]);
    });

    $('[data-i18n-content]').each(function() {
        var message = chrome.i18n.getMessage(
            this.getAttribute('data-i18n-content'));
        if (message)
            $(this).html(message);
    });

});



if (!localStorage.firstime)
    loadOldInfo();
else
    loadProxyData();

getProxyInfo();
