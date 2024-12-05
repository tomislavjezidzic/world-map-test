import styles from './Navigation.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from 'classnames';

export interface NavigationProps {}

const Navigation = ({}: NavigationProps) => {
    const pathname = usePathname();

    return (
        <>
            <div className={styles.main}>
                <div className={styles.top}>
                    <div className="o-container">
                        <div className={styles.inner}>
                            <nav className={styles.navigation}>
                                <ul className={styles.navigationList}>
                                    <li
                                        className={cn(styles.navigationItem, {
                                            [styles.isActive]: pathname === '/flat-example',
                                        })}
                                    >
                                        <Link href="/flat-example">AmChart 5 Example</Link>
                                    </li>
                                    <li
                                        className={cn(styles.navigationItem, {
                                            [styles.isActive]: pathname === '/threejs-example',
                                        })}
                                    >
                                        <Link href="/threejs-example">ThreeJS Example</Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navigation;
