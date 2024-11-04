import { GetStaticProps } from 'next';
import ThreeDMap from '@organisms/ThreeDMap/ThreeDMapWrapper';

interface ThreeDExampleProps {}

const ThreeDExamplePage = ({}: ThreeDExampleProps) => {
    return (
        <>
            <h1>3D Example Page</h1>
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
