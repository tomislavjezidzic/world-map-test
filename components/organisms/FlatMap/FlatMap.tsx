'use client';
import styles from './FlatMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import * as am5 from '@amcharts/amcharts5';
import am5geodata_continentsLow from '@amcharts/amcharts5-geodata/continentsLow';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldOutlineLow';

import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as d3 from 'd3';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { data } from '@organisms/FlatMap/data/continentsAdditionalData';

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
    const [isGlobe, setIsGlobe] = useState(false);
    const globeRef = useRef(null);
    const globeWrapperRef = useRef(null);
    const chartRender = useRef(null);
    const [tooltipPosition, setTooltipPosition] = useState({
        x: null,
        y: null,
    });
    const pointSeries = useRef(null);
    const previousPolygon = useRef(null);
    const [citiesData, setCitiesData] = useState([]);
    const [prevMarkerPosition, setPrevMarkerPosition] = useState({
        x: null,
        y: null,
    });
    const [isZoomed, setIsZoomed] = useState(false);
    const [clickedContinentData, setClickedContinentData] = useState(null);

    useGSAP(() => {
        if (isZoomed && globeWrapperRef.current) {
            gsap.to(window, {
                scrollTo: globeWrapperRef.current,
            });
        }
    }, [isZoomed]);

    useEffect(() => {
        fetch('/world_population.csv')
            .then(res => res.text())
            .then(csv =>
                d3.csvParse(csv, ({ lat, lng, pop }) => {
                    // @ts-ignore
                    if (pop > 500000) {
                        return {
                            lat: +lat,
                            lng: +lng,
                        };
                    }
                })
            )
            .then(setCitiesData);
    }, []);

    useEffect(() => {
        const root = am5.Root.new(globeRef.current);

        chartRender.current = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: isGlobe ? 'rotateY' : 'none',
                wheelY: 'none',
                projection: am5map.geoNaturalEarth1(),
                minZoomLevel: 0.5,
                maxZoomLevel: 16,
                centerY: 0,
            })
        );

        root.setThemes([am5themes_Animated.new(root)]);

        const graticuleSeries = chartRender.current.series.push(
            am5map.GraticuleSeries.new(root, {
                stroke: am5.color(0x575654),
            })
        );

        graticuleSeries.set('visible', false);

        const worldSeries = chartRender.current.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldLow,
            })
        );

        worldSeries.mapPolygons.template.setAll({
            fillOpacity: 0,
            stroke: am5.color(0x3fdbed),
            strokeWidth: 0.5,
        });

        worldSeries.set('visible', false);

        const polygonSeries = chartRender.current.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_continentsLow,
                exclude: ['antarctica'],
            })
        );

        polygonSeries.useGeodata = true;

        polygonSeries.mapPolygons.template.setAll({
            // tooltipText: '{name}',
            toggleKey: 'active',
            interactive: true,
            fill: am5.color(0x2d2c2c),
            stroke: am5.color(0x3fdbed),
            strokeOpacity: 0,
            strokeWidth: 1,
            tooltipPosition: 'fixed',
            cursorOverStyle: 'pointer',
        });

        polygonSeries.mapPolygons.template.states.create('hover', {
            strokeWidth: 1,
            strokeOpacity: 1,
        });

        polygonSeries.mapPolygons.template.events.on('click', ev => {
            const data = continentsData.find(
                continent => continent.id === ev.target.dataItem.dataContext.id
            );

            console.log(ev.target.dataItem.dataContext.id);

            if (data) {
                setClickedContinentData({
                    name: ev.target.dataItem.dataContext.name,
                    ...data,
                });
            }
        });

        polygonSeries.mapPolygons.template.states.create('active', {
            fill: am5.color(0x3fdbed),
            fillOpacity: 0.05,
            stroke: am5.color(0x3fdbed),
            strokeWidth: 1,
        });

        const polygonTemplate = polygonSeries.mapPolygons.template;
        // polygonTemplate.tooltipText = '{name}';
        polygonTemplate.fill = am5.color('#ffffff');
        polygonTemplate.stroke = am5.color('#ffffff');

        const backgroundSeries = chartRender.current.series.unshift(
            am5map.MapPolygonSeries.new(root, {})
        );

        backgroundSeries.mapPolygons.template.setAll({
            fill: am5.color(0x2d2c2c),
            stroke: am5.color(0x575654),
            strokeWidth: 1,
        });

        backgroundSeries.data.push({
            geometry: am5map.getGeoRectangle(90, 180, -90, -180),
        });

        backgroundSeries.set('visible', false);

        chartRender.current.animate({
            key: 'rotationX',
            from: 0,
            to: 360,
            duration: 90000,
            loops: Infinity,
        });

        // create markers
        const markerSeries = chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                geoJSON: data,
            })
        );

        markerSeries.set('visible', false);

        markerSeries.bullets.push((root, series, dataItem) => {
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

        markerSeries.bulletsContainer.parent.zIndex = 199990;

        // Create points
        pointSeries.current = chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                latitudeField: 'lat',
                longitudeField: 'lng',
            })
        );

        pointSeries.current.set('visible', false);

        pointSeries.current.bullets.push(() => {
            const rect = am5.Rectangle.new(root, {
                width: 2.5,
                height: 2.5,
                fill: am5.color(0x3e5b64),
            });

            return am5.Bullet.new(root, {
                sprite: rect,
            });
        });

        pointSeries.current.data.setAll(citiesData);

        // polygonSeries.mapPolygons.template.events.on('click', ev => {
        //     if (ev.target.dataItem === previousPolygon.current?.dataItem) {
        //         rotateGlobe(
        //             previousPolygon.current.longitude,
        //             previousPolygon.current.latitude,
        //             true
        //         );
        //     }
        // });

        polygonSeries.mapPolygons.template.on(
            'active',
            (active: any, target: { geoCentroid: () => any }) => {
                if (previousPolygon && previousPolygon?.current != target) {
                    previousPolygon.current?.set('active', false);
                }

                const centroid = target.geoCentroid();
                if (active) {
                    if (centroid) {
                        rotateGlobe(centroid.longitude, centroid.latitude, false);
                    }
                }

                previousPolygon.current = target;
            }
        );

        ScrollTrigger.create({
            trigger: globeRef.current,
            start: 'top center',
            onEnter: () => {
                chartRender.current.appear(300);
                graticuleSeries.appear(1000, 300);
                backgroundSeries.appear(1000, 300);
                worldSeries.appear(1500, 1000);
                polygonSeries.appear(1500, 1000);
                pointSeries.current.appear(1500, 1800);
                markerSeries.appear(1500, 2500);
            },
        });
        return () => {
            root.dispose();
        };
    }, [isGlobe, citiesData, previousPolygon]);

    const rotateGlobe = useCallback(
        (x = 0, y = 0, zoomOut = false) => {
            if (zoomOut) {
                previousPolygon.current.set('active', false);
                setTooltipPosition({ x: null, y: null });

                chartRender.current.animate({
                    key: 'rotationX',
                    from: prevMarkerPosition.x,
                    to: 360 + prevMarkerPosition.x,
                    duration: 90000,
                    loops: Infinity,
                });
            } else {
                setPrevMarkerPosition({
                    x: isGlobe ? -x : -x - 90,
                    y,
                });

                chartRender.current.animate({
                    key: 'rotationX',
                    to: isGlobe ? -x : -x - 90,
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });
            }

            if (isGlobe) {
                chartRender.current.animate({
                    key: 'zoomLevel',
                    to: zoomOut ? 1 : 2.5,
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });

                chartRender.current.animate({
                    key: 'rotationY',
                    to: -y,
                    duration: 1500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });
            }
            // else {
            // chartRender.current.animate({
            //     key: 'centerY',
            //     to: zoomOut ? 0 : -y * 4.27 * 2.5,
            //     duration: 1500,
            //     easing: am5.ease.inOut(am5.ease.cubic),
            // });
            // }

            setTimeout(
                () => {
                    setTooltipPosition(
                        chartRender.current.convert({
                            latitude: y,
                            longitude: x,
                        })
                    );
                },
                zoomOut ? 300 : 1500
            );

            setIsZoomed(!zoomOut);
        },
        [isGlobe, prevMarkerPosition]
    );

    useEffect(() => {
        pointSeries.current.bulletsContainer.children.each(bullet => {
            setTimeout(
                () => {
                    bullet.animate({
                        key: 'width',
                        to: isZoomed && isGlobe ? 5 : 2.5,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });

                    bullet.animate({
                        key: 'height',
                        to: isZoomed && isGlobe ? 5 : 2.5,
                        duration: 500,
                        easing: am5.ease.inOut(am5.ease.cubic),
                    });
                },
                isZoomed ? 1000 : 0
            );
        });
    }, [isZoomed]);

    useEffect(() => {
        if (chartRender.current) {
            chartRender.current.set(
                'projection',
                isGlobe ? am5map.geoOrthographic() : am5map.geoNaturalEarth1()
            );
        }
    }, [isGlobe]);

    return (
        <>
            <div className={styles.spacer}>
                <h1>Scroll down</h1>
            </div>
            <div className={styles.flatMapWrapper} ref={globeWrapperRef}>
                <section className={styles.flatMap}>
                    <FlatMapDataTooltip
                        isActive={isZoomed}
                        rotateGlobe={rotateGlobe}
                        position={tooltipPosition}
                        data={clickedContinentData}
                    />
                    <div ref={globeRef}></div>

                    <button
                        className={styles.button}
                        type="button"
                        onClick={() => {
                            setIsGlobe(!isGlobe);
                            if (!isGlobe) {
                                chartRender.current.animate({
                                    key: 'rotationY',
                                    to: 0,
                                    duration: 300,
                                    easing: am5.ease.inOut(am5.ease.cubic),
                                });
                            }
                        }}
                    >
                        Switch View
                    </button>
                </section>
            </div>
            <div className={styles.spacer}></div>
        </>
    );
};

export default FlatMap;
