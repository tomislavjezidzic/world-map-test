import styles from './ThreeJS.module.scss';
import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import locationsData from '@public/share_my_GPS_timeline_since_may_2024-reduced.json';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
    const $controls = useRef(null);
    const $camera = useRef(null);
    const $renderer = useRef(null);
    const $mesh = useRef(null);
    const $curZoomSpeed = useRef(0);
    const $distanceTarget = useRef(100000);
    const $distance = useRef(1000000);
    const $rotation = useRef({ x: 0, y: 0 });
    const $target = useRef({ x: (Math.PI * 3) / 2, y: Math.PI / 6.0 });
    const $raycaster = useRef(new THREE.Raycaster());
    const $pointer = useRef(new THREE.Vector2());

    const animate = useCallback(() => {
        requestAnimationFrame(animate);
        $controls.current.update();
        render();
    }, [$camera?.current, $scene.current, $controls.current]);

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

    const addData = useCallback(data => {
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
                color: new THREE.Color(0x3fdbba),
                side: THREE.BackSide,
            })
        );

        $scene.current.add($points.current);
    }, [$baseGeometry.current]);

    const render = useCallback(() => {
        if (!$camera?.current) return;

        $distance.current += ($distanceTarget.current - $distance.current) * 0.8;

        $camera.current.lookAt($mesh.current.position);

        $renderer.current.render($scene.current, $camera.current);
    }, [$camera.current, $scene.current]);

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

            continent.name = feature.id;
            continent.rotation.y = -Math.PI / 2;

            lineObjs.push(continent);
        });

        lineObjs.forEach(obj => $scene.current.add(obj));
    }, []);

    const detectClick = useCallback(ev => {
        $pointer.current.x = (ev.clientX / $globeRef.current.offsetWidth) * 2 - 1;
        $pointer.current.y = -(ev.clientY / $globeRef.current.offsetHeight) * 2 + 1;

        $raycaster.current.setFromCamera($pointer.current, $camera.current);
        const intersects = $raycaster.current.intersectObjects($scene.current.children);

        for (let i = 0; i < intersects.length; i++) {
            // intersects[i].object.material.color.set(0xff0000);
            console.log(intersects[i].object.name);
        }
    }, []);

    const Globe = useCallback(() => {
        const w = $globeRef.current.offsetWidth || window.innerWidth;
        const h = $globeRef.current.offsetHeight || window.innerHeight;

        $camera.current = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
        $camera.current.position.z = 1100;
        $camera.current.position.y = 500;

        $scene.current = new THREE.Scene();

        const geometry = new THREE.SphereGeometry(199, 40, 30);

        const material = new THREE.MeshBasicMaterial({
            color: 0x1b1b1b,
        });

        $mesh.current = new THREE.Mesh(geometry, material);
        $mesh.current.rotation.y = Math.PI;
        $scene.current.add($mesh.current);

        const pointGeometry = new THREE.PlaneGeometry(1, 1);
        $point.current = new THREE.Mesh(pointGeometry);

        $renderer.current = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        $renderer.current.setSize(w, h);

        $globeRef.current.appendChild($renderer.current.domElement);

        // window.addEventListener("resize", onWindowResize, false);

        $controls.current = new OrbitControls($camera.current, $renderer.current.domElement);
        $controls.current.update();
        $controls.current.enableDamping = true;
        $controls.current.enableZoom = false;
        $controls.current.enablePan = false;
        $controls.current.dampingFactor = 0.05;
        $controls.current.screenSpacePanning = false;

        console.log(1);

        createContinents();
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
            <div ref={$globeRef} onClick={ev => detectClick(ev)}></div>
        </div>
    );
};

export default ThreeJS;
