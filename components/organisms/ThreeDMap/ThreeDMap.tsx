import styles from './ThreeDMap.module.scss';
import dynamic from 'next/dynamic';
import React, { useCallback, forwardRef, useEffect, useState, createRef } from 'react';
import * as d3 from 'd3';
import gsap from 'gsap';
import { GlobeMethods } from 'react-globe.gl';
import GEO_DATA from './data/countries_hex_data.json';

const GlobeComponent = dynamic(() => import('../../globe'), {
    ssr: false,
});

const Globe = React.memo(
    forwardRef((props: any, ref) => <GlobeComponent {...props} forwardRef={ref} />)
);

interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeRef = createRef();
    const [countries, setCountries] = useState([]);
    const [globeSpeed, setGlobeSpeed] = useState(0);
    const [populationData, setPopulationData] = useState([]);

    useEffect(() => setCountries(GEO_DATA.features), []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetch('/world_population.csv')
                .then(res => res.text())
                .then(csv => d3.csvParse(csv, ({ lat, lng, pop }) => ({ lat: +lat, lng: +lng })))
                .then(data => setPopulationData(data.flat()));
        }
    }, []);

    const handleRef = useCallback(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            setGlobeSpeed(0.2);
            globeRef.current.controls().enableZoom = false;
        }
    }, []);

    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = globeSpeed;
            globeRef.current.controls().enableZoom = false;
        }
    }, [globeRef.current, globeSpeed]);

    return (
        <section className={styles.threeDMap}>
            <Globe
                ref={globeRef}
                polygonsData={countries}
                polygonAltitude={0.005}
                polygonCapColor={() => 'transparent'}
                polygonSideColor={() => 'transparent'}
                polygonStrokeColor={() => 'red'}
                pointsData={populationData}
                pointLat={d => d.lat}
                pointLng={d => d.lng}
                pointAltitude={0}
                pointRadius={0.1}
                pointColor={() => 'white'}
                onGlobeReady={handleRef}
            />
        </section>
    );
};

export default ThreeDMap;
