//@input float movementSpeed = 0.1

var transform = script.getSceneObject().getTransform();

function onUpdate() {
    var hand = global.handTracking.getHand();

    if (hand === undefined) {
        return;
    }

    // Detect index and middle finger tips' positions
    var indexTip = hand.indexFinger.tip.position;
    var middleTip = hand.middleFinger.tip.position;

    // Place the base of the cone on the line between index and middle finger tips
    updateConePosition(indexTip, middleTip);

    // Align the head of the cone in the direction of the index finger
    alignConeHead(indexTip, middleTip);
}

function updateConePosition(indexTip, middleTip) {
    // Calculate the midpoint between the index and middle finger tips
    var midPoint = {
        x: (indexTip.x + middleTip.x) / 1.75,
        y: (indexTip.y + middleTip.y) / 1.75,
        z: (indexTip.z + middleTip.z) / 1.75
    };

    // Set the position of the cone to the midpoint
    transform.setWorldPosition(new vec3(midPoint.x, midPoint.y, midPoint.z));
}

function alignConeHead(indexTip, middleTip) {
    // Calculate the vector pointing from the midpoint to the index finger tip
    var direction = {
        x: indexTip.x - middleTip.x,
        y: indexTip.y - middleTip.y,
        z: indexTip.z - middleTip.z
    };

    // Normalize the direction vector
    var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    direction.x /= magnitude;
    direction.y /= magnitude;
    direction.z /= magnitude;

    // Convert direction vector to vec3 for the rotation calculation
    var targetDir = new vec3(direction.x, direction.y, direction.z);

    // Set a reference up direction to avoid roll rotation (assuming Y-axis is up)
    var up = vec3.up(); 

    // Calculate the rotation quaternion to align the cone's head with the direction of the index finger
    var rotation = quat.lookAt(targetDir, up);
    transform.setWorldRotation(rotation);
}

script.createEvent("UpdateEvent").bind(onUpdate);
