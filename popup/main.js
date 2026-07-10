/**
 * Claude Account Switcher - Main Module
 * 入口 + 业务逻辑
 */

import {
    CLAUDE_URL, COOKIE_NAME, STORAGE_KEY, TAGS_KEY,
    FILTER_TAG_KEY, TAG_ORDERS_KEY, THEME_KEY, ICONS
} from './constants.js';

import {
    $, createStore, createAccountMap, createTagMap,
    removeKeyFromTagOrders, updateTagOrdersOnTagChange, addKeyToTagOrders,
    saveAndUpdate, initTagOrders, setShowToast, sanitize, validateAccount
} from './store.js';

import { App, setSwitchAccount } from './components.js';

// 模块级私有状态
let _editIndex = -1;
let _grabPlan = null;
let _editingTagId = null;
let _deleteConfirmCallback = null;
let _store = null; // 模块内部引用

// --- Main Entry ---
document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get([STORAGE_KEY, TAGS_KEY, FILTER_TAG_KEY, TAG_ORDERS_KEY, THEME_KEY]);
    const accounts = data[STORAGE_KEY] || [];
    const tags = data[TAGS_KEY] || [];
    const filterTagId = data[FILTER_TAG_KEY] || null;
    let tagOrders = data[TAG_ORDERS_KEY] || {};
    const accountKeySet = new Set(accounts.map(acc => acc.key));
    const accountMap = createAccountMap(accounts);
    const tagMap = createTagMap(tags);

    tagOrders = await initTagOrders(accounts, tagOrders);

    const store = createStore({
        accounts,
        accountMap,
        tags,
        tagMap,
        tagOrders,
        filterTagId,
        accountKeySet,
        activeKey: await getActiveKey(),
        filter: '',
    });

    _store = store; // 模块内部可访问
    // window.store = store; // 已移除：安全考虑

    // 注入依赖
    setShowToast(showToast);
    setSwitchAccount(switchAccount);

    App(store);
    initEventListeners(store);
    initTagManager(store);
    renderTagFilterBar(store);

    // 初始化工具菜单图标
    const exportIcon = $('exportIcon');
    const importIcon = $('importIcon');
    const warningIcon = $('warningIcon');
    if (exportIcon) exportIcon.innerHTML = ICONS.export;
    if (importIcon) importIcon.innerHTML = ICONS.import;
    if (warningIcon) warningIcon.innerHTML = ICONS.warning;

    // Theme Init
    const isDark = data[THEME_KEY] === 'dark' || (!data[THEME_KEY] && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(isDark);

    checkNetwork();
});

// --- Event Listeners ---
function initEventListeners(store) {
    $('toggleAddBtn').onclick = () => toggleModal(true);
    $('cancelEditBtn').onclick = () => toggleModal(false);
    $('modalOverlay').onclick = () => {
        toggleModal(false);
        toggleTagManager(false, store);
        closeTagEditModal();
    };
    $('saveBtn').onclick = () => saveAccount(store);
    $('grabBtn').onclick = () => grabKey();
    $('loginLinkBtn').onclick = logoutAndLogin;

    $('themeBtn').onclick = () => {
        const newIsDark = !document.body.classList.contains('dark-mode');
        applyTheme(newIsDark);
        chrome.storage.local.set({ [THEME_KEY]: newIsDark ? 'dark' : 'light' });
    };

    $('toolsToggle').onclick = (e) => { e.stopPropagation(); $('toolsMenu').classList.toggle('show'); };
    document.onclick = () => $('toolsMenu').classList.remove('show');

    $('searchBox').oninput = debounce((e) => store.setState({ filter: e.target.value }), 300);

    $('exportBtn').onclick = () => exportData(store.getState().accounts);
    $('importBtn').onclick = () => $('fileInput').click();
    $('fileInput').onchange = (e) => importData(e, store);
    $('clearAllBtn').onclick = () => clearData(store);
    $('syncCurrentBtn').onclick = () => syncCurrentAccount(store);

    $('netInfo').onclick = checkNetwork;
    $('ipCheckBtn').onclick = (e) => {
        e.stopPropagation();
        const { currentIP } = store.getState();
        if (currentIP) chrome.tabs.create({ url: `https://scamalytics.com/ip/${currentIP}` });
    };

    $('accountList').addEventListener('click', (e) => handleListClick(e, store));

    // Enter 键保存
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if ($('editForm').classList.contains('open')) {
            saveAccount(store);
        } else if ($('tagManagerModal').classList.contains('open') && e.target.id === 'newTagName') {
            addNewTag(store);
        } else if ($('tagEditModal').classList.contains('open')) {
            saveEditTag(store);
        }
    });

    // ESC 键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();

        if ($('deleteModal').classList.contains('open')) {
            $('deleteModal').classList.remove('open');
        } else if ($('tagEditModal').classList.contains('open')) {
            $('tagEditModal').classList.remove('open');
            $('tagEditOverlay').classList.remove('open');
        } else if ($('tagManagerModal').classList.contains('open')) {
            $('tagManagerModal').classList.remove('open');
            $('modalOverlay').classList.remove('open');
        } else if ($('editForm').classList.contains('open')) {
            toggleModal(false);
        }
    });
}

