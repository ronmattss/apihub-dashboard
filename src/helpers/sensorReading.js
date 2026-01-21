// Lightweight helper and validator for sensor reading envelope
const schema = require('./sensorSchema.json');

class SensorReading {
  constructor({Type, Channel, Payload, Timestamp, To = null, From = null, Topic = null, Meta = null, Id = null, CorrelationId = null}) {
    this.Type = Type;
    this.Channel = Channel;
    this.To = To;
    this.From = From;
    this.Topic = Topic;
    this.Payload = Payload;
    this.Meta = Meta;
    this.Timestamp = Timestamp;
    this.Id = Id;
    this.CorrelationId = CorrelationId;
  }

  // Envelope-level validation matching .NET MessageEnvelope semantics.
  static validate(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Message must be an object');
    const required = ['Type', 'Channel', 'Payload', 'Timestamp'];
    for (const k of required) if (!(k in obj)) throw new Error(`Missing required property: ${k}`);

    if (typeof obj.Type !== 'string') throw new Error('Type must be a string');
    if (typeof obj.Channel !== 'string') throw new Error('Channel must be a string');
    if (typeof obj.Timestamp !== 'number') throw new Error('Timestamp must be a number');

    // Payload is allowed to be any JSON value (JsonElement in .NET). No deep validation here.
    return true;
  }

  static fromJSON(obj) {
    this.validate(obj);
    return new SensorReading(obj);
  }

  toJSON() {
    return {
      Type: this.Type,
      Channel: this.Channel,
      To: this.To,
      From: this.From,
      Topic: this.Topic,
      Payload: this.Payload,
      Meta: this.Meta,
      Timestamp: this.Timestamp,
      Id: this.Id,
      CorrelationId: this.CorrelationId
    };
  }

  // Convenience to extract a sensor measurement if Payload follows the sensor shape.
  getMeasurement(key) {
    try {
      const ms = (this.Payload && this.Payload.Measurements) || [];
      if (!Array.isArray(ms)) return null;
      return ms.find(m => m.Key === key) || null;
    } catch {
      return null;
    }
  }
}

module.exports = { SensorReading, schema };
