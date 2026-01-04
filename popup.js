/**
 * Claude Account Switcher - Refactored with State Management and Components
 */
const CLAUDE_URL = "https://claude.ai";
const COOKIE_NAME = "sessionKey";
const STORAGE_KEY = "accounts";
const TAGS_KEY = "tags";
const FILTER_TAG_KEY = "filterTagId";
const TAG_ORDERS_KEY = "tagOrders";
const THEME_KEY = "user_theme";

// 模块级私有状态（替代 window 全局变量）
let _editIndex = -1;
let _grabPlan = null;
let _editingTagId = null;

// Hand-drawn Style Icons - 真正的手绘风格（带抖动感）
const ICONS = {
    // 复制 - 手绘两张纸
    copy: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 4.2c-.1.1-.3.1-.2.3l.1 10.8c.1.2.1.4.4.4l6.9-.1c.2 0 .4-.2.4-.4l-.1-10.7c0-.2-.2-.4-.4-.4L9.3 4c-.1 0-.2.1-.3.2z" fill="none" stroke-linecap="round"/><path d="M6.2 7.8c-.3.1-.5.1-.4.4l.2 10.6c0 .3.2.5.5.5l6.8-.2c.2 0 .4-.1.4-.4" fill="none" stroke-linecap="round"/></svg>`,
    // 编辑 - 歪歪扭扭的铅笔
    edit: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16.8 3.3c.4-.5 1.2-.6 1.8-.2l2.1 1.9c.5.5.5 1.3.1 1.8L8.3 19.6c-.1.2-.3.3-.5.4l-4.6 1.2 1.3-4.5c.1-.2.2-.4.4-.5L16.8 3.3z" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.8 5.8l3.6 3.4" fill="none" stroke-linecap="round"/></svg>`,
    // 删除 - 手绘垃圾桶
    trash: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4.3 6.2c.1-.1 15.2.2 15.3.1" stroke-linecap="round"/><path d="M8.8 6.1l.2-1.6c.1-.4.4-.7.8-.7h4.2c.4 0 .7.3.8.7l.3 1.5" fill="none" stroke-linecap="round"/><path d="M6.4 6.3c.2.4 1.2 12.8 1.3 13.1.1.4.5.7.9.7h6.6c.4 0 .8-.3.9-.7l1.4-13" fill="none" stroke-linecap="round"/><path d="M9.6 10.2l.3 5.8M12.1 10.1l-.1 5.9M14.5 10.2l-.4 5.7" stroke-linecap="round"/></svg>`,
    // 时钟 - 手绘圆
    clock: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3c-5 .1-8.8 4.1-8.7 9.1.1 4.9 4.2 8.8 9.1 8.7 4.9-.1 8.8-4.2 8.7-9.1C21 6.8 16.9 3 12 3z" fill="none" stroke-linecap="round"/><path d="M12 6.8v5.4l3.2 1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    // 太阳 - 不规则光芒
    sun: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 8c-2.3.1-4.1 2-4 4.3.1 2.2 2 4 4.3 3.9 2.2-.1 4-2 3.9-4.3-.1-2.2-2-3.9-4.2-3.9z" fill="none" stroke-linecap="round"/><path d="M12 2.5v2.3M12.1 19.3v2.2M4.2 11.9l2.1.1M17.8 12.1l2.2-.1M5.7 5.5l1.6 1.7M16.9 16.6l1.5 1.7M5.5 18.4l1.7-1.5M16.7 7.2l1.7-1.6" stroke-linecap="round"/></svg>`,
    // 月亮 - 手绘弧线
    moon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19.8 14.2c-.8.5-2.4.9-3.9.6-3.8-.6-6.6-4-6.2-8.3.1-.9.4-1.8.8-2.6-3.8 1.6-6.1 5.4-5.2 9.6 1 4.3 4.9 7.2 9.3 6.7 2.9-.3 5.3-1.9 6.7-4.3-.5.3-.9.4-1.5.3z" fill="none" stroke-linecap="round"/></svg>`,
    // 登录 - 手绘箭头
    login: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M15.2 3.8h3.8c.4 0 .8.4.8.9l-.1 14.7c0 .5-.4.9-.9.9l-3.6-.1" fill="none" stroke-linecap="round"/><path d="M10.3 16.3l4.3-4.4-4.5-4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.4 12l-10.6.1" stroke-linecap="round"/></svg>`,
    // 保存 - 手绘软盘
    save: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M18.8 20.8l-13.6.1c-.4 0-.9-.4-.9-.9l.1-15.8c0-.4.4-.8.9-.8l10.8-.1 3.6 3.7-.1 12.9c0 .5-.4.9-.8.9z" fill="none" stroke-linecap="round"/><path d="M7.2 3.3l-.1 4.9 7.8-.1.1-4.8" fill="none" stroke-linecap="round"/><path d="M6.3 12.2l11.5-.1-.1 7.6-11.6.1.2-7.6z" fill="none" stroke-linecap="round"/></svg>`,
    // 下载 - 手绘箭头
    grab: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12.1 3.6l-.2 12.8" stroke-linecap="round"/><path d="M7.2 12.2l4.8 4.6 5-4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 19.9l15.7-.2" stroke-linecap="round"/></svg>`,
    // 标签 - 手绘造型
    tag: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20.2 13.8l-7.3 7.3c-.5.4-1.1.4-1.6.1L2.8 12.5c-.2-.2-.4-.5-.4-.8l.1-7.6c0-.4.4-.8.9-.8l7.5-.1c.3 0 .6.1.8.3l8.5 8.6c.4.5.4 1.2 0 1.7z" fill="none" stroke-linecap="round"/><circle cx="7.2" cy="7.6" r="1.4" fill="none"/></svg>`,
    // 导出
    export: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3.5v10.8" stroke-linecap="round"/><path d="M7.2 8.8l4.8-4.6 5 4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 14.5v4.8c0 .4.4.8.9.8h13.8c.5 0 .9-.4.9-.8v-4.7" fill="none" stroke-linecap="round"/></svg>`,
    // 导入
    import: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 14.3V3.5" stroke-linecap="round"/><path d="M7.2 9.5l4.8 4.6 5-4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 14.5v4.8c0 .4.4.8.9.8h13.8c.5 0 .9-.4.9-.8v-4.7" fill="none" stroke-linecap="round"/></svg>`,
    // 警告
    warning: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2.5L2.5 20.5h19L12 2.5z" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v5" stroke-linecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>`
};

const $ = id => document.getElementById(id);

// --- State Management (Store) ---
function createStore(initialState = {}) {
    let state = initialState;
    const listeners = new Set();

    const setState = (updater) => {
        const newState = typeof updater === 'function' ? updater(state) : updater;
        state = { ...state, ...newState };
        publish();
    };

    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const publish = () => {
        for (const listener of listeners) {
            listener(state);
        }
    };

    return {
        getState: () => state,
        setState,
        subscribe,
    };
}

// 从所有 tagOrders 中移除指定 key
function removeKeyFromTagOrders(tagOrders, keyToRemove) {
    const newTagOrders = {};
    for (const k in tagOrders) {
        newTagOrders[k] = tagOrders[k].filter(t => t !== keyToRemove);
    }
    return newTagOrders;
}

// 处理账号标签变化时更新 tagOrders
function updateTagOrdersOnTagChange(tagOrders, key, oldTagIds, newTagIds) {
    const orders = { ...tagOrders };
    const removedTags = oldTagIds.filter(id => !newTagIds.includes(id));
    const addedTags = newTagIds.filter(id => !oldTagIds.includes(id));
    const wasUntagged = oldTagIds.length === 0;
    const isNowUntagged = newTagIds.length === 0;

    // 从移除的标签中删除
    removedTags.forEach(tagId => {
        if (orders[tagId]) orders[tagId] = orders[tagId].filter(t => t !== key);
    });

    // 从无标签移除
    if (wasUntagged && !isNowUntagged && orders.untagged) {
        orders.untagged = orders.untagged.filter(t => t !== key);
    }

    // 添加到新标签
    addedTags.forEach(tagId => {
        if (!orders[tagId]) orders[tagId] = [];
        if (!orders[tagId].includes(key)) orders[tagId].push(key);
    });

    // 添加到无标签
    if (!wasUntagged && isNowUntagged) {
        if (!orders.untagged) orders.untagged = [];
        if (!orders.untagged.includes(key)) orders.untagged.push(key);
    }

    return orders;
}

// 新增账号时添加 key 到 tagOrders
function addKeyToTagOrders(tagOrders, key, tagIds) {
    const orders = { ...tagOrders };

    // 加入 all
    if (!orders.all) orders.all = [];
    orders.all.push(key);

    // 加入标签或无标签
    if (tagIds.length > 0) {
        tagIds.forEach(tagId => {
            if (!orders[tagId]) orders[tagId] = [];
            orders[tagId].push(key);
        });
    } else {
        if (!orders.untagged) orders.untagged = [];
        orders.untagged.push(key);
    }

    return orders;
}

// 记忆化工具函数 - 缓存计算结果
function memoize(fn) {
    let lastArgs = null;
    let lastResult = null;
    return (...args) => {
        // 浅比较参数
        if (lastArgs && args.length === lastArgs.length &&
            args.every((a, i) => a === lastArgs[i])) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
    };
}

// 创建账号 Map (key -> account)，用于 O(1) 查找
function createAccountMap(accounts) {
    return new Map(accounts.map(a => [a.key, a]));
}

// 创建标签 Map (id -> tag)，用于 O(1) 查找
function createTagMap(tags) {
    return new Map(tags.map(t => [t.id, t]));
}

// 通用事件委托函数
function delegate(container, selector, handler) {
    container.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target) handler(target, e);
    });
}
// 错误边界包装器 - 防止单操作失败导致崩溃
async function trySafe(fn, fallbackMsg = '操作失败') {
    try {
        await fn();
    } catch (e) {
        console.error('[Claude-Switcher Error]', e);
        showToast(fallbackMsg);
    }
}

// 合并存储和状态更新（带错误处理）
async function saveAndUpdate(storageData, stateData, store, callback) {
    try {
        await chrome.storage.local.set(storageData);
        store.setState(stateData);
        if (callback) callback();
    } catch (e) {
        console.error('[Claude-Switcher] saveAndUpdate failed:', e);
        showToast('保存失败，请重试');
    }
}

// 初始化/同步 tagOrders，确保数据完整性
async function initTagOrders(accounts, tagOrders) {
    let needsSave = false;
    const orders = { ...tagOrders };

    // 确保 all 排序存在
    if (!orders.all) {
        orders.all = accounts.map(a => a.key);
        needsSave = true;
    }

    // 确保每个账号在对应的标签排序中
    accounts.forEach(acc => {
        const accTagIds = acc.tagIds || [];

        if (accTagIds.length === 0) {
            // 无标签账号
            if (!orders.untagged) orders.untagged = [];
            if (!orders.untagged.includes(acc.key)) {
                orders.untagged.push(acc.key);
                needsSave = true;
            }
        } else {
            // 有标签账号
            accTagIds.forEach(tagId => {
                if (!orders[tagId]) orders[tagId] = [];
                if (!orders[tagId].includes(acc.key)) {
                    orders[tagId].push(acc.key);
                    needsSave = true;
                }
            });
        }
    });

    if (needsSave) {
        await chrome.storage.local.set({ [TAG_ORDERS_KEY]: orders });
    }

    return orders;
}

// 记忆化的过滤和排序函数 - 避免重复计算
const getFilteredAccounts = memoize((accounts, filter, filterTagId, tagOrders) => {
    // 确定当前排序 key
    const orderKey = (!filterTagId || filterTagId === 'all') ? 'all' : filterTagId;

    // 先按标签筛选
    let result = accounts;
    if (filterTagId === 'untagged') {
        result = accounts.filter(acc => !acc.tagIds || acc.tagIds.length === 0);
    } else if (filterTagId && filterTagId !== 'all') {
        result = accounts.filter(acc => (acc.tagIds || []).includes(filterTagId));
    }

    // 再按搜索词筛选
    if (filter) {
        result = result.filter(acc => acc.name.toLowerCase().includes(filter.toLowerCase()));
    }

    // 按 tagOrders 排序
    const order = tagOrders[orderKey] || [];
    return [...result].sort((a, b) => {
        const idxA = order.indexOf(a.key);
        const idxB = order.indexOf(b.key);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
});

// --- Components ---
function AccountCard(account, index, store) {
    const li = document.createElement('li');
    li.className = 'account-card';
    li.dataset.key = account.key;  // 改用 key 作为唯一标识

    const accountInfo = document.createElement('div');
    accountInfo.className = 'account-info';

    const accountHeader = document.createElement('div');
    accountHeader.className = 'account-header';

    const accountName = document.createElement('span');
    accountName.className = 'account-name';

    const badges = document.createElement('div');
    badges.className = 'badges';

    // 标签显示区域（放在用户名行）
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags-container';

    accountHeader.append(accountName, badges, tagsContainer);

    const accountKey = document.createElement('div');
    accountKey.className = 'account-key';
    accountKey.textContent = `${account.key.slice(0, 10)}...${account.key.slice(-6)}`;

    accountInfo.append(accountHeader, accountKey);

    const accountActions = document.createElement('div');
    accountActions.className = 'account-actions';
    accountActions.innerHTML = `
        <button class="icon-btn action-copy" title="Copy Key">${ICONS.copy}</button>
        <button class="icon-btn action-edit" title="Edit">${ICONS.edit}</button>
        <button class="icon-btn action-delete delete" title="Delete Account">${ICONS.trash}</button>
    `;

    li.append(accountInfo, accountActions);

    const update = (newAccount) => {
        account = newAccount;
        const { activeKey } = store.getState();
        li.classList.toggle('active', account.key === activeKey);

        let badgeHTML = account.key === activeKey ? `<span class="badge badge-current">Current</span>` : '';

        // 显示套餐徽章
        if (account.plan) {
            const planLower = account.plan.toLowerCase();
            if (planLower.includes('pro')) {
                badgeHTML += `<span class="badge badge-pro">Pro</span>`;
            } else if (planLower.includes('team')) {
                badgeHTML += `<span class="badge badge-team">Team</span>`;
            } else if (planLower.includes('free')) {
                badgeHTML += `<span class="badge badge-free">Free</span>`;
            }
        }

        accountName.textContent = account.name || '未命名';
        badges.innerHTML = badgeHTML;

        // 显示标签
        const { tagMap } = store.getState();
        const accountTagIds = account.tagIds || [];
        tagsContainer.innerHTML = accountTagIds.map(tagId => {
            const tag = tagMap.get(tagId); // O(1) 查找
            if (!tag) return '';
            return `<span class="tag" style="background:${tag.color}20;color:${tag.color};border:1px solid ${tag.color}40">${tag.name}</span>`;
        }).join('');
    };

    update(account);

    li.addEventListener('click', (e) => {
        if (e.target.closest('.account-actions')) return;
        switchAccount(account.key);
    });

    return { element: li, update };
}

function App(store) {
    const listEl = $('accountList');
    const components = new Map();
    let sortableInstance = null;

    const render = (state) => {
        const { accounts, filter, filterTagId, tagOrders } = state;

        // 使用记忆化的过滤排序函数（条件不变时直接返回缓存结果）
        const filteredAccounts = getFilteredAccounts(accounts, filter, filterTagId, tagOrders);

        if (filteredAccounts.length === 0) {
            listEl.innerHTML = `<div class="empty-state">📭 无账号</div>`;
            components.clear();
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
            return;
        }

        const newKeys = new Set(filteredAccounts.map(acc => acc.key));

        // 清除可能残留的 empty-state
        const emptyState = listEl.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        // Remove old components
        for (const [key, component] of components.entries()) {
            if (!newKeys.has(key)) {
                component.element.remove();
                components.delete(key);
            }
        }

        // Add/update components
        filteredAccounts.forEach((acc, idx) => {
            const originalIndex = accounts.indexOf(acc);
            if (components.has(acc.key)) {
                const component = components.get(acc.key);
                component.update(acc);
                //- Reorder if necessary
                if (listEl.children[idx] !== component.element) {
                    listEl.insertBefore(component.element, listEl.children[idx]);
                }
            } else {
                const card = AccountCard(acc, originalIndex, store);
                listEl.insertBefore(card.element, listEl.children[idx]);
                components.set(acc.key, card);
            }
        });

        // Initialize Sortable if not already done
        if (!sortableInstance && filteredAccounts.length > 0) {
            sortableInstance = new Sortable(listEl, {
                animation: 150,
                ghostClass: 'dragging',
                chosenClass: 'drag-over',
                onEnd: async (evt) => {
                    const { oldIndex, newIndex } = evt;
                    if (oldIndex === newIndex) return;

                    const { tagOrders, filterTagId } = store.getState();
                    const orderKey = (!filterTagId || filterTagId === 'all') ? 'all' : filterTagId;

                    // 从 DOM 获取当前显示的 key 列表
                    const currentOrder = Array.from(listEl.querySelectorAll('li')).map(li => li.dataset.key);

                    // 更新 tagOrders
                    const newTagOrders = { ...tagOrders, [orderKey]: currentOrder };

                    await chrome.storage.local.set({ [TAG_ORDERS_KEY]: newTagOrders });
                    store.setState({ tagOrders: newTagOrders });
                }
            });
        }
    };

    store.subscribe(render);
    render(store.getState());
}

// --- Main ---
document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get([STORAGE_KEY, TAGS_KEY, FILTER_TAG_KEY, TAG_ORDERS_KEY, THEME_KEY]);
    const accounts = data[STORAGE_KEY] || [];
    const tags = data[TAGS_KEY] || [];
    const filterTagId = data[FILTER_TAG_KEY] || null;
    let tagOrders = data[TAG_ORDERS_KEY] || {};
    const accountKeySet = new Set(accounts.map(acc => acc.key));
    const accountMap = createAccountMap(accounts);
    const tagMap = createTagMap(tags);

    // 初始化/同步 tagOrders
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

    window.store = store; // For easier debugging

    App(store);
    initEventListeners(store);
    initTagManager(store);
    renderTagFilterBar(store);

    // 初始化工具菜单图标
    $('exportIcon').innerHTML = ICONS.export;
    $('importIcon').innerHTML = ICONS.import;
    $('warningIcon').innerHTML = ICONS.warning;

    // Theme Init
    const isDark = data[THEME_KEY] === 'dark' || (!data[THEME_KEY] && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(isDark);

    checkNetwork();
});

function initEventListeners(store) {
    $('toggleAddBtn').onclick = () => toggleModal(true);
    $('cancelEditBtn').onclick = () => toggleModal(false);
    // overlay 点击时关闭所有弹窗
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

        // 账号编辑弹窗
        if ($('editForm').classList.contains('open')) {
            saveAccount(store);
        }
        // 标签管理弹窗（添加新标签）
        else if ($('tagManagerModal').classList.contains('open') && e.target.id === 'newTagName') {
            addNewTag(store);
        }
        // 标签编辑弹窗
        else if ($('tagEditModal').classList.contains('open')) {
            saveEditTag(store);
        }
    });

    // ESC 键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        e.preventDefault();
        e.stopPropagation();

        // 按优先级关闭弹窗
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

// --- Actions ---

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

        const newAccounts = [...accounts];
        newAccounts[editIndex].name = name;
        newAccounts[editIndex].tagIds = tagIds;

        const newAccountMap = createAccountMap(newAccounts);
        const newTagOrders = updateTagOrdersOnTagChange(tagOrders, key, oldTagIds, tagIds);

        await saveAndUpdate(
            { [STORAGE_KEY]: newAccounts, [TAG_ORDERS_KEY]: newTagOrders },
            { accounts: newAccounts, accountMap: newAccountMap, tagOrders: newTagOrders },
            store,
            () => renderTagFilterBar(store)
        );
        showToast("已更新");
        toggleModal(false);
        return;
    }

    // 新增模式
    let key = $('inputKey').value.trim();
    if (!name || !key) return showToast("请填写完整");
    if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);

    // 使用 accountMap O(1) 检查重复
    if (accountMap.has(key)) {
        showToast("账号已存在");
        toggleModal(false);
        return;
    }

    // 获取抓取时临时存储的套餐
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

async function grabKey(store, index = -1) {
    try {
        const cookie = await chrome.cookies.get({ url: CLAUDE_URL, name: COOKIE_NAME });
        if (!cookie) return showToast("未登录");
        const key = decodeURIComponent(cookie.value);

        // 获取用户名和套餐
        const result = await grabUserInfo();

        if (index >= 0) {
            if (result?.name) {
                const { accounts } = store.getState();
                const newAccounts = [...accounts];
                newAccounts[index].name = result.name;
                if (result.plan) newAccounts[index].plan = result.plan;

                await chrome.storage.local.set({ [STORAGE_KEY]: newAccounts });
                store.setState({ accounts: newAccounts });
                showToast(`已更新: ${result.name} (${result.plan || '--'})`);
            } else {
                showToast("未能获取用户名");
            }
        } else {
            $('inputKey').value = key;
            if (result?.name) $('inputName').value = result.name;
            // 临时存储套餐
            window._grabPlan = result?.plan;
            $('inputName').focus();
            showToast(`已获取: ${result?.name || 'Key'} (${result?.plan || '--'})`);
        }
    } catch {
        showToast("获取失败");
    }
}

// 通用抓取用户信息函数
async function grabUserInfo() {
    const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
    if (tabs.length === 0) return null;

    try {
        const res = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                // 获取所有 truncate 元素
                const allTruncate = document.querySelectorAll('[class*="truncate"]');
                if (allTruncate.length < 2) return null;

                let name = null;
                let plan = null;

                // 从后往前找，找到包含 "plan" 的元素就是套餐
                for (let i = allTruncate.length - 1; i >= 0; i--) {
                    const text = allTruncate[i].textContent.trim();
                    const textLower = text.toLowerCase();

                    // 套餐格式是 "xxx plan"
                    if (textLower.includes(' plan')) {
                        plan = text;
                        // 用户名是套餐前面的那个元素
                        if (i > 0) {
                            name = allTruncate[i - 1].textContent.trim();
                        }
                        break;
                    }
                }

                return { name, plan };
            }
        });
        return res?.[0]?.result || null;
    } catch (e) {
        console.log("DOM grab failed", e);
        return null;
    }
}

// 更新当前账号信息
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
        const newAccounts = [...accounts];
        if (result.name) newAccounts[idx].name = result.name;
        if (result.plan) newAccounts[idx].plan = result.plan;

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

        window.store.setState({ activeKey: key });

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
    const acc = accountMap.get(key); // O(1) 查找
    const idx = accounts.findIndex(a => a.key === key);

    if (!acc) return;

    const target = e.target.closest('.icon-btn');
    if (!target) return;

    if (target.classList.contains('action-copy')) {
        navigator.clipboard.writeText(acc.key);
        showToast("已复制");
    } else if (target.classList.contains('action-edit')) {
        // 使用弹窗编辑
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
                () => renderTagFilterBar(store)
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
                    if (a.key && !newKeys.has(a.key)) {
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

// --- UI & Helpers ---

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
        renderTagSelector(window.store, selectedTagIds);
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

function toggleEditState(li, isEditing) {
    li.querySelector('.account-name').style.display = isEditing ? 'none' : 'inline-block';
    li.querySelector('.account-name-input').style.display = isEditing ? 'inline-block' : 'none';
    li.querySelector('.action-edit').style.display = isEditing ? 'none' : 'inline-block';
    li.querySelector('.action-save').style.display = isEditing ? 'inline-block' : 'none';

    if (isEditing) {
        li.querySelector('.account-name-input').focus();
        li.querySelector('.account-name-input').select();
    }
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
            window.store.setState({ currentIP: data.ip });
            $('ipText').textContent = data.ip;
            $('geoText').textContent = `${data.city}, ${data.country_code}`;
            $('netDot').classList.add('online');
        }
    } catch {
        $('ipText').textContent = "Error";
        window.store.setState({ currentIP: null });
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

// 颜色选择器事件处理器工厂函数
function createColorPickerHandler(containerId) {
    return (e) => {
        if (e.target.classList.contains('color-option')) {
            $(containerId).querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    };
}

// ========== 标签管理系统 ==========

function initTagManager(store) {
    // 标签管理按钮
    $('tagsManageBtn').onclick = () => toggleTagManager(true, store);
    $('closeTagManagerBtn').onclick = () => toggleTagManager(false, store);

    // 添加标签按钮
    $('addTagBtn').onclick = () => addNewTag(store);

    // 颜色选择器（使用工厂函数简化）
    $('colorPicker').onclick = createColorPickerHandler('colorPicker');
    $('editColorPicker').onclick = createColorPickerHandler('editColorPicker');

    // 编辑弹窗按钮
    $('cancelEditTagBtn').onclick = () => closeTagEditModal();
    $('saveEditTagBtn').onclick = () => saveEditTag(store);

    // 点击编辑弹窗遮罩关闭
    $('tagEditOverlay').onclick = () => closeTagEditModal();

    // 标签列表事件委托
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
      <span class="tag-name">${tag.name}</span>
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

    // 检查重复
    if (tags.some(t => t.name === name)) {
        return showToast("标签已存在");
    }

    const newTag = {
        id: 'tag_' + Date.now(),
        name,
        color
    };

    const newTags = [...tags, newTag];
    const newTagMap = createTagMap(newTags);
    await saveAndUpdate(
        { [TAGS_KEY]: newTags },
        { tags: newTags, tagMap: newTagMap },
        store,
        () => renderTagList(store)
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

        // 同时从账号中移除该标签
        const newAccounts = accounts.map(acc => ({
            ...acc,
            tagIds: (acc.tagIds || []).filter(id => id !== tagId)
        }));

        // 从 tagOrders 中移除该标签的排序
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

// 打开标签编辑弹窗
function openTagEditModal(tagId, store) {
    const { tagMap } = store.getState();
    const tag = tagMap.get(tagId);
    if (!tag) return;

    _editingTagId = tagId;

    // 填充当前标签信息
    $('editTagName').value = tag.name;

    // 选中当前颜色
    $('editColorPicker').querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === tag.color);
    });

    // 打开弹窗
    $('tagEditOverlay').classList.add('open');
    $('tagEditModal').classList.add('open');
    $('editTagName').focus();
}

// 关闭标签编辑弹窗
function closeTagEditModal() {
    $('tagEditModal').classList.remove('open');
    $('tagEditOverlay').classList.remove('open');
    window._editingTagId = null;
}

// 保存编辑的标签
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

// 渲染账号编辑弹窗中的标签选择器
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
        ${tag.name}
      </span>
    `;
    }).join('');

    // 标签选择事件
    container.onclick = (e) => {
        const option = e.target.closest('.tag-option');
        if (option) {
            option.classList.toggle('selected');
        }
    };
}

