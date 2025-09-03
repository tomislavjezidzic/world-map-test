import { GetStaticProps } from 'next';
import { useEffect } from 'react';
import ThreeJSGlobe from 'components/organisms/ThreeJSGlobe';

interface ThreeJSExampleProps {}

const KeplerExamplePage = ({}: ThreeJSExampleProps) => {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.history.scrollRestoration = 'manual';
            window.scrollTo(0, 0);
        }
    }, []);

    return (
        <ThreeJSGlobe
            continentsData={[
                {
                    id: 'europe',
                    countries: [
                        'Austria',
                        'Belgium',
                        'Bulgaria',
                        'Croatia',
                        'Republic of Cyprus',
                        'Czech Republic',
                        'Denmark',
                        'Estonia',
                        'Finland',
                        'France',
                        'Germany',
                        'Greece',
                    ],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '100',
                },
                {
                    id: 'southAmerica',
                    countries: [
                        'Austria',
                        'Belgium',
                        'Bulgaria',
                        'Croatia',
                        'Republic of Cyprus',
                        'Czech Republic',
                        'Denmark',
                        'Estonia',
                        'Finland',
                        'France',
                        'Germany',
                        'Greece',
                    ],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '300',
                },
                {
                    id: 'northAmerica',
                    countries: ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Republic of Cyprus'],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '800',
                },
                {
                    id: 'africa',
                    countries: ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Republic of Cyprus'],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '340',
                },
                {
                    id: 'asia',
                    countries: ['Austria', 'Belgium', 'Bulgaria'],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '120',
                },
                {
                    id: 'oceania',
                    countries: ['Austria', 'Belgium', 'Bulgaria'],
                    humans: '6,805,424',
                    users: '15,154,506',
                    transactions: '151,217,997',
                    orbs: '440',
                },
            ]}
        />
    );
};

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            title: 'ThreeJSGlobe Example Page',
        },
        revalidate: 3600,
    };
};

export default KeplerExamplePage;
