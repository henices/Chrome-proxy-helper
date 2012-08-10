// Chrome Proxy helper
// by zhouzhenster@gmail.com
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/options.js


init();
load_proxy_info();


function init() {

  document.addEventListener('DOMContentLoaded', function () {

    document.querySelector('#save-button').addEventListener('click', save);
    document.querySelector('#adv_checkbox').addEventListener('change', show_adv);
    document.querySelector('#pac-path').addEventListener('input', markDirty);
    document.querySelector('#http-host').addEventListener('input', markDirty);
    document.querySelector('#http-port').addEventListener('input', markDirty);
    document.querySelector('#https-host').addEventListener('input', markDirty);
    document.querySelector('#https-port').addEventListener('input', markDirty);
    document.querySelector('#socks5-host').addEventListener('input', markDirty);
    document.querySelector('#socks5-port').addEventListener('input', markDirty);
    document.querySelector('#rule').addEventListener('change', markDirty);
    document.querySelector('#bypasslist').addEventListener('change', markDirty);
    document.querySelector('#socks4').addEventListener('click', socks5_unchecked);
    document.querySelector('#socks5').addEventListener('click', socks4_unchecked);
    document.querySelector('#cancel-button').addEventListener('click', load_proxy_info);

    markClean();
  });

  get_proxy_info();

}

function load_proxy_info() {

  $(document).ready(function() {

      $('#pac-path').val(localStorage.pacPath || "") ;
      $('#socks5-host').val(localStorage.socks5Host || "");
      $('#socks5-port').val(localStorage.socks5Port || "");
      $('#http-host').val(localStorage.httpHost || "");
      $('#http-port').val(localStorage.httpPort || "");
      $('#https-host').val(localStorage.httpsHost || "");
      $('#https-port').val(localStorage.httpsPort || "");
      $('#rule').val(localStorage.rule || "");
      $('#bypasslist').val(localStorage.bypass || "localhost,127.0.0.1");

      if (localStorage.socks5 == 'true') 
        $('#socks5').attr('checked', true);

      if (localStorage.socks4 == 'true')
        $('#socks4').attr('checked', true);

  });

}

function get_proxy_info() {

    var methods = ['singleProxy', 'proxyForHttp', 'proxyForFtp', 'ProxyForHttps',
    'fallbackProxy'];

    var info, host, port;

    chrome.proxy.settings.get(
    {'incognito': false},
        function(config) {
            //alert(JSON.stringify(config));
            if (config["value"]["mode"] == "system") {
                info =  "Use DIRECT connections.";
            }
            else if (config["value"]["mode"] == "pac_script") {
                info = "PAC script: " + config["value"]["pacScript"]["url"];
            }
            else {
                for (var i in methods) {
                    host = config["value"]["rules"][methods[i]]["host"];
                    port = config["value"]["rules"][methods[i]]["port"];
                    info = "Proxy server: " + 
                    config["value"]["rules"][methods[i]]["scheme"] + 
                    '://' + host + ':' + port.toString();
                    $("#info").text(info);
                }
            }
            $("#info").text(info);
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

function show_adv() {
    if($('#adv_settings').is(':hidden'))
        $("#adv_settings").show();
    else
        $("#adv_settings").hide();
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
  localStorage.bypass = $("#bypasslist").val()||"localhost,127.0.0.1";

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
}

function markClean() {
  $('#save-button').attr("disabled", true);
}


