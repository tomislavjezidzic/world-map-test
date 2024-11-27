import styles from './ThreeJSMapDataTooltip.module.scss';
import cn from 'classnames';
import { useGSAP } from '@gsap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface ThreeJSMapDataTooltipProps {
    isActive: boolean;
    isFlat?: boolean;
    isLoaded?: boolean;
    name?: string;
    canvasDimensions?: {
        width: number;
        height: number;
    };
    data?: {
        countries?: string[];
        humans?: string;
        users?: string;
        transactions?: string;
        orbs?: string;
    };
}

const ThreeJSMapDataTooltip = ({
    isActive = false,
    isFlat = false,
    isLoaded = false,
    canvasDimensions,
    data = null,
    name,
}: ThreeJSMapDataTooltipProps) => {
    const $mainWrapper = useRef(null);
    const $content = useRef(null);
    const $texts = useRef([null]);
    const [isRight, setIsRight] = useState(false);
    const [isBottom, setIsBottom] = useState(false);

    const open = useCallback(() => {
        let height = 0;

        gsap.set($texts.current, {
            autoAlpha: 0,
        });

        gsap.set($content.current, {
            height: 'auto',
            delay: isFlat ? 0 : 0.8,
            onComplete: () => {
                height = $content.current.clientHeight;

                gsap.set($content.current, {
                    height: 0,
                    onComplete: () => {
                        gsap.to($content.current, {
                            height: height,
                        });

                        gsap.to($texts.current, {
                            autoAlpha: 1,
                            stagger: 0.07,
                        });
                    },
                });
            },
        });
    }, []);

    const close = useCallback(() => {
        gsap.to($content.current, {
            height: 0,
        });

        gsap.to($texts.current, {
            autoAlpha: 0,
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

    const setRef = useCallback(
        (el: HTMLElement, key: number) => {
            void ($texts.current[key] = el);
        },
        [$texts]
    );

    useEffect(() => {
        if (isFlat && isLoaded) {
            const box = $mainWrapper?.current.getBoundingClientRect();
            if (box.x > canvasDimensions.width / 2) {
                setIsRight(true);
            }

            if (box.y > canvasDimensions.height / 2) {
                setIsBottom(true);
            }
        }
    }, [isFlat, canvasDimensions, isLoaded]);

    return (
        <div
            ref={$mainWrapper}
            className={cn(styles.wrapper, {
                [styles.isRight]: isRight,
                [styles.isBottom]: isBottom,
            })}
        >
            <div className={styles.main}>
                <div
                    className={cn(styles.marker, {
                        [styles.isActive]: isActive,
                    })}
                ></div>

                {data && (
                    <div className={styles.content} ref={$content}>
                        <div className={styles.contentInner}>
                            <h3 className={styles.continent} ref={el => setRef(el, 0)}>
                                {name}
                            </h3>

                            <p className={styles.countries} ref={el => setRef(el, 1)}>
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
                )}
            </div>
        </div>
    );
};

export default ThreeJSMapDataTooltip;
