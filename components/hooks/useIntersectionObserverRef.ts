import { useEffect, useCallback, useState, useRef } from 'react';

type CallbackRef<T extends HTMLElement | null = HTMLElement | null> = (node: T) => void;

const config: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: [0, 1],
};

/**
 *
 * useIntersectionObserverRef hook
 *
 * Returns a mutation observer for a React Ref and fires a callback
 *
 * @param {IntersectionObserverCallback} callback Function that needs to be fired on mutation
 * @param {IntersectionObserverInit} options
 * @see https://rooks.vercel.app/docs/useIntersectionObserverRef
 */
function useIntersectionObserverRef(
    callback: IntersectionObserverCallback | undefined,
    options: IntersectionObserverInit = config
): [CallbackRef] {
    const { root = null, rootMargin, threshold } = options;

    const [node, setNode] = useState<HTMLElement | null>(null);

    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    });

    const handleIntersectionObserver = useCallback<IntersectionObserverCallback>((...args) => {
        return callbackRef.current?.(...args);
    }, []);

    useEffect(() => {
        // Create an observer instance linked to the callback function
        if (node) {
            const observer = new IntersectionObserver(handleIntersectionObserver, {
                root,
                rootMargin,
                threshold,
            });

            // Start observing the target node for configured mutations
            observer.observe(node);

            return () => {
                observer.disconnect();
            };
        }

        return () => {};
    }, [node, handleIntersectionObserver, root, rootMargin, threshold]);

    const ref = useCallback((nodeElement: HTMLElement | null) => {
        setNode(nodeElement);
    }, []);

    return [ref];
}

export { useIntersectionObserverRef };
