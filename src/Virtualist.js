import React, {useCallback, useLayoutEffect, useReducer, useRef} from "react";
import {createEmptyCacheObject, findFirstIndex, ifThenElse, measureElement} from "./utils";

const processed = [];

const initialState = {
    estimatedTotalSize: 0,
    scrollTop: 0,
    clientHeight: 0
};

function reducer(state, action) {
    return {
        ...state,
        ...action
    }
}

let wasPrepended = false;
let wasChangedScrollTop = false;

const cache = new Map();

const getCache = (cacheId) => {
    if (cache.has(cacheId)) {
        return cache.get(cacheId);
    } else {
        const localCache = createEmptyCacheObject();
        cache.set(cacheId, localCache);
        return localCache;
    }
};
export default function Virtualist(props) {
    const {cacheId, data, rowRenderer, computeKey, scrollHandler, resizeClientHandler, resizeContentHandler, updateHandler, listRef} = props;
    const [state, setState] = useReducer(reducer, initialState);
    const _scrollingContainerRef = useRef(null);
    const _contentRef = useRef(null);
    const ro = useRef(null);
    const roContent = useRef(null);
    const isScrolling = false;
    const log = (str) => {
        console.log(str + " ||| " + " cacheId: " + cacheId + " || scrollTop: " + getCache(cacheId).scrollTop);
    };
    const onScroll = useCallback((e) => {
        log("onScroll");
        if (!wasPrepended) {
            getCache(cacheId).scrollTop = e.target.scrollTop;
            setState({
                scrollTop: e.target.scrollTop
            });
            log("onScroll");
        } else {
            wasPrepended = false;
        }
    }, [cacheId]);
    const onResize = useCallback((entries) => {
        log("onResize");
        if (resizeClientHandler) {
            resizeClientHandler(entries[0]);
        }
        getCache(cacheId).clientHeight = entries[0].contentRect.height;
        setState({
            clientHeight: entries[0].contentRect.height
        });
    }, []);
    const onResizeContent = useCallback((entries) => {
        if (resizeContentHandler && entries[0].contentRect.height > 0) {
            resizeContentHandler(entries[0].contentRect.height);
        }
    }, []);
    const setScrollTop = (scrollTop) => {
        log("setScrollTop");
        if (_scrollingContainerRef)
            _scrollingContainerRef.current.scrollTop = scrollTop;
        wasChangedScrollTop = true;
        getCache(cacheId).scrollTop = scrollTop;
        setState({
            scrollTop: scrollTop,
        });
    };
    useLayoutEffect(() => {
        log("update State");
        const cache = getCache(cacheId);
        if (state.scrollTop !== cache.scrollTop) {
            setScrollTop(cache.scrollTop);
            setState({...cache});
        }
    }, [cacheId]);
    useLayoutEffect(() => {
        if (updateHandler && !wasChangedScrollTop) {
            updateHandler()
        } else if (wasChangedScrollTop) {
            wasChangedScrollTop = false;
        }
    });
    useLayoutEffect(() => {
        listRef.current = {
            setScrollTop: setScrollTop
        };
        if (_contentRef.current) {
            roContent.current = new ResizeObserver(onResizeContent);
            roContent.current.observe(_contentRef.current);
        }
        if (_scrollingContainerRef.current) {
            _scrollingContainerRef.current.addEventListener("scroll", scrollHandler);
            ro.current = new ResizeObserver(onResize);
            ro.current.observe(_scrollingContainerRef.current);
            getCache(cacheId).clientHeight = _scrollingContainerRef.current.clientHeight;
            setState({
                clientHeight: _scrollingContainerRef.current.clientHeight
            });
        }
    }, []);
    const calculateDiff = () => {
        console.warn("Difference!!!")
    };
    const _deleteElement = (item) => {
        log("deleteElement");
        const {cached} = getCache(cacheId);
        const key = computeKey(item);
        const i = cached.findIndex(elem => elem.key === key);
        if (i >= 0) cached.splice(i, 1);
        let newTotalHeight = updateOffsets(i, 0, cached);
        setTotalHeight(newTotalHeight - state.estimatedTotalSize, newTotalHeight);
    };
    const updateOffsets = (startIndex, localSum, elements) => {
        log("updateOffsets");
        // Calculate new offsets
        let offset;
        if (startIndex === 0) {
            offset = 0;
        } else {
            offset = elements[startIndex - 1].offset + elements[startIndex - 1].height;
        }
        for (let i = startIndex; i < elements.length; i++) {
            elements[i].offset = offset;
            offset += elements[i].height;
        }
        return offset;
    };
    const setTotalHeight = (diff, totalHeight) => {
        log("setTotalHeight");
        if (props.mode === "prepend") {
            let top = 0;
            if (state.estimatedTotalSize > 0) {
                top = state.scrollTop + diff
            } else {
                top = state.scrollTop + diff - state.clientHeight;
            }
            getCache(cacheId).scrollTop = top;
            getCache(cacheId).estimatedTotalSize = totalHeight;
            setState({
                scrollTop: top,
                estimatedTotalSize: totalHeight
            });
            wasPrepended = true;
            _scrollingContainerRef.current.scrollTop = top;
        } else {
            getCache(cacheId).estimatedTotalSize = totalHeight;
            setState({
                estimatedTotalSize: totalHeight
            });
        }
    };
    const setCalculatedSize = (iterable, updateExisting = false) => {
        log("setCalculatedSize");
        // if (props.mode === "prepend")
        //     iterable = iterable.reverse();
        let localSum = 0;
        const {cached} = getCache(cacheId);
        let offset;
        if (!updateExisting) {
            // Add new cached in cache and calculate total height of added cached
            for (let elem of iterable) {
                const {key, height, width} = elem;

                if (props.mode === "prepend") {
                    cached.unshift(elem);
                } else {
                    cached.push(elem);
                }
                localSum += height;
            }
            offset = updateOffsets(props.mode === "prepend" ? 0 : cached.length - iterable.length, localSum, cached);
        } else {
            let elIndex;
            for (let elem of iterable) {
                const {key, height, width} = elem;
                elIndex = cached.findIndex(el => el.key === key);
                if (elIndex !== -1) cached[elIndex].height = height;
                else {
                    console.error("Fail while updateExisting height");
                    continue;
                }
                localSum += height - cached[elIndex].height;
            }
            offset = updateOffsets(elIndex, localSum, cached);
        }
        // Set total height
        setTotalHeight(localSum, offset);

    };
    const mapForMeasure = (item) => {
        let key = computeKey(item);
        processed.push(key);
        let component = rowRenderer(
            {
                reMeasure: () => {
                    console.log("measure!")
                },
                style: {
                    width: _scrollingContainerRef.current.clientWidth
                },
                data: item
            });
        return measureElement(key, component, {width: _scrollingContainerRef.current.clientWidth})
    };
    // TODO need use something other than setCalculatedSize(). Need to rework setCalculatedSize()
    const _reMeasure = (key) => {
        if (cache.has(cacheId)) {
            let item = data.find(elem => computeKey(elem) === key);
            // let item = cache.get(cacheId).find(elem => elem.key === key);
            if (item) {
                Promise.all([mapForMeasure(item)])
                    .then(iterable => {
                        setCalculatedSize(iterable, true);
                    });
            } else {
                console.error("You're trying re-measure not exist component !");
            }
        } else {
            console.error("You're trying re-measure component of not exists cache!");
        }
    };
    const measureNonMeasuredElements = () => {
        const {cached} = getCache(cacheId);
        if (data.length) {
            // if (props.mode === "append") {
            //     if (computeKey(data[data.length - 1]) !== cached[cached.length - 1]) {
            //
            //     }
            // }
            let start = performance.now();
            let filtered = [];
            if (data.length !== cached.length) {
                filtered = data
                    .filter(item => {
                        let computedKey = computeKey(item);
                        let cachedE;
                        if (cached) {
                            cachedE = cached.find(e => {
                                return e.key === computedKey
                            });
                        }
                        let processedE = processed.find(key => {
                            return key === computedKey
                        });
                        return processedE === undefined && cachedE === undefined;
                    });
            }
            let measurements = [];
            // console.log("measure:" + (performance.now() - start));
            if (filtered.length) {
                measurements = filtered.map(mapForMeasure);
            }
            if (measurements.length) {
                Promise.all(measurements)
                    .then(iterable => {
                        setCalculatedSize(iterable);
                    });
            }
        }
    };
    const getVisibleItems = (overscan) => {
        let {scrollTop, clientHeight} = state;
        const start = performance.now();
        let {cached} = getCache(cacheId);
        if (cached.length > data.length) {
            calculateDiff();
            cached = cached.filter(elem => data.findIndex(d => elem.key === computeKey(d)) !== -1);
            cache.set(cacheId, cached);
            let newTotalHeight = updateOffsets(0, 0, cached);
            setTotalHeight(newTotalHeight - state.estimatedTotalSize, newTotalHeight);
            // return [];
        }
        if (cached.length) {
            let firstIndex = cached.findIndex(elem => elem.offset + elem.height > scrollTop);
            firstIndex = firstIndex === -1 ? 0 : firstIndex;
            if (firstIndex !== -1) {
                let startI = firstIndex - overscan > 0 ? firstIndex - overscan : firstIndex;
                let lastIndex = findFirstIndex(cached, elem => elem.offset + elem.height > scrollTop + clientHeight, startI);
                let endI = !lastIndex ? cached.length : lastIndex + overscan > cached.length ? cached.length : lastIndex + overscan;
                return cached
                    .slice(startI, endI)
                    .map(element => {
                        const itemOfData = data.find(item => element.key === computeKey(item));
                        return rowRenderer({
                            deleteElement: _deleteElement,
                            reMeasure: _reMeasure,
                            style: {
                                top: element.offset,
                                position: "absolute",
                                left: 0,
                                width: "100%"
                            },
                            data: itemOfData
                        })
                    });
            }
        } else {
            return [];
        }

    };
    let items = [];
    if (_scrollingContainerRef.current) {
        measureNonMeasuredElements();
        items = getVisibleItems(2);
    }
    return (
        <div
            ref={_scrollingContainerRef}
            style={{
                position: 'relative',
                height: "100%",
                width: "100%",
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                willChange: 'transform',
                // ...style,
            }}
            onScroll={onScroll}
        >
            {
                React.createElement(
                    "div",
                    {
                        ref: _contentRef,
                        style: {
                            height: state.estimatedTotalSize || "100%",
                            overflow: 'hidden',
                            pointerEvents: isScrolling ? 'none' : '',
                            width: "100%",
                        }
                    },
                    ...items
                )
            }
        </div>
    );
}