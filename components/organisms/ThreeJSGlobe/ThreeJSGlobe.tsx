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
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

// Utils
import ThreeGeoJSON from './ThreeGeoJSON';

// Components
import ThreeJSMapDataTooltip from '@molecules/ThreeJSMapDataTooltip';

// Register GSAP plugins
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP);
}

// Reused per-frame scratch objects (avoids allocating in the render loop)
const _labelPosition = new THREE.Vector3();
const _occlusionRay = new THREE.Ray();
const _occluder = new THREE.Sphere();

// Data
import locationsData from '@public/location-data-reduced.json';
import continentData from './data/continents.json';
import graticules from './data/graticules.json';
import { useIsMobile } from '@hooks/useIsMobile';

/**
 * ThreeJSGlobe props interface.
 *
 * @interface ThreeJSGlobeProps
 */
interface ThreeJSGlobeProps {
    /**
     * @type {{
     * id: string;
     * countries: string;
     * humans: string;
     * users: string;
     * transactions: string;
     * tokens: string
     * orbs: string
     * }[]}
     */
    continentsData: {
        id: string;
        countries: string;
        humans: string;
        users: string;
        transactions: string;
        tokens: string;
        orbs?: string;
    }[];
}

const ThreeJSGlobe = ({ continentsData }: ThreeJSGlobeProps) => {
    const $globeRef = useRef<HTMLDivElement>(null);
    const $width = useRef<number>(null);
    const $height = useRef<number>(null);
    const $pi = useRef(Math.PI);
    const $point = useRef<THREE.Object3D>(null);
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
    const $labels = useRef<CSS2DObject[]>([]);
    const $frame = useRef<number | null>(null);
    const $touchStart = useRef<number>(0);
    const [activePoint, setActivePoint] = useState<number | null>(null);
    const [labelsLoaded, setLabelsLoaded] = useState(false);
    const [markerClicked, setMarkerClicked] = useState(false);
    const isMobile = useIsMobile();

    const initialLoad = useCallback(() => {
        if ($globeRef.current) {
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
            });

            setTimeout(() => {
                setLabelsLoaded(true);
            }, 1000);
        }
    }, [isMobile]);

    const animate = useCallback(() => {
        $frame.current = requestAnimationFrame(animate);
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

    /**
     * Builds one merged BufferGeometry of 1x1 quads (one per location),
     * each placed on the globe surface and facing its centre.
     */
    const createPointsGeometry = useCallback(
        (locations: { lat: number | string; lng: number | string }[]) => {
            const quad = new THREE.PlaneBufferGeometry(1, 1);
            const quadPositions = quad.attributes.position.array as ArrayLike<number>;
            const quadIndex = quad.index.array as ArrayLike<number>;
            const quadVertexCount = quadPositions.length / 3;

            const positions = new Float32Array(locations.length * quadPositions.length);
            const indices = new Uint32Array(locations.length * quadIndex.length);
            const vertex = new THREE.Vector3();

            locations.forEach(({ lat, lng }, pointIndex) => {
                const { x, y, z } = getCoordinates(Number(lat), Number(lng));

                $point.current.position.set(x, y, z);
                $point.current.lookAt($sphere.current.position);
                $point.current.updateMatrix();

                const vertexOffset = pointIndex * quadVertexCount;

                for (let i = 0; i < quadVertexCount; i++) {
                    vertex.fromArray(quadPositions, i * 3).applyMatrix4($point.current.matrix);
                    vertex.toArray(positions, (vertexOffset + i) * 3);
                }

                for (let i = 0; i < quadIndex.length; i++) {
                    indices[pointIndex * quadIndex.length + i] = vertexOffset + quadIndex[i];
                }
            });

            quad.dispose();

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));

            return geometry;
        },
        [getCoordinates]
    );

    const addData = useCallback((locationData: any[]) => {
        // Meshes are created last batch first (render order matters while the
        // batches fade in one after another, see `initialLoad`)
        for (let index = locationData.length - 1; index >= 0; index--) {
            createMesh(createPointsGeometry(locationData[index]));
        }
    }, []);

    const createMesh = useCallback((geometry: THREE.BufferGeometry) => {
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

        // Hide labels on the far side of the globe: a label is occluded when the
        // ray from it towards the camera passes through the globe's sphere.
        $sphere.current.updateWorldMatrix(true, false);
        _occluder
            .copy($sphere.current.geometry.boundingSphere)
            .applyMatrix4($sphere.current.matrixWorld);

        $labels.current.forEach(label => {
            label.getWorldPosition(_labelPosition);
            _occlusionRay.origin.copy(_labelPosition);
            _occlusionRay.direction.copy($camera.current.position).sub(_labelPosition).normalize();

            // toggle with `force` doesn't touch the DOM when the state is unchanged,
            // and re-applies the class after React rewrites `className`
            label.element.classList.toggle('is-hidden', _occlusionRay.intersectsSphere(_occluder));
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
            color: 0x2d2c2c,
            width: $width.current,
            height: $height.current,
            name: 'continent',
        });

        $threeGeoJSON.current.drawThreeGeo(graticules, 200, 'sphere', {
            color: 0x9d9b94,
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

            const currentAlpha = $controls.current.getAzimuthalAngle();
            const beta = $controls.current.getPolarAngle() - $pi.current / 2;

            // Normalize the current angle to [-π, π] range
            const normalizedAlpha =
                (((currentAlpha % (2 * $pi.current)) + 3 * $pi.current) % (2 * $pi.current)) -
                $pi.current;

            let x = $pi.current / 2 - lng;
            let targetAzimuth;

            if (index === null || index === activePoint) {
                targetAzimuth = normalizedAlpha;
            } else {
                targetAzimuth = isMobile ? 1 + lat + $pi.current / 3 : lat + $pi.current / 3;

                // Calculate the shortest rotation path
                const diff = targetAzimuth - normalizedAlpha;
                if (diff > $pi.current) {
                    targetAzimuth -= 2 * $pi.current;
                } else if (diff < -$pi.current) {
                    targetAzimuth += 2 * $pi.current;
                }
            }

            gsap.fromTo(
                $controls.current,
                {
                    minAzimuthAngle: normalizedAlpha,
                    maxAzimuthAngle: normalizedAlpha,
                    minPolarAngle: $pi.current / 2 + beta,
                    maxPolarAngle: $pi.current / 2 + beta,
                },
                {
                    minAzimuthAngle: targetAzimuth,
                    maxAzimuthAngle: targetAzimuth,
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

        const geometry = new THREE.SphereBufferGeometry(199, 40, 30);
        // used every frame for label occlusion
        geometry.computeBoundingSphere();
        // globe material
        const material = new THREE.MeshBasicMaterial({
            color: 0xf6f5f3,
            transparent: true,
            opacity: 0,
        });
        $sphere.current = new THREE.Mesh(geometry, material);
        $scene.current.add($sphere.current);

        // helper used to orient each location quad towards the globe centre
        $point.current = new THREE.Object3D();

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
        $controls.current.autoRotateSpeed = 0.4;
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
    }, [isMobile]);

    const stopLoop = useCallback(() => {
        if ($frame.current === null) return;

        cancelAnimationFrame($frame.current);
        $frame.current = null;
    }, []);

    const dispose = useCallback(() => {
        stopLoop();

        $scene.current?.traverse(object => {
            const { geometry, material } = object as THREE.Mesh;
            geometry?.dispose();
            (Array.isArray(material) ? material : [material]).forEach(m => m?.dispose());
        });

        $controls.current?.dispose();
        $renderer.current?.dispose();
        $renderer.current?.domElement.remove();
    }, [stopLoop]);

    // remove this effect if you have different detection
    useEffect(() => {
        if (
            !locationsData ||
            !locationsData.length ||
            !$globeRef?.current ||
            typeof window === 'undefined'
        )
            return;

        const removeResizeListener = Globe();

        const batchSize = 2000;

        const splitData = [];
        for (let i = 0; i < locationsData.length; i += batchSize) {
            splitData.push(locationsData.slice(i, i + batchSize));
        }

        addData(splitData);
        animate();
        initialLoad();

        // Only run the render loop while the globe is on screen
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if ($frame.current === null) animate();
            } else {
                stopLoop();
            }
        });
        observer.observe($globeRef.current);

        return () => {
            observer.disconnect();
            removeResizeListener();
            dispose();
        };
    }, []);

    useEffect(() => {
        if ($camera.current) {
            $camera.current.position.z = isMobile ? 1100 : 1000;
        }
    }, [isMobile]);

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
                                        if (
                                            Date.now() - $touchStart.current <= 300 &&
                                            !markerClicked
                                        ) {
                                            handleClick(feature.pointCoordinates, i);
                                        } else if (activePoint !== null && !markerClicked) {
                                            setActivePoint(null);
                                            $activePoint.current = null;
                                            $controls.current.autoRotate = true;
                                        }
                                    }}
                                    onTouchStart={() => {
                                        $touchStart.current = Date.now();
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
        </div>
    );
};

export default ThreeJSGlobe;
