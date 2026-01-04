# Claude Session Switcher

[English](README.md) | **[中文文档](README_ZH.md)**

A lightweight, high-performance Chrome extension for seamlessly switching between multiple [Claude.ai](https://claude.ai) accounts. Built with **Manifest V3** and vanilla JavaScript, featuring a modern UI and optimized for speed.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![Chrome](https://img.shields.io/badge/Chrome-Extension-orange)

## Features

* **One-Click Switch**: Instantly switch accounts without manual logout/login.
* **Tag Management System**: 
    * Create custom tags with colors to organize accounts.
    * **Tag Filter Bar**: Filter accounts by tag with one click.
    * **Independent Tag Sorting**: Each tag view maintains its own drag-and-drop order.
    * **"Untagged" Filter**: Quickly find accounts without any tags.
* **High Performance**:
    * **Debounced Search**: Smooth, lag-free search input.
    * **O(1) Duplicate Check**: Lightning-fast deduplication even with hundreds of accounts.
    * **Zero CPU Idle**: Event-driven architecture with no background resource usage.
* **Quick Re-login**: Clear current session and jump to login page for adding new accounts.
* **Modern UI**: 
    * Card-based design with SVG icons and responsive layout.
    * **Dark Mode** support.
    * **Custom Delete Confirmation Modal**: Beautiful dialog instead of native browser alerts.
    * **ESC Key Support**: Press ESC to close any modal.
* **Smart Auto-Capture**:
    * Automatically grab `sessionKey` from the current tab.
    * **Smart Username & Plan Extraction**: Reads your username and subscription plan directly from Claude's sidebar.
* **Plan Badges**: Visual indicators (Pro/Team/Free) displayed on each account card.
* **Quick Info Sync**: One-click button in the toolbar to update the current account's username and plan.
* **Network Monitoring**:
    * Real-time **IP** and **geolocation** display in the status bar.
    * **One-Click Check**: Dedicated button to assess IP risk score via external service.
* **Drag & Drop Sorting**: Hold and drag to reorder your account list.
* **Import & Export**: Backup your account list to JSON or import from other devices.
* **Secure & Local**:
    * All keys stored only in browser's `chrome.storage.local`.
    * Never uploaded to any remote server.

## Preview

<img src="assets/preview.png" width="300" alt="Preview">

## Installation

1. Download the latest release from [Releases](https://github.com/kieranchan/Claude-Session-Switcher/releases)
2. Extract the ZIP file to a folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right corner)
5. Click **Load unpacked** and select the extracted folder
6. Done! Click the extension icon in the toolbar to use

## Usage

### Add an Account
1. Click the **+** button in the toolbar.
2. **Auto Method**: Make sure you're logged into Claude.ai, then click the **capture button** to auto-fill the session key and username.
3. **Manual Method**: Paste your `sk-ant...` key manually.
4. Optionally select tags to organize your account.
5. Click **Save**.

### Switch Accounts
Click any **account card** in the list. The extension will replace the cookie and refresh the Claude page immediately.

### Tag Management
* Click the **tag icon** in the toolbar to open tag manager.
* Create, edit, or delete tags with custom colors.
* Use the **tag filter bar** below the toolbar to filter accounts by tag.

### Network & Security
* **View IP**: Check the status bar at the bottom.
* **Security Report**: Click the **link icon** next to the IP to view an IP risk report.

## Security Notice

* **Local Only**: Your data never leaves your browser.
* **Permissions Explained**:
    * `cookies`: Required to modify cookies for account switching.
    * `scripting`: Required to read username from page DOM.
    * `storage`: Required to save your account list.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
