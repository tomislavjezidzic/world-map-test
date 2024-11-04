import { GetStaticProps } from 'next';

interface FlatExampleProps {}

const FlatExamplePage = ({}: FlatExampleProps) => {
    return (
        <>
            <h1>Flat Example Page</h1>
        </>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {
            title: 'Flat Example Page',
        },
        revalidate: 3600,
    };
};

export default FlatExamplePage;
