import styles from './ThreeJSMapDataTooltip.module.scss';
import cn from 'classnames';
import { useGSAP } from '@gsap/react';
import { useCallback, useRef } from 'react';
import gsap from 'gsap';

interface ThreeJSMapDataTooltipProps {
    isActive: boolean;
    name?: string;
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
    data = null,
    name,
}: ThreeJSMapDataTooltipProps) => {
    const $mainWrapper = useRef(null);
    const $content = useRef(null);
    const $textRefs = useRef<HTMLElement[]>([]);

    const handleOpen = useCallback(() => {
        if (!$content.current || !$textRefs.current) return;

        let height = 0;

        gsap.set($textRefs.current, {
            autoAlpha: 0,
        });

        gsap.set($content.current, {
            height: 'auto',
            delay: 0.8,
            onComplete: () => {
                height = $content.current.clientHeight;

                gsap.set($content.current, {
                    height: 0,
                    onComplete: () => {
                        gsap.to($content.current, {
                            height: height,
                        });

                        gsap.to($textRefs.current, {
                            autoAlpha: 1,
                            stagger: 0.07,
                        });
                    },
                });
            },
        });
    }, []);

    const handleClose = useCallback(() => {
        if (!$content.current || !$textRefs.current) return;

        gsap.to($content.current, {
            height: 0,
        });

        gsap.to($textRefs.current, {
            autoAlpha: 0,
        });
    }, []);

    useGSAP(() => {
        if (!$content.current) return;

        if (isActive) {
            handleOpen();
        } else {
            handleClose();
        }
    }, [isActive]);

    const setRef = useCallback(
        (el: HTMLElement, key: number) => {
            if (!$textRefs.current) return;

            void ($textRefs.current[key] = el);
        },
        [$textRefs]
    );

    return (
        <div ref={$mainWrapper} className={styles.wrapper}>
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
