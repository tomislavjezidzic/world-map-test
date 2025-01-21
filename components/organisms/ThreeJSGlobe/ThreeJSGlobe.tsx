/**
 * ThreeJSGlobe component.
 *
 * This component renders a 3D globe with markers and tooltips.
 *
 * @param {ThreeJSGlobeProps} props - Component props.
 * @returns {JSX.Element} - The rendered component.
 */

import cn from 'classnames';
import styles from './ThreeJSGlobe.module.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// THREE.js imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

// Utils
import ThreeGeoJSON from './ThreeGeoJSON';

// Components
import ThreeJSMapDataTooltip from '@molecules/ThreeJSMapDataTooltip';
import GlobeDataTestSection from '@organisms/GlobeDataTestSection'; // should be replaced

// Register GSAP plugins
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Data
import locationsData from '@public/location-data-reduced.json';
import continentData from './data/continents.json';
import graticules from './data/graticules.json';

/**
 * ThreeJSGlobe props interface.
 *
 * @interface ThreeJSGlobeProps
 */
interface ThreeJSGlobeProps {
    /**
     * @type {{
     * id: string;
     * countries: string[];
     * humans: string;
     * users: string;
     * transactions: string;
     * orbs: string
     * }[]}
     */
    continentsData: {
        id: string;
        countries: string[];
        humans: string;
        users: string;
        transactions: string;
        orbs: string;
    }[];
}

