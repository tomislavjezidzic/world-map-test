import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), {
    ssr: false,
});

export default Globe;
