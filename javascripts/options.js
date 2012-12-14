// Chrome Proxy helper
// by zhouzhenster@gmail.com
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/options.js

document.addEventListener('DOMContentLoaded', function () {

    document.querySelector('#save-button').addEventListener('click', save);
    document.querySelector('#adv_checkbox').addEventListener('change', showAdv);
    document.querySelector('#pac-path').addEventListener('input', markDirty);
    document.querySelector('#http-host').addEventListener('input', markDirty);
    document.querySelector('#http-port').addEventListener('input', markDirty);
    document.querySelector('#https-host').addEventListener('input', markDirty);
    document.querySelector('#https-port').addEventListener('input', markDirty);
    document.querySelector('#socks5-host').addEventListener('input', markDirty);
    document.querySelector('#socks5-port').addEventListener('input', markDirty);
    document.querySelector('#rule').addEventListener('change', markDirty);
    document.querySelector('textarea#bypasslist').addEventListener('input', markDirty);
    document.querySelector('#socks4').addEventListener('click', socks5_unchecked);
    document.querySelector('#socks5').addEventListener('click', socks4_unchecked);
    document.querySelector('#cancel-button').addEventListener('click', loadProxyData);
    document.querySelector('#memory-data').addEventListener('change', enableInput);
    document.querySelector('#load-pac').addEventListener('click', memoryData);
    document.querySelector('#pac-via-proxy').addEventListener('change', disableInput);
    document.querySelector('textarea#pac-rules').addEventListener('input', markDirty);
    document.querySelector('#edit-pac-data').addEventListener('click', showPacData);
    document.querySelector('#ret-pac-data').addEventListener('click', retPacData);

    markClean();
});

loadProxyData();
getProxyInfo();

/**
 * load data in local database and 
 * display it on the options page
 *
 */
function loadProxyData() {

  $(document).ready(function() {

      $('#pac-path').val(localStorage.pacPath || "") ;
      $('#socks5-host').val(localStorage.socks5Host || "");
      $('#socks5-port').val(localStorage.socks5Port || "");
      $('#http-host').val(localStorage.httpHost || "");
      $('#http-port').val(localStorage.httpPort || "");
      $('#https-host').val(localStorage.httpsHost || "");
      $('#https-port').val(localStorage.httpsPort || "");
      $('#rule').val(localStorage.rule || "");
      $('textarea#bypasslist').val(localStorage.bypass || "localhost,127.0.0.1");
      $('textarea#pac-data').val(localStorage.pacData || "");
      $('#pac-via-proxy').val(localStorage.pacViaProxy || "");
      $('#pac-proxy-host').val(localStorage.pacProxyHost || "");
      $('textarea#pac-rules').val(localStorage.pacRules || "");

      if (localStorage.socks5 == 'true') {
        $('#socks5').attr('checked', true);
        $('#socks4').attr('checked', false);
      }

      if (localStorage.socks4 == 'true') {
        $('#socks4').attr('checked', true);
        $('#socks5').attr('checked', false);
      }

      if (localStorage.useMemory == 'true') {
        $('#memory-data').attr('checked', true);
        $('#pac-via-proxy').attr('disabled', false);
        $('#pac-data-settings').show();
        //$('textarea#pac-rules').attr('disabled', false);
        if ($('#pac-via-proxy').val() !== 'None')
            $('#pac-proxy-host').attr('disabled', false);
      }

  });

  markClean();

}

/**
 * get chrome browser proxy settings 
 * and display on the options page
 *
 */
function getProxyInfo() {

    var proxyInfo, controlInfo, host, port;

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
                proxyInfo = "PAC script: " + config["value"]["pacScript"]["url"];
            } else if (config["value"]["mode"] == "auto_detect") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Auto detect mode";
            } else {
                host = config["value"]["rules"][localStorage.rule]["host"];
                port = config["value"]["rules"][localStorage.rule]["port"];
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Proxy server  : " +
                config["value"]["rules"][localStorage.rule]["scheme"] +
                '://' + host + ':' + port.toString();
            }
            $("#proxy-info").text(proxyInfo);
            // $("#control-info").text(controlInfo);
        }
    );
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
 * event handler
 *
 */
function showAdv() {
    if($('#adv_settings').is(':hidden'))
        $("#adv_settings").show();
    else
        $("#adv_settings").hide();
}

/**
 * input id memory-data handler
 *
 */
