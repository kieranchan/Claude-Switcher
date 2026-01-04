/**
 * Claude Account Switcher - Store Module
 * 状态管理 + 工具函数
 */

import { TAG_ORDERS_KEY } from './constants.js';

// DOM 选择器
export const $ = id => document.getElementById(id);

// --- State Management ---
export function createStore(initialState = {}) {
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

// --- tagOrders 工具函数 ---

// 从所有 tagOrders 中移除指定 key
export function removeKeyFromTagOrders(tagOrders, keyToRemove) {
    const newTagOrders = {};
    for (const k of Object.keys(tagOrders)) {
        newTagOrders[k] = tagOrders[k].filter(t => t !== keyToRemove);
    }
    return newTagOrders;
}

// 处理账号标签变化时更新 tagOrders
export function updateTagOrdersOnTagChange(tagOrders, key, oldTagIds, newTagIds) {
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
export function addKeyToTagOrders(tagOrders, key, tagIds) {
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
// --- 安全工具函数 ---

// HTML 转义 - 防止 XSS 攻击
export function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&"']/g, c => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

// 验证账号数据结构
export function validateAccount(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.key !== 'string' || obj.key.length < 10) return false;
    if (typeof obj.name !== 'string') return false;
    if (obj.tagIds && !Array.isArray(obj.tagIds)) return false;
    return true;
}

// 验证标签数据结构
export function validateTag(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.id !== 'string' || !obj.id.startsWith('tag_')) return false;
    if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 50) return false;
    if (typeof obj.color !== 'string' || !/^#[0-9a-fA-F]{6}$/i.test(obj.color)) return false;
    return true;
}

// --- 通用工具函数 ---

// 记忆化工具函数 - 缓存计算结果
export function memoize(fn) {
    let lastArgs = null;
    let lastResult = null;
    return (...args) => {
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
export function createAccountMap(accounts) {
    return new Map(accounts.map(a => [a.key, a]));
}

// 创建标签 Map (id -> tag)，用于 O(1) 查找
export function createTagMap(tags) {
    return new Map(tags.map(t => [t.id, t]));
}

// 通用事件委托函数
export function delegate(container, selector, handler) {
    container.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target) handler(target, e);
    });
}

// 错误边界包装器 - 防止单操作失败导致崩溃
export async function trySafe(fn, fallbackMsg = '操作失败') {
    try {
        await fn();
    } catch (e) {
        console.error('[Claude-Switcher Error]', e);
        showToast(fallbackMsg);
    }
}

// showToast 占位（实际在 main.js 定义，这里用于避免循环依赖）
let showToast = (msg) => console.log('[Toast]', msg);
export function setShowToast(fn) {
    showToast = fn;
}

// 合并存储和状态更新（带错误处理）
export async function saveAndUpdate(storageData, stateData, store, callback) {
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
export async function initTagOrders(accounts, tagOrders) {
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
            if (!orders.untagged) orders.untagged = [];
            if (!orders.untagged.includes(acc.key)) {
                orders.untagged.push(acc.key);
                needsSave = true;
            }
        } else {
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
