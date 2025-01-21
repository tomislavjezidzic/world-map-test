import styles from './GlobeDataTestSection.module.scss';
import cn from 'classnames';
import Counter from '@atoms/Counter';
import FadeIn from '@atoms/FadeIn';

interface GlobeDataTestSectionProps {}

const GlobeDataTestSection = ({}: GlobeDataTestSectionProps) => {
    return (
        <section className={cn('o-section', styles.wrapper)}>
            <div className={styles.stats}>
                <div className={styles.statsColBig}>
                    <FadeIn trigger="100%">
                        <div className={styles.row}>
                            <span className={cn('u-a1', 'u-fw-400')}>Unique humans</span>

                            <p className={'u-a4'}>
                                <Counter trigger="95%">6,805,424</Counter>
                            </p>
                        </div>
                    </FadeIn>
                </div>

                <div className={styles.statsColNormal}>
                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>Tokens distributed</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">359,571,818</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>New accounts in last 7 days</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">805,569</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>Daily wallet transactions</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">803,955</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>Total wallet transactions</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">178,571,360</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>World App users</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">18,128,672</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>
                                Unique human verifications in last 7 days
                            </span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">310,234</Counter>
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>Countries with World ID users</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">160</Counter>+
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn trigger="91%">
                        <div className={styles.row}>
                            <span className={'u-b1'}>Active Orbs</span>

                            <p className={'u-a2'}>
                                <Counter trigger="87%">1,073</Counter>
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default GlobeDataTestSection;
