import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FlatMapDataTooltip.module.scss';
import cn from 'classnames';
import gsap from 'gsap';

interface FlatMapDataTooltipProps {
    isActive: boolean;
    isAnimating: boolean;
    setIsAnimating: (value: boolean) => void;
    rotateGlobe?: (lat: number, lng: number, zoom: boolean) => void;
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
    isAnimating = false,
    setIsAnimating,
    isActive = false,
    rotateGlobe,
    position,
    data = null,
}: FlatMapDataTooltipProps) => {
    const $texts = useRef([null]);
    const $content = useRef(null);
    const $main = useRef(null);
    const $marker = useRef(null);
    const [isOpened, setIsOpened] = useState(false);

    const openTooltip = useCallback(() => {
        if (isOpened || !isActive) return;
        setIsOpened(true);

        let height = 0;

        gsap.set([$texts.current, $content.current], {
            autoAlpha: 0,
        });

        gsap.set($main.current, {
            x: position.x,
            y: position.y,
        });

        const offsetRight = -(position.x + 24 - window.innerWidth);

        let offsetToLeft = 0;

        if (offsetRight < 320) {
            offsetToLeft = (320 - offsetRight) / 2;
        }

        gsap.set($content.current, {
            width: 320,
            height: 'auto',
            onComplete: () => {
                height = $content.current.offsetHeight;
                gsap.set($content.current, {
                    height: 24,
                    width: 24,
                    onComplete: () => {
                        gsap.set($content.current, {
                            autoAlpha: 1,
                        });

                        gsap.timeline()
                            .add('start')
                            .to(
                                $content.current,
                                {
                                    width: 320,
                                },
                                'start'
                            )
                            .to(
                                $main.current,
                                {
                                    x: position.x - offsetToLeft,
                                },
                                'start'
                            )
                            .to(
                                $marker.current,
                                {
                                    x: offsetToLeft,
                                },
                                'start'
                            )
                            .to(
                                $content.current,
                                {
                                    height: height,
                                },
                                '-=0.1'
                            )
                            .to(
                                $texts.current,
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
    }, [isOpened, isActive, position]);

    const closeTooltip = useCallback(() => {
        if (!isOpened || isAnimating) return;

        setIsAnimating(true);

        gsap.timeline({
            overwrite: true,
            onComplete: () => {
                rotateGlobe(0, 0, true);
            },
        })
            .to($texts.current, {
                autoAlpha: 0,
                overwrite: true,
                stagger: {
                    each: 0.03,
                    from: 'end',
                },
            })
            .to(
                $content.current,
                {
                    height: 24,
                    overwrite: true,
                },
                '-=0.2'
            )
            .add('end', '-=0.1')
            .to(
                $main.current,
                {
                    overwrite: true,
                    x: position.x,
                },
                'end'
            )
            .to(
                $marker.current,
                {
                    overwrite: true,
                    x: 0,
                },
                'end'
            )
            .to(
                $content.current,
                {
                    width: 24,
                    onComplete: () => {
                        setIsOpened(false);
                    },
                },
                'end'
            );
    }, [isOpened, rotateGlobe, isAnimating]);

    useEffect(() => {
        if (position.x) {
            openTooltip();
        } else {
            closeTooltip();
        }
    }, [position]);

    const setRef = useCallback(
        (el: HTMLElement, key: number) => {
            void ($texts.current[key] = el);
        },
        [$texts]
    );

    const escFunction = useCallback(
        (event: { key: string }) => {
            if (event.key === 'Escape') {
                closeTooltip();
            }
        },
        [isOpened]
    );

    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);

        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, [isOpened]);

    return (
        <div
            className={cn(styles.wrapper, {
                [styles.isActive]: isOpened,
            })}
            onClick={() => closeTooltip()}
            style={{ pointerEvents: isAnimating ? 'none' : isActive ? 'auto' : 'none' }}
        >
            <div className={styles.main} ref={$main}>
                <div className={styles.marker} ref={$marker}></div>

                <div className={styles.content} ref={$content}>
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
