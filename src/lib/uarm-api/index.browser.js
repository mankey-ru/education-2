/* global window - это коммент для eslint, тк пресет в ivi для ноды */
import getUarmSubmit from './src/getUarmSubmit.js';
import getTransformRecords from './src/getTransformRecords.js';
/**
 * 
 * Это точка входа ДЛЯ БРАУЗЕРА
 * ***********************************************************************************************************
 * у каждой функции с API-специфическими требованиями (например, в браузере есть FormData, а в ноде это пакет)
 * есть оригинальный код (generic), который принимает апи-специфичные вещи аргументом
 * и есть обертка с этим самым аргументом точнее даже две
 */
export default function () {
	return getUarmSubmit(window.FormData, window.File, ...arguments);
}

export function transformRecords() {
	return getTransformRecords(window.File, ...arguments);
}
