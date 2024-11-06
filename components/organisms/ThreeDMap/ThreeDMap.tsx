import styles from './ThreeDMap.module.scss';
import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import gsap from 'gsap';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ThreeDMapProps {}

const ThreeDMap = ({}: ThreeDMapProps) => {
    const globeRef = useRef<GlobeMethods | null>(null);
    const globeWrapper = useRef(null);
    const globeInner = useRef(null);
    const [countries, setCountries] = useState({ features: [] });
    const [globeSpeed, setGlobeSpeed] = useState(0);
    const [hovered, setHovered] = useState();
    const [animatingAlpha, setAnimatingAlpha] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
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
                d3.csvParse(csv, ({ lat, lng, pop }) => {
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

            points.forEach(point => {
                point.scale.set(0, 0, 0.1);
            });

            ScrollTrigger.create({
                trigger: globeInner.current,
                start: 'top 50%',
                end: 'bottom 50%',
                scrub: 0.5,
                invalidateOnRefresh: true,
                onEnter: () => {
                    points.forEach((point, index) => {
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