// --- Account Actions ---

async function saveAccount(store) {
    const name = $('inputName').value.trim();
    const tagIds = getSelectedTagIds();

    const { accounts, accountMap, accountKeySet, tagOrders } = store.getState();
    const editIndex = _editIndex;

    // 编辑模式
    if (editIndex >= 0 && editIndex < accounts.length) {
        if (!name) return showToast("请输入名称");

        const oldTagIds = accounts[editIndex].tagIds || [];
        const key = accounts[editIndex].key;

        const newAccounts = accounts.map((acc, i) =>
            i === editIndex ? { ...acc, name, tagIds } : acc
        );

        const newAccountMap = createAccountMap(newAccounts);
        const newTagOrders = updateTagOrdersOnTagChange(tagOrders, key, oldTagIds, tagIds);

        await saveAndUpdate(
            { [STORAGE_KEY]: newAccounts, [TAG_ORDERS_KEY]: newTagOrders },
            { accounts: newAccounts, accountMap: newAccountMap, tagOrders: newTagOrders },
            store,
            () => {
                // 检查当前筛选分类是否变空，如果空则跳回"全部"
                const { filterTagId } = store.getState();
                if (filterTagId && filterTagId !== 'all') {
                    let isEmpty = false;
                    if (filterTagId === 'untagged') {
                        isEmpty = newAccounts.every(a => a.tagIds && a.tagIds.length > 0);
                    } else {
                        isEmpty = newAccounts.every(a => !(a.tagIds || []).includes(filterTagId));
                    }
                    if (isEmpty) {
                        store.setState({ filterTagId: 'all' });
                        chrome.storage.local.set({ [FILTER_TAG_KEY]: 'all' });
                    }
                }
                renderTagFilterBar(store);
            }
        );
        showToast("已更新");
        toggleModal(false);
        return;
    }

    // 新增模式
    let key = $('inputKey').value.trim();
    if (!name || !key) return showToast("请填写完整");
    if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
    if (!key.trim()) return showToast("请输入有效的 Key");

    if (accountMap.has(key)) {
        showToast("账号已存在");
        toggleModal(false);
        return;
    }

    const plan = _grabPlan || null;
    _grabPlan = null;

    const newAccount = { name, key, plan, tagIds };
    const newAccounts = [...accounts, newAccount];
    const newAccountMap = createAccountMap(newAccounts);
    const newTagOrders = addKeyToTagOrders(tagOrders, key, tagIds);

    await saveAndUpdate(
        { [STORAGE_KEY]: newAccounts, [TAG_ORDERS_KEY]: newTagOrders },
        { accounts: newAccounts, accountMap: newAccountMap, accountKeySet: new Set(accountKeySet).add(key), tagOrders: newTagOrders },
        store,
        () => renderTagFilterBar(store)
    );
    showToast("已保存");
    toggleModal(false);
}

async function grabKey() {
    try {
        const cookie = await chrome.cookies.get({ url: CLAUDE_URL, name: COOKIE_NAME });
        if (!cookie) return showToast("未登录");
        const key = decodeURIComponent(cookie.value);

        const result = await grabUserInfo();

        $('inputKey').value = key;
        if (result?.name) $('inputName').value = result.name;
        _grabPlan = result?.plan;
        $('inputName').focus();
        showToast(`已获取: ${result?.name || 'Key'} (${result?.plan || '--'})`);
    } catch {
        showToast("获取失败");
    }
}