const ThreeJSGlobe = ({ continentsData }: ThreeJSGlobeProps) => {
    const $globeRef = useRef<HTMLDivElement>(null);
    const $width = useRef<number>(null);
    const $height = useRef<number>(null);
    const $pi = useRef(Math.PI);
    const $point = useRef<THREE.Mesh>(null);
    const $activePoint = useRef<number | null>(null);
    const $threeGeoJSON = useRef(null);
    const $scene = useRef<THREE.Scene>(null);
    const $pointGroups = useRef<THREE.Mesh[]>([]);
    const $controls = useRef<OrbitControls>(null);
    const $continents = useRef<THREE.Mesh>(null);
    const $graticules = useRef<THREE.Mesh>(null);
    const $camera = useRef<THREE.PerspectiveCamera>(null);
    const $renderer = useRef<THREE.WebGLRenderer>(null);
    const $labelRenderer = useRef<CSS2DRenderer>(null);
    const $sphere = useRef<THREE.Mesh>(null);
    const $raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const $labels = useRef<CSS2DObject[]>([]);
    const [activePoint, setActivePoint] = useState<number | null>(null);
    const [labelsLoaded, setLabelsLoaded] = useState(false);
    const [markerClicked, setMarkerClicked] = useState(false);
    const [touchStart, setTouchStart] = useState<Date | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // useEffect(() => {
    //     const filteredData = [];
    //
    //     for (let i = 0; i < locationsData.length; i++) {
    //         const point = locationsData[i];
    //         let keepPoint = true;
    //
    //         for (let j = 0; j < locationsData.length; j++) {
    //             if (i !== j) {
    //                 const otherPoint = locationsData[j];
    //                 const latDiff = Math.abs(point.lat - otherPoint.lat);
    //                 const lngDiff = Math.abs(point.lng - otherPoint.lng);
    //
    //                 if (latDiff < 0.05 && lngDiff < 0.05) {
    //                     keepPoint = false;
    //                     break;
    //                 }
    //             }
    //         }
    //
    //         if (keepPoint) {
    //             filteredData.push(point);
    //         }
    //     }
    //     console.log(filteredData);
    // }, []);

    useGSAP(() => {
        if ($globeRef.current) {
            const fromColor = new THREE.Color(0x3fdbed);
            const toColor = new THREE.Color(0xd1cec7);
            ScrollTrigger.create({
                trigger: $globeRef.current,
                start: `top ${isMobile ? '60%' : '60%'}`,
                end: 'bottom center',
                once: true,
                onEnter: () => {
                    const tl = gsap.timeline().add('start');

                    tl.from(
                        $scene.current.rotation,
                        {
                            y: -$pi.current / 2,
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
                            $sphere?.current?.material,
                            {
                                opacity: 1,
                                ease: 'none',
                            },
                            'start'
                        )
                        .to(
                            $continents?.current?.material,
                            {
                                opacity: 1,
                                ease: 'none',
                            },
                            'start'
                        )
                        .to(
                            $graticules?.current?.material,
                            {
                                opacity: 1,
                                ease: 'none',
                            },
                            'start-=0.1'
                        );

                    $pointGroups.current.reverse().forEach((group, index) => {
                        gsap.to(group.material, {
                            opacity: 1,
                            ease: 'none',
                            duration: 1,
                            delay: 1 + 0.7 * index,
                        });

                        gsap.to(fromColor, {
                            r: toColor.r,
                            g: toColor.g,
                            b: toColor.b,
                            ease: 'none',
                            duration: 1,
                            delay: 2 + 0.7 * index,
                            onUpdate: () => {
                                // @ts-ignore
                                group.material.color = new THREE.Color(
                                    fromColor.r,
                                    fromColor.g,
                                    fromColor.b
                                );
                            },
                        });
                    });

                    setTimeout(() => {
                        setLabelsLoaded(true);
                    }, 1000);
                },
            });
        }
    }, [isMobile]);

    const animate = useCallback(() => {
        requestAnimationFrame(animate);
        $controls.current.update();
        render();
    }, [$camera?.current, $scene.current, $controls.current]);

    const getCoordinates = useCallback((lat: number, lng: number) => {
        const phi = ((90 - lat) * $pi.current) / 180;
        const theta = ((180 - lng) * $pi.current) / 180 - $pi.current / 2;

        return {
            x: 200 * Math.sin(phi) * Math.cos(theta),
            y: 200 * Math.cos(phi),
            z: 200 * Math.sin(phi) * Math.sin(theta),
        };
    }, []);

    const addPoint = useCallback(
        (latitude: number, longitude: number, geometry: THREE.Geometry) => {
            if (!$point.current) return;

            const { x, y, z } = getCoordinates(latitude, longitude);

            $point.current.position.set(x, y, z);
            $point.current.lookAt($sphere.current.position);
            $point.current.updateMatrix();

            // @ts-ignore
            geometry.merge($point.current.geometry, $point.current.matrix);
        },
        [$point.current, getCoordinates, $sphere.current]
    );

    const addData = useCallback((locationData: any[]) => {
        const processLocationData = (index: number) => {
            if (index >= locationData.length) return;

            const geometry = new THREE.Geometry();
            for (const location of locationData[index]) {
                const { lat, lng } = location;
                addPoint(lat, lng, geometry);
            }

            processLocationData(index + 1);
            createMesh(geometry);
        };

        processLocationData(0);
    }, []);

    const createMesh = useCallback((geometry: THREE.Geometry) => {
        if (!$scene.current) return;

        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x3fdbed),
                side: THREE.BackSide,
                transparent: true,
                opacity: 0,
                depthTest: false,
                depthWrite: false,
            })
        );

        $pointGroups.current.push(mesh);
        $scene.current.add(mesh);
    }, []);

    const render = useCallback(() => {
        if (!$camera.current) return;

        $camera.current.lookAt($sphere.current.position);

        $labels.current.forEach(label => {
            const labelPosition = label.getWorldPosition(new THREE.Vector3());
            const cameraPosition = $camera.current.position;
            const direction = cameraPosition.clone().sub(labelPosition).normalize();

            $raycaster.current.set(labelPosition, direction);
            const intersections = $raycaster.current.intersectObject($sphere.current);

            if (intersections.length > 0) {
                label.element.classList.add('is-hidden');
            } else {
                label.element.classList.remove('is-hidden');
            }
        });

        $renderer.current.render($scene.current, $camera.current);
        $labelRenderer.current.render($scene.current, $camera.current);
    }, [$camera.current, $scene.current]);

    const handleWindowResize = useCallback(() => {
        const globeWidth = $globeRef.current.offsetWidth;
        const globeHeight = $globeRef.current.offsetHeight;

        $camera.current.aspect = globeWidth / globeHeight;
        $camera.current.updateProjectionMatrix();

        $renderer.current.setSize(globeWidth, globeHeight);
        $labelRenderer.current.setSize(globeWidth, globeHeight);
    }, [$camera, $globeRef, $labelRenderer, $renderer]);

    const createContinents = useCallback(() => {
        $threeGeoJSON.current.drawThreeGeo(continentData, 200, 'sphere', {
            color: 0x3fdbed,
            width: $width.current,
            height: $height.current,
            name: 'continent',
        });

        $threeGeoJSON.current.drawThreeGeo(graticules, 200, 'sphere', {
            color: 0x575654,
            width: $width.current,
            height: $height.current,
            name: 'graticule',
        });

        $graticules.current = $scene.current.getObjectByName('graticule') as THREE.Mesh;
        // @ts-ignore
        $graticules.current.material.transparent = true;
        // @ts-ignore
        $graticules.current.material.opacity = 0;

        $continents.current = $scene.current.getObjectByName('continent') as THREE.Mesh;
        // @ts-ignore
        $continents.current.material.transparent = true;
        // @ts-ignore
        $continents.current.material.opacity = 0;

        continentData.features.forEach((feature: any) => {
            if (feature.pointCoordinates) {
                const { x, y, z } = getCoordinates(
                    feature.pointCoordinates[1],
                    feature.pointCoordinates[0]
                );

                let labelDiv = document.getElementById(`${feature.id}-marker`);
                let label = new CSS2DObject(labelDiv);

                label.position.set(x, y, z);

                $labels.current.push(label);
                $scene.current.add(label);
            }
        });
    }, []);

    const handleClick = useCallback(
        (coordinates: number[], index: number | null) => {
            const lat = coordinates[0] * ($pi.current / 180);
            let lng = 0;
            let delay = 0;

            if (
                (activePoint === index && index != null) ||
                (index === null && activePoint != null)
            ) {
                setActivePoint(null);
                $activePoint.current = null;
                $controls.current.autoRotate = true;
            } else if (index != null) {
                lng = coordinates[1] * ($pi.current / 180);
                setActivePoint(index);
                $activePoint.current = index;
                $controls.current.autoRotate = false;
                activePoint ? (delay = 0.5) : (delay = 0);
            } else {
                return;
            }

            const alpha = $controls.current.getAzimuthalAngle();
            const beta = $controls.current.getPolarAngle() - $pi.current / 2;

            let x = $pi.current / 2 - lng;

            gsap.fromTo(
                $controls.current,
                {
                    minAzimuthAngle: alpha,
                    maxAzimuthAngle: alpha,
                    minPolarAngle: $pi.current / 2 + beta,
                    maxPolarAngle: $pi.current / 2 + beta,
                },
                {
                    minAzimuthAngle:
                        index === null || index === activePoint
                            ? alpha
                            : isMobile
                              ? 1 + lat + $pi.current / 3
                              : lat + $pi.current / 3,
                    maxAzimuthAngle:
                        index === null || index === activePoint
                            ? alpha
                            : isMobile
                              ? 1 + lat + $pi.current / 3
                              : lat + $pi.current / 3,
                    minPolarAngle: isMobile
                        ? index === null || index === activePoint
                            ? $pi.current / 2
                            : x + 1
                        : x,
                    maxPolarAngle: isMobile
                        ? index === null || index === activePoint
                            ? $pi.current / 2
                            : x + 1
                        : x,
                    duration: 1,
                    delay: delay,
                    onComplete: () => {
                        setMarkerClicked(false);
                        $controls.current.minAzimuthAngle = -Infinity;
                        $controls.current.maxAzimuthAngle = Infinity;
                        $controls.current.minPolarAngle = 0;
                        $controls.current.maxPolarAngle = $pi.current;
                    },
                }
            );
        },
        [activePoint, isMobile, markerClicked]
    );

    const createDebouncedFunction = (func: any, delay: number) => {
        let timeoutId: string | number | NodeJS.Timeout;
        return (...args: any) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const handleGlobeRotationCompletion = useCallback(() => {
        if ($activePoint.current !== null) return;
        const polarAngleOffset = $pi.current / 2;
        const currentPolarAngle = $controls.current.getPolarAngle() - polarAngleOffset;

        gsap.fromTo(
            $controls.current,
            {
                minPolarAngle: polarAngleOffset + currentPolarAngle,
                maxPolarAngle: polarAngleOffset + currentPolarAngle,
            },
            {
                minPolarAngle: polarAngleOffset,
                maxPolarAngle: polarAngleOffset,
                duration: 0.5,
                ease: 'power4.out',
                onComplete: () => {
                    $controls.current.minPolarAngle = 0;
                    $controls.current.maxPolarAngle = $pi.current;
                },
            }
        );
    }, [$activePoint.current]);

    useEffect(() => {
        const debouncedHandleGlobeRotationCompletion = createDebouncedFunction(
            handleGlobeRotationCompletion,
            1000
        );
        if ($controls.current) {
            $controls.current.addEventListener('end', debouncedHandleGlobeRotationCompletion);
        }
        return () => {
            $controls?.current?.removeEventListener('end', debouncedHandleGlobeRotationCompletion);
        };
    }, [$controls.current, handleGlobeRotationCompletion]);

    const Globe = useCallback(() => {
        $width.current = $globeRef.current.offsetWidth;
        $height.current = $globeRef.current.offsetHeight;

        $camera.current = new THREE.PerspectiveCamera(
            30,
            $width.current / $height.current,
            1,
            1100
        );

        $camera.current.position.z = 1000;

        $scene.current = new THREE.Scene();

        const geometry = new THREE.SphereGeometry(199, 40, 30);
        const material = new THREE.MeshBasicMaterial({
            color: 0x2d2c2c,
            transparent: true,
            opacity: 0,
        });
        $sphere.current = new THREE.Mesh(geometry, material);
        $scene.current.add($sphere.current);

        const pointGeometry = new THREE.PlaneGeometry(1, 1);
        $point.current = new THREE.Mesh(pointGeometry);

        $renderer.current = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });

        $renderer.current.setPixelRatio(
            window.devicePixelRatio > 1 ? Math.min(2.5, window.devicePixelRatio) : 1
        );
        $renderer.current.setSize($width.current, $height.current);
        $globeRef.current.appendChild($renderer.current.domElement);
        $threeGeoJSON.current = new ThreeGeoJSON($scene.current);

        $labelRenderer.current = new CSS2DRenderer();
        $labelRenderer.current.setSize($width.current, $height.current);
        $labelRenderer.current.domElement.style.position = 'absolute';
        $labelRenderer.current.domElement.style.top = '0px';
        $labelRenderer.current.domElement.style.left = '0px';
        $labelRenderer.current.domElement.style.width = '100%';
        $labelRenderer.current.domElement.style.height = '100%';
        $globeRef.current.appendChild($labelRenderer.current.domElement);

        $controls.current = new OrbitControls($camera.current, $labelRenderer.current.domElement);
        $controls.current.update();
        $controls.current.enableDamping = true;
        $controls.current.autoRotate = true;
        $controls.current.autoRotateSpeed = 0.3;
        $controls.current.enableZoom = false;
        $controls.current.enablePan = false;
        $controls.current.dampingFactor = 0.05;
        $controls.current.screenSpacePanning = false;

        $scene.current.rotation.y = $pi.current / 3;

        createContinents();

        window.addEventListener('resize', handleWindowResize, false);

        return () => {
            window.removeEventListener('resize', handleWindowResize, false);
        };
    }, []);

    // remove this effect if you have different detection
    useEffect(() => {
        if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                navigator.userAgent
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                navigator.userAgent.substr(0, 4)
            )
        ) {
            setIsMobile(true);
        }

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
        <div className={styles.wrapper}>
            <div className={styles.main}>
                <div
                    className={styles.canvas}
                    ref={$globeRef}
                    onClick={() => {
                        if (markerClicked) return;
                        handleClick([0, 0], null);
                    }}
                    onTouchEnd={() => {
                        if (markerClicked) return;
                        handleClick([0, 0], null);
                    }}
                >
                    <div className={styles.scrollArea}>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>
                </div>

                <div className={styles.markers}>
                    {continentData.features.map((feature, i) => {
                        if (feature.pointCoordinates) {
                            return (
                                <button
                                    type="button"
                                    className={cn(styles.marker, {
                                        [styles.isActive]: activePoint === i,
                                        [styles.isLoaded]: labelsLoaded,
                                    })}
                                    key={`continent-marker-${i}`}
                                    id={`${feature.id}-marker`}
                                    onClick={() => {
                                        if (markerClicked) return;
                                        setMarkerClicked(true);
                                        handleClick(feature.pointCoordinates, i);
                                    }}
                                    onTouchEnd={() => {
                                        // @ts-ignore
                                        if (new Date() - touchStart <= 300 && !markerClicked) {
                                            handleClick(feature.pointCoordinates, i);
                                        } else if (activePoint !== null && !markerClicked) {
                                            setActivePoint(null);
                                            $activePoint.current = null;
                                            $controls.current.autoRotate = true;
                                        }
                                    }}
                                    onTouchStart={() => {
                                        setTouchStart(new Date());
                                    }}
                                >
                                    <ThreeJSMapDataTooltip
                                        name={feature.properties.name}
                                        isActive={activePoint === i}
                                        data={continentsData.find(data => data.id === feature.id)}
                                    />
                                </button>
                            );
                        }
                    })}
                </div>
            </div>

            {/* TODO: remove this and implement statistics component */}
            <GlobeDataTestSection play={labelsLoaded} />
        </div>
    );
};

export default ThreeJSGlobe;
