import styles from './ThreeDMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import gsap from 'gsap';
import GEO_DATA from './data/countries_hex_data.json';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeRef = useRef();
    const [countries, setCountries] = useState([]);
    const [globeSpeed, setGlobeSpeed] = useState(0);
    const [populationData, setPopulationData] = useState([]);

    useEffect(() => setCountries(GEO_DATA.features), []);

    useEffect(() => {
        addPoints();

        console.log(populationData);
    }, []);

    const addPoints = useCallback(() => {
        function addPoint(point: any) {
            setPopulationData(prev => [...prev, point]);
        }

        fetch('/world_population.csv')
            .then(res => res.text())
            .then(csv =>
                d3.csvParse(csv, ({ lat, lng, pop }) => {
                    return {
                        lat: +lat,
                        lng: +lng,
                        color: '#00b176',
                    };
                })
            )
            .then(data => {
                data.forEach(point => {
                    // setTimeout(() => {
                    addPoint(point);
                    // }, 100);
                });
            });
    }, []);

    const handleRef = useCallback(() => {
        if (globeRef.current) {
            setGlobeSpeed(0.4);
            // @ts-ignore
            globeRef.current.controls().autoRotate = true;
            // @ts-ignore
            globeRef.current.controls().enableZoom = false;

            setTimeout(() => {
                console.log(globeRef.current);
            }, 100);

            // const fromColor = new THREE.Color('black');
            // const toColor = new THREE.Color('white');
            //
            // gsap.to(fromColor, {
            //     r: toColor.r,
            //     g: toColor.g,
            //     b: toColor.b,
            //     duration: 1,
            //     onUpdate: () => {
            //         globeRef.current.scene().children[0].material.color.setRGB(fromColor);
            //     },
            // });

            // setTimeout(() => {
            //     console.log(globeRef.current.scene()?.children[3].children[1].children[0].scale);
            //     gsap.to(globeRef.current.scene()?.children[3].children[1].children[0].scale, {
            //         x: 0,
            //         y: 0,
            //         z: 0,
            //         duration: 1,
            //     });
            // }, 1000);

            //globeRef.current.scene().children[0].material.color

            // setTimeout(() => {
            //     if (
            //         globeRef.current?.controls &&
            //         typeof globeRef.current?.controls === 'function'
            //     ) {
            //         const points = [];
            //
            //         // globeRef.current.scene()?.children[3]?.traverse(group => {
            //         //     if (group.isGroup) {
            //         //         // group.traverse(child => {
            //         //             if (group?.geometry?.type === 'CylinderGeometry') {
            //         //                 console.log(child);
            //         //             }
            //         //         // });
            //         //     }
            //         // });
            //
            //         function traverseChildren(child) {
            //             if (
            //                 child.geometry &&
            //                 child.geometry.type === 'ConicPolygonBufferGeometry'
            //             ) {
            //                 child.visible = false;
            //                 child.scale.set(0, 0, 0);
            //                 // console.log(child);
            //                 // points.push(child);
            //             }
            //             if (child.children) {
            //                 child.children.forEach(grandchild => {
            //                     traverseChildren(grandchild);
            //                 });
            //             }
            //         }
            //
            //         globeRef.current.scene()?.children[3]?.traverse(child => {
            //             traverseChildren(child);
            //         });
            //
            //         if (points != null) {
            //             points.forEach(point => {
            //                 gsap.to(point.scale, {
            //                     x: 1.5,
            //                     y: 1.5,
            //                     z: 0.1,
            //                 });
            //             });
            //         }
            //     }
            // }, 10);
        }
    }, [globeRef]);

    useEffect(() => {
        if (globeRef.current) {
            // @ts-ignore
            globeRef.current.controls().autoRotateSpeed = globeSpeed;
        }
    }, [globeRef.current, globeSpeed]);

    return (
        <section className={styles.threeDMap}>
            <Globe
                ref={globeRef}
                // ringColor={() => 'rgba(0, 0, 0, 0)'}
                backgroundColor={'rgba(0, 0, 0, 0)'}
                globeImageUrl={
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAAC0lEQVQIHWP4DwQACfsD/Qy7W+cAAAAASUVORK5CYII='
                }
                atmosphereColor={'white'}
                showAtmosphere={true}
                polygonsData={countries}
                polygonAltitude={0.005}
                polygonCapColor={() => 'transparent'}
                polygonSideColor={() => 'transparent'}
                polygonStrokeColor={() => 'rgb(45, 44, 44)'}
                pointsData={populationData}
                // @ts-ignore
                pointLat={d => d?.lat}
                // @ts-ignore
                pointLng={d => d?.lng}
                pointsMerge={true}
                pointAltitude={0}
                pointRadius={0.12}
                // @ts-ignore
                pointColor={d => d?.color}
                onGlobeReady={handleRef}
            />
        </section>
    );
};

export default ThreeDMap;
