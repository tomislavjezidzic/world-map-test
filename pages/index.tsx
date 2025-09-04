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
                    countries:
                        'France, Romania, Poland, Czech Republic, Ireland, Norway, Greece, Spain, Serbia, Slovakia, Sweden, Portugal, Croatia, Moldova, Iceland, Denmark, Austria, Montenegro, Ukraine, Finland, Germany, Latvia, Netherlands, Isle of Man, Lithuania, Luxembourg, Switzerland, United Kingdom, Andorra, Estonia, Bulgaria, Belgium, Hungary, Malta, Italy, Slovenia',
                    humans: '1,367,377',
                    users: '2,671,351',
                    transactions: '20,222,964',
                    tokens: '92,474,233',
                    orbs: '75',
                },
                {
                    id: 'southAmerica',
                    countries:
                        'Chile, Brazil, Ecuador, Colombia, Uruguay, Peru, Paraguay, Argentina, French Guiana',
                    humans: '7,677,414',
                    users: '15,409,841',
                    transactions: '112,796,970',
                    tokens: '383,312,750',
                    orbs: '440',
                },
                {
                    id: 'northAmerica',
                    countries:
                        'Panama, Bahamas, United States, Canada, Jamaica, Guatemala, El Salvador, Costa Rica, Puerto Rico, Honduras, Nicaragua, Mexico, Dominican Republic, Guadeloupe, Trinidad and Tobago, Antigua and Barbuda',
                    humans: '953,226',
                    users: '1,951,946',
                    transactions: '8,483,935',
                    tokens: '34,558,536',
                    orbs: '293',
                },
                {
                    id: 'africa',
                    countries:
                        'Sudan, Uganda, Cameroon, Mauritius, Zimbabwe, Burkina Faso, Cape Verde, Morocco, Rwanda, Ivory Coast, Angola, Senegal, Ghana, Benin, Mozambique, Tunisia, Kenya, Togo, Mauritania, Nigeria, Equatorial Guinea, South Africa, Niger, Zambia, Madagascar, Botswana',
                    humans: '538,902',
                    users: '1,569,447',
                    transactions: '8,811,490',
                    tokens: '27,234,091',
                },
                {
                    id: 'asia',
                    countries:
                        'Philippines, Cyprus, Uzbekistan, Oman, Saudi Arabia, Nepal, Kazakhstan, Thailand, Kyrgyzstan, China, Qatar, Israel, Laos, Pakistan, Japan, Brunei, Azerbaijan, Taiwan, Georgia, Turkey, Kuwait, Hong Kong, Vietnam, Jordan, Mongolia, South Korea, Singapore, India, Armenia, Bahrain, Sri Lanka, Indonesia, Malaysia, United Arab Emirates, Macao',
                    humans: '4,952,596',
                    users: '11,855,967',
                    transactions: '42,336,646',
                    tokens: '181,047,907',
                    orbs: '909',
                },
                {
                    id: 'oceania',
                    countries: 'New Zealand, Australia',
                    humans: '22',
                    users: '22,333',
                    transactions: '3,182',
                    tokens: '3,505',
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
