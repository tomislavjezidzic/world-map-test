import cn from 'classnames';
import styles from './ThreeJSMapDataTooltip.module.scss';
import { useCallback, useRef } from 'react';

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
    const $textRefs = useRef<HTMLElement[]>([]);
    const isMobile = useIsMobile();

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
                            delay: 0.1,
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
        (el: HTMLElement) => {
            if (!$textRefs.current) return;

            void $textRefs.current.push(el);
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
                            {name && (
                                <h3 className={styles.continent} ref={el => setRef(el)}>
                                    {name}
                                </h3>
                            )}

                            {data?.countries && (
                                <p className={styles.countries} ref={el => setRef(el)}>
                                    {data.countries}.
                                </p>
                            )}

                            <ul>
                                {data?.humans && (
                                    <li ref={el => setRef(el)}>
                                        <p>Unique humans</p>

                                        <span>{data.humans}</span>
                                    </li>
                                )}

                                {data?.users && (
                                    <li ref={el => setRef(el)}>
                                        <p>World App users</p>

                                        <span>{data.users}</span>
                                    </li>
                                )}

                                {data?.tokens && (
                                    <li ref={el => setRef(el)}>
                                        <p>Tokens distributed</p>

                                        <span>{data.tokens}</span>
                                    </li>
                                )}

                                {!isMobile && (
                                    <>
                                        {data?.transactions && (
                                            <li ref={el => setRef(el)}>
                                                <p>Wallet transactions</p>

                                                <span>{data.transactions}</span>
                                            </li>
                                        )}

                                        {data?.orbs && (
                                            <li ref={el => setRef(el)}>
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

export default ThreeJSMapDataTooltip;
