import React from 'react';
import KeplerGl from 'kepler.gl';
import { ReactReduxContext } from 'react-redux';

const Kepler = () => {
    return (
        <ReactReduxContext.Consumer>
            {({ store }) => (
                <KeplerGl
                    id="map"
                    width={window.innerWidth}
                    mapboxApiAccessToken={
                        'pk.eyJ1IjoiaXRzdG9tbyIsImEiOiJjbTNwcHNkbnQwaTZoMmlxdHV3ZXMwZ2Z3In0.-Imy9Bt3moYYSOgr2VSHpw'
                    }
                    height={window.innerHeight}
                    store={store}
                />
            )}
        </ReactReduxContext.Consumer>
    );
};

export default Kepler;
