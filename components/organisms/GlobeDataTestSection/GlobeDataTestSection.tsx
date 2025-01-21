import styles from './GlobeDataTestSection.module.scss';
import cn from 'classnames';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useCallback, useRef, useState } from 'react';

interface GlobeDataTestSectionProps {
    play?: boolean;
}

const GlobeDataTestSection = ({ play = false }: GlobeDataTestSectionProps) => {
    const [isPlayed, setIsPlayed] = useState(false);

    const countAnimation = useCallback((element, delay) => {
        const num = parseFloat(element.innerHTML.replace(/\,/g, ''));
        let startNum = 0;
        let increment = 1;

        if (num > 999) {
            increment = 10;
            startNum = num - 999;
        } else if (num > 99) {
            increment = 5;
            startNum = num - 99;
        }

        element.innerText = startNum;

        increment = Math.floor(increment);

        gsap.to(element, {
            autoAlpha: 1,
            delay: delay,
            duration: 1,
        });

        gsap.to(element, {
            duration: 1,
            delay: delay,
            innerText: num,
            modifiers: {
                innerText: function (innerText) {
                    return gsap.utils
                        .snap(increment, innerText)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                },
            },
        });
    }, []);

    useGSAP(() => {
        gsap.set('.js-fade-item', {
            autoAlpha: 0,
            y: 30,
        });

        gsap.set('.js-counter-item', {
            autoAlpha: 0,
        });

        if (play && !isPlayed) {
            setIsPlayed(true);
            gsap.fromTo(
                '.js-fade-item',
                {
                    autoAlpha: 0,
                    y: 30,
                },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1,
                    ease: 'expo.out',
                    stagger: function (index, target, list) {
                        const element = target.querySelector('.js-counter-item');
                        let delay = index * 0.09;

                        index !== 0 ? (delay = delay + 0.2) : delay;

                        countAnimation(element, delay);

                        return delay;
                    },
                }
            );
        }
    }, [play]);

    return (
        <section className={cn('o-section', styles.wrapper)}>
            <div className={styles.stats}>
                <div className={styles.statsColBig}>
                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={cn('u-a1', 'u-fw-400')}>Unique humans</span>

                        <p className={'u-a4'}>
                            <span className="js-counter-item">6,805,424</span>
                        </p>
                    </div>
                </div>

                <div className={styles.statsColNormal}>
                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Tokens distributed</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">359,571,818</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>New accounts in last 7 days</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">805,569</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Daily wallet transactions</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">803,955</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Total wallet transactions</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">178,571,360</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>World App users</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">18,128,672</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Unique human verifications in last 7 days</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">310,234</span>
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Countries with World ID users</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">160</span>+
                        </p>
                    </div>

                    <div className={cn(styles.row, 'js-fade-item')}>
                        <span className={'u-b1'}>Active Orbs</span>

                        <p className={'u-a2'}>
                            <span className="js-counter-item">1,073</span>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GlobeDataTestSection;
