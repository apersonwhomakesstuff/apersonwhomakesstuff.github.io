export function checkCircularCollision(obj1, obj2) {
    const distance = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
    return distance < (obj1.radius + obj2.radius);
}

export function keepEntityInBounds(entity, canvasWidth, canvasHeight) {
    entity.x = Math.max(entity.radius, Math.min(canvasWidth - entity.radius, entity.x));
    entity.y = Math.max(entity.radius, Math.min(canvasHeight - entity.radius, entity.y));
}

