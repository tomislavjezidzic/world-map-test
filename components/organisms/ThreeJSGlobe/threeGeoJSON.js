import * as THREE from 'three';

let xValues = [];
let yValues = [];
let zValues = [];

export default class threeGeoJSON {
    constructor(scene) {
        this.scene = scene;
    }

    drawThreeGeo(jsonData, radius, shape, options) {
        const geometryArray = this.createGeometryArray(jsonData);
        const conversionFunction = this.getConversionFunctionName(shape);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: options.color || 'red',
        });

        for (const geometry of geometryArray) {
            switch (geometry.type) {
                case 'Point':
                    conversionFunction(geometry.coordinates, radius, options);
                    this.drawParticle(yValues[0], zValues[0], xValues[0], options);
                    break;
                case 'MultiPoint':
                    for (const point of geometry.coordinates) {
                        conversionFunction(point, radius, options);
                        this.drawParticle(yValues[0], zValues[0], xValues[0], options);
                    }
                    break;
                case 'LineString':
                    const coordinateArray = this.createCoordinateArray(geometry.coordinates, options);
                    for (const point of coordinateArray) {
                        conversionFunction(point, radius, options);
                    }
                    this.drawLine(yValues, zValues, xValues, options, lineMaterial);
                    break;
                case 'MultiLineString':
                case 'Polygon':
                    for (const segment of geometry.coordinates) {
                        const coordinateArray = this.createCoordinateArray(segment, options);
                        for (const point of coordinateArray) {
                            conversionFunction(point, radius, options);
                        }
                        this.drawLine(yValues, zValues, xValues, options, lineMaterial);
                    }
                    break;
                case 'MultiPolygon':
                    for (const polygon of geometry.coordinates) {
                        for (const segment of polygon) {
                            const coordinateArray = this.createCoordinateArray(segment, options);
                            for (const point of coordinateArray) {
                                conversionFunction(point, radius, options);
                            }
                            this.drawLine(yValues, zValues, xValues, options, lineMaterial);
                        }
                    }
                    break;
                default:
                    throw new Error('Invalid geoJSON type');
            }
        }
    }

    createGeometryArray(geoJson) {
        const geometryArray = [];

        switch (geoJson.type) {
            case 'Feature':
                geometryArray.push(geoJson.geometry);
                break;
            case 'FeatureCollection':
                for (const feature of geoJson.features) {
                    geometryArray.push(feature.geometry);
                }
                break;
            case 'GeometryCollection':
                for (const geometry of geoJson.geometries) {
                    geometryArray.push(geometry);
                }
                break;
            default:
                throw new Error('Invalid geoJSON type');
        }

        return geometryArray;
    }

    getConversionFunctionName(shape) {
        const conversionFunction = {
            sphere: this.convertToSphereCoords,
            plane: this.convertToPlaneCoords,
        }[shape];

        if (!conversionFunction) {
            throw new Error(`Invalid shape: ${shape}`);
        }

        return conversionFunction;
    }

    createCoordinateArray(feature, options) {
        const coordinates = [];

        for (let i = 0; i < feature.length; i++) {
            const currentPoint = feature[i];
            const previousPoint = feature[i - 1];

            if (i > 0 && this.needsInterpolation(previousPoint, currentPoint)) {
                const interpolationPoints = this.interpolatePoints([previousPoint, currentPoint]);
                coordinates.push(...interpolationPoints);
            } else {
                coordinates.push(currentPoint);
            }
        }

        return coordinates;
    }

    needsInterpolation(point2, point1) {
        const longitude1 = point1[0];
        const latitude1 = point1[1];
        const longitude2 = point2[0];
        const latitude2 = point2[1];

        return Math.abs(longitude1 - longitude2) > 5 || Math.abs(latitude1 - latitude2) > 5;
    }

    interpolatePoints(interpolationArray) {
        const interpolatedPoints = [];

        for (let i = 0; i < interpolationArray.length - 1; i++) {
            const currentPoint = interpolationArray[i];
            const nextPoint = interpolationArray[i + 1];

            if (this.needsInterpolation(nextPoint, currentPoint)) {
                interpolatedPoints.push(currentPoint, this.getMidpoint(currentPoint, nextPoint));
            } else {
                interpolatedPoints.push(currentPoint);
            }
        }

        interpolatedPoints.push(interpolationArray[interpolationArray.length - 1]);

        if (interpolatedPoints.length > interpolationArray.length) {
            return this.interpolatePoints(interpolatedPoints);
        }

        return interpolatedPoints;
    }

    getMidpoint(point1, point2) {
        const longitude = (point1[0] + point2[0]) / 2;
        const latitude = (point1[1] + point2[1]) / 2;
        return [longitude, latitude];
    }

    convertToSphereCoords(coordinates, radius) {
        const [longitude, latitude] = coordinates;

        const x =
            Math.cos(latitude * (Math.PI / 180)) * Math.cos(longitude * (Math.PI / 180)) * radius;
        const y =
            Math.cos(latitude * (Math.PI / 180)) * Math.sin(longitude * (Math.PI / 180)) * radius;
        const z = Math.sin(latitude * (Math.PI / 180)) * radius;

        xValues.push(x);
        yValues.push(y);
        zValues.push(z);
    }

    convertToPlaneCoords(coordinates, radius, options) {
        const longitude = coordinates[0];
        const latitude = coordinates[1];

        zValues.push(latitude * (options.height / 2 / 180.0));
        yValues.push(longitude * (options.width / 2 / 360.0));
    }

    drawParticle(x, y, z, particleOptions) {
        const particleGeometry = new THREE.Geometry();
        particleGeometry.vertices.push(new THREE.Vector3(x, y, z));

        const particleMaterial = new THREE.ParticleSystemMaterial(particleOptions);

        const particleSystem = new THREE.ParticleSystem(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);

        this.clearArrays();
    }

    drawLine(xValues, yValues, zValues, options, lineMaterial) {
        const lineContainer = new THREE.Object3D();
        const lineGeometry = new THREE.Geometry();
        this.createVerticesForGeometry(lineGeometry, xValues, yValues, zValues);

        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.name = options.name || '';
        lineContainer.add(line);

        const meshGeometry = new THREE.Geometry();
        this.createVerticesForGeometry(meshGeometry, xValues, yValues, zValues);
        const meshMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(meshGeometry, meshMaterial);

        lineContainer.add(mesh);
        this.scene.add(lineContainer);
        this.clearArrays();
    }

    createVerticesForGeometry(geometry, xValues, yValues, zValues) {
        for (let index = 0; index < xValues.length; index++) {
            const vertex = new THREE.Vector3(xValues[index] ?? 0, yValues[index] ?? 0, zValues[index] ?? 0);
            geometry.vertices.push(vertex);
            geometry.faces.push(new THREE.Face3(0, index, index));
        }
    }

    clearArrays() {
        xValues.length = 0;
        yValues.length = 0;
        zValues.length = 0;
    }
}
