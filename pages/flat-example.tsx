import { GetStaticProps } from 'next';
import FlatMap from '@organisms/FlatMap/FlatMapWrapper';

interface FlatExampleProps {}

const FlatExamplePage = ({}: FlatExampleProps) => {
    return (
        <>
            <FlatMap />
        </>
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: 'Flat Example Page',
        },
        revalidate: 3600,
    };
};

export default FlatExamplePage;
