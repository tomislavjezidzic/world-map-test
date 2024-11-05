import { GetStaticProps } from 'next';
import ThreeDMap from '@organisms/ThreeDMap/ThreeDMapWrapper';

interface ThreeDExampleProps {}

const ThreeDExamplePage = ({}: ThreeDExampleProps) => {
    return (
        <>
            <ThreeDMap />
        </>
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: '3D Example Page',
        },
        revalidate: 3600,
    };
};

export default ThreeDExamplePage;
