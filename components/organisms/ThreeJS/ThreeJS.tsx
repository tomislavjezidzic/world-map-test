import styles from './ThreeJS.module.scss';
import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import locationsData from '@public/share_my_GPS_timeline_since_may_2024-reduced.json';

import globeTexture from '@public/images/world.jpg';

import { GeoJsonGeometry } from 'three-geojson-geometry';

import continentData from './data/continents.json';

import * as d3 from 'd3';

interface ThreeJSProps {}

/*
const canvasW = 1024;
const canvasH = 512;

function getPXfromLatLng(lat, lon) {
    // Convert longitude to [0,1] range, then multiply by canvas width
    let posX = (lon + 180) / 360 * canvasW;


    // Convert lat to [0,1] range, then multiply by canvas height
    let posY = (lat + 90) / 180 * canvasH;

    return { x: posX, y: posY };
}

function getPXfromLatLng(lat, lon) {
        let posX = ((lat + 180.0) * (canvasW / 360.0));
        let posY = (((lon * -1.0) + 90.0) * (canvasH / 180.0));
        return { x: posX, y: posY };
}
 */

const ThreeJS = ({}: ThreeJSProps) => {
    const $globeRef = useRef<HTMLDivElement>(null);
    const $baseGeometry = useRef(null);
    const $point = useRef(null);
    const $points = useRef(null);
    const $scene = useRef(null);
    const $camera = useRef(null);
    const $renderer = useRef(null);
    const $mesh = useRef(null);
    const $overRenderer = useRef(null);
    const $curZoomSpeed = useRef(0);
    const $distanceTarget = useRef(100000);
    const $distance = useRef(1000000);
    const $rotation = useRef({ x: 0, y: 0 });
    const $target = useRef({ x: (Math.PI * 3) / 2, y: Math.PI / 6.0 });
    const $targetOnDown = useRef({ x: 0, y: 0 });
    const $mouse = useRef({ x: 0, y: 0 });
    const $mouseOnDown = useRef({ x: 0, y: 0 });
    const $PI_HALF = useRef(Math.PI / 2);

    const animate = useCallback(() => {
        requestAnimationFrame(animate);
        render();
    }, [$camera?.current, $scene.current]);

    const addPoint = useCallback(
        (lat: number, lng: number, subGeo: any) => {
            if (!$point?.current) return;

            const phi = ((90 - lat) * Math.PI) / 180;
            const theta = ((180 - lng) * Math.PI) / 180;

            $point.current.position.x = 200 * Math.sin(phi) * Math.cos(theta);
            $point.current.position.y = 200 * Math.cos(phi);
            $point.current.position.z = 200 * Math.sin(phi) * Math.sin(theta);

            $point.current.lookAt($mesh.current.position);

            $point.current.scale.z = 0.1;
            $point.current.updateMatrix();

            if ($point.current.matrixAutoUpdate) {
                $point.current.updateMatrix();
            }

            subGeo.merge($point.current.geometry, $point.current.matrix);
        },
        [$point.current]
    );

    const addData = useCallback((data: string | any[]) => {
        const addDataLoop = (index: number) => {
            if (index >= data.length) {
                return;
            }
            const subGeo = new THREE.Geometry();

            for (let i = 0; i < data.length; i++) {
                const lat = data[i].lat;
                const lng = data[i].lng;
                addPoint(lat, lng, subGeo);
            }

            if (!$baseGeometry.current) {
                $baseGeometry.current = subGeo;
            }
        };

        addDataLoop(0);
        createPoints();
    }, []);

    const createPoints = useCallback(() => {
        if (!$scene?.current) return;
        $points.current = new THREE.Mesh(
            $baseGeometry.current,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x3FDBBA),
                side: THREE.BackSide,
            })
        );

        $scene.current.add($points.current);
    }, [$baseGeometry.current]);

    const zoom = useCallback((delta: number) => {
        $distanceTarget.current -= delta;
        $distanceTarget.current = $distanceTarget.current > 1100 ? 1100 : $distanceTarget.current;
        $distanceTarget.current = $distanceTarget.current < 350 ? 350 : $distanceTarget.current;
    }, []);

    const render = useCallback(() => {
        if (!$camera?.current) return;

        zoom($curZoomSpeed.current);

        $rotation.current.x += ($target.current.x - $rotation.current.x) * 0.1;
        $rotation.current.y += ($target.current.y - $rotation.current.y) * 0.1;

        $distance.current += ($distanceTarget.current - $distance.current) * 0.8;

        $camera.current.position.x =
            $distance.current * Math.sin($rotation.current.x) * Math.cos($rotation.current.y);
        $camera.current.position.y = $distance.current * Math.sin($rotation.current.y);
        $camera.current.position.z =
            $distance.current * Math.cos($rotation.current.x) * Math.cos($rotation.current.y);

        $camera.current.lookAt($mesh.current.position);

        $renderer.current.render($scene.current, $camera.current);
    }, [$camera.current, $scene.current]);

    const onMouseDown = useCallback((event: any) => {
        event.preventDefault();

        $globeRef.current.addEventListener('mousemove', onMouseMove, false);
        $globeRef.current.addEventListener('mouseup', onMouseUp, false);
        $globeRef.current.addEventListener('mouseout', onMouseOut, false);

        $mouseOnDown.current.x = -event.clientX;
        $mouseOnDown.current.y = event.clientY;

        $targetOnDown.current.x = $target.current.x;
        $targetOnDown.current.y = $target.current.y;

        $globeRef.current.style.cursor = 'move';
    }, []);

    const onMouseMove = useCallback((event: any) => {
        $mouse.current.x = -event.clientX;
        $mouse.current.y = event.clientY;

        let zoomDamp = $distance.current / 1000;

        $target.current.x =
            $targetOnDown.current.x +
            ($mouse.current.x - $mouseOnDown.current.x) * 0.005 * zoomDamp;
        $target.current.y =
            $targetOnDown.current.y +
            ($mouse.current.y - $mouseOnDown.current.y) * 0.005 * zoomDamp;

        $target.current.y =
            $target.current.y > $PI_HALF.current ? $PI_HALF.current : $target.current.y;

        $target.current.x =
            $target.current.x > $PI_HALF.current ? $PI_HALF.current : $target.current.x;
    }, []);

    const onMouseUp = useCallback(() => {
        $globeRef.current.removeEventListener('mousemove', onMouseMove, false);
        $globeRef.current.removeEventListener('mouseup', onMouseUp, false);
        $globeRef.current.removeEventListener('mouseout', onMouseOut, false);
        $globeRef.current.style.cursor = 'auto';
    }, []);

    const onMouseOut = useCallback(() => {
        $globeRef.current.removeEventListener('mousemove', onMouseMove, false);
        $globeRef.current.removeEventListener('mouseup', onMouseUp, false);
        $globeRef.current.removeEventListener('mouseout', onMouseOut, false);
    }, []);

    const onWindowResize = useCallback(() => {
        $camera.current.aspect = $globeRef.current.offsetWidth / $globeRef.current.offsetHeight;
        $camera.current.updateProjectionMatrix();
        $renderer.current.setSize($globeRef.current.offsetWidth, $globeRef.current.offsetHeight);
    }, []);

    const createContinents = useCallback(() => {
        const lineObjs = [
            new THREE.LineSegments(
                new GeoJsonGeometry(d3.geoGraticule10(), 199.5),
                new THREE.LineBasicMaterial({ color: 0x575654 })
            ),
        ];

        const material = new THREE.LineBasicMaterial({ color: 0x3fdbed });

        continentData.features.forEach((feature: any) => {
            const continent = new THREE.LineSegments(
                new GeoJsonGeometry(feature.geometry, 201),
                material
            );

            continent.rotation.y = -Math.PI / 2;

            lineObjs.push(continent);
        });

        lineObjs.forEach(obj => $scene.current.add(obj));
    }, []);

    const Globe = useCallback(() => {
        const w = $globeRef.current.offsetWidth || window.innerWidth;
        const h = $globeRef.current.offsetHeight || window.innerHeight;

        $camera.current = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
        $camera.current.position.z = $distance.current;

        $scene.current = new THREE.Scene();

        const geometry = new THREE.SphereGeometry(199, 40, 30);

        const material = new THREE.MeshBasicMaterial({
            color: 0x1b1b1b,
            // map: new THREE.TextureLoader().load(globeTexture.src),
            // transparent: true,
            // opacity: 0,
        });

        $mesh.current = new THREE.Mesh(geometry, material);
        $mesh.current.rotation.y = Math.PI;
        $scene.current.add($mesh.current);

        const pointGeometry = new THREE.PlaneGeometry(1, 1);
        $point.current = new THREE.Mesh(pointGeometry);

        $renderer.current = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        $renderer.current.setSize(w, h);

        $globeRef.current.appendChild($renderer.current.domElement);

        $globeRef.current.addEventListener('mousedown', onMouseDown, false);

        // window.addEventListener("resize", onWindowResize, false);

        $globeRef.current.addEventListener(
            'mouseover',
            () => {
                $overRenderer.current = true;
            },
            false
        );

        $globeRef.current.addEventListener(
            'mouseout',
            () => {
                $overRenderer.current = false;
            },
            false
        );

        createContinents();
    }, [$point, $scene]);

    useEffect(() => {
        if (!locationsData || !locationsData.length) return;

        if (!$globeRef) return;

        Globe();

        const batchSize = 10000;

        const splitData = [];
        for (let i = 0; i < locationsData.length; i += batchSize) {
            splitData.push(locationsData.slice(i, i + batchSize));
        }

        addData(locationsData);
        animate();
    }, []);

    return (
        <div>
            <div ref={$globeRef}></div>
        </div>
    );
};

export default ThreeJS;
