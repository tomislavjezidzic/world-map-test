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

    useGSAP(() => {
        if ($element.current) {
            gsap.set($element.current, {
                autoAlpha: 0,
            });

            const num = parseFloat($element.current.innerHTML.replace(/\,/g, ''));
            let startNum = 0;
            let increment = 1;

            if (num > 999) {
                increment = 10;
                startNum = num - 999;
            } else if (num > 99) {
                increment = 5;
                startNum = num - 99;
            }

            $element.current.innerText = startNum;

            increment = Math.floor(increment);

            ScrollTrigger.create({
                trigger: $element.current,
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    gsap.to($element.current, {
                        autoAlpha: 1,
                        duration: 1,
                    });

                    gsap.to($element.current, {
                        duration: 1,
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
                },
            });
        }
    }, []);

    return <span ref={$element}>{children}</span>;
};

export default Counter;
