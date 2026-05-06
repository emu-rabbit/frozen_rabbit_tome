import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from './components/Sidebar.vue';
import LanguageModal from './components/LanguageModal.vue';
import { useSettings } from './composables/useSettings';
const { locale, t } = useI18n();
const isMobileMenuOpen = ref(false);
const { isDarkMode, language } = useSettings();
// 同步語系
watch(language, (newLang) => {
    locale.value = newLang;
}, { immediate: true });
// 同步深色模式
watch(isDarkMode, (newVal) => {
    if (newVal) {
        document.documentElement.classList.add('dark');
    }
    else {
        document.documentElement.classList.remove('dark');
    }
}, { immediate: true });
// 更新網頁標題
watch(language, () => {
    document.title = `${t('app.title')} | ${t('app.description')}`;
}, { immediate: true });
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
const __VLS_0 = LanguageModal;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex h-screen w-screen bg-soft-green-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans relative" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['w-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-soft-green-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-950']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-soft-green-100/50 dark:border-slate-800/50 flex items-center justify-between px-6 z-50" },
});
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/80']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-900/80']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-soft-green-100/50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-800/50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-8 h-8" },
});
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "/assets/logo.png",
    ...{ class: "w-full h-full object-contain" },
    alt: "Logo",
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "font-black text-soft-green-800 dark:text-soft-green-400 tracking-tight leading-none uppercase" },
});
/** @type {__VLS_StyleScopedClasses['font-black']} */ ;
/** @type {__VLS_StyleScopedClasses['text-soft-green-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-soft-green-400']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-none']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
(__VLS_ctx.$t('app.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.isMobileMenuOpen = !__VLS_ctx.isMobileMenuOpen;
            // @ts-ignore
            [$t, isMobileMenuOpen, isMobileMenuOpen,];
        } },
    ...{ class: "w-10 h-10 rounded-xl bg-soft-green-50/50 dark:bg-slate-800/50 text-soft-green-600 dark:text-soft-green-400 flex items-center justify-center border border-soft-green-100/50 dark:border-slate-700/50 active:scale-95 transition-all" },
});
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-soft-green-50/50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800/50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-soft-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-soft-green-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-soft-green-100/50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-slate-700/50']} */ ;
/** @type {__VLS_StyleScopedClasses['active:scale-95']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
    ...{ class: "pi" },
    ...{ class: (__VLS_ctx.isMobileMenuOpen ? 'pi-times' : 'pi-bars') },
});
/** @type {__VLS_StyleScopedClasses['pi']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.isMobileMenuOpen = false;
            // @ts-ignore
            [isMobileMenuOpen, isMobileMenuOpen,];
        } },
    ...{ class: "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300" },
    ...{ class: (__VLS_ctx.isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-950/60']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['z-[60]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-[70] lg:relative lg:w-72 lg:z-0 lg:translate-x-0 transition-transform duration-300 ease-in-out flex shadow-2xl lg:shadow-none" },
    ...{ class: (__VLS_ctx.isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-80']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['z-[70]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:relative']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:w-72']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:z-0']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:translate-x-0']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:shadow-none']} */ ;
const __VLS_5 = Sidebar;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onCloseMobile': {} },
}));
const __VLS_7 = __VLS_6({
    ...{ 'onCloseMobile': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ closeMobile: {} },
    { onCloseMobile: (...[$event]) => {
            __VLS_ctx.isMobileMenuOpen = false;
            // @ts-ignore
            [isMobileMenuOpen, isMobileMenuOpen, isMobileMenuOpen,];
        } });
var __VLS_8;
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "flex-1 flex flex-col overflow-y-auto relative pt-16 pb-12 lg:pt-0 lg:pb-0 scroll-smooth" },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-16']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-12']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:pt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:pb-0']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-smooth']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fixed top-0 right-0 w-full max-w-[500px] aspect-square bg-gradient-to-br from-soft-green-200/40 via-transparent to-transparent dark:from-soft-green-900/20 rounded-bl-full opacity-60 -z-10 blur-[100px] pointer-events-none" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[500px]']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-soft-green-200/40']} */ ;
/** @type {__VLS_StyleScopedClasses['via-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:from-soft-green-900/20']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-bl-full']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
/** @type {__VLS_StyleScopedClasses['-z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['blur-[100px]']} */ ;
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fixed bottom-0 left-0 w-full max-w-[300px] aspect-square bg-gradient-to-tr from-lime-green-100/30 via-transparent to-transparent dark:from-lime-green-900/10 rounded-tr-full opacity-40 -z-10 blur-[80px] pointer-events-none" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[300px]']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-tr']} */ ;
/** @type {__VLS_StyleScopedClasses['from-lime-green-100/30']} */ ;
/** @type {__VLS_StyleScopedClasses['via-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:from-lime-green-900/10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-tr-full']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-40']} */ ;
/** @type {__VLS_StyleScopedClasses['-z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['blur-[80px]']} */ ;
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-full max-w-7xl mx-auto" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view'] | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
routerView;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
{
    const { default: __VLS_17 } = __VLS_15.slots;
    const [{ Component }] = __VLS_vSlot(__VLS_17);
    let __VLS_18;
    /** @ts-ignore @type { | typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
    transition;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        name: "fade",
        mode: "out-in",
    }));
    const __VLS_20 = __VLS_19({
        name: "fade",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    const { default: __VLS_23 } = __VLS_21.slots;
    const __VLS_24 = (Component);
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
    const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
    // @ts-ignore
    [];
    var __VLS_21;
    // @ts-ignore
    [];
    __VLS_15.slots['' /* empty slot name completion */];
}
var __VLS_15;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=App.vue.js.map