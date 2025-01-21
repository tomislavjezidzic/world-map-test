import styles from './FadeIn.module.scss';
import { ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import gsap from 'gsap';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface FadeInProps {
    children: ReactNode;
    trigger?: string;
}

const FadeIn = ({ children, trigger = '80%' }: FadeInProps) => {
    const $element = useRef(null);

    useGSAP(() => {
        if ($element.current) {
            gsap.set($element.current, {
                autoAlpha: 0,
                y: 30,
            });

            ScrollTrigger.create({
                trigger: $element.current,
                start: `top ${trigger}`,
                once: true,
                onEnter: () => {
                    gsap.fromTo(
                        $element.current,
                        {
                            autoAlpha: 0,
                            y: 30,
                        },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 1,
                            ease: 'expo.out',
                        }
                    );
                },
            });
        }
    }, []);

    return (
        <span ref={$element} className={styles.main}>
            {children}
        </span>
    );
};

export default FadeIn;