async function grabUserInfo() {
    const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
    if (tabs.length === 0) return null;

    try {
        const res = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                // 主策略：sidebar 底部 Settings 按钮内的 truncate 元素依次为 [name, plan/organization]。
                // Team 账号第二个 truncate 是组织名（无 "plan" 字样），不能靠文本匹配定位。
                const settingsBtn = document.querySelector('button[aria-label*="Settings" i]');
                if (settingsBtn) {
                    const truncates = settingsBtn.querySelectorAll('[class*="truncate"]');
                    if (truncates.length >= 2) {
                        const name = truncates[0].textContent.trim();
                        const plan = truncates[truncates.length - 1].textContent.trim();
                        if (name && plan) return { name, plan };
                    }
                }

                // 备用策略：全局扫描 truncate 元素找含 "plan" 的文本（Free/Pro/Max）
                const allTruncate = document.querySelectorAll('[class*="truncate"]');
                if (allTruncate.length < 2) return null;

                for (let i = allTruncate.length - 1; i >= 0; i--) {
                    const text = allTruncate[i].textContent.trim();
                    if (text.toLowerCase().includes(' plan')) {
                        return {
                            name: i > 0 ? allTruncate[i - 1].textContent.trim() : null,
                            plan: text,
                        };
                    }
                }
                return null;
            }
        });
        return res?.[0]?.result || null;
    } catch (e) {
        console.log("DOM grab failed", e);
        return null;
    }
}

async function syncCurrentAccount(store) {
    showToast("正在更新...");

    const activeKey = await getActiveKey();
    if (!activeKey) {
        showToast("未登录 Claude");
        return;
    }

    const { accounts } = store.getState();
    const idx = accounts.findIndex(a => a.key === activeKey);

    if (idx === -1) {
        showToast("当前账号不在列表中");
        return;
    }

    const result = await grabUserInfo();

    if (result?.name || result?.plan) {
        const newAccounts = accounts.map((acc, i) =>
            i === idx ? {
                ...acc,
                name: result.name || acc.name,
                plan: result.plan || acc.plan
            } : acc
        );

        await chrome.storage.local.set({ [STORAGE_KEY]: newAccounts });
        store.setState({ accounts: newAccounts });
        showToast(`已更新: ${result.name || ''} (${result.plan || '--'})`);
    } else {
        showToast("更新失败，请确保 Claude 页面已打开");
    }
}

async function switchAccount(key) {
    if (!key) return;

    try {
        await chrome.cookies.set({
            url: CLAUDE_URL, name: COOKIE_NAME, value: key, domain: ".claude.ai",
            path: "/", secure: true, sameSite: "lax", expirationDate: (Date.now() / 1000) + (86400 * 30)
        });
        await chrome.storage.local.set({ lastActiveKey: key });

        _store.setState({ activeKey: key });

        const [tab] = await chrome.tabs.query({ url: "*://claude.ai/*" });
        if (tab) {
            await chrome.tabs.update(tab.id, { url: "https://claude.ai/chats", active: true });
            chrome.windows.update(tab.windowId, { focused: true });
        } else {
            chrome.tabs.create({ url: "https://claude.ai/chats" });
        }
    } catch (e) {
        console.error('[Claude-Switcher] switchAccount failed:', e);
        showToast('切换账号失败，请重试');
    }
}

async function logoutAndLogin() {
    await chrome.cookies.remove({ url: CLAUDE_URL, name: COOKIE_NAME });
    const [tab] = await chrome.tabs.query({ url: "*://claude.ai/*" });
    if (tab) {
        await chrome.tabs.update(tab.id, { url: "https://claude.ai/login", active: true });
        chrome.windows.update(tab.windowId, { focused: true });
    } else {
        chrome.tabs.create({ url: "https://claude.ai/login" });
    }
}

