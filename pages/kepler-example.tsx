import { GetStaticProps } from 'next';
import Image from 'next/image';
import aboveMapImage from '@public/images/above.jpg';
import belowMapImage from '@public/images/below.jpg';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Provider as ReduxProvider } from 'react-redux';
import store from '../store';

const DynamicMap = dynamic(() => import('../components/organisms/Kepler'), {
    ssr: false,
});

interface KeplerExampleProps {}

const KeplerExamplePage = ({}: KeplerExampleProps) => {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.scrollRestoration = 'manual';
            window.scrollTo(0, 0);
        }
    }, []);

    return (
        <>
            <div>
                <Image src={aboveMapImage} alt="above" />
            </div>

            <ReduxProvider store={store}>
                <DynamicMap />
            </ReduxProvider>

            <div>
                <Image src={belowMapImage} alt="below" />
            </div>
        </>
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: 'Kepler Example Page',
        },
        revalidate: 3600,
    };
};

export default KeplerExamplePage;
