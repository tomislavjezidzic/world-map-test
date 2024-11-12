import styles from './FlatMapDataTooltip.module.scss';
import Image from 'next/image';
import markerImage from '@public/images/marker.svg';
import cn from 'classnames';
import { useCallback } from 'react';

interface FlatMapDataTooltipProps {
    isActive: boolean;
    rotateGlobe?: (lat: any, lng: any, zoom: any) => void;
}

const FlatMapDataTooltip = ({ isActive = false, rotateGlobe }: FlatMapDataTooltipProps) => {
    return (
        <div
            className={cn(styles.wrapper, {
                [styles.isActive]: isActive,
            })}
            onClick={() => rotateGlobe(0, 0, true)}
        >
            <div className={styles.main}>
                <div className={styles.marker}></div>
            </div>
        </div>
    );
};

export default FlatMapDataTooltip;
