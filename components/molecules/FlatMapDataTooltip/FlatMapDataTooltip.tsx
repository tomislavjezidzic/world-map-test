import styles from './FlatMapDataTooltip.module.scss';
import cn from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface FlatMapDataTooltipProps {
    isActive: boolean;
    rotateGlobe?: (lat: any, lng: any, zoom: any) => void;
    position?: { x: number; y: number };
}

const FlatMapDataTooltip = ({
    isActive = false,
    rotateGlobe,
    position,
}: FlatMapDataTooltipProps) => {
    const textsRef = useRef([null]);
    const content = useRef(null);
    const [isOpened, setIsOpened] = useState(false);

    const openTooltip = useCallback(() => {
        if (isOpened) return;
        setIsOpened(true);

        let height = 0;

        gsap.set(textsRef.current, {
            autoAlpha: 0,
        });

        gsap.set(content.current, {
            width: 320,
            height: 'auto',
            onComplete: () => {
                height = content.current.offsetHeight;
                gsap.set(content.current, {
                    height: 24,
                    width: 24,
                    onComplete: () => {
                        gsap.timeline()
                            .to(content.current, {
                                width: 320,
                            })
                            .to(
                                content.current,
                                {
                                    height: height,
                                },
                                '-=0.1'
                            )
                            .to(
                                textsRef.current,
                                {
                                    autoAlpha: 1,
                                    stagger: 0.07,
                                },
                                '-=0.3'
                            );
                    },
                });
            },
        });
    }, [isOpened]);

    const closeTooltip = useCallback(() => {
        if (!isOpened) return;
        setIsOpened(false);

        gsap.timeline({
            onComplete: () => {
                rotateGlobe(0, 0, true);
            },
        })
            .to(textsRef.current, {
                autoAlpha: 0,
                stagger: {
                    each: 0.03,
                    from: 'end',
                },
            })
            .to(
                content.current,
                {
                    height: 24,
                },
                '-=0.2'
            )
            .to(
                content.current,
                {
                    width: 24,
                },
                '-=0.1'
            );
    }, [isOpened, rotateGlobe]);

    useEffect(() => {
        if (position.x) {
            openTooltip();
        } else {
            closeTooltip();
        }
    }, [position]);

    const setRef = useCallback(
        (el: HTMLElement, key: number) => {
            void (textsRef.current[key] = el);
        },
        [textsRef]
    );

    return (
        <div
            className={cn(styles.wrapper, {
                [styles.isActive]: isActive,
            })}
            onClick={() => closeTooltip()}
        >
            <div
                className={styles.main}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                }}
            >
                <div className={styles.marker}></div>

                <div className={styles.content} ref={content}>
                    <div className={styles.contentInner}>
                        <h3 ref={el => setRef(el, 0)}>Europe</h3>

                        <p ref={el => setRef(el, 1)}>
                            Austria, Belgium, Bulgaria, Croatia, Republic of Cyprus, Czech Republic,
                            Denmark, Estonia, Finland, France, Germany, Greece.
                        </p>

                        <ul>
                            <li ref={el => setRef(el, 2)}>
                                <p>Unique humans</p>

                                <span>6,805,424</span>
                            </li>

                            <li ref={el => setRef(el, 3)}>
                                <p>World App users</p>

                                <span>15,154,506</span>
                            </li>

                            <li ref={el => setRef(el, 4)}>
                                <p>Wallet transactions</p>

                                <span>151,217,997</span>
                            </li>

                            <li ref={el => setRef(el, 5)}>
                                <p>Active Orbs</p>

                                <span>500</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlatMapDataTooltip;
