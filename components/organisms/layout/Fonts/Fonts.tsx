import { DM_Sans } from 'next/font/google';

export const fontMain = DM_Sans({
    weight: ['400', '500'],
    subsets: ['latin'],
});

const Fonts = () => (
    // eslint-disable-next-line react/no-unknown-property
    <style jsx global>
        {`
            :root {
                --font-main: ${fontMain.style.fontFamily};
            }
            html {
                font-family: ${fontMain.style.fontFamily};
                font-weight: 400;
            }
            .u-body,
            .u-font-primary,
            .u-font-main {
                font-family: ${fontMain.style.fontFamily};
                font-weight: 400;
            }
        `}
    </style>
);

export default Fonts;
