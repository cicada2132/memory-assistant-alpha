# Mori — Elderly Care Companion Robot

The first Soul Spec v0.5 soul designed for embodied agents.

Mori is a care companion robot persona for nursing homes and home care. It demonstrates Soul Spec's new v0.5 fields: `environment`, `interactionMode`, `hardwareConstraints`, and `safety.physical`.

## What's Special

- **v0.5 Embodied Agent fields** — hardware constraints, physical safety, interaction modes
- **Multi-modal interaction** — voice, gesture, touch screen
- **Safety-first design** — emergency stop, collision avoidance, soft exterior
- **Bilingual** — Korean (존댓말) and English

## Usage

Works with any Soul Spec compatible framework:

```bash
# Install via ClawSouls CLI
clawsouls install clawsouls/mori

# Or use with ROS2/Isaac Sim via soul-spec-mcp
npx soul-spec-mcp
```

## Soul Spec v0.5 Fields

```json
{
  "environment": "indoor",
  "interactionMode": ["voice", "gesture", "touch-screen"],
  "hardwareConstraints": {
    "mobility": "wheeled",
    "sensors": ["camera", "microphone", "temperature", "pulse-oximeter"],
    "actuators": ["speaker", "display", "led-ring"],
    "compute": "edge",
    "battery": true
  },
  "safety": {
    "physical": {
      "maxSpeed": "0.5m/s",
      "emergencyStop": true,
      "collisionAvoidance": true,
      "softExterior": true
    }
  }
}
```

## License

CC-BY-4.0
