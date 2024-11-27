import styles from './ThreeJS.module.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import locationsData from '@public/share_my_GPS_timeline_since_may_2024-reduced.json';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import threeGeoJSON from './threeGeoJSON';

import gsap from 'gsap';
import continentData from './data/continents.json';
import graticules from './data/graticules.json';

import * as d3 from 'd3';
import { useGSAP } from '@gsap/react';
import ThreeJSMapDataTooltip from '@molecules/ThreeJSMapDataTooltip';
import cn from 'classnames';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ThreeJSProps {
    isFlat?: boolean;
    continentsData: {
        id: string;
        countries: string[];
        humans: string;
        users: string;
        transactions: string;
        orbs: string;
    }[];
}

const ThreeJS = ({ continentsData, isFlat = false }: ThreeJSProps) => {
    const $globeRef = useRef<HTMLDivElement>(null);
    const $w = useRef(null);
    const $h = useRef(null);
    const $point = useRef(null);
    const $scene = useRef(null);
    const $pointGroups = useRef([]);
    const $controls = useRef(null);
    const $continent = useRef(null);
    const $graticule = useRef(null);
    const $camera = useRef(null);
    const $renderer = useRef(null);
    const $lineObjs = useRef([null]);
    const $labelRenderer = useRef(null);
    const $mesh = useRef(null);
    const $raycaster = useRef(new THREE.Raycaster());
    const $labels = useRef([]);
    const [activePoint, setActivePoint] = useState(null);
    const [labelsLoaded, setLabelsLoaded] = useState(false);
    const $threeGeoJSON = useRef(null);

    // useEffect(() => {
    //     setTimeout(() => {
    //         const filteredData = [];
    //
    //         for (let i = 0; i < locationsData.length; i++) {
    //             const point = locationsData[i];
    //             let keepPoint = true;
    //
    //             for (let j = 0; j < locationsData.length; j++) {
    //                 if (i !== j) {
    //                     const otherPoint = locationsData[j];
    //                     const latDiff = Math.abs(point.lat - otherPoint.lat);
    //                     const lngDiff = Math.abs(point.lng - otherPoint.lng);
    //
    //                     if (latDiff < 0.05 && lngDiff < 0.05) {
    //                         keepPoint = false;
    //                         break;
    //                     }
    //                 }
    //             }
    //
    //             if (keepPoint) {
    //                 filteredData.push(point);
    //             }
    //         }
    //         console.log(filteredData);
    //     }, 1000);
    // }, []);

    useGSAP(() => {
        if ($globeRef.current) {
            ScrollTrigger.create({
                trigger: $globeRef.current,
                start: 'top 30%',
                end: 'bottom center',
                once: true,
                onEnter: () => {
                    const tl = gsap.timeline().add('start');
                    if (!isFlat) {
                        tl.from(
                            $scene.current.rotation,
                            {
                                y: -Math.PI / 2,
                                duration: 3,
                                ease: 'power4.out',
                            },
                            'start'
                        )
                            .from(
                                $scene.current.scale,
                                {
                                    x: 0.5,
                                    y: 0.5,
                                    z: 0.5,
                                    duration: 1,
                                    ease: 'power4.out',
                                },
                                'start'
                            )
                            .to(
                                $mesh?.current?.material,
                                {
                                    opacity: 1,
                                    ease: 'none',
                                },
                                'start'
                            );
                    }

                    tl.to(
                        $continent?.current?.material,
                        {
                            opacity: 1,
                            ease: 'none',
                        },
                        'start'
                    ).to(
                        $graticule?.current?.material,
                        {
                            opacity: 1,
                            ease: 'none',
                        },
                        'start-=0.1'
                    );

                    $pointGroups.current.forEach((group, index) => {
                        gsap.to(group.material, {
                            opacity: 1,
                            ease: 'none',
                            duration: 1,
                            delay: 1 + 0.7 * index,
                        });
                    });

                    setTimeout(() => {
                        setLabelsLoaded(true);
                    }, 1000);
                },
            });
        }
    }, []);

    const animate = useCallback(() => {
        requestAnimationFrame(animate);
        !isFlat && $controls.current.update();
        render();
    }, [$camera?.current, $scene.current, $controls.current]);

    const getCoordinates = useCallback((lat: number, lng: number) => {
        if (isFlat) {
            const x = (lng + 180.0) * ($w.current / 2 / 360.0);
            const y = (lat + 90.0) * ($h.current / 2 / 180.0);

            return { x: x, y: y, z: 0 };
        } else {
            const phi = ((90 - lat) * Math.PI) / 180;
            const theta = ((180 - lng) * Math.PI) / 180 - Math.PI / 2;

            return {
                x: 200 * Math.sin(phi) * Math.cos(theta),
                y: 200 * Math.cos(phi),
                z: 200 * Math.sin(phi) * Math.sin(theta),
            };
        }
    }, []);

    const addPoint = useCallback(
        (lat: number, lng: number, subGeo: any) => {
            if (!$point?.current) return;

            const { x, y, z } = getCoordinates(lat, lng);

            $point.current.position.x = x;
            $point.current.position.y = y;
            $point.current.position.z = z;

            !isFlat && $point.current.lookAt($mesh.current.position);

            $point.current.updateMatrix();

            subGeo.merge($point.current.geometry, $point.current.matrix);
        },
        [$point.current]
    );

    const addData = useCallback(data => {
        const addDataLoop = (index: number) => {
            if (index >= data.length) {
                return;
            }
            const subGeo = new THREE.Geometry();
            for (let i = 0; i < data[index].length; i++) {
                const lat = data[index][i].lat;
                const lng = data[index][i].lng;
                addPoint(lat, lng, subGeo);
            }

            index++;
            addDataLoop(index);
            createPoints(subGeo);
        };

        addDataLoop(0);
    }, []);

    const createPoints = useCallback(subGeo => {
        if (!$scene?.current) return;
        const points = new THREE.Mesh(
            subGeo,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x3fdbba),
                side: isFlat ? THREE.FrontSide : THREE.BackSide,
                transparent: true,
                opacity: 0,
                depthTest: !isFlat,
            })
        );

        $pointGroups.current.push(points);
        $scene.current.add(points);
    }, []);

    const render = useCallback(() => {
        if (!$camera?.current) return;
        if (isFlat) {
            $camera.current.lookAt(0, 0, 0);
        } else {
            $camera.current.lookAt($mesh.current.position);

            $labels.current.forEach(label => {
                label.getWorldPosition($raycaster.current.ray.origin);

                const rd = $camera.current.position
                    .clone()
                    .sub($raycaster.current.ray.origin)
                    .normalize();
                $raycaster.current.ray.direction.set(rd.x, rd.y, rd.z);

                const hits = $raycaster.current.intersectObjects([$mesh.current]);

                if (hits.length > 0 && !label.element.classList.contains('is-hidden')) {
                    label.element.classList.add('is-hidden');
                } else if (hits.length == 0 && label.element.classList.contains('is-hidden')) {
                    label.element.classList.remove('is-hidden');
                }
            });
        }

        $renderer.current.render($scene.current, $camera.current);
        $labelRenderer.current.render($scene.current, $camera.current);
    }, [$camera.current, $scene.current]);

    const onWindowResize = useCallback(() => {
        $camera.current.aspect = $globeRef.current.offsetWidth / $globeRef.current.offsetHeight;
        $camera.current.updateProjectionMatrix();
        $renderer.current.setSize($globeRef.current.offsetWidth, $globeRef.current.offsetHeight);
        $labelRenderer.current.setSize(
            $globeRef.current.offsetWidth,
            $globeRef.current.offsetHeight
        );
    }, []);

    const createContinents = useCallback(() => {
        $threeGeoJSON.current.drawThreeGeo(
            continentData,
            isFlat ? null : 200,
            isFlat ? 'plane' : 'sphere',
            {
                color: 0x3fdbed,
                width: $w.current,
                height: $h.current,
                name: 'continent',
            }
        );

        $threeGeoJSON.current.drawThreeGeo(
            graticules,
            isFlat ? null : 200,
            isFlat ? 'plane' : 'sphere',
            {
                color: 0x575654,
                width: $w.current,
                height: $h.current,
                name: 'graticule',
            }
        );

        $continent.current = $scene.current.getObjectByName('continent');
        $graticule.current = $scene.current.getObjectByName('graticule');
        $continent.current.material.transparent = $graticule.current.material.transparent = true;
        $continent.current.material.opacity = $graticule.current.material.opacity = 0;

        continentData.features.forEach((feature: any) => {
            if (feature.pointCoordinates) {
                const { x, y, z } = getCoordinates(
                    isFlat ? feature.pointCoordinates[1] - 90 : feature.pointCoordinates[1],
                    isFlat ? feature.pointCoordinates[0] - 180 : feature.pointCoordinates[0]
                );

                let labelDiv = document.getElementById(feature.id + '-marker');
                let label = new CSS2DObject(labelDiv);

                label.position.set(x, y, z);

                $labels.current.push(label);

                $scene.current.add(label);
            }
        });

        $lineObjs.current.forEach(obj => {
            if (obj) $scene.current.add(obj);
        });
    }, []);

    const handleClick = useCallback(
        (coordinates: number[], index: number | null) => {
            const lat = coordinates[0] * (Math.PI / 180);
            let lng = 0;
            let delay = 0;

            if (
                (activePoint === index && index != null) ||
                (index === null && activePoint != null)
            ) {
                setActivePoint(null);
                !isFlat && ($controls.current.autoRotate = true);
            } else if (index != null) {
                lng = coordinates[1] * (Math.PI / 180);
                setActivePoint(index);
                !isFlat && ($controls.current.autoRotate = false);
                activePoint ? (delay = 0.5) : (delay = 0);
            } else {
                return;
            }

            if (isFlat) return;

            const alpha = $controls.current.getAzimuthalAngle();
            const beta = $controls.current.getPolarAngle() - Math.PI / 2;

            gsap.fromTo(
                $controls.current,
                {
                    minAzimuthAngle: alpha,
                    maxAzimuthAngle: alpha,
                    minPolarAngle: Math.PI / 2 + beta,
                    maxPolarAngle: Math.PI / 2 + beta,
                },
                {
                    minAzimuthAngle: lat,
                    maxAzimuthAngle: lat,
                    minPolarAngle: Math.PI / 2 - lng,
                    maxPolarAngle: Math.PI / 2 - lng,
                    duration: 1,
                    delay: delay,
                    onComplete: () => {
                        $controls.current.minAzimuthAngle = -Infinity;
                        $controls.current.maxAzimuthAngle = Infinity;
                        $controls.current.minPolarAngle = 0;
                        $controls.current.maxPolarAngle = Math.PI;
                    },
                }
            );
        },
        [activePoint]
    );

    const debounce = (func: any, wait: number) => {
        let timeout: string | number | NodeJS.Timeout;
        return (...args: any) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
            }, wait);
        };
    };

    const handleGlobeRotationEnd = useCallback(() => {
        const beta = $controls.current.getPolarAngle() - Math.PI / 2;

        gsap.fromTo(
            $controls.current,
            {
                minPolarAngle: Math.PI / 2 + beta,
                maxPolarAngle: Math.PI / 2 + beta,
            },
            {
                minPolarAngle: Math.PI / 2,
                maxPolarAngle: Math.PI / 2,
                duration: 1,
                ease: 'power3.out',
                onComplete: () => {
                    $controls.current.minPolarAngle = 0;
                    $controls.current.maxPolarAngle = Math.PI;
                },
            }
        );
    }, []);

    const debouncedHandleGlobeRotationEnd = debounce(handleGlobeRotationEnd, 3000);

    useEffect(() => {
        if ($controls.current) {
            $controls.current.addEventListener('end', debouncedHandleGlobeRotationEnd, false);
        }
        return () => {
            $controls.current.removeEventListener('end', debouncedHandleGlobeRotationEnd, false);
        };
    }, [$controls.current]);

    const Globe = useCallback(() => {
        $w.current = $globeRef.current.offsetWidth;
        $h.current = $globeRef.current.offsetHeight;

        if (isFlat) {
            $camera.current = new THREE.OrthographicCamera(
                $w.current / -4,
                $w.current / 4,
                $h.current / 4,
                $h.current / -4,
                1,
                1200
            );
        } else {
            $camera.current = new THREE.PerspectiveCamera(30, $w.current / $h.current, 1, 1200);
        }

        $camera.current.position.z = 1100;

        $scene.current = new THREE.Scene();

        if (!isFlat) {
            const geometry = new THREE.SphereGeometry(199, 40, 30);

            const material = new THREE.MeshBasicMaterial({
                color: 0x2d2c2c,
                transparent: true,
                opacity: 0,
            });

            $mesh.current = new THREE.Mesh(geometry, material);
            $mesh.current.rotation.y = Math.PI;
            $scene.current.add($mesh.current);
        }

        const pointGeometry = new THREE.PlaneGeometry(1, 1);
        $point.current = new THREE.Mesh(pointGeometry);

        $renderer.current = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });

        $renderer.current.setPixelRatio(1.5);

        $renderer.current.setSize($w.current, $h.current);

        $globeRef.current.appendChild($renderer.current.domElement);

        $threeGeoJSON.current = new threeGeoJSON($scene.current);

        $labelRenderer.current = new CSS2DRenderer();
        $labelRenderer.current.setSize($w.current, $h.current);
        $labelRenderer.current.domElement.style.position = 'absolute';
        $labelRenderer.current.domElement.style.top = '0px';
        $labelRenderer.current.domElement.style.left = '0px';
        $labelRenderer.current.domElement.style.width = '100%';
        $labelRenderer.current.domElement.style.height = '100%';
        $globeRef.current.appendChild($labelRenderer.current.domElement);

        if (!isFlat) {
            $controls.current = new OrbitControls(
                $camera.current,
                $labelRenderer.current.domElement
            );
            $controls.current.update();
            $controls.current.enableDamping = true;
            $controls.current.autoRotate = !isFlat;
            $controls.current.autoRotateSpeed = 0.3;
            $controls.current.enableZoom = false;
            $controls.current.enablePan = false;
            $controls.current.dampingFactor = 0.05;
            $controls.current.screenSpacePanning = false;
        }

        createContinents();

        window.addEventListener('resize', onWindowResize, false);

        return () => {
            window.removeEventListener('resize', onWindowResize, false);
        };
    }, []);

    useEffect(() => {
        if (
            !locationsData ||
            !locationsData.length ||
            !$globeRef?.current ||
            typeof window === 'undefined'
        )
            return;

        Globe();

        const batchSize = 2000;

        const splitData = [];
        for (let i = 0; i < locationsData.length; i += batchSize) {
            splitData.push(locationsData.slice(i, i + batchSize));
        }

        addData(splitData);
        animate();
    }, []);

    return (
        <div className={styles.main}>
            <div
                className={styles.canvas}
                ref={$globeRef}
                onClick={() => handleClick([0, 0], null)}
            ></div>

            <div className={styles.markers}>
                {continentData.features.map((feature, i) => {
                    if (feature.pointCoordinates) {
                        return (
                            <div
                                className={cn(styles.marker, {
                                    [styles.isActive]: activePoint === i,
                                    [styles.isLoaded]: labelsLoaded,
                                })}
                                key={i}
                                id={`${feature.id}-marker`}
                                onClick={() => handleClick(feature.pointCoordinates, i)}
                            >
                                <ThreeJSMapDataTooltip
                                    canvasDimensions={{
                                        width: $w.current,
                                        height: $h.current,
                                    }}
                                    isFlat={isFlat}
                                    isLoaded={labelsLoaded}
                                    name={feature.properties.name}
                                    isActive={activePoint === i}
                                    data={continentsData.find(data => data.id === feature.id)}
                                />
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default ThreeJS;
