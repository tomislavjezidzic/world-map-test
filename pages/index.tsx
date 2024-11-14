import { GetStaticProps } from 'next';

interface HomepageProps {}

const IndexPage = ({}: HomepageProps) => {
    return (
        <>
            <h1>World map test</h1>
        </>
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: 'Homepage',
        },
        revalidate: 3600,
    };
};

export default IndexPage;
