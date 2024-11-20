import styles from './Kepler.module.scss';
import KeplerGl from '@kepler.gl/components';
import { ReactReduxContext } from 'react-redux';

interface KeplerProps {}

const Kepler = ({}: KeplerProps) => {
    return (
        <div className={styles.main}>
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
        </div>
    );
};

export default Kepler;
