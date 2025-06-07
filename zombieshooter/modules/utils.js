// Utility functions for the game
export function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

