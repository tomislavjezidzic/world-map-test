import styles from './Navigation.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import Icon from '@atoms/Icons';
import Favorites from '@organisms/Favorites';
import Search from '@atoms/Search';

export interface NavigationProps {}

const Navigation = ({}: NavigationProps) => {
    const [favoritesOpened, setFavoritesOpened] = useState(false);
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

                                    <li
                                        className={cn(styles.navigationItem, {
                                            [styles.isActive]: pathname === '/most-watched',
                                        })}
                                    >
                                        <Link href="/most-watched">Most Watched</Link>
                                    </li>
                                </ul>
                            </nav>

                            <div className={styles.actions}>
                                <button
                                    className={cn(styles.favorited, {
                                        [styles.isActive]: favoritesOpened,
                                    })}
                                    onClick={() => setFavoritesOpened(!favoritesOpened)}
                                >
                                    <span>
                                        <Icon name="heartFill" />
                                    </span>
                                </button>

                                <div className={styles.search}>
                                    <Search />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {favoritesOpened && <Favorites />}
        </>
    );
};

export default Navigation;
