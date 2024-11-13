import styles from './FlatMapDataTooltip.module.scss';
import cn from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface FlatMapDataTooltipProps {
    isActive: boolean;
    rotateGlobe?: (lat: any, lng: any, zoom: any) => void;
    position?: { x: number; y: number };
    data?: {
        name: string;
        countries: string[];
        humans: string;
        users: string;
        transactions: string;
        orbs: string;
    };
}

const FlatMapDataTooltip = ({
    isActive = false,
    rotateGlobe,
    position,
    data = null,
}: FlatMapDataTooltipProps) => {
    const textsRef = useRef([null]);
    const content = useRef(null);
    const [isOpened, setIsOpened] = useState(false);

    const openTooltip = useCallback(() => {
        if (isOpened || !isActive) return;
        setIsOpened(true);

        let height = 0;

        gsap.set(textsRef.current, {
            autoAlpha: 0,
        });

        gsap.set(content.current, {
            width: 320,
            overwrite: true,
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
    }, [isOpened, isActive]);

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
                        <h3 ref={el => setRef(el, 0)} className={styles.continent}>
                            {data?.name}
                        </h3>

                        <p ref={el => setRef(el, 1)} className={styles.countries}>
                            {data?.countries?.join(', ')}.
                        </p>

                        <ul>
                            <li ref={el => setRef(el, 2)}>
                                <p>Unique humans</p>

                                <span>{data?.humans}</span>
                            </li>

                            <li ref={el => setRef(el, 3)}>
                                <p>World App users</p>

                                <span>{data?.users}</span>
                            </li>

                            <li ref={el => setRef(el, 4)}>
                                <p>Wallet transactions</p>

                                <span>{data?.transactions}</span>
                            </li>

                            <li ref={el => setRef(el, 5)}>
                                <p>Active Orbs</p>

                                <span>{data?.orbs}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlatMapDataTooltip;
