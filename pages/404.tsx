import { GetStaticProps } from 'next';
import Header from '@organisms/layout/Header';

const IndexPage = () => {
    return (
        <>
            <Header title="404" centered full />
        </>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {
            title: '404',
        },
        revalidate: 3600,
    };
};

export default IndexPage;
