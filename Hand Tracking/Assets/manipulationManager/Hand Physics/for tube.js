//@input SceneObject tube

var isPushing = false;

function onTap(eventData) {
    isPushing = !isPushing; // Toggle pushing state on tap

    if (isPushing) {
        var cylinder = script.tube.getChild(0); // Assuming the cylinder is the first child
        var cylinderPosition = cylinder.getTransform().getLocalPosition();
        var direction = vec3.forward(); // Assuming forward is the direction into the tube
        cylinder.getTransform().setLocalPosition(cylinderPosition.add(direction.uniformScale(0.01)));
    }
}

var tapEvent = script.createEvent("TapEvent");
tapEvent.bind(onTap);