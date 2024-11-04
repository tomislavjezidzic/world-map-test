import { GetStaticProps } from 'next';

interface ThreeDExampleProps {}

const ThreeDExamplePage = ({}: ThreeDExampleProps) => {
    return (
        <>
            <h1>3D Example Page</h1>
        </>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {
            title: '3D Example Page',
        },
        revalidate: 3600,
    };
};

export default ThreeDExamplePage;
