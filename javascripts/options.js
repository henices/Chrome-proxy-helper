// Chrome Proxy helper
// by zhouzhenster@gmail.com
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/options.js


loadProxyData();

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
    document.querySelector('#memory-data').addEventListener('change', markDirty);
    document.querySelector('#load-pac').addEventListener('click', memoryData);

    markClean();
});

getProxyInfo();


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
      }

  });

  markClean();

}

function getProxyInfo() {

    var proxyInfo, controlInfo, host, port;

    chrome.proxy.settings.get(
    {'incognito': false},
        function(config) {
            //alert(JSON.stringify(config));
            if (config["value"]["mode"] == "direct") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use DIRECT connections.";
            }
            else if (config["value"]["mode"] == "system" ) {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use System's proxy settings.";
            }
            else if (config["value"]["mode"] == "pac_script") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "PAC script: " + config["value"]["pacScript"]["url"];
            }
            else if (config["value"]["mode"] == "auto_detect") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Auto detect mode";
            }
            else {
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

function socks5_unchecked() {
    $('#socks5').attr('checked', false);
    markDirty();
}

function socks4_unchecked() {
    $('#socks4').attr('checked', false);
    markDirty();
}

function showAdv() {
    if($('#adv_settings').is(':hidden'))
        $("#adv_settings").show();
    else
        $("#adv_settings").hide();
}

function memoryData() {

    localStorage.useMemory = false;

    if ($('#memory-data').attr('checked')) {
        if (!getPac())
            localStorage.useMemory = true;
        else
            return 1;
    }

    return 0;
}

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

  if ($('#socks5').attr('checked')) {
      localStorage.socks5 = 'true';
  }
  else {
      localStorage.socks5 = 'false';
  }

  if ($('#socks4').attr('checked')) {
      localStorage.socks4 = 'true';
  }
  else {
      localStorage.socks4 = 'false';
  }

    markClean();
    sysProxy();

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

/**
 * get pac script data from url
 */
function getPac() {

    var req = new XMLHttpRequest();
    var url = $('#pac-path').val();
    var result;

    if ( url.indexOf("file") != -1) {
        alert("local file are not supported");
        return 1;
    }

    // async
    req.open("GET", url, true);

    req.onreadystatechange = function() {

        if (req.readyState == 4 ) {
            if (req.status == 200) {
                result = req.responseText;
                /* autoproxy2pac */
                if (result.indexOf('decode64') != -1) {
                    var regx = /decode64\("(.*)"\)/i;
                    match = regx.test(result)
                    if (match)
                        localStorage.pacData = $.base64Decode(RegExp.$1);
                    else
                        localStorage.pacData = result;
                }
                /* plain text */
                else {
                    localStorage.pacData = result;
                }
            }
        }
    }

    req.onerror = function() {
        alert('Load pac script data failed, check proxy settings :(');
        return 2;
    }

    req.send(null);

    return 0;
}
