'use client';
import styles from './FlatMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import * as am5 from '@amcharts/amcharts5';
import am5geodata_continentsLow from '@amcharts/amcharts5-geodata/continentsLow';
import am5geodata_worldOutlineLow from '@amcharts/amcharts5-geodata/worldOutlineLow';

import * as am5map from '@amcharts/amcharts5/map';
import * as d3 from 'd3';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { continentsAdditionalData } from '@organisms/FlatMap/data/continentsAdditionalData';

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
    const [isGlobe, setIsGlobe] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isScrollLoaded, setIsScrollLoaded] = useState(false);
    const [citiesData, setCitiesData] = useState([]);
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

    useGSAP(() => {
        if (isZoomed && $globeWrapper.current) {
            gsap.to(window, {
                scrollTo: $globeWrapper.current,
            });
        }
    }, [isZoomed]);

    // TODO: this should be people signups (population is used for mock data)
    useEffect(() => {
        fetch('/world_population.csv')
            .then(res => res.text())
            .then(csv =>
                d3.csvParse(csv, ({ lat, lng, pop }) => {
                    // @ts-ignore
                    if (pop > 50000) {
                        return {
                            lat: +lat,
                            lng: +lng,
                        };
                    }
                })
            )
            .then(setCitiesData);
    }, []);

    const createMarkers = useCallback(root => {
        $markerSeries.current.bullets.push(root => {
            const container = am5.Container.new(root, {
                layer: 2,
            });
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
    }, [isGlobe, isZoomed, isAnimating]);

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
        const root = am5.Root.new($globe.current);

        $chartRender.current = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: isGlobe ? 'rotateY' : 'none',
                wheelY: 'none',
                // TODO: change to am5map.geoOrthographic() on mobile
                projection: am5map.geoNaturalEarth1(),
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

        $chartRender.current.animate({
            key: 'rotationX',
            from: 0,
            to: 360,
            duration: 90000,
            loops: Infinity,
        });

        // create markers
        $markerSeries.current = $chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                geoJSON: continentsAdditionalData,
            })
        );

        $markerSeries.current.set('visible', false);

        createMarkers(root);

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
                width: 1.5,
                height: 1.5,
                fill: am5.color(0x3e5b64),
            });

            return am5.Bullet.new(root, {
                sprite: rect,
            });
        });

        $pointSeries.current.data.setAll(citiesData);

        continentsActiveEvent();

        return () => {
            root.dispose();
        };
    }, [isGlobe, citiesData, $previousPolygon]);

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
                $chartRender.current.animate({
                    key: 'rotationX',
                    from: prevMarkerPosition.x,
                    to: 360 + prevMarkerPosition.x,
                    duration: 90000,
                    loops: Infinity,
                });
            } else {
                // save current position
                setPrevMarkerPosition({
                    x: -x - (isGlobe ? 20 : 45),
                    y,
                });

                $chartRender.current.animate({
                    key: 'rotationX',
                    to: -x - (isGlobe ? 20 : 45),
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });
            }

            if (isGlobe) {
                $chartRender.current.animate({
                    key: 'zoomLevel',
                    to: zoomOut ? 1 : 2.5,
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });

                $chartRender.current.animate({
                    key: 'rotationY',
                    to: -y + (zoomOut ? 0 : 25),
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
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
                // 300ms delay for close animation to complete
                zoomOut ? 10 : 1400
            );

            setIsZoomed(!zoomOut);
        },
        [isGlobe, prevMarkerPosition, isAnimating]
    );

    // enlarge points if map type is globe and map is zoomed
    useEffect(() => {
        if (!isGlobe) return;
        $pointSeries.current.bulletsContainer.children.each(bullet => {
            setTimeout(
                () => {
                    bullet.animate({
                        key: 'width',
                        to: isZoomed ? 5 : 1.5,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });

                    bullet.animate({
                        key: 'height',
                        to: isZoomed ? 5 : 1.5,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });
                },
                isZoomed ? 1000 : 0
            );
        });
    }, [isZoomed, isGlobe]);

    // TODO: remove after mobile detection will be implemented
    useEffect(() => {
        if ($chartRender.current) {
            $chartRender.current.set(
                'projection',
                isGlobe ? am5map.geoOrthographic() : am5map.geoNaturalEarth1()
            );

            if (isScrollLoaded) {
                globeElementsAppear();
            }
        }
    }, [isGlobe]);

    return (
        <div className={styles.flatMapWrapper} ref={$globeWrapper}>
            <section className={styles.flatMap}>
                <FlatMapDataTooltip
                    isAnimating={isAnimating}
                    isActive={isZoomed}
                    rotateGlobe={rotateGlobe}
                    position={tooltipPosition}
                    data={clickedContinentData}
                />

                <div
                    ref={$globe}
                    style={{
                        pointerEvents: isZoomed ? 'none' : 'all',
                    }}
                ></div>

                <button
                    className={styles.button}
                    type="button"
                    onClick={() => setIsGlobe(!isGlobe)}
                >
                    Switch View
                </button>
            </section>
        </div>
    );
};

export default FlatMap;
