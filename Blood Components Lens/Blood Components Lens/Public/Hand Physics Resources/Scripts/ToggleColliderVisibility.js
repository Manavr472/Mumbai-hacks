// -----JS CODE-----
// ToggleJointVisibility.js
// Version: 0.3.0
// Event: On Awake
// Description: Toggles visibility on target Hand Colliders objects

// @input Physics.ColliderComponent handCollidersL
// @input Physics.ColliderComponent handCollidersR

// @input Component.ScriptComponent handJointsL
// @input Component.ScriptComponent handJointsR

script.createEvent("TapEvent").bind(function() {
    var isVisible = !script.handCollidersL.debugDrawEnabled;
    script.handCollidersL.debugDrawEnabled = isVisible;
    script.handCollidersR.debugDrawEnabled = isVisible;
    
    script.handJointsL.setVisible(isVisible);
    script.handJointsR.setVisible(isVisible);
});