function memoryData() {

    if ($('#memory-data').attr('checked')) {
        if (getPac())
            return 1;
    }

    $('#pac-data').val(localStorage.pacData);

    return 0;
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

  localStorage.pacPath = $('#pac-path').val()||"";
  localStorage.socks5Host = $('#socks5-host').val()||"";
  localStorage.socks5Port = $('#socks5-port').val()||"";
  localStorage.httpHost = $('#http-host').val()||"";
  localStorage.httpPort = $('#http-port').val()||"";
  localStorage.httpsHost = $('#https-host').val()||"";
  localStorage.httpsPort = $('#https-port').val()||"";
  localStorage.rule = $("#rule").val()||"singleProxy";
  localStorage.bypass = $("textarea#bypasslist").val()||"localhost,127.0.0.1";
  localStorage.pacViaProxy = $('#pac-via-proxy').val()||"";
  localStorage.pacProxyHost = $('#pac-proxy-host').val()||"";
  localStorage.pacData = $('#pac-data').val()||"";
  localStorage.pacRules = $('textarea#pac-rules').val()||"";

  if ($('#socks5').attr('checked')) {
      localStorage.socks5 = 'true';
  } else {
      localStorage.socks5 = 'false';
  }

  if ($('#socks4').attr('checked')) {
      localStorage.socks4 = 'true';
  } else {
      localStorage.socks4 = 'false';
  }

  if ($('#memory-data').is(':checked')) {
      localStorage.useMemory = true;
  } else {
      localStorage.useMemory = false;
      localStorage.pacData = "";
  }

  markClean();
  sysProxy();


  loadProxyData();
  getProxyInfo();

  alert("Please restart proxy on popup page");
}

function markDirty() {
  $('#save-button').attr("disabled", false);
  $('#save-button').attr("class", "btn solid red");
}

function markClean() {
  $('#save-button').attr("disabled", true);
  $('#save-button').attr("class", "btn solid grey");
}

function retPacData() {
    enableInput();
    $('#pac-data-info').hide();
}


/**
 * memory-data click handle
 *
 */

function enableInput() {

    if ($('#memory-data').is(':checked')) {

        $("#pac-via-proxy").attr("disabled", false);
        $('#pac-data-settings').show();

        if ($('#pac-via-proxy').val() !== 'None') {
            $("#pac-proxy-host").show();
        }
    } else {
        $('#pac-data-settings').hide();
        $('#pac-data-info').hide();
        $("#pac-via-proxy").attr("disabled", true);
        $("#pac-proxy-host").attr("disabled", true);
    }
    markDirty();
}

function showPacData() {
    $('#pac-data-info').show();
    $('#pac-data-settings').hide();
}

function disableInput() {
    if ($('#pac-via-proxy').val() === 'None') {
        $('#pac-proxy-host').attr('disabled', true);
        $('#pac-proxy-host').val("");
        $('#pac-proxy-host').hide();
    } else {
        $('#pac-proxy-host').attr('disabled', false);
        $('#pac-proxy-host').show();
    }
}

/**
 * set proxy for get pac data
 *
 */
function setPacProxy() {

    var proxy = {type:'', host:'', port:''};
    var pacPorxyHost;

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
    var url = $('#pac-path').val();
    var result;
    var pacViaProxy;
    var oldConfig;
    var useProxy;
    var pacData;

    if ( url.indexOf("file") != -1) {
        alert("Local file are not supported. :(");
        return;
    }

    chrome.proxy.settings.get(
        {'incognito': false},
        function(config) {
            oldConfig = config.value;
        }
    );

    pacViaProxy = $('#pac-via-proxy').val();

    // via proxy
    useProxy = pacViaProxy.indexOf('None');

    if (useProxy) {
        setPacProxy();
    }

    // async request
    req.open("GET", url, true);
    req.onreadystatechange = processResponse;
    req.send(null);

    /**
     *  decode pac data and set it to local database
     *  @param {string} ret the response text
     *
     *  @return {string}
     */
    function processPacData(ret) {
        var regx_dbase64 = /decode64\("(.*)"\)/i;
        var regx_find = /FindProxyForURL/i;

        // autoproxy2pac
        if (ret.indexOf('decode64') != -1) {
            match = regx_dbase64.test(ret);
            if (match) {
                var decodePacData = $.base64Decode(RegExp.$1);
                if (regx_find.test(decodePacData)) 
                    localStorage.pacData = decodePacData;
                else
                    localStorage.pacData = "";
            } else 
                localStorage.pacData = "";
        }
        // plain text
        else {
            if (regx_find.test(ret))
                localStorage.pacData = ret;
            else
                localStorage.pacData = "";
        }

        return localStorage.pacData;
    }

    /**
     *  process the reponse text, tell user the result
     *
     */
    function processResponse() {

        if (req.readyState == 4 ) {
            if (req.status == 200) {
                result = req.responseText;
                pacData = processPacData(result);
                if (pacData !== "") {
                    alert('Load pac data OK');
                    $('textarea#pac-data').val(pacData);
                } else {
                    alert('Error pac script, check it again :(');
                }
            } else
                alert('Failed to open the pac url :(');

            // if set proxy, recovery old proxy settings
            if (useProxy)
                chrome.proxy.settings.set(
                    {value: oldConfig, scope: 'regular'},
                    function() {});
        }
    }
}
