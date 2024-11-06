'use client';
import styles from './FlatMap.module.scss';
import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

import * as am5 from '@amcharts/amcharts5';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';

import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ThreeDMapProps {}

const FlatMap = ({}: ThreeDMapProps) => {
    const [isGlobe, setIsGlobe] = useState(false);
    const chartRef = useRef(null);
    const chartRender = useRef(null);

    useEffect(() => {
        const root = am5.Root.new(chartRef.current);

        chartRender.current = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: 'none',
                wheelY: 'none',
                projection: am5map.geoEqualEarth(),
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
                longitudeField: 'long',
            })
        );

        pointSeries.bullets.push(() => {
            const circle = am5.Circle.new(root, {
                radius: 5,
                fill: am5.color(0x4544ff),
                tooltipText: '{name}',
            });

            circle.events.on('click', ev => {
                if (ev.target?._dataItem?.dataContext) {
                    circle.set('active', true);
                    rotateGlobe(
                        ev.target._dataItem.dataContext.long,
                        ev.target._dataItem.dataContext.lat
                    );
                }
            });

            return am5.Bullet.new(root, {
                sprite: circle,
            });
        });

        pointSeries.data.setAll([
            {
                long: -73.778137,
                lat: 40.641312,
                name: 'Location 1',
            },
            {
                long: -0.454296,
                lat: 51.47002,
                name: 'Location 2',
            },
            {
                long: 116.597504,
                lat: 40.072498,
                name: 'Location 3',
            },
        ]);

        let previousPolygon = null;

        polygonSeries.mapPolygons.template.on('active', (active, target) => {
            if (previousPolygon && previousPolygon != target) {
                previousPolygon.set('active', false);
            }
            if (target.get('active')) {
                const centroid = target.geoCentroid();
                if (centroid) {
                    rotateGlobe(centroid.longitude, centroid.latitude);
                }
            }

            previousPolygon = target;
        });

        return () => {
            root.dispose();
        };
    }, [isGlobe]);

    const rotateGlobe = useCallback(
        (x, y) => {
            chartRender.current.animate({
                key: 'rotationX',
                to: -x,
                duration: 1500,
                easing: am5.ease.inOut(am5.ease.cubic),
            });

            if (isGlobe) {
                chartRender.current.animate({
                    key: 'rotationY',
                    to: -y,
                    duration: 1500,
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
