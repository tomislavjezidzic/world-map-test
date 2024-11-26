import styles from './ThreeJSMapDataTooltip.module.scss';
import cn from 'classnames';
import { useGSAP } from '@gsap/react';
import { useCallback, useRef } from 'react';
import gsap from 'gsap';

interface ThreeJSMapDataTooltipProps {
    isActive: boolean;
    data?: {
        name?: string;
        countries?: string[];
        humans?: string;
        users?: string;
        transactions?: string;
        orbs?: string;
    };
}

const ThreeJSMapDataTooltip = ({ isActive = false, data = null }: ThreeJSMapDataTooltipProps) => {
    const $content = useRef(null);

    const open = useCallback(() => {
        let height = 0;

        gsap.set($content.current, {
            height: 'auto',
            delay: 0.7,
            onComplete: () => {
                height = $content.current.clientHeight;

                gsap.set($content.current, {
                    height: 0,
                    onComplete: () => {
                        gsap.to($content.current, {


                            width: 320,
                            height: height,
                        });
                    },
                });
            },
        });
    }, []);

    const close = useCallback(() => {

        gsap.to($content.current, {
            width: 0,
            height: 0,
        });

    }, []);

    useGSAP(() => {
        if (!$content.current) return;

        if (isActive) {
            open();
        } else {
            close();
        }
    }, [isActive]);

    return (
        <div className={cn(styles.wrapper)}>
            <div className={styles.main}>
                <div className={styles.marker}></div>

                {data && (
                    <div className={styles.content} ref={$content}>
                        <div className={styles.contentInner}>
                            <h3 className={styles.continent}>{data?.name}</h3>

                            <p className={styles.countries}>{data?.countries?.join(', ')}.</p>

                            <ul>
                                <li>
                                    <p>Unique humans</p>

                                    <span>{data?.humans}</span>
                                </li>

                                <li>
                                    <p>World App users</p>

                                    <span>{data?.users}</span>
                                </li>

                                <li>
                                    <p>Wallet transactions</p>

                                    <span>{data?.transactions}</span>
                                </li>

                                <li>
                                    <p>Active Orbs</p>

                                    <span>{data?.orbs}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreeJSMapDataTooltip;
