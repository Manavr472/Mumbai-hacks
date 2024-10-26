//@input float maxScale = 1.5
//@input float minScale = 0.5
//@input float maxDistance = 30
//@input float movementSpeed = 0.1

var pinchActive = false;
var threshold = 3;
var startPos = {x: 0, y: 0, z: 0};
var startPosSet = false;
var lastHandPosition = null;

var transform = script.getSceneObject().getTransform();

function onUpdate() {
    var hand = global.handTracking.getHand();

    if (hand === undefined) {
        return;
    }

    if (global.pointerActive) {
        return;
    }

    detectPinch(hand);

    if (pinchActive) {
        scale(hand);
    } else {
        rotate(hand);
        move(hand);
    }
}

function detectPinch(hand) {
    var thumb = hand.thumb.tip.position;
    var finger = hand.indexFinger.tip.position;
    var distance = calculateDistance(thumb, finger);

    if (distance < threshold) {
        print("Pinch active");
        pinchActive = true;
        if (!startPosSet) {
            startPos = {
                x: hand.indexFinger.tip.position.x,
                y: hand.indexFinger.tip.position.y,
                z: hand.indexFinger.tip.position.z
            };
            startPosSet = true;
        }
    } else {
        pinchActive = false;
        startPosSet = false;
    }
}

function scale(hand) {
    var pos = hand.indexFinger.tip.position;
    var distance = calculateDistance(startPos, pos);
    var range = script.maxScale - script.minScale;
    var multiplier = range * (distance / script.maxDistance) + script.minScale;
    var scale = {x: multiplier, y: multiplier, z: multiplier};
    transform.setWorldScale(new vec3(scale.x, scale.y, scale.z));
}

function rotate(hand) {
    print("Rotating");
    transform.setWorldRotation(hand.rotation);
}

function move(hand) {
    var currentHandPosition = {
        x: hand.wrist.position.x,
        y: hand.wrist.position.y,
        z: hand.wrist.position.z
    };
    
    if (lastHandPosition !== null) {
        var movement = {
            x: (currentHandPosition.x - lastHandPosition.x) * script.movementSpeed,
            y: (currentHandPosition.y - lastHandPosition.y) * script.movementSpeed,
            z: (currentHandPosition.z - lastHandPosition.z) * script.movementSpeed
        };
        
        var currentPosition = transform.getWorldPosition();
        var newPosition = {
            x: currentPosition.x + movement.x,
            y: currentPosition.y + movement.y,
            z: currentPosition.z + movement.z
        };
        
        transform.setWorldPosition(new vec3(newPosition.x, newPosition.y, newPosition.z));
    }
    
    lastHandPosition = currentHandPosition;
}

function calculateDistance(pos1, pos2) {
    var dx = pos1.x - pos2.x;
    var dy = pos1.y - pos2.y;
    var dz = pos1.z - pos2.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

script.createEvent("UpdateEvent").bind(onUpdate);