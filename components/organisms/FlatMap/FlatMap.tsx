'use client';
import styles from './FlatMap.module.scss';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import * as am5 from '@amcharts/amcharts5';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';

import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as d3 from 'd3';

interface ThreeDMapProps {}

const FlatMap = ({}: ThreeDMapProps) => {
    const [isGlobe, setIsGlobe] = useState(false);
    const chartRef = useRef(null);
    const chartRender = useRef(null);
    const [citiesData, setCitiesData] = useState([]);

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
                            name: `${pop} people`,
                        };
                    }
                })
            )
            .then(setCitiesData);
    }, []);

    useEffect(() => {
        const root = am5.Root.new(chartRef.current);

        chartRender.current = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: isGlobe ? 'rotateY' : 'none',
                wheelY: 'none',
                projection: am5map.geoEqualEarth(),
                minZoomLevel: 0.5,
                maxZoomLevel: 16,
            })
        );

        root.setThemes([am5themes_Animated.new(root)]);

        const polygonSeries = chartRender.current.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldLow,
                exclude: ['AQ'],
            })
        );

        polygonSeries.useGeodata = true;

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: '{name}',
            toggleKey: 'active',
            interactive: true,
            fill: am5.color(0xcccccc),
            stroke: am5.color(0x000000),
        });

        polygonSeries.mapPolygons.template.states.create('hover', {
            fill: am5.color(0x555555),
        });

        polygonSeries.mapPolygons.template.states.create('active', {
            fill: am5.color(0xaaaaaa),
        });

        const polygonTemplate = polygonSeries.mapPolygons.template;
        polygonTemplate.tooltipText = '{name}';
        polygonTemplate.fill = am5.color('#ffffff');
        polygonTemplate.stroke = am5.color('#ffffff');
        polygonTemplate.strokeWidth = 0.5;

        const graticuleSeries = chartRender.current.series.insertIndex(
            0,
            am5map.GraticuleSeries.new(root, {})
        );

        graticuleSeries.mapLines.template.setAll({
            stroke: am5.color(0x000000),
            strokeOpacity: 0.08,
        });

        const backgroundSeries = chartRender.current.series.unshift(
            am5map.MapPolygonSeries.new(root, {})
        );

        backgroundSeries.mapPolygons.template.setAll({
            fill: am5.color(0xcccccc),
            stroke: am5.color(0x000000),
            strokeOpacity: 0.3,
        });

        backgroundSeries.data.push({
            geometry: am5map.getGeoRectangle(90, 180, -90, -180),
        });

        chartRender.current.animate({
            key: 'rotationX',
            from: 0,
            to: 360,
            duration: 90000,
            loops: Infinity,
        });

        // Create points
        const pointSeries = chartRender.current.series.push(
            am5map.MapPointSeries.new(root, {
                latitudeField: 'lat',
                longitudeField: 'lng',
            })
        );

        pointSeries.bullets.push(() => {
            const circle = am5.Circle.new(root, {
                radius: 2,
                fill: am5.color(0x4544ff),
                tooltipText: '{name}',
            });

            circle.events.on('click', ev => {
                // @ts-ignore
                if (ev.target?._dataItem?.dataContext) {
                    circle.set('active', true);
                    rotateGlobe(
                        // @ts-ignore
                        ev.target._dataItem.dataContext.lng,
                        // @ts-ignore
                        ev.target._dataItem.dataContext.lat
                    );
                }
            });

            return am5.Bullet.new(root, {
                sprite: circle,
            });
        });

        pointSeries.data.setAll(citiesData);

        let previousPolygon = null;

        let isZooming = false;

        polygonSeries.mapPolygons.template.on('active', (active, target) => {
            if (previousPolygon && previousPolygon != target) {
                previousPolygon.set('active', false);
            }
            isZooming = false;

            const centroid = target.geoCentroid();
            if (target.get('active')) {
                if (centroid) {
                    isZooming = true;
                    rotateGlobe(centroid.longitude, centroid.latitude);
                    setTimeout(() => {
                        chartRender.current.zoomToGeoPoint(
                            { longitude: centroid.longitude, latitude: centroid.latitude },
                            4.5,
                            true,
                            500
                        );
                    }, 500);
                }
            } else if (!target.get('active')) {
                console.log(3, isZooming);
                if (previousPolygon == target && !isZooming) {
                    chartRender.current.zoomToGeoPoint(
                        { longitude: centroid.longitude, latitude: centroid.latitude },
                        1,
                        true,
                        1000
                    );

                    // isZoomed = false;
                }
            }

            previousPolygon = target;
        });

        return () => {
            root.dispose();
        };
    }, [isGlobe, citiesData]);

    const rotateGlobe = useCallback(
        (x, y) => {
            chartRender.current.animate({
                key: 'rotationX',
                to: -x,
                duration: 500,
                easing: am5.ease.inOut(am5.ease.cubic),
            });

            if (isGlobe) {
                chartRender.current.animate({
                    key: 'rotationY',
                    to: -y,
                    duration: 500,
                    easing: am5.ease.inOut(am5.ease.cubic),
                });
            }
        },
        [isGlobe]
    );

    useEffect(() => {
        if (chartRender.current) {
            chartRender.current.set(
                'projection',
                isGlobe ? am5map.geoOrthographic() : am5map.geoEqualEarth()
            );
        }
    }, [isGlobe]);

    return (
        <>
            <div className={styles.spacer}>
                <h1>Scroll down</h1>
            </div>
            <section className={styles.flatMap}>
                <div
                    ref={chartRef}
                    style={{
                        width: '100%',
                        height: '80vh',
                    }}
                />

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
            <div className={styles.spacer}></div>
        </>
    );
};

export default FlatMap;
