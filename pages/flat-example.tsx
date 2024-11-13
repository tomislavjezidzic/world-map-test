import { GetStaticProps } from 'next';
import FlatMap from '@organisms/FlatMap/FlatMapWrapper';

interface FlatExampleProps {}

const FlatExamplePage = ({}: FlatExampleProps) => {
    return (
        <>
            <FlatMap
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
                        countries: [
                            'Austria',
                            'Belgium',
                            'Bulgaria',
                            'Croatia',
                            'Republic of Cyprus',
                        ],
                        humans: '6,805,424',
                        users: '15,154,506',
                        transactions: '151,217,997',
                        orbs: '800',
                    },
                    {
                        id: 'africa',
                        countries: [
                            'Austria',
                            'Belgium',
                            'Bulgaria',
                            'Croatia',
                            'Republic of Cyprus',
                        ],
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
                        id: 'australia',
                        countries: ['Austria', 'Belgium', 'Bulgaria'],
                        humans: '6,805,424',
                        users: '15,154,506',
                        transactions: '151,217,997',
                        orbs: '440',
                    },
                ]}
            />
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
