import { useEffect, useState } from 'react';
import { AppProps as NextAppProps } from 'next/app';
import Fonts from '@organisms/layout/Fonts';
import SeoHead from '@organisms/layout/SeoHead';
import 'scss/style.scss';
import Navigation from '@organisms/layout/Navigation';
import { useRouter } from 'next/router';
import cn from 'classnames';

type AppProps<P = any> = {
    pageProps: P;
} & Omit<NextAppProps<P>, 'pageProps'>;

const App = ({ Component, pageProps }: AppProps) => {
    const router = useRouter();
    const [isReady, setIsReady] = useState(true);

    useEffect(() => {
        const startHandler = () => setIsReady(false);

        const completeHandler = () => setIsReady(true);

        router.events.on('routeChangeStart', startHandler);
        router.events.on('routeChangeComplete', completeHandler);

        return () => {
            router.events.off('routeChangeStart', startHandler);
            router.events.off('routeChangeComplete', completeHandler);
        };
    }, []);

    return (
        <>
            <Fonts />
            <SeoHead title={pageProps.title} />
            <main
                className={cn('o-page', {
                    'o-page--show': isReady,
                })}
            >
                <Navigation />

                <Component {...pageProps} />
            </main>
        </>
    );
};

export default App;

export function reportWebVitals(metric) {
    const styling = ['color: gold', 'display: block'].join(';');
    if (process.env.NODE_ENV === 'development') {
        if (metric?.name === 'TTFB') {
            const timeSec = parseFloat(`${Number(metric?.value) / 1000}`).toFixed(2);
            console.info(`%cWeb vitals (TTFB): ${timeSec}s`, styling);
        }
        if (metric.name === 'Next.js-route-change-to-render') {
            const timeSec = parseFloat(`${Number(metric?.value) / 1000}`).toFixed(2);
            console.info(`%cWeb vitals (change-to-render): ${timeSec}s`, styling);
        }
    }
}
