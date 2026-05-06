import { useRoute } from 'vue-router';
const route = useRoute();
const version = '0.1.0';
const githubUrl = 'https://github.com/emu-rabbit/frozen_rabbit_tome';
const __VLS_emit = defineEmits(['close-mobile']);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "w-full bg-white dark:bg-slate-900 flex flex-col transition-all overflow-y-auto border-r border-soft-green-100 dark:border-slate-800 h-full" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['border-r']} */ ;
/** @type {__VLS_StyleScopedClasses['border-soft-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "p-6 pb-2" },
});
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-lg font-bold text-soft-green-800 dark:text-soft-green-500 flex items-center gap-2 leading-tight" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-soft-green-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-soft-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "/assets/logo.png",
    ...{ class: "w-8 h-8 rounded-lg shadow-sm" },
    alt: "Logo",
});
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
(__VLS_ctx.$t('app.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-soft-green-600 dark:text-soft-green-600 mt-2" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-soft-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-soft-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
(__VLS_ctx.$t('app.subtitle'));
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "flex-1 mt-6 px-4 flex flex-col gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    to: "/",
    ...{ class: "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-bold" },
    ...{ class: (__VLS_ctx.route.path === '/' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300') },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    to: "/",
    ...{ class: "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-bold" },
    ...{ class: (__VLS_ctx.route.path === '/' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300') },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.$emit('close-mobile');
            // @ts-ignore
            [$t, $t, route, $emit,];
        } });
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
const { default: __VLS_7 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
    ...{ class: "pi pi-pencil shrink-0" },
});
/** @type {__VLS_StyleScopedClasses['pi']} */ ;
/** @type {__VLS_StyleScopedClasses['pi-pencil']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "leading-tight" },
});
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
(__VLS_ctx.$t('nav.createGuide'));
// @ts-ignore
[$t,];
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-auto" },
});
/** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "p-4 border-t border-soft-green-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30" },
});
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-soft-green-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-50/30']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-900/30']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col gap-3 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
let __VLS_8;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    to: "/settings",
    ...{ class: "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-left font-bold text-sm" },
    ...{ class: (__VLS_ctx.route.path === '/settings' ? 'bg-soft-green-100 dark:bg-soft-green-950 text-soft-green-800 dark:text-soft-green-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300') },
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    to: "/settings",
    ...{ class: "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-left font-bold text-sm" },
    ...{ class: (__VLS_ctx.route.path === '/settings' ? 'bg-soft-green-100 dark:bg-soft-green-950 text-soft-green-800 dark:text-soft-green-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300') },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.$emit('close-mobile');
            // @ts-ignore
            [route, $emit,];
        } });
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
const { default: __VLS_15 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
    ...{ class: "pi pi-cog text-base" },
});
/** @type {__VLS_StyleScopedClasses['pi']} */ ;
/** @type {__VLS_StyleScopedClasses['pi-cog']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.$t('nav.settings'));
// @ts-ignore
[$t,];
var __VLS_11;
var __VLS_12;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col gap-2 px-1" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: (__VLS_ctx.githubUrl),
    target: "_blank",
    ...{ class: "flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-300" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-slate-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:text-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
    ...{ class: "pi pi-github text-xs opacity-70" },
});
/** @type {__VLS_StyleScopedClasses['pi']} */ ;
/** @type {__VLS_StyleScopedClasses['pi-github']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-[11px] font-bold tracking-tight" },
});
/** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
(__VLS_ctx.$t('nav.github'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-[10px] text-center font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase opacity-60" },
});
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['font-black']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
(__VLS_ctx.version);
// @ts-ignore
[$t, githubUrl, version,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
});
export default {};
//# sourceMappingURL=Sidebar.vue.js.map