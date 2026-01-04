/**
 * Claude Account Switcher - Constants Module
 */

// API 和存储键
export const CLAUDE_URL = "https://claude.ai";
export const COOKIE_NAME = "sessionKey";
export const STORAGE_KEY = "accounts";
export const TAGS_KEY = "tags";
export const FILTER_TAG_KEY = "filterTagId";
export const TAG_ORDERS_KEY = "tagOrders";
export const THEME_KEY = "user_theme";

// 手绘风格 SVG 图标
export const ICONS = {
    copy: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 4.2c-.1.1-.3.1-.2.3l.1 10.8c.1.2.1.4.4.4l6.9-.1c.2 0 .4-.2.4-.4l-.1-10.7c0-.2-.2-.4-.4-.4L9.3 4c-.1 0-.2.1-.3.2z" fill="none" stroke-linecap="round"/><path d="M6.2 7.8c-.3.1-.5.1-.4.4l.2 10.6c0 .3.2.5.5.5l6.8-.2c.2 0 .4-.1.4-.4" fill="none" stroke-linecap="round"/></svg>`,
    edit: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16.8 3.3c.4-.5 1.2-.6 1.8-.2l2.1 1.9c.5.5.5 1.3.1 1.8L8.3 19.6c-.1.2-.3.3-.5.4l-4.6 1.2 1.3-4.5c.1-.2.2-.4.4-.5L16.8 3.3z" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.8 5.8l3.6 3.4" fill="none" stroke-linecap="round"/></svg>`,
    trash: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4.3 6.2c.1-.1 15.2.2 15.3.1" stroke-linecap="round"/><path d="M8.8 6.1l.2-1.6c.1-.4.4-.7.8-.7h4.2c.4 0 .7.3.8.7l.3 1.5" fill="none" stroke-linecap="round"/><path d="M6.4 6.3c.2.4 1.2 12.8 1.3 13.1.1.4.5.7.9.7h6.6c.4 0 .8-.3.9-.7l1.4-13" fill="none" stroke-linecap="round"/><path d="M9.6 10.2l.3 5.8M12.1 10.1l-.1 5.9M14.5 10.2l-.4 5.7" stroke-linecap="round"/></svg>`,
    clock: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3c-5 .1-8.8 4.1-8.7 9.1.1 4.9 4.2 8.8 9.1 8.7 4.9-.1 8.8-4.2 8.7-9.1C21 6.8 16.9 3 12 3z" fill="none" stroke-linecap="round"/><path d="M12 6.8v5.4l3.2 1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    sun: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 8c-2.3.1-4.1 2-4 4.3.1 2.2 2 4 4.3 3.9 2.2-.1 4-2 3.9-4.3-.1-2.2-2-3.9-4.2-3.9z" fill="none" stroke-linecap="round"/><path d="M12 2.5v2.3M12.1 19.3v2.2M4.2 11.9l2.1.1M17.8 12.1l2.2-.1M5.7 5.5l1.6 1.7M16.9 16.6l1.5 1.7M5.5 18.4l1.7-1.5M16.7 7.2l1.7-1.6" stroke-linecap="round"/></svg>`,
    moon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19.8 14.2c-.8.5-2.4.9-3.9.6-3.8-.6-6.6-4-6.2-8.3.1-.9.4-1.8.8-2.6-3.8 1.6-6.1 5.4-5.2 9.6 1 4.3 4.9 7.2 9.3 6.7 2.9-.3 5.3-1.9 6.7-4.3-.5.3-.9.4-1.5.3z" fill="none" stroke-linecap="round"/></svg>`,
    login: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M15.2 3.8h3.8c.4 0 .8.4.8.9l-.1 14.7c0 .5-.4.9-.9.9l-3.6-.1" fill="none" stroke-linecap="round"/><path d="M10.3 16.3l4.3-4.4-4.5-4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.4 12l-10.6.1" stroke-linecap="round"/></svg>`,
    save: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M18.8 20.8l-13.6.1c-.4 0-.9-.4-.9-.9l.1-15.8c0-.4.4-.8.9-.8l10.8-.1 3.6 3.7-.1 12.9c0 .5-.4.9-.8.9z" fill="none" stroke-linecap="round"/><path d="M7.2 3.3l-.1 4.9 7.8-.1.1-4.8" fill="none" stroke-linecap="round"/><path d="M6.3 12.2l11.5-.1-.1 7.6-11.6.1.2-7.6z" fill="none" stroke-linecap="round"/></svg>`,
    grab: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12.1 3.6l-.2 12.8" stroke-linecap="round"/><path d="M7.2 12.2l4.8 4.6 5-4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 19.9l15.7-.2" stroke-linecap="round"/></svg>`,
    tag: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20.2 13.8l-7.3 7.3c-.5.4-1.1.4-1.6.1L2.8 12.5c-.2-.2-.4-.5-.4-.8l.1-7.6c0-.4.4-.8.9-.8l7.5-.1c.3 0 .6.1.8.3l8.5 8.6c.4.5.4 1.2 0 1.7z" fill="none" stroke-linecap="round"/><circle cx="7.2" cy="7.6" r="1.4" fill="none"/></svg>`,
    export: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3.5v10.8" stroke-linecap="round"/><path d="M7.2 8.8l4.8-4.6 5 4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 14.5v4.8c0 .4.4.8.9.8h13.8c.5 0 .9-.4.9-.8v-4.7" fill="none" stroke-linecap="round"/></svg>`,
    import: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 14.3V3.5" stroke-linecap="round"/><path d="M7.2 9.5l4.8 4.6 5-4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 14.5v4.8c0 .4.4.8.9.8h13.8c.5 0 .9-.4.9-.8v-4.7" fill="none" stroke-linecap="round"/></svg>`,
    warning: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2.5L2.5 20.5h19L12 2.5z" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v5" stroke-linecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>`
};
