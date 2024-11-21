'use client';
import styles from './FlatMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import * as am5 from '@amcharts/amcharts5';
import am5geodata_continentsLow from '@amcharts/amcharts5-geodata/continentsLow';
import am5geodata_worldOutlineLow from '@amcharts/amcharts5-geodata/worldOutlineLow';

import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { continentsAdditionalData } from '@organisms/FlatMap/data/continentsAdditionalData';

import userShareData from '@public/world_population.json';

import FlatMapDataTooltip from '@molecules/FlatMapDataTooltip';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollToPlugin, ScrollTrigger);
}

interface FlatMapProps {
    continentsData: {
        id: string;
        countries: string[];
        humans: string;
        users: string;
        transactions: string;
        orbs: string;
    }[];
}

const FlatMap = ({ continentsData }: FlatMapProps) => {
    const [prevMarkerPosition, setPrevMarkerPosition] = useState({
        x: null,
        y: null,
    });
    const [tooltipPosition, setTooltipPosition] = useState({
        x: null,
        y: null,
    });
    // TODO: change to true on mobile
    const [isMobile, setIsMobile] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isScrollLoaded, setIsScrollLoaded] = useState(false);
    const [citiesData, setCitiesData] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [clickedContinentData, setClickedContinentData] = useState(null);
    const $globe = useRef(null);
    const $globeWrapper = useRef(null);
    const $chartRender = useRef(null);
    const $pointSeries = useRef(null);
    const $previousPolygon = useRef(null);
    const $mapLineSeries = useRef(null);
    const $backgroundSeries = useRef(null);
    const $worldOutlineSeries = useRef(null);
    const $continentsSeries = useRef(null);
    const $markerSeries = useRef(null);

    const [velocityX, setVelocityX] = useState(0);
    const [prevDragPosition, setPrevDragPosition] = useState({ rotationX: 0 });

    const infiniteRotation = useCallback(
        (from: number = null) => {
            if ($chartRender?.current) {
                const fromRotation = from || $chartRender.current._settings.rotationX;
                $chartRender.current.animate({
                    key: 'rotationX',
                    from: fromRotation,
                    to: fromRotation + 360,
                    duration: 90000,
                    loops: Infinity,
                });
            }
        },
        [$chartRender]
    );

    const continueRotation = useCallback(() => {
        infiniteRotation();
    }, []);

    let counter = 0;
    // damping movement on drag
    useEffect(() => {
        if ($globe.current && $chartRender.current && !isAnimating) {
            const dragMove = () => {
                const { rotationX } = $chartRender.current._settings;
                const newVelocityX = rotationX - prevDragPosition.rotationX;
                setVelocityX(newVelocityX);
                setPrevDragPosition({ rotationX });
            };
            const dragEnd = () => {
                $chartRender.current.animate({
                    key: 'rotationX',
                    from: $chartRender.current._settings.rotationX,
                    to: $chartRender.current._settings.rotationX + velocityX,
                    duration: Math.abs(velocityX) * 10,
                    easing: am5.ease.out(am5.ease.exp),
                });
                counter++;

                setVelocityX(velocityX * 0.2); // decay factor
                if (Math.abs(velocityX) < 0.01) {
                    setVelocityX(0);
                }

                setTimeout(
                    () => {
                        continueRotation();
                    },
                    Math.abs(velocityX) * 10
                );
            };

            $globe.current.addEventListener('mousemove', dragMove, true);
            $globe.current.addEventListener('touchmove', dragMove, true);
            $globe.current.addEventListener('mouseup', dragEnd, true);
            $globe.current.addEventListener('touchend', dragEnd, true);

            return () => {
                $globe.current?.removeEventListener('mousemove', dragMove, true);
                $globe.current?.removeEventListener('touchmove', dragMove, true);
                $globe.current?.removeEventListener('mouseup', dragEnd, true);
                $globe.current?.removeEventListener('touchend', dragEnd, true);
            };
        }
    }, [velocityX, $globe.current, $chartRender.current, isAnimating, counter]);

    useGSAP(() => {
        if (isZoomed && $globeWrapper.current) {
            const offset = (window.innerHeight - $globeWrapper.current.offsetHeight) / 2;
            gsap.to(window, {
                duration: 1,
                ease: 'power4.out',
                scrollTo: {
                    y: $globeWrapper.current,
                    offsetY: offset,
                },
            });
        }
    }, [isZoomed]);

    // TODO: this should be people signups (population is used for mock data)
    useEffect(() => {
        const filteredData = [];

        for (let i = 0; i < userShareData.length; i++) {
            const point = userShareData[i];

            if (i % 3 === 0) {
                filteredData.push(point);
            }
        }

        setCitiesData(filteredData);
    }, []);

    const createMarkers = useCallback(root => {
        $markerSeries.current.bullets.push(root => {
            const container = am5.Container.new(root, {});
            container.children.push(
                am5.Picture.new(root, {
                    templateField: 'pictureSettings',
                    width: 24,
                    centerX: am5.p50,
                    centerY: am5.p50,
                    forceInactive: true,
                })
            );

            const rect = container.children.push(
                am5.Rectangle.new(root, {
                    width: 24,
                    height: 24,
                    centerX: am5.p50,
                    centerY: am5.p50,
                    fill: am5.color(0x2d2c2c),
                })
            );

            container.set('mask', rect);

            return am5.Bullet.new(root, {
                sprite: container,
            });
        });
    }, []);

    const continentsActiveEvent = useCallback(() => {
        $continentsSeries.current.mapPolygons.template.on(
            'active',
            (active: boolean, target: { geoCentroid: () => any }) => {
                if (isAnimating) return;

                if ($previousPolygon && $previousPolygon?.current != target) {
                    $previousPolygon.current?.set('active', false);
                }

                const centroid = target.geoCentroid();
                if (active) {
                    if (centroid) {
                        rotateGlobe(centroid.longitude, centroid.latitude, false);
                    }
                }

                $previousPolygon.current = target;
            }
        );
    }, [isMobile, isZoomed, isAnimating]);

    const populateTooltipDataEvent = useCallback(() => {
        $continentsSeries.current.mapPolygons.template.events.on('click', ev => {
            const data = continentsData.find(
                continent => continent.id === ev.target.dataItem.dataContext.id
            );

            if (data) {
                setClickedContinentData({
                    name: ev.target.dataItem.dataContext.name,
                    ...data,
                });
            }
        });
    }, []);

    useEffect(() => {
        if (!citiesData || citiesData?.length < 1) return;

        console.log(citiesData?.length);

        const root = am5.Root.new($globe.current);

        root.fps = 60;
        root.autoResize = false;
        root.tapToActivate = true;
        root.tapToActivateTimeout = 5000;

        $chartRender.current = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: isMobile ? 'rotateY' : 'none',
                wheelY: 'none',
                // TODO: change to am5map.geoOrthographic() on mobile
                projection: am5map.geoNaturalEarth1(),
                zoomLevel: isMobile ? 0.9 : 1,
                minZoomLevel: 0.5,
                maxZoomLevel: 16,
                centerY: 0,
            })
        );

        root.setThemes([am5themes_Animated.new(root)]);

        $mapLineSeries.current = $chartRender.current.series.push(
            am5map.GraticuleSeries.new(root, {
                stroke: am5.color(0x575654),
            })
        );

        $mapLineSeries.current.set('visible', false);

        $worldOutlineSeries.current = $chartRender.current.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldOutlineLow,
            })
        );

        $worldOutlineSeries.current.mapPolygons.template.setAll({
            fillOpacity: 0,
            stroke: am5.color(0x3fdbed),
            strokeWidth: 0.5,
        });

        $worldOutlineSeries.current.set('visible', false);

        $continentsSeries.current = $chartRender.current.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_continentsLow,
                exclude: ['antarctica'],
            })
        );

        $continentsSeries.current.useGeodata = true;

        $continentsSeries.current.mapPolygons.template.setAll({
            toggleKey: 'active',
            interactive: true,
            fill: am5.color(0x2d2c2c),
            stroke: am5.color(0x3fdbed),
            strokeOpacity: 0,
            strokeWidth: 1,
            tooltipPosition: 'fixed',
            cursorOverStyle: 'pointer',
        });

        $continentsSeries.current.mapPolygons.template.states.create('hover', {
            strokeWidth: 1,
            strokeOpacity: 1,
        });

        populateTooltipDataEvent();

        $continentsSeries.current.mapPolygons.template.states.create('active', {
            fill: am5.color(0x3fdbed),
            fillOpacity: 0.05,
            stroke: am5.color(0x3fdbed),
            strokeWidth: 1,
        });

        const continentsSeriesTemplate = $continentsSeries.current.mapPolygons.template;
        continentsSeriesTemplate.fill = am5.color('#ffffff');
        continentsSeriesTemplate.stroke = am5.color('#ffffff');

        $backgroundSeries.current = $chartRender.current.series.unshift(
            am5map.MapPolygonSeries.new(root, {})
        );

        $backgroundSeries.current.mapPolygons.template.setAll({
            fill: am5.color(0x2d2c2c),
            stroke: am5.color(0x575654),
            strokeWidth: 1,
        });

        $backgroundSeries.current.data.push({
            geometry: am5map.getGeoRectangle(90, 180, -90, -180),
        });

        $backgroundSeries.current.set('visible', false);

        infiniteRotation();

        // Create points (people signups)
        $pointSeries.current = $chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                latitudeField: 'lat',
                longitudeField: 'lng',
            })
        );

        $pointSeries.current.set('visible', false);

        $pointSeries.current.bullets.push(() => {
            const rect = am5.Rectangle.new(root, {
                width: 2,
                height: 2,
                fill: am5.color(0x3e5b64),
            });

            return am5.Bullet.new(root, {
                sprite: rect,
            });
        });

        $pointSeries.current.data.setAll(citiesData);

        continentsActiveEvent();

        // create markers
        $markerSeries.current = $chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                geoJSON: continentsAdditionalData,
            })
        );

        $markerSeries.current.set('visible', false);

        createMarkers(root);

        return () => {
            root.dispose();
        };
    }, [isMobile, citiesData, $previousPolygon]);

    const globeElementsAppear = useCallback(() => {
        $chartRender.current.appear(300);
        $mapLineSeries.current.appear(1000);
        $backgroundSeries.current.appear(1000);
        $worldOutlineSeries.current.appear(1500, 500);
        $continentsSeries.current.appear(1500, 500);
        $pointSeries.current.appear(2500, 1000);
        $markerSeries.current.appear(5000, 1500);
    }, []);

    useGSAP(() => {
        if (isScrollLoaded) return;
        // show globe elements on scroll
        ScrollTrigger.create({
            trigger: $globe.current,
            start: 'top center',
            onEnter: () => {
                setIsScrollLoaded(true);
                globeElementsAppear();
            },
        });
    }, [isScrollLoaded]);

    const rotateGlobe = useCallback(
        (x = 0, y = 0, zoomOut = false) => {
            if (isAnimating) return;
            setIsAnimating(true);

            if (zoomOut) {
                $previousPolygon.current.set('active', false);

                // remove tooltip
                setTooltipPosition({ x: null, y: null });

                // continue rotation from current position
                infiniteRotation(prevMarkerPosition.x);
            } else {
                // save current position
                let offsetX = -x - (isMobile ? 20 : 45);

                setPrevMarkerPosition({
                    x: offsetX,
                    y,
                });

                const rotationCount = $chartRender.current._settings.rotationX / 360;

                const sumRotationCount = ($chartRender.current._settings.rotationX - offsetX) / 360;

                const toSmaller = Math.floor(rotationCount);
                const toBigger = Math.ceil(rotationCount);
                let multiplier = toSmaller;

                if (sumRotationCount > toBigger) {
                    multiplier = toBigger;
                }

                $chartRender.current.animate({
                    key: 'rotationX',
                    to: multiplier * 360 + offsetX,
                    duration: 1500,
                    easing: am5.ease.out(am5.ease.cubic),
                });
            }

            if (isMobile) {
                $chartRender.current.animate({
                    key: 'zoomLevel',
                    to: zoomOut ? (isMobile ? 0.9 : 1) : 2.5,
                    duration: 1500,
                    easing: am5.ease.out(am5.ease.cubic),
                });

                $chartRender.current.animate({
                    key: 'rotationY',
                    to: -y + (zoomOut ? 0 : 25),
                    duration: 1500,
                    easing: am5.ease.out(am5.ease.cubic),
                });
            }

            setTimeout(
                () => {
                    setTooltipPosition(
                        $chartRender.current.convert({
                            latitude: y,
                            longitude: x,
                        })
                    );
                    setIsAnimating(false);
                },
                // 1400ms delay because rotate animation (1500) - animate method doesnt have on complete callback so we need to use this dirty solution
                // 10ms delay for close animation to start
                zoomOut ? 10 : 1400
            );

            setIsZoomed(!zoomOut);
        },
        [isMobile, prevMarkerPosition, isAnimating]
    );

    // enlarge points if map type is globe and map is zoomed
    useEffect(() => {
        if (!isMobile) return;
        $pointSeries.current.bulletsContainer.children.each(bullet => {
            setTimeout(
                () => {
                    bullet.animate({
                        key: 'width',
                        to: isZoomed ? 3 : 2,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });

                    bullet.animate({
                        key: 'height',
                        to: isZoomed ? 3 : 2,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });
                },
                isZoomed ? 1000 : 0
            );
        });
    }, [isZoomed, isMobile]);

    // TODO: remove after mobile detection will be implemented
    useEffect(() => {
        if ($chartRender.current) {
            $chartRender.current.set(
                'projection',
                isMobile ? am5map.geoOrthographic() : am5map.geoNaturalEarth1()
            );

            if (isScrollLoaded) {
                globeElementsAppear();
            }
        }
    }, [isMobile]);

    return (
        <div className={styles.flatMapWrapper} ref={$globeWrapper}>
            <section className={styles.flatMap}>
                <FlatMapDataTooltip
                    isAnimating={isAnimating}
                    setIsAnimating={setIsAnimating}
                    isActive={isZoomed}
                    rotateGlobe={rotateGlobe}
                    position={tooltipPosition}
                    data={clickedContinentData}
                />

                <div
                    ref={$globe}
                    style={{
                        pointerEvents: isAnimating ? 'none' : 'all',
                    }}
                ></div>

                <button
                    className={styles.button}
                    type="button"
                    onClick={() => setIsMobile(!isMobile)}
                >
                    {isMobile ? 'Switch to Desktop' : 'Switch to Mobile'}
                </button>
            </section>
        </div>
    );
};

export default FlatMap;
