// @input float movementSpeed = 1 {"widget": "slider", "min": 0.1, "max": 5.0, "step": 0.1}
// @input float maxScale = 1.5 {"widget": "slider", "min": 0.5, "max": 3.0, "step": 0.1}
// @input float minScale = 0.5 {"widget": "slider", "min": 0.1, "max": 1.0, "step": 0.1}
// @input bool smoothMovement = true
// @input float smoothingFactor = 0.5 {"widget": "slider", "min": 0.1, "max": 1.0, "step": 0.1}
// @input bool enablePinchScaling = true
// @input Asset.Material outlineMaterial {"label": "Outline Material"}
// @input vec4 outlineColor = {1, 1, 1, 1} {"widget": "color"}
// @input float outlineWidth = 0.1 {"widget": "slider", "min": 0.0, "max": 1.0, "step": 0.01}
// @input bool debugMode = false

// Constants
const EPSILON = 0.0001;
const DEFAULT_UP = vec3.up();
const ROTATION_ADJUSTMENT = 180;

// Cache frequently accessed components
var transform;
var meshVisual;
var prevPosition = null;
var isInitialized = false;
var lastFrameTime = 0;
var smoothVelocity = new vec3(0, 0, 0);

// Initialize the script
function initialize() {
    if (isInitialized) return;
    
    transform = script.getSceneObject().getTransform();
    meshVisual = script.getSceneObject().getComponent("Component.MeshVisual");
    
    validateInputs();
    setupMaterial();
    
    isInitialized = true;
}

function validateInputs() {
    if (script.minScale >= script.maxScale) {
        warn("minScale must be less than maxScale. Adjusting values.");
        script.maxScale = script.minScale + 0.5;
    }
    
    if (script.smoothingFactor <= 0 || script.smoothingFactor > 1) {
        warn("Invalid smoothingFactor. Setting to default 0.5");
        script.smoothingFactor = 0.5;
    }
}

function setupMaterial() {
    if (!script.outlineMaterial) {
        warn("No outline material assigned!");
        return;
    }
    
    if (meshVisual) {
        if (!global.originalMaterial) {
            global.originalMaterial = meshVisual.mainMaterial;
        }
        meshVisual.mainMaterial = script.outlineMaterial;
        updateMaterialProperties();
    } else {
        warn("No MeshVisual component found!");
    }
}

function updateMaterialProperties() {
    if (!script.outlineMaterial) return;
    
    script.outlineMaterial.mainPass.outlineColor = script.outlineColor;
    script.outlineMaterial.mainPass.outlineWidth = script.outlineWidth;
}

function getHandPoints() {
    var hand = global.handTracking.getHand();
    if (!hand) return null;
    
    var indexTip = hand.indexFinger.tip.position;
    var middleTip = hand.middleFinger.tip.position;
    
    if (!indexTip || !middleTip) return null;
    
    return {
        indexTip: indexTip,
        middleTip: middleTip,
        midPoint: calculateMidPoint(indexTip, middleTip),
        direction: calculateDirection(indexTip, middleTip)
    };
}

function calculateMidPoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2
    };
}

function calculateDirection(from, to) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var dz = to.z - from.z;
    
    var magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    return magnitude > EPSILON ? 
        { x: dx/magnitude, y: dy/magnitude, z: dz/magnitude } :
        { x: 0, y: 0, z: 1 };
}

function updateObjectTransform(handPoints) {
    var targetPosition = calculateTargetPosition(handPoints.midPoint);
    var targetRotation = calculateTargetRotation(handPoints.direction);
    
    if (script.smoothMovement) {
        smoothlyUpdateTransform(targetPosition, targetRotation);
    } else {
        transform.setWorldPosition(targetPosition);
        transform.setWorldRotation(targetRotation);
    }
    
    if (script.enablePinchScaling) {
        updateScale(handPoints.indexTip, handPoints.middleTip);
        updateDynamicOutline(handPoints.indexTip, handPoints.middleTip);
    }
}

function calculateTargetPosition(midPoint) {
    return new vec3(
        midPoint.x * script.movementSpeed,
        midPoint.y * script.movementSpeed,
        midPoint.z * script.movementSpeed
    );
}

function calculateTargetRotation(direction) {
    var targetDir = new vec3(-direction.x, -direction.y, -direction.z);
    var handRight = targetDir.cross(DEFAULT_UP).normalize();
    var dynamicUp = handRight.cross(targetDir).normalize();
    
    var baseRotation = quat.lookAt(targetDir, dynamicUp);
    var adjustment = quat.angleAxis(ROTATION_ADJUSTMENT, handRight);
    
    return baseRotation.multiply(adjustment);
}

function smoothlyUpdateTransform(targetPosition, targetRotation) {
    var currentPos = transform.getWorldPosition();
    var smoothedPosition = vec3.lerp(currentPos, targetPosition, script.smoothingFactor);
    
    var currentRot = transform.getWorldRotation();
    var smoothedRotation = quat.slerp(currentRot, targetRotation, script.smoothingFactor);
    
    transform.setWorldPosition(smoothedPosition);
    transform.setWorldRotation(smoothedRotation);
}

function updateScale(indexTip, middleTip) {
    var distance = calculateDistance(indexTip, middleTip);
    var scale = clamp(distance, script.minScale, script.maxScale);
    transform.setLocalScale(new vec3(scale, scale, scale));
}

function updateDynamicOutline(indexTip, middleTip) {
    if (!script.outlineMaterial) return;
    
    var distance = calculateDistance(indexTip, middleTip);
    var t = (distance - script.minScale) / (script.maxScale - script.minScale);
    var mappedWidth = lerp(0.01, script.outlineWidth, clamp(t, 0, 1));
    
    script.outlineMaterial.mainPass.outlineWidth = mappedWidth;
}

function calculateDistance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    var dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function warn(message) {
    print("Warning: " + message);
}

function onUpdate(eventData) {
    if (!isInitialized) {
        initialize();
    }
    
    var handPoints = getHandPoints();
    if (!handPoints) return;
    
    updateObjectTransform(handPoints);
    
    if (script.debugMode) {
        logDebugInfo(handPoints);
    }
}

function logDebugInfo(handPoints) {
    print("Hand tracking debug:");
    print("- Mid point:", JSON.stringify(handPoints.midPoint));
    print("- Direction:", JSON.stringify(handPoints.direction));
    print("- Current scale:", transform.getLocalScale().x);
    print("- Outline width:", script.outlineMaterial.mainPass.outlineWidth);
}

script.createEvent("TurnOnEvent").bind(initialize);
script.createEvent("UpdateEvent").bind(onUpdate);