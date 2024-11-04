declare module '*.scss' {
    const content: { [className: string]: string };
    export = content;
}

declare module '*.svg' {
    const content: any;
    export default content;
}

declare module '*.jpg';

declare module '*.png';

declare module '*.woff';
declare module '*.woff2';
