// @input float movementSpeed = 1
// @input float maxScale = 1.5
// @input float minScale = 0.5
// @input bool smoothMovement = true
// @input float smoothingFactor = 0.5 // Smoothing factor between 0 and 1
// @input Asset.Material outlineMaterial // Reference to the outline material

var transform = script.getSceneObject().getTransform(); // Transform of the aussen object
var aussenMeshRenderer = script.getSceneObject().getComponent("Component.MeshRenderer"); // Mesh renderer for outlines

// Store the previous position and rotation for smooth movement
var previousPosition = transform.getWorldPosition();
var previousRotation = transform.getWorldRotation();

function onUpdate() {
    var hand = global.handTracking.getHand();

    if (!hand) {
        return; // Exit if hand tracking is not detected
    }

    // Get index and middle finger tips' positions
    var indexTip = hand.indexFinger.tip.position;
    var middleTip = hand.middleFinger.tip.position;

    if (!indexTip || !middleTip) {
        return; // If either finger isn't detected, exit early
    }

    // Calculate midpoint between index and middle fingertips
    var midpoint = new vec3(
        (indexTip.x + middleTip.x) / 2,
        (indexTip.y + middleTip.y) / 2,
        (indexTip.z + middleTip.z) / 2
    );

    // Update object's position to the calculated midpoint smoothly
    updateObjectPosition(midpoint);

    // Align object using both finger positions smoothly
    alignWithFingerDirection(indexTip, middleTip);

    // Enable outline
    enableOutline(true);
}

function updateObjectPosition(position) {
    if (script.smoothMovement) {
        // Smoothly interpolate between the previous and current position
        previousPosition = vec3.lerp(previousPosition, position, script.smoothingFactor);
        transform.setWorldPosition(previousPosition);
    } else {
        // Directly set the position of the object to the provided position (midpoint)
        transform.setWorldPosition(position);
    }
}

function alignWithFingerDirection(indexTip, middleTip) {
    // Calculate the direction vector from the middle finger tip to the index finger tip
    var direction = {
        x: indexTip.x - middleTip.x,
        y: indexTip.y - middleTip.y,
        z: indexTip.z - middleTip.z
    };

    // Normalize the direction vector
    var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    if (magnitude > 0.0001) { // Small epsilon to avoid division by zero
        direction.x /= magnitude;
        direction.y /= magnitude;
        direction.z /= magnitude;
    } else {
        // Default to a forward direction if the vector magnitude is too small
        direction = { x: 0, y: 0, z: 1 };
    }

    // Convert to vec3 for rotation calculations
    var targetDir = new vec3(direction.x, direction.y, direction.z);

    // Calculate a stable up vector
    // Using world up (y-axis) as reference
    var worldUp = new vec3(0, 1, 0);
    var handRight = targetDir.cross(worldUp).normalize();
    var dynamicUp = handRight.cross(targetDir).normalize();

    // Calculate the rotation quaternion to align the object with the pointing direction
    var targetRotation = quat.lookAt(targetDir, dynamicUp);

    if (script.smoothMovement) {
        // Smoothly interpolate between the previous and target rotation
        previousRotation = quat.slerp(previousRotation, targetRotation, script.smoothingFactor);
        transform.setWorldRotation(previousRotation);
    } else {
        // Directly set the rotation
        transform.setWorldRotation(targetRotation);
    }
}

function enableOutline(enable) {
    if (aussenMeshRenderer && script.outlineMaterial) {
        // Set the outline material to the MeshRenderer
        aussenMeshRenderer.getMaterial(0).setMaterial(script.outlineMaterial);

        // If outline should be enabled or disabled
        if (enable) {
            aussenMeshRenderer.setOutlineColor(new vec4(1, 1, 0, 1)); // Set outline color (yellow for visibility)
            aussenMeshRenderer.setOutlineWidth(0.02); // Adjust outline width as necessary
            aussenMeshRenderer.setOutlineEnabled(true); // Enable outline
        } else {
            aussenMeshRenderer.setOutlineEnabled(false); // Disable outline
        }
    }
}

script.createEvent("UpdateEvent").bind(onUpdate);
