import styles from './Navigation.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';

export interface NavigationProps {}

const Navigation = ({}: NavigationProps) => {
    const navBar = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        if (navBar.current) {
            const navBarHeight = navBar.current.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--navigation-height', navBarHeight + 'px');
        }
    }, [navBar]);

    return (
        <>
            <div className={styles.main}>
                <div className={styles.top} ref={navBar}>
                    <div className="o-container">
                        <div className={styles.inner}>
                            <nav className={styles.navigation}>
                                <ul className={styles.navigationList}>
                                    <li
                                        className={cn(styles.navigationItem, {
                                            [styles.isActive]: pathname === '/',
                                        })}
                                    >
                                        <Link href="/">Home</Link>
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
