import * as THREE from 'three';

let xValues = [];
let yValues = [];
let zValues = [];

/**
 * Draws GeoJSON line data onto a sphere/plane.
 *
 * Every line of a single `drawThreeGeo` call is merged into one indexed
 * `THREE.LineSegments`, so a whole layer (continents, graticules) costs a
 * single draw call instead of one per ring/segment.
 */
export default class ThreeGeoJSON {
    constructor(scene) {
        this.scene = scene;
    }

    drawThreeGeo(jsonData, radius, shape, options) {
        const geometryArray = this.createGeometryArray(jsonData);
        const conversionFunction = this.getConversionFunctionName(shape);
        const positions = [];
        const indices = [];

        const addLine = coordinates => {
            const coordinateArray = this.createCoordinateArray(coordinates);
            for (const point of coordinateArray) {
                conversionFunction(point, radius, options);
            }
            this.appendLine(yValues, zValues, xValues, positions, indices);
            this.clearArrays();
        };

        for (const geometry of geometryArray) {
            switch (geometry.type) {
                case 'LineString':
                    addLine(geometry.coordinates);
                    break;
                case 'MultiLineString':
                case 'Polygon':
                    for (const segment of geometry.coordinates) {
                        addLine(segment);
                    }
                    break;
                case 'MultiPolygon':
                    for (const polygon of geometry.coordinates) {
                        for (const segment of polygon) {
                            addLine(segment);
                        }
                    }
                    break;
                default:
                    throw new Error(`Unsupported geoJSON type: ${geometry.type}`);
            }
        }

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        lineGeometry.setIndex(indices);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: options.color || 'red',
        });

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        lines.name = options.name || '';
        this.scene.add(lines);

        return lines;
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

    createCoordinateArray(feature) {
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

    /**
     * Appends one polyline to the shared buffers as consecutive index pairs,
     * which renders identically to a `THREE.Line` strip.
     */
    appendLine(xValues, yValues, zValues, positions, indices) {
        const offset = positions.length / 3;

        for (let index = 0; index < xValues.length; index++) {
            positions.push(xValues[index] ?? 0, yValues[index] ?? 0, zValues[index] ?? 0);

            if (index > 0) {
                indices.push(offset + index - 1, offset + index);
            }
        }
    }

    clearArrays() {
        xValues.length = 0;
        yValues.length = 0;
        zValues.length = 0;
    }
}
