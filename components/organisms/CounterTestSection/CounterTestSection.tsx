import styles from './CounterTestSection.module.scss';
import Counter from '@atoms/Counter';

interface CounterTestSectionProps {}

const CounterTestSection = ({}: CounterTestSectionProps) => {
    return (
        <section className={'o-section'}>
            <div className={styles.stats}>
                <div className={styles.statsColBig}>
                    <div className={styles.row}>
                        <span className={'u-a3'}>Unique humans</span>

                        <p className={'u-a5'}>
                            <Counter>6,805,424</Counter>
                        </p>
                    </div>
                </div>

                <div className={styles.statsColNormal}>
                    <div className={styles.row}>
                        <span className={'u-b0'}>Tokens distributed</span>

                        <p className={'u-a4'}>
                            <Counter>359,571,818</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>New accounts in last 7 days</span>

                        <p className={'u-a4'}>
                            <Counter>805,569</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>Daily wallet transactions</span>

                        <p className={'u-a4'}>
                            <Counter>803,955</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>Total wallet transactions</span>

                        <p className={'u-a4'}>
                            <Counter>178,571,360</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>World App users</span>

                        <p className={'u-a4'}>
                            <Counter>18,128,672</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>Unique human verifications in last 7 days</span>

                        <p className={'u-a4'}>
                            <Counter>310,234</Counter>
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>Countries with World ID users</span>

                        <p className={'u-a4'}>
                            <Counter>160</Counter>+
                        </p>
                    </div>

                    <div className={styles.row}>
                        <span className={'u-b0'}>Active Orbs</span>

                        <p className={'u-a4'}>
                            <Counter>1,073</Counter>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CounterTestSection;