function handleListClick(e, store) {
    const li = e.target.closest('li');
    if (!li) return;
    const key = li.dataset.key;
    const { accounts, accountMap, tagOrders } = store.getState();
    const acc = accountMap.get(key);
    const idx = accounts.findIndex(a => a.key === key);

    if (!acc) return;

    const target = e.target.closest('.icon-btn');
    if (!target) return;

    if (target.classList.contains('action-copy')) {
        navigator.clipboard.writeText(acc.key);
        showToast("已复制");
    } else if (target.classList.contains('action-edit')) {
        $('inputName').value = acc.name || '';
        toggleModal(true, idx, acc.tagIds || []);
    } else if (target.classList.contains('action-delete')) {
        showDeleteModal(acc.name, async () => {
            const keyToRemove = acc.key;
            const newAccounts = accounts.filter(a => a.key !== keyToRemove);
            const newAccountKeySet = new Set(newAccounts.map(a => a.key));
            const newAccountMap = createAccountMap(newAccounts);
            const newTagOrders = removeKeyFromTagOrders(tagOrders, keyToRemove);

            await saveAndUpdate(
                { [STORAGE_KEY]: newAccounts, [TAG_ORDERS_KEY]: newTagOrders },
                { accounts: newAccounts, accountMap: newAccountMap, accountKeySet: newAccountKeySet, tagOrders: newTagOrders },
                store,
                () => {
                    // 检查当前筛选分类是否变空，如果空则跳回"全部"
                    const { filterTagId } = store.getState();
                    if (filterTagId && filterTagId !== 'all') {
                        let isEmpty = false;
                        if (filterTagId === 'untagged') {
                            isEmpty = newAccounts.every(a => a.tagIds && a.tagIds.length > 0);
                        } else {
                            isEmpty = newAccounts.every(a => !(a.tagIds || []).includes(filterTagId));
                        }
                        if (isEmpty) {
                            store.setState({ filterTagId: 'all' });
                            chrome.storage.local.set({ [FILTER_TAG_KEY]: 'all' });
                        }
                    }
                    renderTagFilterBar(store);
                }
            );
            showToast("已删除");
        });
    }
}

function importData(e, store) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const json = JSON.parse(ev.target.result);
            if (Array.isArray(json)) {
                const { accounts, accountKeySet } = store.getState();
                let newAccounts = [...accounts];
                let newKeys = new Set(accountKeySet);
                let addedCount = 0;

                json.forEach(a => {
                    // 验证账号数据结构
                    if (!validateAccount(a)) return;
                    if (!newKeys.has(a.key)) {
                        newAccounts.push(a);
                        newKeys.add(a.key);
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    await chrome.storage.local.set({ [STORAGE_KEY]: newAccounts });
                    store.setState({ accounts: newAccounts, accountKeySet: newKeys });
                    showToast(`导入 ${addedCount} 个账号`);
                } else {
                    showToast("没有新账号");
                }
            }
        } catch { showToast("格式错误"); }
    };
    if (e.target.files[0]) reader.readAsText(e.target.files[0]);
}

function clearData(store) {
    if (confirm("清空不可恢复!")) {
        chrome.storage.local.set({ [STORAGE_KEY]: [] }).then(() => {
            store.setState({ accounts: [], accountKeySet: new Set() });
        });
    }
}

// --- UI Helpers ---

function toggleModal(show, editIndex = -1, selectedTagIds = []) {
    const el = $('editForm'), overlay = $('modalOverlay');
    _editIndex = editIndex;

    if (show) {
        if (editIndex >= 0) {
            $('modalTitle').textContent = "编辑账号";
            $('inputKey').parentElement.style.display = 'none';
        } else {
            $('modalTitle').textContent = "添加账号";
            $('inputKey').parentElement.style.display = 'flex';
        }
        renderTagSelector(_store, selectedTagIds);
        el.classList.add('open'); overlay.classList.add('open');
        $('inputName').focus();
    } else {
        el.classList.remove('open'); overlay.classList.remove('open');
        $('inputName').value = $('inputKey').value = '';
        _editIndex = -1;
    }
}

async function getActiveKey() {
    const cookie = await chrome.cookies.get({ url: CLAUDE_URL, name: COOKIE_NAME }).catch(() => null);
    return cookie ? decodeURIComponent(cookie.value) : "";
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

async function checkNetwork() {
    try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data.success) {
            _store.setState({ currentIP: data.ip });
            $('ipText').textContent = data.ip;
            $('geoText').textContent = `${data.city}, ${data.country_code}`;
            $('netDot').classList.add('online');
        }
    } catch {
        $('ipText').textContent = "Error";
        _store.setState({ currentIP: null });
    }
}

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    $('themeBtn').innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
}

