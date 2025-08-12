/**
 * Simple CSS path getter for all components
 */

class ComponentCommon {

    static getComponentCssConfig(componentName) {
        if (window.AntMediaConfig?.componentStyles?.[componentName]) {
            return window.AntMediaConfig.componentStyles[componentName];
        }
        return `../components/styles/${componentName}.css`;
    }
    
    static getBootstrapCss() {
        if (window.AntMediaConfig?.commonStyles?.bootstrap) {
            return window.AntMediaConfig.commonStyles.bootstrap;
        }
        return '../../css/external/bootstrap4/bootstrap.min.css';
    }
    
    static getCommonCss() {
        if (window.AntMediaConfig?.commonStyles?.['component-common']) {
            return window.AntMediaConfig.commonStyles['component-common'];
        }
        return '../components/styles/component-common.css';
    }
    
    // Path for BootstrapIcons package
    static getIconsBootstrapPath() {
        if (window.AntMediaConfig?.iconsPath) {
            return window.AntMediaConfig.iconsPath;
        }
        return '../../css/external/icons/';
    }

    // TODO: Maybe move to component-utils.js or something?
    static formatDuration(ms) {
        if (isNaN(ms) || ms < 0) return '00:00';
        
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const padded = (num) => String(num).padStart(2, '0');

        return hours > 0
            ? `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`
            : `${padded(minutes)}:${padded(seconds)}`;
    }

    // TODO: Maybe move to component-utils.js or something?
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export { ComponentCommon }; 