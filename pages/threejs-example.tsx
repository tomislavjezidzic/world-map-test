import { GetStaticProps } from 'next';
import Image from 'next/image';
import aboveMapImage from '@public/images/above.jpg';
import belowMapImage from '@public/images/below.jpg';
import { useEffect } from 'react';
import ThreeJS from '@organisms/ThreeJS';

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

            <ThreeJS />

            <div>
                <Image src={belowMapImage} alt="below" />
            </div>
        </>
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: 'ThreeJS Example Page',
        },
        revalidate: 3600,
    };
};

export default KeplerExamplePage;
