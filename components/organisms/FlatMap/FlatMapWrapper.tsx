import dynamic from 'next/dynamic';

const FlatMap = dynamic(() => import('./FlatMap'), {
    ssr: false,
});

export default FlatMap;
