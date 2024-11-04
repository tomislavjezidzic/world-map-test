import styles from './Footer.module.scss';

export interface FooterProps {}

const Footer = ({}: FooterProps) => {
    return (
        <footer className="o-footer">
            <div className="o-container">
                <div className={styles.main}>
                    <p>Copyright &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
