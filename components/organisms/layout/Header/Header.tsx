import styles from './Header.module.scss';
import cn from 'classnames';

export interface HeaderProps {
    title: string;
    subtitle?: string;
    centered?: boolean;
    full?: boolean;
}

const Header = ({ title, centered = false, subtitle, full }: HeaderProps) => {
    return (
        title && (
            <header
                className={cn(styles.main, 'o-header', {
                    [styles.centered]: centered,
                    [styles.full]: full,
                })}
            >
                <div className="o-container">
                    <h1 className={cn(styles.title, 'u-a5')}>{title}</h1>

                    {subtitle && <p className={cn(styles.subtitle, 'u-a3')}>{subtitle}</p>}
                </div>
            </header>
        )
    );
};

export default Header;
