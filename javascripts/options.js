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
 * get chrome browser proxy settings 
 * and display on the options page
 *
 */
function getProxyInfo() {

    var proxyInfo, controlInfo, host, port;
    var proxySetting = JSON.parse(localStorage.proxySetting);
    var proxyRule = proxySetting['proxy_rule'];

    chrome.proxy.settings.get(
    {'incognito': false},
        function(config) {
            //alert(JSON.stringify(config));
            if (config["value"]["mode"] == "direct") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use DIRECT connections.";
            } else if (config["value"]["mode"] == "system" ) {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use System's proxy settings.";
            } else if (config["value"]["mode"] == "pac_script") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                var url = config["value"]["pacScript"]["url"];
                if (url)
                    proxyInfo = "PAC script: " + url;
                else {
                    proxyInfo = "PAC script: data:application/x-ns-proxy-autoconfig;"
                }

            } else if (config["value"]["mode"] == "auto_detect") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Auto detect mode";
            } else {
                host = config["value"]["rules"][proxyRule]["host"];
                port = config["value"]["rules"][proxyRule]["port"];
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Proxy server  : " +
                config["value"]["rules"][proxyRule]["scheme"] +
                '://' + host + ':' + port.toString();
            }
            $("#proxy-info").text(proxyInfo);
            $("#control-info").text(controlInfo);

            localStorage.proxyInfo = proxyInfo;
        }
    );

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

    if (info.indexOf('DIRECT') != -1 || info.indexOf('System') != -1 )
        return;

    arrayString = info.split(':');
    auto = arrayString[0];
    type = arrayString[1];

    if (auto.indexOf('PAC') != -1) {
        var pacType = proxySetting['pac_type'];
        var proto = pacType.split(':')[0];
        config.mode = 'pac_script';
        config["pacScript"]["url"] = pacType + pacScriptUrl[proto];
        chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {})
    } else {
        if (type.indexOf('http') != -1) {
            proxy.type = 'http';
            proxy.host = proxySetting['http_host'];
            proxy.port = parseInt(proxySetting['http_port']);
        }
        if (type.indexOf('https') != -1) {
            proxy.type = 'https';
            proxy.host = proxySetting['https_host'];
            proxy.port = parseInt(proxySetting['https_port']);
        }
        if (type.indexOf('socks4') != -1) {
            proxy.type = 'socks4';
            proxy.host = proxySetting['socks_host'];
            proxy.port = parseInt(proxySetting['socks_port']);
        }
        if (type.indexOf('socks5') != -1) {
            proxy.type = 'socks5';
            proxy.host = proxySetting['socks_host'];
            proxy.port = parseInt(proxySetting['socks_port']);
        }

        var rule = proxySetting['proxy_rule'];
        var chinaList = JSON.parse(localStorage.chinaList);
        var bypasslist = proxySetting['bypasslist'];

        if (proxySetting['internal'] == 'china') {
            chinaList = chinaList.map(function(element) { return '*' + element});
            bypasslist = chinaList.concat(bypasslist.split(','));
        } else
            bypasslist = bypasslist ? bypasslist.split(',') : ['127.0.0.1', 'localhost'];


        config.mode = "fixed_servers";
        config.rules.bypassList = bypasslist;
        config["rules"][rule] = {
            scheme: proxy.type,
            host: proxy.host,
            port: proxy.port
        };

        // console.log(JSON.stringify(config));

        chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
    }
}

/**
 * event handler
 *
 */
function socks5_unchecked() {
    $('#socks5').attr('checked', false);
    markDirty();
}

/**
 * event handler
 *
 */
function socks4_unchecked() {
    $('#socks4').attr('checked', false);
    markDirty();
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
  getProxyInfo();
}

//function markDirty() {
//  $('#save-button').attr("class", "btn solid red");
//}
//
//function markClean() {
//  $('#save-button').attr("class", "btn solid grey");
//}


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

    $('#btn_select').click(function() {
        $('#pac_file').trigger('click');
    });

    $('#btn-save').click(function() {
        save();
    });

    $('#btn-cancel').click(function() {
        location.reload();
    });

    $('#socks4').change(function() {
        socks5_unchecked();
    });

    $('#socks5').change(function() {
        socks4_unchecked();
    });

    $('#btn-auth-edit').click(function() {
        $('#div-auth-input').show();
    });

    var proxySetting = JSON.parse(localStorage.proxySetting);
    $('#pac-type').change(function() {
        var type = $('#pac-type').val().split(':')[0];
        $('#pac-script-url').val(proxySetting['pac_script_url'][type]);
    });

    $('[data-i18n-content]').each(function() {
        var message = chrome.i18n.getMessage(this.getAttribute('data-i18n-content'));
        if (message)
            $(this).html(message);
    }); 

});

loadProxyData();
getProxyInfo();