function exportData(accounts) {
    const blob = new Blob([JSON.stringify(accounts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `claude_accounts.json`; a.click();
    URL.revokeObjectURL(url);
}

function createColorPickerHandler(containerId) {
    return (e) => {
        if (e.target.classList.contains('color-option')) {
            $(containerId).querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    };
}

// --- Tag Management ---

function initTagManager(store) {
    $('tagsManageBtn').onclick = () => toggleTagManager(true, store);
    $('closeTagManagerBtn').onclick = () => toggleTagManager(false, store);
    $('addTagBtn').onclick = () => addNewTag(store);

    $('colorPicker').onclick = createColorPickerHandler('colorPicker');
    $('editColorPicker').onclick = createColorPickerHandler('editColorPicker');

    $('cancelEditTagBtn').onclick = () => closeTagEditModal();
    $('saveEditTagBtn').onclick = () => saveEditTag(store);
    $('tagEditOverlay').onclick = () => closeTagEditModal();

    $('tagList').onclick = (e) => {
        const tagItem = e.target.closest('.tag-item');
        if (!tagItem) return;
        const tagId = tagItem.dataset.id;

        if (e.target.closest('.tag-delete')) {
            deleteTag(tagId, store);
        } else if (e.target.closest('.tag-edit')) {
            openTagEditModal(tagId, store);
        }
    };
}

function toggleTagManager(show, store) {
    const el = $('tagManagerModal'), overlay = $('modalOverlay');
    if (show) {
        renderTagList(store);
        el.classList.add('open');
        overlay.classList.add('open');
    } else {
        el.classList.remove('open');
        overlay.classList.remove('open');
        $('newTagName').value = '';
    }
}

function renderTagList(store) {
    const { tags } = store.getState();
    const container = $('tagList');

    if (!tags || tags.length === 0) {
        container.innerHTML = '<div class="empty-tags">暂无标签，添加一个吧！</div>';
        return;
    }

    container.innerHTML = tags.map(tag => `
    <div class="tag-item" data-id="${tag.id}">
      <span class="tag-color" style="background:${tag.color}"></span>
      <span class="tag-name">${sanitize(tag.name)}</span>
      <div class="tag-actions">
        <button class="tag-edit" title="编辑">✏️</button>
        <button class="tag-delete" title="删除">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function addNewTag(store) {
    const name = $('newTagName').value.trim();
    if (!name) return showToast("请输入标签名称");

    const selectedColor = $('colorPicker').querySelector('.color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : '#6b7280';

    const { tags } = store.getState();

    if (tags.some(t => t.name === name)) {
        return showToast("标签已存在");
    }

    const newTag = { id: 'tag_' + Date.now(), name, color };
    const newTags = [...tags, newTag];
    const newTagMap = createTagMap(newTags);

    await saveAndUpdate(
        { [TAGS_KEY]: newTags },
        { tags: newTags, tagMap: newTagMap },
        store,
        () => { renderTagList(store); renderTagFilterBar(store); }
    );
    $('newTagName').value = '';
    showToast("标签已添加");
}

function deleteTag(tagId, store) {
    const { tagMap } = store.getState();
    const tag = tagMap.get(tagId);
    const tagName = tag ? tag.name : '此标签';

    showDeleteModal(tagName, async () => {
        const { tags, accounts, tagOrders } = store.getState();
        const newTags = tags.filter(t => t.id !== tagId);

        const newAccounts = accounts.map(acc => ({
            ...acc,
            tagIds: (acc.tagIds || []).filter(id => id !== tagId)
        }));

        const newTagOrders = { ...tagOrders };
        delete newTagOrders[tagId];
        const newTagMap = createTagMap(newTags);
        const newAccountMap = createAccountMap(newAccounts);

        await saveAndUpdate(
            { [TAGS_KEY]: newTags, [STORAGE_KEY]: newAccounts, [TAG_ORDERS_KEY]: newTagOrders },
            { tags: newTags, tagMap: newTagMap, accounts: newAccounts, accountMap: newAccountMap, tagOrders: newTagOrders },
            store,
            () => { renderTagList(store); renderTagFilterBar(store); }
        );
        showToast("标签已删除");
    });
}

function openTagEditModal(tagId, store) {
    const { tagMap } = store.getState();
    const tag = tagMap.get(tagId);
    if (!tag) return;

    _editingTagId = tagId;

    $('editTagName').value = tag.name;

    $('editColorPicker').querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === tag.color);
    });

    $('tagEditOverlay').classList.add('open');
    $('tagEditModal').classList.add('open');
    $('editTagName').focus();
}

function closeTagEditModal() {
    $('tagEditModal').classList.remove('open');
    $('tagEditOverlay').classList.remove('open');
    _editingTagId = null;
}

async function saveEditTag(store) {
    const tagId = _editingTagId;
    if (!tagId) return;

    const newName = $('editTagName').value.trim();
    if (!newName) return showToast("请输入标签名称");

    const selectedColor = $('editColorPicker').querySelector('.color-option.selected');
    const newColor = selectedColor ? selectedColor.dataset.color : '#6b7280';

    const { tags } = store.getState();
    const newTags = tags.map(t => t.id === tagId ? { ...t, name: newName, color: newColor } : t);
    const newTagMap = createTagMap(newTags);

    await saveAndUpdate(
        { [TAGS_KEY]: newTags },
        { tags: newTags, tagMap: newTagMap },
        store,
        () => { renderTagList(store); renderTagFilterBar(store); }
    );
    closeTagEditModal();
    showToast("标签已更新");
}

function renderTagSelector(store, selectedTagIds = []) {
    const { tags } = store.getState();
    const container = $('tagSelector');

    if (!tags || tags.length === 0) {
        container.innerHTML = '<span class="empty-tags">暂无标签</span>';
        return;
    }

    container.innerHTML = tags.map(tag => {
        const isSelected = selectedTagIds.includes(tag.id);
        return `
      <span class="tag-option ${isSelected ? 'selected' : ''}" data-id="${tag.id}">
        <span class="tag-dot" style="background:${tag.color}"></span>
        ${sanitize(tag.name)}
      </span>
    `;
    }).join('');

    container.onclick = (e) => {
        const option = e.target.closest('.tag-option');
        if (option) {
            option.classList.toggle('selected');
        }
    };
}

function getSelectedTagIds() {
    const selected = $('tagSelector').querySelectorAll('.tag-option.selected');
    return Array.from(selected).map(el => el.dataset.id);
}

function showDeleteModal(accountName, onConfirm) {
    const modal = $('deleteModal');
    $('deleteMessage').textContent = `确定要删除「${accountName}」吗？此操作不可撤销。`;
    modal.classList.add('open');

    _deleteConfirmCallback = onConfirm;

    $('cancelDeleteBtn').onclick = () => modal.classList.remove('open');
    $('confirmDeleteBtn').onclick = () => {
        modal.classList.remove('open');
        if (_deleteConfirmCallback) {
            _deleteConfirmCallback();
            _deleteConfirmCallback = null;
        }
    };

    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('open');
    };
}

function renderTagFilterBar(store) {
    const { tags, filterTagId, accounts } = store.getState();
    const container = $('tagFilterBar');

    const hasUntagged = accounts.some(a => !a.tagIds || a.tagIds.length === 0);

    if ((!tags || tags.length === 0) && !hasUntagged) {
        container.innerHTML = '';
        return;
    }

    let html = `<span class="tag-filter-item ${!filterTagId || filterTagId === 'all' ? 'active' : ''}" data-id="all">全部</span>`;

    if (tags && tags.length > 0) {
        html += tags.map(tag => `
            <span class="tag-filter-item ${filterTagId === tag.id ? 'active' : ''}" data-id="${tag.id}">
                <span class="tag-dot" style="background:${tag.color}"></span>
                ${sanitize(tag.name)}
            </span>
        `).join('');
    }

    if (hasUntagged) {
        html += `<span class="tag-filter-item ${filterTagId === 'untagged' ? 'active' : ''}" data-id="untagged">无标签</span>`;
    }

    container.innerHTML = html;

    container.onclick = (e) => {
        const item = e.target.closest('.tag-filter-item');
        if (!item) return;

        const tagId = item.dataset.id || 'all';
        store.setState({ filterTagId: tagId });
        chrome.storage.local.set({ [FILTER_TAG_KEY]: tagId });

        container.querySelectorAll('.tag-filter-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === tagId);
        });
    };
}
