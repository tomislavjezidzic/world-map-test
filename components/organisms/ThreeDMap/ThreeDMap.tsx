import styles from './ThreeDMap.module.scss';
import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import gsap from 'gsap';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP, ScrollToPlugin);
}

interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeRef = useRef<GlobeMethods | null>(null);
    const globeWrapper = useRef(null);
    const globeInner = useRef(null);
    const [countries, setCountries] = useState({ features: [] });
    const [globeSpeed, setGlobeSpeed] = useState(0);
    const [hovered, setHovered] = useState();
    const [isLoaded, setIsLoaded] = useState(false);
    const [activePolygon, setActivePolygon] = useState(null);
    const [populationData, setPopulationData] = useState([]);
    const [currentCords, setCurrentCords] = useState(null);

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
                d3.csvParse(csv, ({ lat, lng, pop }) => {
                    // @ts-ignore
                    if (pop > 10000) {
                        return {
                            lat: +lat,
                            lng: +lng,
                        };
                    }
                })
            )
            .then(setPopulationData);
    }, []);

    useGSAP(() => {
        if (globeRef.current) {
            const points = globeRef.current?.scene()?.children[3]?.children[1].children;

            if (!points || points?.length === 0) return;

            points.forEach(
                (point: { scale: { set: (arg0: number, arg1: number, arg2: number) => void } }) => {
                    point.scale.set(0, 0, 0.1);
                }
            );

            ScrollTrigger.create({
                trigger: globeInner.current,
                start: 'top 50%',
                end: 'bottom 50%',
                scrub: 0.5,
                invalidateOnRefresh: true,
                onEnter: () => {
                    points.forEach((point: { scale: gsap.TweenTarget }, index: number) => {
                        gsap.to(point.scale, {
                            x: 0.2,
                            y: 0.2,
                            delay: index * 0.0007,
                        });
                    });
                },
            });
        }
    }, [isLoaded]);

    useGSAP(() => {
        gsap.timeline({
            scrollTrigger: {
                trigger: globeInner.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.5,
                invalidateOnRefresh: true,
            },
        })
            .fromTo(
                globeInner.current,
                {
                    scale: 0.7,
                },
                {
                    scale: 1,
                }
            )
            .to(globeInner.current, {
                delay: 0.3,
                scale: 0.8,
            });
    });

    const handleRef = useCallback(() => {
        if (globeRef.current) {
            setGlobeSpeed(0.4);
            // @ts-ignore
            globeRef.current.controls().autoRotate = true;
            // @ts-ignore
            globeRef.current.controls().enableZoom = false;

            setTimeout(() => {
                setIsLoaded(true);
            }, 100);
        }
    }, [globeRef]);

    useEffect(() => {
        if (globeRef.current) {
            // @ts-ignore
            globeRef.current.controls().autoRotateSpeed = globeSpeed;
        }
    }, [globeRef.current, globeSpeed]);

    const handlePolygonClickClick = useCallback(
        (polygon, data) => {
            if (globeRef?.current) {
                if (activePolygon !== polygon) {
                    // @ts-ignore
                    globeRef.current.controls().autoRotate = false;
                    setGlobeSpeed(0);
                    // @ts-ignore
                    globeRef?.current.pointOfView(
                        { lat: data.lat, lng: data.lng, altitude: 0.5 },
                        900
                    );
                    setCurrentCords({ lat: data.lat, lng: data.lng });
                    setActivePolygon(polygon);
                } else {
                    handleClickOut();
                }
            }
        },
        [setCurrentCords, globeRef, activePolygon]
    );

    useGSAP(() => {
        if (activePolygon !== null && globeWrapper.current) {
            gsap.to(window, {
                scrollTo: globeWrapper.current,
            });
        }
    }, [activePolygon]);

    const handleClickOut = useCallback(() => {
        if (activePolygon !== null) {
            setActivePolygon(null);
            if (globeRef.current?.controls && typeof globeRef.current?.controls === 'function') {
                // @ts-ignore
                globeRef.current.controls().autoRotate = true;
                setGlobeSpeed(0.3);
                if (currentCords !== null) {
                    globeRef?.current.pointOfView(
                        { lat: 0, lng: currentCords.lng, altitude: 2.5 },
                        900
                    );

                    setCurrentCords(null);
                }
            }
        }
    }, [setCurrentCords, currentCords, globeRef, activePolygon]);

    const escFunction = useCallback(
        ev => {
            if (ev.key === 'Escape') {
                handleClickOut();
            }
        },
        [handleClickOut]
    );

    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);

        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, [escFunction]);

    return (
        <>
            <div className={styles.spacer}>
                <h1>Scroll down</h1>
            </div>
            <section className={styles.threeDMap} ref={globeWrapper}>
                <div ref={globeInner} style={{ height: '100vh' }}>
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
                            item === hovered || item === activePolygon
                                ? 'rgba(200, 200, 255, 0.5)'
                                : 'transparent'
                        }
                        polygonCapCurvatureResolution={0.5}
                        polygonAltitude={0.005}
                        polygonSideColor={() => 'transparent'}
                        polygonStrokeColor={() => 'rgb(100, 100, 100)'}
                        polygonsTransitionDuration={0}
                        onPolygonHover={(item: any) => setHovered(item)}
                        onPolygonClick={(polygon, ev, data) =>
                            handlePolygonClickClick(polygon, data)
                        }
                        pointsData={populationData}
                        pointLat={(d: any) => d?.lat}
                        pointLng={(d: any) => d?.lng}
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
