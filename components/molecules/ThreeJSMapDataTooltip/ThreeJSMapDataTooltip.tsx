import cn from 'classnames';
import styles from './ThreeJSMapDataTooltip.module.scss';
import { memo, useCallback, useRef } from 'react';

// GSAP
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useIsMobile } from '@hooks/useIsMobile';

interface ThreeJSMapDataTooltipProps {
    isActive: boolean;
    name?: string;
    data?: {
        countries?: string;
        humans?: string;
        users?: string;
        transactions?: string;
        tokens?: string;
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
    const isMobile = useIsMobile();

    // Elements revealed with a stagger, queried fresh so the list always matches the DOM
    const getTextElements = () =>
        $content.current.querySelectorAll('[data-reveal]') as NodeListOf<HTMLElement>;

    const handleOpen = useCallback(() => {
        if (!$content.current) return;

        const textElements = getTextElements();
        let height = 0;

        gsap.set(textElements, {
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

                        gsap.to(textElements, {
                            autoAlpha: 1,
                            delay: 0.1,
                            stagger: 0.07,
                        });
                    },
                });
            },
        });
    }, []);

    const handleClose = useCallback(() => {
        if (!$content.current) return;

        gsap.to($content.current, {
            height: 0,
        });

        gsap.to(getTextElements(), {
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
                            {name && (
                                <h3 className={styles.continent} data-reveal>
                                    {name}
                                </h3>
                            )}

                            {data?.countries && (
                                <p className={styles.countries} data-reveal>
                                    {data.countries}.
                                </p>
                            )}

                            <ul>
                                {data?.humans && (
                                    <li data-reveal>
                                        <p>Unique humans</p>

                                        <span>{data.humans}</span>
                                    </li>
                                )}

                                {data?.users && (
                                    <li data-reveal>
                                        <p>World App users</p>

                                        <span>{data.users}</span>
                                    </li>
                                )}

                                {data?.tokens && (
                                    <li data-reveal>
                                        <p>Tokens distributed</p>

                                        <span>{data.tokens}</span>
                                    </li>
                                )}

                                {!isMobile && (
                                    <>
                                        {data?.transactions && (
                                            <li data-reveal>
                                                <p>Wallet transactions</p>

                                                <span>{data.transactions}</span>
                                            </li>
                                        )}

                                        {data?.orbs && (
                                            <li data-reveal>
                                                <p>Active Orbs</p>
                                                <span>{data.orbs}</span>
                                            </li>
                                        )}
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ThreeJSMapDataTooltip);