// 获取当前选中的标签ID列表
function getSelectedTagIds() {
    const selected = $('tagSelector').querySelectorAll('.tag-option.selected');
    return Array.from(selected).map(el => el.dataset.id);
}

// 显示删除确认弹窗
function showDeleteModal(accountName, onConfirm) {
    const modal = $('deleteModal');
    $('deleteMessage').textContent = `确定要删除「${accountName}」吗？此操作不可撤销。`;
    modal.classList.add('open');

    // 存储回调
    window._deleteConfirmCallback = onConfirm;

    // 绑定事件
    $('cancelDeleteBtn').onclick = () => modal.classList.remove('open');
    $('confirmDeleteBtn').onclick = () => {
        modal.classList.remove('open');
        if (window._deleteConfirmCallback) {
            window._deleteConfirmCallback();
            window._deleteConfirmCallback = null;
        }
    };

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('open');
    };
}

// 渲染标签筛选栏
function renderTagFilterBar(store) {
    const { tags, filterTagId, accounts } = store.getState();
    const container = $('tagFilterBar');

    // 检查是否有无标签账号
    const hasUntagged = accounts.some(a => !a.tagIds || a.tagIds.length === 0);

    if ((!tags || tags.length === 0) && !hasUntagged) {
        container.innerHTML = '';
        return;
    }

    // 生成"全部"按钮 + 各标签 + "无标签"
    let html = `<span class="tag-filter-item ${!filterTagId || filterTagId === 'all' ? 'active' : ''}" data-id="all">全部</span>`;

    if (tags && tags.length > 0) {
        html += tags.map(tag => `
            <span class="tag-filter-item ${filterTagId === tag.id ? 'active' : ''}" data-id="${tag.id}">
                <span class="tag-dot" style="background:${tag.color}"></span>
                ${tag.name}
            </span>
        `).join('');
    }

    // 无标签选项
    if (hasUntagged) {
        html += `<span class="tag-filter-item ${filterTagId === 'untagged' ? 'active' : ''}" data-id="untagged">无标签</span>`;
    }

    container.innerHTML = html;

    // 点击事件
    container.onclick = (e) => {
        const item = e.target.closest('.tag-filter-item');
        if (!item) return;

        const tagId = item.dataset.id || 'all';

        // 更新 store
        store.setState({ filterTagId: tagId });

        // 持久化保存
        chrome.storage.local.set({ [FILTER_TAG_KEY]: tagId });

        // 更新 UI
        container.querySelectorAll('.tag-filter-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === tagId);
        });
    };
}
