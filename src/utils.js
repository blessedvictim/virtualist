import React from "react";
import ReactDOM from "react-dom";

const predefinedContainerStyle = {
    display: "block",
    top: 0,
    left: 0,
    position: "absolute",
    visibility: "hidden",
    zIndex: -1,
    width: "100%"
};

// TODO set container width, current version don't work!
export const measureElement = async (key, element, containerStyle) => {
    // Creates the hidden div appended to the document body
    const container = document.createElement("div");
    const tempStyle = {
        ...predefinedContainerStyle,
        ...containerStyle
    };
    container.style.position = tempStyle.position;
    container.style.visibility = tempStyle.visibility;
    container.style.zIndex = tempStyle.zIndex;
    container.style.top = tempStyle.top;
    container.style.left = tempStyle.left;
    container.style.width = tempStyle.width;

    document.body.appendChild(container);

    // Renders the React element into the hidden div
    await ReactDOM.render(element, container);
    // Gets the element size
    const height = container.clientHeight;
    const width = container.clientWidth;
    // Removes the element and its wrapper from the document
    ReactDOM.unmountComponentAtNode(container);
    container.parentNode.removeChild(container);
    return {key, height, width};
};

export const ifThenElse = (cond, funcPositive, funcNegative) => {
    if (cond()) {
        return () => funcPositive();
    } else {
        return () => funcNegative();
    }
};

export const findFirstElementIndex = (elements, offset) => {
    let left = 0;
    let right = elements.length;
    let mid = 0;

    while (!(left >= right)) {
        mid = left + right / 2;// Why not?

        if (elements[mid].offset + elements[mid].height > offset)
            return mid;

        if (elements[mid].offset + elements[mid].height < offset)
            right = mid;
        else
            left = mid + 1;
    }

    return -(1 + left);
};

export function findFirstIndex(arr, cond, startIndex = 0) {
    for (let i = startIndex; i < arr.length; i++) {
        if (cond(arr[i])) {
            return i;
        }
    }
}

export function createEmptyCacheObject() {
    return {
        cached: [],
        estimatedTotalSize: 0,
        scrollTop: 0,
        clientHeight: 0
    }
}