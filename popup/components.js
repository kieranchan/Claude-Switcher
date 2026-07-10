/**
 * Claude Account Switcher - Components Module
 * UI 组件
 */

import { ICONS, TAG_ORDERS_KEY } from './constants.js';
import { $, memoize, sanitize, detectPlanKind } from './store.js';

// 外部依赖注入（避免循环依赖）
let switchAccount = () => { };
export function setSwitchAccount(fn) {
    switchAccount = fn;
}

// 记忆化的过滤和排序函数 - 避免重复计算
export const getFilteredAccounts = memoize((accounts, filter, filterTagId, tagOrders) => {
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

// AccountCard 组件
export function AccountCard(account, index, store) {
    const li = document.createElement('li');
    li.className = 'account-card';
    li.dataset.key = account.key;

    const accountInfo = document.createElement('div');
    accountInfo.className = 'account-info';

    const accountHeader = document.createElement('div');
    accountHeader.className = 'account-header';

    const accountName = document.createElement('span');
    accountName.className = 'account-name';

    const badges = document.createElement('div');
    badges.className = 'badges';

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

        let badgeHTML = '';

        if (account.plan) {
            const kind = detectPlanKind(account.plan);
            if (kind === 'max') {
                badgeHTML += `<span class="badge badge-max">Max</span>`;
            } else if (kind === 'pro') {
                badgeHTML += `<span class="badge badge-pro">Pro</span>`;
            } else if (kind === 'team') {
                badgeHTML += `<span class="badge badge-team">Team</span>`;
                // 旧数据兼容：无 orgName 且 plan 不含 "plan" 字样时，plan 字段本身就是组织名
                let orgName = account.orgName;
                if (!orgName && account.plan && !/\bplan\b/i.test(account.plan)) {
                    orgName = account.plan;
                }
                if (orgName) {
                    badgeHTML += `<span class="team-org" title="${sanitize(orgName)}">${sanitize(orgName)}</span>`;
                }
            } else if (kind === 'free') {
                badgeHTML += `<span class="badge badge-free">Free</span>`;
            }
        }

        accountName.textContent = account.name || '未命名';
        badges.innerHTML = badgeHTML;

        // 显示标签
        const { tagMap } = store.getState();
        const accountTagIds = account.tagIds || [];
        tagsContainer.innerHTML = accountTagIds.map(tagId => {
            const tag = tagMap.get(tagId);
            if (!tag) return '';
            return `<span class="tag" style="background:${tag.color}20;color:${tag.color};border:1px solid ${tag.color}40">${sanitize(tag.name)}</span>`;
        }).join('');
    };

    update(account);

    li.addEventListener('click', (e) => {
        if (e.target.closest('.account-actions')) return;
        switchAccount(account.key);
    });

    return { element: li, update };
}

// App 组件
export function App(store) {
    const listEl = $('accountList');
    const components = new Map();
    let sortableInstance = null;

    const render = (state) => {
        const { accounts, filter, filterTagId, tagOrders } = state;

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

                    const currentOrder = Array.from(listEl.querySelectorAll('li')).map(li => li.dataset.key);
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
