import styles from './Counter.module.scss';
import { ReactNode, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import gsap from 'gsap';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface CounterProps {
    children: ReactNode;
}

const Counter = ({ children }: CounterProps) => {
    const $element = useRef(null);

    const numberWithCommas = useCallback(x => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }, []);

    useGSAP(() => {
        if ($element.current) {
            gsap.set($element.current, {
                autoAlpha: 0,
            });

            const num = parseFloat($element.current.innerHTML.replace(/\,/g, ''));
            $element.current.innerText = 0;

            let increment = 1;

            if (num > 10000) {
                increment = num / 10000;
            } else if (num > 1000) {
                increment = num / 1000;
            } else if (num > 100) {
                increment = num / 100;
            }

            increment = Math.floor(increment);

            ScrollTrigger.create({
                trigger: $element.current,
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    gsap.to($element.current, {
                        autoAlpha: 1,
                    });

                    gsap.to($element.current, {
                        duration: 2,
                        innerText: num,
                        // snap: { innerText: increment },
                        modifiers: {
                            innerText: function (innerText) {
                                return gsap.utils
                                    .snap(increment, innerText)
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            },
                        },
                    });
                },
            });
        }
    }, []);

    return <span ref={$element}>{children}</span>;
};

export default Counter;
