# Chrome Proxy Helper

[![License: GPL-2.0](https://img.shields.io/badge/license-GPL%202.0-blue.svg)](./COPYING)
[![Stars](https://img.shields.io/github/stars/henices/Chrome-proxy-helper?style=social)](https://github.com/henices/Chrome-proxy-helper/stargazers)
[![Chrome Web Store](https://img.shields.io/badge/chrome-web%20store-available-brightgreen)](https://chrome.google.com/webstore/detail/proxy-helper/mnloefcpaepkpmhaoipjkpikbnkmbnic)

Chrome Proxy Helper is a browser extension that lets Chrome use its own proxy settings instead of inheriting the entire system proxy configuration.

## Table of Contents

- [Why use it](#why-use-it)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [PAC script example](#pac-script-example)
- [FAQ](#faq)
- [Development notes](#development-notes)
- [License](#license)

## Why use it

Chrome normally follows the operating system proxy configuration. This extension is useful when you want to route Chrome traffic through a specific proxy without changing the rest of the machine.

## Features

- Supports **SOCKS4**, **SOCKS5**, **HTTP**, **HTTPS**, and **QUIC** proxy modes
- Supports **PAC script** configuration
- Supports **online and offline** PAC files
- Supports **bypass rules**
- Supports **custom proxy rules**
- Supports **proxy authentication**
- Supports **synchronized extension settings**

## Installation

### Option 1: Chrome Web Store

Install the latest stable version from the [Chrome Web Store](https://chrome.google.com/webstore/detail/proxy-helper/mnloefcpaepkpmhaoipjkpikbnkmbnic).

### Option 2: Load from source

```bash
git clone https://github.com/henices/Chrome-proxy-helper.git
cd Chrome-proxy-helper
```

Then open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the project folder.

## Usage

### Configure a direct proxy

1. Open the extension popup.
2. Choose the proxy type.
3. Enter host, port, and credentials if needed.
4. Save and enable the profile.

### Configure a PAC script

1. Open the options page.
2. Navigate to **PAC**.
3. Paste the script or choose a PAC file.
4. Enable **PAC Script** from the popup.

## PAC script example

A sample PAC file is available at [example.pac](./example.pac) and can also be viewed directly [here](https://raw.githubusercontent.com/henices/Chrome-proxy-helper/refs/heads/master/example.pac).

## FAQ

See the project [FAQ wiki page](https://github.com/henices/Chrome-proxy-helper/wiki/FAQ).

## Development notes

Useful project files:

| Path | Purpose |
|---|---|
| `manifest.json` | Chrome extension manifest |
| `background.js` | Background proxy logic |
| `popup/` | Popup UI |
| `options/` | Extension settings page |
| `example.pac` | Example PAC script |

## License

This program is free software released under the terms of the GNU General Public License, version 2 or later. See [COPYING](./COPYING) for the full text.
