import styles from './ThreeJS.module.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import locationsData from '@public/share_my_GPS_timeline_since_may_2024-reduced.json';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import threeGeoJSON from './threeGeoJSON';
import mapLinesSvg from '@public/images/lines.png';

import gsap from 'gsap';
import continentData from './data/continents.json';
import graticules from './data/graticules.json';

import { useGSAP } from '@gsap/react';
import ThreeJSMapDataTooltip from '@molecules/ThreeJSMapDataTooltip';
import cn from 'classnames';
import Image from 'next/image';

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
    const $pi = useRef(Math.PI);
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
    const $activePoint = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

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
    }, []);

    useGSAP(() => {
        if ($globeRef.current) {
            const fromColor = new THREE.Color(0x3fdbed);
            const toColor = new THREE.Color(0xf9f9f8);
            ScrollTrigger.create({
                trigger: $globeRef.current,
                start: `top ${isMobile ? '50%' : '30%'}`,
                end: 'bottom center',
                once: true,
                onEnter: () => {
                    const tl = gsap.timeline().add('start');
                    if (!isFlat) {
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
        !isFlat && $controls.current.update();
        render();
    }, [$camera?.current, $scene.current, $controls.current]);

    const getCoordinates = useCallback((lat: number, lng: number) => {
        if (isFlat) {
            const x = (lng + 180.0) * ($w.current / 2 / 360.0);
            const y = (lat + 90.0) * ($h.current / 2 / 180.0);

            return { x: x, y: y, z: 0 };
        } else {
            const phi = ((90 - lat) * $pi.current) / 180;
            const theta = ((180 - lng) * $pi.current) / 180 - $pi.current / 2;

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
                color: new THREE.Color(0x3fdbed),
                side: isFlat ? THREE.FrontSide : THREE.BackSide,
                transparent: true,
                opacity: 0,
                depthTest: !isFlat,
                depthWrite: !isFlat,
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

        if (!isFlat) {
            $threeGeoJSON.current.drawThreeGeo(graticules, 200, 'sphere', {
                color: 0x575654,
                width: $w.current,
                height: $h.current,
                name: 'graticule',
            });

            $graticule.current = $scene.current.getObjectByName('graticule');
            $graticule.current.material.transparent = true;
            $graticule.current.material.opacity = 0;
        }

        $continent.current = $scene.current.getObjectByName('continent');
        $continent.current.material.transparent = true;
        $continent.current.material.opacity = 0;

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
            const lat = coordinates[0] * ($pi.current / 180);
            let lng = 0;
            let delay = 0;

            if (
                (activePoint === index && index != null) ||
                (index === null && activePoint != null)
            ) {
                setActivePoint(null);
                $activePoint.current = null;
                !isFlat && ($controls.current.autoRotate = true);
            } else if (index != null) {
                lng = coordinates[1] * ($pi.current / 180);
                setActivePoint(index);
                $activePoint.current = index;
                !isFlat && ($controls.current.autoRotate = false);
                activePoint ? (delay = 0.5) : (delay = 0);
            } else {
                return;
            }

            if (isFlat) return;

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
                    minAzimuthAngle: index === null ? alpha : lat + $pi.current / 2.3,
                    maxAzimuthAngle: index === null ? alpha : lat + $pi.current / 2.3,
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
                        $controls.current.minAzimuthAngle = -Infinity;
                        $controls.current.maxAzimuthAngle = Infinity;
                        $controls.current.minPolarAngle = 0;
                        $controls.current.maxPolarAngle = $pi.current;
                    },
                }
            );
        },
        [activePoint, isMobile]
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

    const handleGlobeRotationEnd = useCallback(
        (event: any) => {
            if ($activePoint.current !== null) return;
            const beta = $controls.current.getPolarAngle() - $pi.current / 2;

            gsap.fromTo(
                $controls.current,
                {
                    minPolarAngle: $pi.current / 2 + beta,
                    maxPolarAngle: $pi.current / 2 + beta,
                },
                {
                    minPolarAngle: $pi.current / 2,
                    maxPolarAngle: $pi.current / 2,
                    duration: 0.5,
                    ease: 'power4.out',
                    onComplete: () => {
                        $controls.current.minPolarAngle = 0;
                        $controls.current.maxPolarAngle = $pi.current;
                    },
                }
            );
        },
        [$activePoint.current]
    );

    useEffect(() => {
        const debouncedHandleGlobeRotationEnd = debounce(handleGlobeRotationEnd, 1000);
        if ($controls.current) {
            $controls.current.addEventListener('end', debouncedHandleGlobeRotationEnd, false);
        }
        return () => {
            $controls?.current?.removeEventListener('end', debouncedHandleGlobeRotationEnd, false);
        };
    }, [$controls.current, handleGlobeRotationEnd]);

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
            $camera.current = new THREE.PerspectiveCamera(30, $w.current / $h.current, 1, 1100);
        }

        $camera.current.position.z = 1000;

        $scene.current = new THREE.Scene();

        if (!isFlat) {
            const geometry = new THREE.SphereGeometry(199, 40, 30);

            const material = new THREE.MeshBasicMaterial({
                color: 0x2d2c2c,
                transparent: true,
                opacity: 0,
            });

            $mesh.current = new THREE.Mesh(geometry, material);
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

            $scene.current.rotation.y = $pi.current / 2.3;
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
        <div
            className={cn(styles.main, {
                [styles.isFlat]: isFlat,
            })}
        >
            <h1>{isMobile ? 'mobile' : 'not mobile'}</h1>
            <div
                className={styles.canvas}
                ref={$globeRef}
                onClick={() => handleClick([0, 0], null)}
                onTouchEnd={() => {
                    handleClick([0, 0], null);
                }}
            >
                {isFlat && (
                    <div className={styles.linesImg}>
                        <Image src={mapLinesSvg} alt="map lines" />
                    </div>
                )}

                {!isFlat && (
                    <div className={styles.scrollArea}>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>
                )}
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
                                onClick={() => handleClick(feature.pointCoordinates, i)}
                                onTouchEnd={ev => {
                                    // @ts-ignore
                                    if (new Date() - touchStart <= 300) {
                                        handleClick(feature.pointCoordinates, i);
                                    }
                                }}
                                onTouchStart={() => {
                                    setTouchStart(new Date());
                                }}
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
                            </button>
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default ThreeJS;
