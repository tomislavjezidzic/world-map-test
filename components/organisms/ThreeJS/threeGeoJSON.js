/* Draw GeoJSON

Iterates through the latitude and longitude values, converts the values to XYZ coordinates,
and draws the geoJSON geometries.

*/

import * as THREE from 'three';

let x_values = [];
let y_values = [];
let z_values = [];

export default class threeGeoJSON {
    constructor(scene) {
        this.scene = scene;
    }

    drawThreeGeo(json, radius, shape, options) {
        const json_geom = this.createGeometryArray(json, shape);
        //An array to hold the feature geometries.
        const convertCoordinates = this.getConversionFunctionName(shape);
        //Whether you want to convert to spherical or planar coordinates.
        let coordinate_array = [];
        //Re-usable array to hold coordinate values. This is necessary so that you can add

        const line_material = new THREE.LineBasicMaterial({
            color: options.color || 'red',
        });

        //interpolated coordinates. Otherwise, lines go through the sphere instead of wrapping around.

        for (let geom_num = 0; geom_num < json_geom.length; geom_num++) {
            if (json_geom[geom_num].type === 'Point') {
                convertCoordinates(json_geom[geom_num].coordinates, radius, options);
                this.drawParticle(y_values[0], z_values[0], x_values[0], options);
            } else if (json_geom[geom_num].type === 'MultiPoint') {
                for (
                    let point_num = 0;
                    point_num < json_geom[geom_num].coordinates.length;
                    point_num++
                ) {
                    convertCoordinates(json_geom[geom_num].coordinates[point_num], radius, options);
                    this.drawParticle(y_values[0], z_values[0], x_values[0], options);
                }
            } else if (json_geom[geom_num].type === 'LineString') {
                coordinate_array = this.createCoordinateArray(
                    json_geom[geom_num].coordinates,
                    options
                );

                for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                    convertCoordinates(coordinate_array[point_num], radius, options);
                }
                this.drawLine(y_values, z_values, x_values, options, line_material);
            } else if (
                json_geom[geom_num].type === 'MultiLineString' ||
                json_geom[geom_num].type === 'Polygon'
            ) {
                for (
                    let segment_num = 0;
                    segment_num < json_geom[geom_num].coordinates.length;
                    segment_num++
                ) {
                    coordinate_array = this.createCoordinateArray(
                        json_geom[geom_num].coordinates[segment_num]
                    );

                    for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                        convertCoordinates(coordinate_array[point_num], radius, options);
                    }
                    this.drawLine(y_values, z_values, x_values, options, line_material);
                }
            } else if (json_geom[geom_num].type === 'MultiPolygon') {
                for (
                    let polygon_num = 0;
                    polygon_num < json_geom[geom_num].coordinates.length;
                    polygon_num++
                ) {
                    for (
                        let segment_num = 0;
                        segment_num < json_geom[geom_num].coordinates[polygon_num].length;
                        segment_num++
                    ) {
                        coordinate_array = this.createCoordinateArray(
                            json_geom[geom_num].coordinates[polygon_num][segment_num]
                        );

                        for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                            convertCoordinates(coordinate_array[point_num], radius, options);
                        }
                        this.drawLine(y_values, z_values, x_values, options, line_material);
                    }
                }
            } else {
                throw new Error('The geoJSON is not valid.');
            }
        }
    }

    createGeometryArray(json, shape) {
        let geometry_array = [];

        if (json.type === 'Feature') {
            geometry_array.push(json.geometry);
        } else if (json.type === 'FeatureCollection') {
            for (let feature_num = 0; feature_num < json.features.length; feature_num++) {
                if (
                    (shape === 'plane' && json.features[feature_num].id !== 'antarctica') ||
                    shape === 'sphere'
                ) {
                    geometry_array.push(json.features[feature_num].geometry);
                }
            }
        } else if (json.type === 'GeometryCollection') {
            for (let geom_num = 0; geom_num < json.geometries.length; geom_num++) {
                geometry_array.push(json.geometries[geom_num]);
            }
        } else {
            throw new Error('The geoJSON is not valid.');
        }
        //alert(geometry_array.length);
        return geometry_array;
    }

    getConversionFunctionName(shape) {
        let conversionFunctionName;

        if (shape === 'sphere') {
            conversionFunctionName = this.convertToSphereCoords;
        } else if (shape === 'plane') {
            conversionFunctionName = this.convertToPlaneCoords;
        } else {
            throw new Error('The shape that you specified is not valid.');
        }
        return conversionFunctionName;
    }

    createCoordinateArray(feature) {
        //Loop through the coordinates and figure out if the points need interpolation.
        let temp_array = [];
        let interpolation_array = [];

        for (let point_num = 0; point_num < feature.length; point_num++) {
            let point1 = feature[point_num];
            let point2 = feature[point_num - 1];

            if (point_num > 0) {
                if (this.needsInterpolation(point2, point1)) {
                    interpolation_array = [point2, point1];
                    interpolation_array = this.interpolatePoints(interpolation_array);

                    for (
                        let inter_point_num = 0;
                        inter_point_num < interpolation_array.length;
                        inter_point_num++
                    ) {
                        temp_array.push(interpolation_array[inter_point_num]);
                    }
                } else {
                    temp_array.push(point1);
                }
            } else {
                temp_array.push(point1);
            }
        }
        return temp_array;
    }

    needsInterpolation(point2, point1) {
        //If the distance between two latitude and longitude values is
        //greater than five degrees, return true.
        let lon1 = point1[0];
        let lat1 = point1[1];
        let lon2 = point2[0];
        let lat2 = point2[1];
        let lon_distance = Math.abs(lon1 - lon2);
        let lat_distance = Math.abs(lat1 - lat2);

        if (lon_distance > 5 || lat_distance > 5) {
            return true;
        } else {
            return false;
        }
    }

    interpolatePoints(interpolation_array) {
        //This function is recursive. It will continue to add midpoints to the
        //interpolation array until needsInterpolation() returns false.
        let temp_array = [];
        let point1, point2;

        for (let point_num = 0; point_num < interpolation_array.length - 1; point_num++) {
            point1 = interpolation_array[point_num];
            point2 = interpolation_array[point_num + 1];

            if (this.needsInterpolation(point2, point1)) {
                temp_array.push(point1);
                temp_array.push(this.getMidpoint(point1, point2));
            } else {
                temp_array.push(point1);
            }
        }

        temp_array.push(interpolation_array[interpolation_array.length - 1]);

        if (temp_array.length > interpolation_array.length) {
            temp_array = this.interpolatePoints(temp_array);
        } else {
            return temp_array;
        }
        return temp_array;
    }

    getMidpoint(point1, point2) {
        let midpoint_lon = (point1[0] + point2[0]) / 2;
        let midpoint_lat = (point1[1] + point2[1]) / 2;
        let midpoint = [midpoint_lon, midpoint_lat];

        return midpoint;
    }

    convertToSphereCoords(coordinates_array, sphere_radius) {
        let lon = coordinates_array[0];
        let lat = coordinates_array[1];

        x_values.push(
            Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180) * sphere_radius
        );
        y_values.push(
            Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180) * sphere_radius
        );
        z_values.push(Math.sin((lat * Math.PI) / 180) * sphere_radius);
    }

    convertToPlaneCoords(coordinates_array, radius, options) {
        let lon = coordinates_array[0];
        let lat = coordinates_array[1];

        z_values.push(lat * (options.height / 2 / 180.0));
        y_values.push(lon * (options.width / 2 / 360.0));
    }

    drawParticle(x, y, z, options) {
        let particle_geom = new THREE.Geometry();
        particle_geom.vertices.push(new THREE.Vector3(x, y, z));

        let particle_material = new THREE.ParticleSystemMaterial(options);

        let particle = new THREE.ParticleSystem(particle_geom, particle_material);
        this.scene.add(particle);

        this.clearArrays();
    }

    drawLine(x_values, y_values, z_values, options, line_material) {
        // container
        let objEl = new THREE.Object3D();

        // lines
        let line_geom = new THREE.Geometry();
        this.createVertexForEachPoint(line_geom, x_values, y_values, z_values);

        let line = new THREE.Line(line_geom, line_material);
        line.name = options.name || '';
        objEl.add(line);

        // mesh
        let mesh_geom = new THREE.Geometry();
        this.createVertexForEachPoint(mesh_geom, x_values, y_values, z_values);
        let mesh_material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
        });
        let mesh = new THREE.Mesh(mesh_geom, mesh_material);

        objEl.add(mesh);
        this.scene.add(objEl);
        this.clearArrays();
    }

    createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
        for (let i = 0; i < values_axis1.length; i++) {
            object_geometry.vertices.push(
                new THREE.Vector3(values_axis1[i] || 0, values_axis2[i] || 0, values_axis3[i] || 0)
            );

            object_geometry.faces.push(new THREE.Face3(0, i, i)); // <- add faces
        }
    }

    clearArrays() {
        x_values.length = 0;
        y_values.length = 0;
        z_values.length = 0;
    }
}
