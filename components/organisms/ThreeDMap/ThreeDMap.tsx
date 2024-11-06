import styles from './ThreeDMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import gsap from 'gsap';
import Globe from 'react-globe.gl';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeRef = useRef();
    const globeWrapper = useRef(null);
    const globeInner = useRef(null);
    const [countries, setCountries] = useState({ features: [] });
    const [globeSpeed, setGlobeSpeed] = useState(0);
    const [hovered, setHovered] = useState();
    const [animatingAlpha, setAnimatingAlpha] = useState(false);
    const [populationData, setPopulationData] = useState([]);

    useEffect(() => {
        // load data
        fetch('/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries);
    }, []);

    useEffect(() => {
        fetch('/world_population.csv')
            .then(res => res.text())
            .then(csv =>
                d3.csvParse(csv, ({ lat, lng }) => {
                    return {
                        lat: +lat,
                        lng: +lng,
                    };
                })
            )
            .then(setPopulationData);
    }, []);

    const handleOnLoad = useCallback(
        (material: {
            color: { set: (arg0: number, arg1: number, arg2: number) => void };
            opacity: number;
        }) => {
            const color = {
                alpha: 0,
            };

            material.color.set(0.3, 0.3, 0.3);

            setAnimatingAlpha(true);

            material.opacity = 0;

            ScrollTrigger.create({
                trigger: globeWrapper.current,
                start: 'top 30%',
                onEnter: () => {
                    gsap.to(color, {
                        alpha: 1,
                        duration: 1,
                        onUpdate: () => {
                            material.opacity = color.alpha;
                        },
                    });
                },
            });
        },
        [globeWrapper.current]
    );

    const handleRef = useCallback(() => {
        if (globeRef.current) {
            setGlobeSpeed(0.4);
            // @ts-ignore
            globeRef.current.controls().autoRotate = true;
            // @ts-ignore
            globeRef.current.controls().enableZoom = false;
        }
    }, [globeRef]);

    useEffect(() => {
        if (globeRef.current) {
            // @ts-ignore
            globeRef.current.controls().autoRotateSpeed = globeSpeed;
        }
    }, [globeRef.current, globeSpeed]);

    useEffect(() => {
        if (globeRef.current) {
            let material =
                // @ts-ignore
                globeRef.current.scene()?.children[3]?.children[1]?.children[0]?.material;
            setTimeout(() => {
                material =
                    // @ts-ignore
                    globeRef.current.scene()?.children[3]?.children[1]?.children[0]?.material;
                if (material && !animatingAlpha) {
                    material.opacity = 0;

                    handleOnLoad(material);
                }
            }, 1000);
        }
    }, [globeRef.current, animatingAlpha]);

    return (
        <>
            <div className={styles.spacer}>
                <h1>Scroll down</h1>
            </div>
            <section className={styles.threeDMap} ref={globeWrapper}>
                <div ref={globeInner}>
                    <Globe
                        ref={globeRef}
                        globeMaterial={
                            new THREE.MeshStandardMaterial({
                                color: 0xffffff,
                                metalness: 0,
                                roughness: 0.5,
                                transparent: false,
                                opacity: 1,
                            })
                        }
                        rendererConfig={{
                            antialias: false,
                        }}
                        onGlobeReady={handleRef}
                        animateIn={false}
                        backgroundColor={'rgba(0, 0, 0, 0)'}
                        atmosphereColor={'white'}
                        showAtmosphere={true}
                        polygonsData={countries.features.filter(d => d.properties.ISO_A2 !== 'AQ')}
                        polygonCapColor={item =>
                            item === hovered ? 'rgba(200, 200, 255, 0.5)' : 'transparent'
                        }
                        polygonCapCurvatureResolution={0.5}
                        polygonAltitude={0.005}
                        polygonSideColor={() => 'transparent'}
                        polygonStrokeColor={() => 'rgb(100, 100, 100)'}
                        polygonsTransitionDuration={0}
                        onPolygonHover={(item: any) => setHovered(item)}
                        pointsData={populationData}
                        pointLat={(d: any) => d?.lat}
                        pointLng={(d: any) => d?.lng}
                        pointsMerge={true}
                        pointResolution={6}
                        pointAltitude={0.001}
                        pointRadius={0.12}
                        pointsTransitionDuration={0}
                        pointColor={() => 'rgb(80, 80, 80)'}
                    />
                </div>
            </section>
            <div className={styles.spacer}></div>
        </>
    );
};

export default ThreeDMap;
