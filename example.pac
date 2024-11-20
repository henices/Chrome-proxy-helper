
const domains = {
  "google.com": 1,
  "x.com": 1
};

const proxy = "SOCKS5 127.0.0.1:9999"; // 'PROXY' or 'SOCKS5' or 'HTTPS'

const direct = 'DIRECT;';


function FindProxyForURL(url, host) {
  const suffixes = host.match(/[^\.]+\.[^\.]+$/g) || [];

  // Check each suffix against the domains object
  for (const suffix of suffixes) {
    if (Object.prototype.hasOwnProperty.call(domains, suffix)) {
      return proxy;
    }
  }

  return direct;
}
