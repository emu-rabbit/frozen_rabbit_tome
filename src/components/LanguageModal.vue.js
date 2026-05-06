import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettings } from '../composables/useSettings';
const { t } = useI18n();
const { language, initialized } = useSettings();
const languages = [
    { code: 'tw', name: '繁體中文', label: 'Traditional Chinese', icon: '🇹🇼' },
    { code: 'cn', name: '简体中文', label: 'Simplified Chinese', icon: '🇨🇳' },
    { code: 'en', name: 'English', label: 'English', icon: '🇺🇸' },
    { code: 'ja', name: '日本語', label: 'Japanese', icon: '🇯🇵' }
];
const selectedLang = ref(null);
const handleSelect = (code) => {
    selectedLang.value = code;
    language.value = code;
};
const confirmSelection = () => {
    if (selectedLang.value) {
        initialized.value = true;
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['modal-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "modal",
}));
const __VLS_2 = __VLS_1({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
if (!__VLS_ctx.initialized) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[100]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-slate-900/60']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden transform transition-all border border-soft-green-100 dark:border-slate-800 flex flex-col md:flex-row" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-slate-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-[2rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-soft-green-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-slate-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "md:w-5/12 bg-soft-green-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-soft-green-100 dark:border-slate-800 relative overflow-hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['md:w-5/12']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-soft-green-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-slate-950']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border-b-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border-r']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-soft-green-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-slate-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute top-0 left-0 w-32 h-32 bg-lime-green-100 dark:bg-lime-green-900/20 rounded-full -translate-x-12 -translate-y-12 opacity-50 blur-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-lime-green-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-lime-green-900/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-x-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute bottom-0 right-0 w-32 h-32 bg-soft-green-200 dark:bg-soft-green-900/20 rounded-full translate-x-12 translate-y-12 opacity-50 blur-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-soft-green-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-soft-green-900/20']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['translate-x-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['translate-y-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: "/assets/logo.png",
        ...{ class: "w-24 h-24 rounded-3xl shadow-lg mb-8 relative z-10 transform hover:rotate-6 transition-transform duration-500" },
        alt: "Logo",
    });
    /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:rotate-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-3xl font-black text-soft-green-900 dark:text-soft-green-400 mb-2 relative z-10" },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-soft-green-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-soft-green-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    (__VLS_ctx.t('welcomeModal.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-soft-green-600 dark:text-soft-green-500 font-medium relative z-10 opacity-80" },
    });
    /** @type {__VLS_StyleScopedClasses['text-soft-green-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-soft-green-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
    (__VLS_ctx.t('welcomeModal.subtitle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-12 hidden md:block" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex -space-x-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['-space-x-2']} */ ;
    for (const [l] of __VLS_vFor((__VLS_ctx.languages))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (l.code),
            ...{ class: "w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-soft-green-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-soft-green-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:border-slate-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        (l.icon);
        // @ts-ignore
        [initialized, t, t, languages,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "md:w-7/12 p-8 md:p-12 flex flex-col" },
    });
    /** @type {__VLS_StyleScopedClasses['md:w-7/12']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed" },
    });
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
    (__VLS_ctx.t('welcomeModal.description'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 gap-3 mb-10" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-10']} */ ;
    for (const [lang] of __VLS_vFor((__VLS_ctx.languages))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.initialized))
                        return;
                    __VLS_ctx.handleSelect(lang.code);
                    // @ts-ignore
                    [t, languages, handleSelect,];
                } },
            key: (lang.code),
            ...{ class: "group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300" },
            ...{ class: (__VLS_ctx.selectedLang === lang.code
                    ? 'border-soft-green-400 dark:border-soft-green-600 bg-soft-green-50 dark:bg-soft-green-900/20 ring-4 ring-soft-green-400/10'
                    : 'border-slate-100 dark:border-slate-800 hover:border-soft-green-200 dark:hover:border-soft-green-700 hover:bg-slate-50 dark:hover:bg-slate-800') },
        });
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm transform group-hover:scale-110 transition-transform" },
        });
        /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:border-slate-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['transform']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover:scale-110']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
        (lang.icon);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-left" },
        });
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "font-bold text-slate-800 dark:text-slate-200" },
            ...{ class: (__VLS_ctx.selectedLang === lang.code ? 'text-soft-green-900 dark:text-soft-green-300' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
        (lang.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider" },
        });
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        (lang.label);
        if (__VLS_ctx.selectedLang === lang.code) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "ml-auto w-6 h-6 rounded-full bg-soft-green-500 text-white flex items-center justify-center" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-soft-green-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
                ...{ class: "pi pi-check text-[10px]" },
            });
            /** @type {__VLS_StyleScopedClasses['pi']} */ ;
            /** @type {__VLS_StyleScopedClasses['pi-check']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        }
        // @ts-ignore
        [selectedLang, selectedLang, selectedLang,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmSelection) },
        disabled: (!__VLS_ctx.selectedLang),
        ...{ class: "w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-soft-green-200/50 dark:shadow-none transition-all duration-300 transform active:scale-[0.98]" },
        ...{ class: (__VLS_ctx.selectedLang
                ? 'bg-soft-green-500 dark:bg-soft-green-600 text-white hover:bg-soft-green-600 dark:hover:bg-soft-green-700 hover:-translate-y-0.5'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed') },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-soft-green-200/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:shadow-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['active:scale-[0.98]']} */ ;
    (__VLS_ctx.t('welcomeModal.confirm'));
}
// @ts-ignore
[t, selectedLang, selectedLang, confirmSelection,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=LanguageModal.vue.js.map