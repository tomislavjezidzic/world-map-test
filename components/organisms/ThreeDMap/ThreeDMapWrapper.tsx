import dynamic from 'next/dynamic';

const ThreeDMap = dynamic(() => import('./ThreeDMap'), {
    ssr: false,
});

export default ThreeDMap;
