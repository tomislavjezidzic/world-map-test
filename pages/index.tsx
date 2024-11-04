import { GetStaticProps } from 'next';

interface HomepageProps {

}

const IndexPage = ({ }: HomepageProps) => {
    return (
        <>
            <h1>page</h1>
        </>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {
            title: 'Homepage',
        },
        revalidate: 3600,
    };
};

export default IndexPage;
