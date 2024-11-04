import styles from './ThreeDMap.module.scss';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
const Globe = dynamic(import('react-globe.gl'), { ssr: false });
import * as d3 from 'd3';

export interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeEl = useRef(null);
    const [popData, setPopData] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // load data
            fetch('/world_population.csv')
                .then(res => res.text())
                .then(csv =>
                    d3.csvParse(csv, ({ lat, lng, pop }) => ({ lat: +lat, lng: +lng, pop: +pop }))
                )
                .then(setPopData);
        }
    }, []);

    useEffect(() => {
        // Auto-rotate
        if (typeof window !== 'undefined') {
            // globeEl.current.controls().autoRotate = true;
            // globeEl.current.controls().autoRotateSpeed = 0.1;
        }
    }, []);

    const weightColor = d3.scaleSequentialSqrt(d3.interpolateYlOrRd).domain([0, 1e7]);

    return (
        <section className="">
            {typeof window !== 'undefined' && (
                <Globe
                    ref={globeEl}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    hexBinPointsData={popData}
                    hexBinPointWeight="pop"
                    hexAltitude={d => d.sumWeight * 6e-8}
                    hexBinResolution={4}
                    hexTopColor={d => weightColor(d.sumWeight)}
                    hexSideColor={d => weightColor(d.sumWeight)}
                    hexBinMerge={true}
                    enablePointerInteraction={false}
                />
            )}
        </section>
    );
};

export default ThreeDMap;
